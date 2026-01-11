import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.core.client import gemini_client
from src.prompt.manager import PromptManager
from src.services.gemini.generate_func import generate_text_engine
from src.services.gemini.schemas import GenerateRequest
from src.services.gemini.session_store import session_store

# ルーター
router = APIRouter(prefix="/generate", tags=["LLM生成"])

# クライアント取得
client = gemini_client


# エンドポイント
@router.post("/content")
async def generate_chat(request: GenerateRequest):
    """
    統一エンドポイント
    - save_context=False (解析・アイデア生成): 履歴を使わず、単発のリクエストとして処理
    - save_context=True  (チャット): セッション履歴を読み書きして処理
    - PromptManagerを経由してプロンプトを構築し、生成を行う
    """

    async def event_stream():
        try:
            # 1. PromptManagerを使用してプロンプトとシステムプロンプトを構築
            # 戻り値: (ユーザー入力として扱うテキスト, システムプロンプト)
            user_content_text, system_prompt = PromptManager.build(
                prompt_type=request.prompt_type, context=request.context, user_input=request.user_message or ""
            )

            print(f"[DEBUG]PROMPT_TYPE: {request.prompt_type}")
            print("[DEBUG]SYSTEM_PROMPT:")
            print(system_prompt[:100], "..." or None)
            print("[DEBUG]PROMPT:")
            print(user_content_text[:100], "..." or None)
            print("[DEBUG]RESULT:")

            # ====================================================
            # モードA: チャットモード (履歴を保持・更新する)
            # ====================================================
            if request.save_context:
                session_id = request.session_id

                # 新規セッションなら作成
                if not session_id:
                    session_id = session_store.create_session()
                    yield _format_event("session_init", {"session_id": session_id})

                # 履歴のロード
                history = session_store.load(session_id)

                # 今回のユーザー入力を追加
                new_message = {"role": "user", "parts": [{"text": user_content_text}]}
                history.append(new_message)

                # 生成エンジン実行
                full_response_text = ""
                for event in generate_text_engine(
                    client=gemini_client, contents=history, system_instruction=system_prompt
                ):
                    if event["type"] == "content_delta":
                        full_response_text += event["data"]["chunk"]
                    # デバッグ用
                    if "chunk" in event["data"]:
                        print(event["data"]["chunk"], end="")
                    # フロントへ送信
                    yield _format_event(event["type"], event["data"])

                # 完了後、AIの応答も含めて履歴保存
                history.append({"role": "model", "parts": [{"text": full_response_text}]})
                session_store.save(session_id, history)

            # ====================================================
            # モードB: 単発生成モード (解析・アイデア生成)
            # ====================================================
            else:
                # 履歴はロードせず、今回のプロンプトだけで構成する
                contents = [{"role": "user", "parts": [{"text": user_content_text}]}]

                for event in generate_text_engine(
                    client=gemini_client, contents=contents, system_instruction=system_prompt
                ):
                    # デバッグ用
                    if "chunk" in event["data"]:
                        print(event["data"]["chunk"], end="")
                    # フロントへ送信
                    yield _format_event(event["type"], event["data"])

        except Exception as e:
            print(f"Generate Error: {e}")
            yield _format_event("error", {"message": str(e)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _format_event(event_type: str, data: dict) -> str:
    chunk = {"type": event_type, "data": data}
    return f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
