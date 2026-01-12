# Patent_Survey_APP/backend/src/services/gemini/generate_api.py
import json
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.prompt.manager import PromptManager
from src.services.gemini.functions import (
    convert_messages_to_gemini_contents,
    generate_text_engine,
)
from src.services.gemini.schemas import (
    GeneratedArtifact,
    GeneratedMeta,
    GenerateMultiTurnRequest,
    GenerateSingleShotRequest,
    StreamEvent,
)
from src.services.report.store import report_store

# ルーター
router = APIRouter(prefix="/generate", tags=["LLM生成（各機能共通）"])

# ============================================================
# 【シングルショット】
# ============================================================


@router.post("/single-shot")
async def generate_single_shot_content(request: GenerateSingleShotRequest):
    """シングルショット生成エンドポイント"""

    async def event_stream():
        try:
            # --------------------------------------------------
            # 1. レポート取得
            # --------------------------------------------------
            report = report_store.load_report(request.report_type, request.report_id)
            if not report:
                raise ValueError("Report not found")

            # --------------------------------------------------
            # 2. プロンプト構築
            # --------------------------------------------------
            # タスクプロンプト
            prompt = PromptManager.build_prompt(
                prompt_type=request.prompt_type,
                context=request.context,
            )

            # 型をGeminiに合わせる
            contents = [{"role": "user", "parts": [{"text": prompt}]}]

            # システムプロンプト
            system_prompt = PromptManager.build_system_prompt(
                system_prompt_type=request.system_prompt_type,
                context={},  # single-shotでは task prompt 側に集約
            )

            # --------------------------------------------------
            # 3. 生成パラメータ（暫定的にここで定義/将来的にリクエスト対応）
            # --------------------------------------------------
            model = "gemini-2.5-flash"
            temperature = 0.7

            # --------------------------------------------------
            # 4. 生成実行（ストリーミング）
            # --------------------------------------------------
            full_response_text = ""
            for event in generate_text_engine(
                model=model,  # モデル名
                contents=contents,  # 構築したプロンプト
                system_instruction=system_prompt,  # 構築したシステムプロンプト
                temperature=temperature,  # 多様性
            ):
                # 変数格納
                if event["type"] == "content_delta":
                    full_response_text += event["data"]["chunk"]
                # フロントエンドに送信
                yield _format_event(StreamEvent(**event))

            # --------------------------------------------------
            # 5. generated.artifacts へ保存（report.json）
            # --------------------------------------------------
            artifact = GeneratedArtifact(
                system_prompt_type=request.system_prompt_type or "",
                prompt_type=request.prompt_type,
                input=list(request.context.values()),
                output=full_response_text,
                meta=GeneratedMeta(
                    model=model,
                    temperature=temperature,
                    last_run_at=datetime.utcnow().isoformat() + "Z",
                ),
            )

            report.content.setdefault("generated", {})
            report.content["generated"].setdefault("artifacts", {})
            report.content["generated"]["artifacts"][request.artifact_name] = artifact.model_dump()

            report_store.save_report(report)

        # エラーハンドリング（エラーフラグと完了フラグを送信）
        except Exception as e:
            print(f"Generate Error: {e}")
            # エラーイベント
            yield _format_event(StreamEvent(type="error", data={"message": str(e)}))
            # 完了イベント
            yield _format_event(StreamEvent(type="done", data={}))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ============================================================
# 【マルチターン】
# ============================================================


@router.post("/multi-turn")
async def generate_multi_turn_content(request: GenerateMultiTurnRequest):
    """マルチターン生成エンドポイント"""

    async def event_stream():
        try:
            print("マルチターン")
            # --------------------------------------------------
            # 1. レポート取得
            # --------------------------------------------------
            report = report_store.load_report(request.report_type, request.report_id)
            if not report:
                raise ValueError("Report not found")

            # --------------------------------------------------
            # 2. プロンプト構築
            # --------------------------------------------------
            # Gemini形式のオブジェクトに変換
            contents = convert_messages_to_gemini_contents(request.messages)

            # システムプロンプト
            system_prompt = PromptManager.build_system_prompt(
                system_prompt_type=request.system_prompt_type,
                context=request.context,
            )

            # --------------------------------------------------
            # 3. 生成パラメータ（暫定的にここで定義/将来的にリクエスト対応）
            # --------------------------------------------------
            model = "gemini-2.5-flash"
            temperature = 0.7

            # --------------------------------------------------
            # 4. 生成実行
            # --------------------------------------------------
            assistant_text = ""
            for event in generate_text_engine(
                model=model,  # モデル名
                contents=contents,  # 構築したプロンプト
                system_instruction=system_prompt,  # 構築したシステムプロンプト
                temperature=temperature,  # 多様性
            ):
                # 変数格納
                if event["type"] == "content_delta":
                    assistant_text += event["data"]["chunk"]
                # フロントエンドに送信
                yield _format_event(StreamEvent(**event))

            # --------------------------------------------------
            # 5. 会話を保存（assistantを追加）
            # --------------------------------------------------
            messages = [m.model_dump() for m in request.messages]
            messages.append({"role": "assistant", "content": assistant_text})

            report.content.setdefault("generated", {})
            report.content["generated"]["conversation"] = {
                "type": "multi_turn",
                "system_prompt_type": request.system_prompt_type or "",
                "context": list(request.context.keys()),
                "messages": messages,
                "meta": {
                    "model": model,
                    "temperature": temperature,
                    "last_run_at": datetime.utcnow().isoformat() + "Z",
                },
            }

            report_store.save_report(report)

        # エラーハンドリング（エラーフラグと完了フラグを送信）
        except Exception as e:
            print(f"Generate Error: {e}")
            # エラーイベント
            yield _format_event(StreamEvent(type="error", data={"message": str(e)}))
            # 完了イベント
            yield _format_event(StreamEvent(type="done", data={}))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ============================================================
# 【UIイベント】
# ============================================================


def _format_event(event: StreamEvent) -> str:
    """
    StreamEvent を SSE フォーマットに変換
    """
    payload = event.model_dump()
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
