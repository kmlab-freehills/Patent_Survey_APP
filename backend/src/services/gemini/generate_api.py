# Patent_Survey_APP/backend/src/routers/generate_api.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.core.client import gemini_client
from src.services.gemini import generate_func
from src.prompt import idea_prompt, system_prompt
from src.services.patent.patent_store import (
    get_chat_history,
    get_patent,
    save_chat_message,
)

## generate_api.py / LLM生成のAPIエンドポイント ##

router = APIRouter(prefix="/generate", tags=["LLM生成"])
client = gemini_client

# ============================================================
# リクエストボディのモデル定義
# ============================================================


# LLMテキスト生成
class GenerateRequest(BaseModel):
    prompt: str
    tool_mode: str


# 特許解析
class GeneratePatentRequest(BaseModel):
    patent_id: str


# アイデア生成
class GenerateIdeaRequest(BaseModel):
    patent_id: str
    explanation_text: str  # フロントエンドから受け取る解説文


# チャットセッション
class ChatRequest(BaseModel):
    patent_id: str
    user_message: str
    analysis_text: str = ""  # 解析結果（生成済みの場合）
    idea_text: str = ""  # アイデア結果（生成済みの場合）


# ============================================================
# エンドポイント
# ============================================================


# シンプルなテキスト生成
@router.post("/content", summary="テキスト生成")
async def generate(data: GenerateRequest):
    """
    Gemini APIを使用してテキストをストリーミング生成
    """

    # ストリーミング生成
    def stream_output():
        prompt = data.prompt
        tool_mode = data.tool_mode
        response = generate_func.generate_content(prompt, client, tool_mode)
        for chunk in generate_func.stream(response):
            if not chunk:
                continue
            yield chunk

    return StreamingResponse(stream_output(), media_type="text/plain; charset=utf-8")


# 特許解析
@router.post("/patent")
async def generate_from_patent(data: GeneratePatentRequest):
    # 1. 保存された原文を取得
    patent_doc = get_patent(data.patent_id)
    if not patent_doc:
        raise HTTPException(status_code=404, detail="Patent not found")

    # 2. プロンプト構築
    prompt = idea_prompt.build_patent_prompt(patent_doc)

    # 3. ストリーミング生成
    def stream_output():
        response = generate_func.generate_content(
            prompt=prompt,
            client=client,
            tool_mode="text",
            system_instruction=system_prompt.SYSTEM_PROMPT_PATENT,
        )
        for chunk in generate_func.stream(response):
            if not chunk:
                continue
            yield chunk

    return StreamingResponse(stream_output(), media_type="text/plain; charset=utf-8")


# アイデア生成
@router.post("/idea")
async def generate_idea(data: GenerateIdeaRequest):
    # 1. 保存された特許原文を取得
    patent_doc = get_patent(data.patent_id)
    if not patent_doc:
        raise HTTPException(status_code=404, detail="Patent not found")

    # 2. プロンプトを構築（解説文 + 原文）
    prompt = idea_prompt.build_idea_prompt(patent_doc, data.explanation_text)

    # 3. ストリーミング生成
    def stream_output():
        response = generate_func.generate_content(
            prompt=prompt,
            client=client,
            tool_mode="text",
            system_instruction=system_prompt.SYSTEM_PROMPT_PATENT,
        )
        for chunk in generate_func.stream(response):
            if not chunk:
                continue
            yield chunk

    return StreamingResponse(stream_output(), media_type="text/plain; charset=utf-8")


# チャットセッション
@router.post("/chat")
async def chat_with_context(data: ChatRequest):
    """
    特許文脈を保持したマルチターンチャット
    """
    # 1. 特許原文を取得
    patent_doc = get_patent(data.patent_id)
    if not patent_doc:
        raise HTTPException(status_code=404, detail="Patent not found")

    # 2. チャット履歴を取得（Gemini contents形式）
    history = get_chat_history(data.patent_id)

    # 3. 新しいユーザーメッセージを追加
    history.append({"role": "user", "parts": [{"text": data.user_message}]})

    # 4. システムプロンプトを構築（特許原文 + 生成済みテキストを含む）
    system_instruction = system_prompt.build_chat_system_instruction(
        patent_doc=patent_doc,
        analysis_text=data.analysis_text,
        idea_text=data.idea_text,
    )

    # 5. ユーザーメッセージを履歴に保存
    save_chat_message(data.patent_id, "user", data.user_message)

    # 6. マルチターン生成
    def stream_output():
        full_response = ""
        try:
            response = generate_func.generate_content_multiturn(
                contents=history, client=client, system_instruction=system_instruction
            )

            for chunk in generate_func.stream(response):
                if not chunk:
                    continue
                full_response += chunk
                yield chunk

            # 完了後、モデルの応答を履歴に保存
            save_chat_message(data.patent_id, "model", full_response)

        except Exception as e:
            error_msg = f"生成エラー: {str(e)}"
            print(error_msg)
            yield error_msg

    return StreamingResponse(stream_output(), media_type="text/plain; charset=utf-8")
