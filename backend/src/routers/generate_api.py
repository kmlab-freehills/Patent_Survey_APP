from fastapi import APIRouter
from typing import Optional
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.func import generate_func
from src.func import gemini_client

## generate_api.py / LLM生成のAPIエンドポイント ##

router = APIRouter(prefix="/generate", tags=["LLM生成"])
client = gemini_client.client

# ============================================================
# リクエストボディのモデル定義
# ============================================================

class GenerateRequest(BaseModel):
    prompt: str
    tool_mode: str

# ============================================================
# エンドポイント
# ============================================================

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


@router.post("/patent")
async def generate_from_patent(data: GenerateRequest):
    def stream_output():
        response = generate_func.generate_content(
            prompt=data.prompt,
            client=client,
            tool_mode=data.tool_mode,
        )
        for chunk in generate_func.stream(response):
            if not chunk:
                continue
            yield chunk

    return StreamingResponse(stream_output(), media_type="text/plain; charset=utf-8")