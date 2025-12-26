import os
import config
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# ============================================================
# アプリケーションのセットアップ
# ============================================================

app = FastAPI()
client = genai.Client(api_key=config.GEMINI_API_KEY)
FRONTEND_URL = config.FRONTEND_URL or ""


# ============================================================
# CORS設定（フロントエンドとの通信を許可）
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # フロントエンド の URL を指定
    allow_credentials=True,
    allow_methods=["GET, POST"],  # HTTP メソッドを許可 (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # すべてのヘッダーを許可
)


# ============================================================
# エンドポイント
# ===========================================================

@app.post("/api/generate")
async def generate_text(request_body: dict):
    user_idea = request_body.get("prompt", "")

    async def stream_output():

        response = await client.aio.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=["Explain how AI works"]
        )
        async for chunk in response:
            # チャンクからテキスト部分を取り出してyield
            if chunk.text:
                yield chunk.text

    # 3. ストリーミングレスポンスとして返す
    return StreamingResponse(
        stream_output(), 
        # media_type="application/json"
        media_type="application/text"
    )

# 動作確認用
@app.get("/")
def read_root():
    return {"message": "Hello from Docker!(update)"}

@app.get("/health")
def health_check():
    return {"status": "ok"}