# backend/src/services/gemini/generate_api.py

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.core.client import gemini_client
from src.prompt import idea_prompt, system_prompt
from src.services.gemini import session_store
from src.services.gemini.generate_func import generate_text_engine
from src.services.gemini.schemas import GenerateRequest
from src.services.patent.patent_store import get_patent

router = APIRouter(prefix="/generate", tags=["LLM生成"])
client = gemini_client


# ============================================================
# 統合エンドポイント（新規）
# ============================================================


@router.post("/content")
async def generate_chat(request: GenerateRequest):
    """統一エンドポイント"""

    async def event_stream():
        try:
            # 1. セッション管理
            session_id = request.session_id
            history = []

            if not session_id and request.save_context:
                session_id = session_store.create_session()
                yield _format_event("session_init", {"session_id": session_id})

            # 2. 履歴ロード
            if session_id and request.save_context:
                history = session_store.load(session_id)

            # 3. システムプロンプト挿入（履歴が空の場合のみ）
            if not history and request.system_instruction:
                history.append({"role": "user", "parts": [{"text": f"[System]\n{request.system_instruction}"}]})

            # 4. プロンプト構築（patent_idが指定されている場合）
            if request.patent_id:
                patent_doc = get_patent(request.patent_id)
                if not patent_doc:
                    raise HTTPException(status_code=404, detail="Patent not found")

                # プロンプトを自動構築（既存のbuild関数を利用）
                request.prompt = idea_prompt.build_patent_prompt(patent_doc)

            # 5. ユーザーメッセージ追加
            history.append({"role": "user", "parts": [{"text": request.prompt}]})

            # 6. 生成エンジン実行
            for event in generate_text_engine(
                client=gemini_client, contents=history, system_instruction=request.system_instruction
            ):
                yield _format_event(event["type"], event["data"])

            # 7. 履歴保存（save_contextがtrueの場合のみ）
            if session_id and request.save_context:
                session_store.save(session_id, history)

        except Exception as e:
            yield _format_event("error", {"message": str(e)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ============================================================
# 既存エンドポイント（互換性維持のため一時的に残す）
# ============================================================


class GeneratePatentRequest(BaseModel):
    patent_id: str


class GenerateIdeaRequest(BaseModel):
    patent_id: str
    explanation_text: str


class ChatRequest(BaseModel):
    patent_id: str
    user_message: str
    analysis_text: str = ""
    idea_text: str = ""


@router.post("/patent")
async def generate_from_patent(data: GeneratePatentRequest):
    """特許解析（既存互換）"""

    async def event_stream():
        try:
            patent_doc = get_patent(data.patent_id)
            if not patent_doc:
                raise HTTPException(status_code=404, detail="Patent not found")

            prompt = idea_prompt.build_patent_prompt(patent_doc)
            history = [{"role": "user", "parts": [{"text": prompt}]}]

            for event in generate_text_engine(
                client=client, contents=history, system_instruction=system_prompt.SYSTEM_PROMPT_PATENT
            ):
                if event["type"] == "content_delta":
                    yield event["data"]["chunk"]

        except Exception as e:
            print(f"Error: {e}")

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")


@router.post("/idea")
async def generate_idea(data: GenerateIdeaRequest):
    """アイデア生成（既存互換）"""

    async def event_stream():
        try:
            patent_doc = get_patent(data.patent_id)
            if not patent_doc:
                raise HTTPException(status_code=404, detail="Patent not found")

            prompt = idea_prompt.build_idea_prompt(patent_doc, data.explanation_text)
            history = [{"role": "user", "parts": [{"text": prompt}]}]

            for event in generate_text_engine(
                client=client, contents=history, system_instruction=system_prompt.SYSTEM_PROMPT_PATENT
            ):
                if event["type"] == "content_delta":
                    yield event["data"]["chunk"]

        except Exception as e:
            print(f"Error: {e}")

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")


@router.post("/chat")
async def chat_with_context(data: ChatRequest):
    """チャット（既存互換）"""

    async def event_stream():
        try:
            patent_doc = get_patent(data.patent_id)
            if not patent_doc:
                raise HTTPException(status_code=404, detail="Patent not found")

            # システムプロンプト構築
            system_instruction = system_prompt.build_chat_system_instruction(
                patent_doc=patent_doc, analysis_text=data.analysis_text, idea_text=data.idea_text
            )

            # 履歴構築（新規の場合は空）
            history = [{"role": "user", "parts": [{"text": data.user_message}]}]

            for event in generate_text_engine(client=client, contents=history, system_instruction=system_instruction):
                if event["type"] == "content_delta":
                    yield event["data"]["chunk"]

        except Exception as e:
            print(f"Error: {e}")

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")


def _format_event(event_type: str, data: dict) -> str:
    """SSE形式にフォーマット"""
    chunk = {"type": event_type, "data": data}
    return f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
