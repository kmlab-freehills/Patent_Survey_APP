from fastapi import APIRouter, HTTPException
from typing import Optional
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.func import generate_func
from src.func import gemini_client
from src.storage.patent_store import get_patent
from src.prompt import idea_prompt

## generate_api.py / LLM生成のAPIエンドポイント ##

router = APIRouter(prefix="/generate", tags=["LLM生成"])
client = gemini_client.client

# ============================================================
# リクエストボディのモデル定義
# ============================================================

class GenerateRequest(BaseModel):
    prompt: str
    tool_mode: str

class GeneratePatentRequest(BaseModel):
    patent_id: str

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
async def generate_from_patent(data: GeneratePatentRequest):

    patent_doc = get_patent(data.patent_id)
    if not patent_doc:
        raise HTTPException(status_code=404, detail="Patent not found")

    prompt = idea_prompt.build_patent_prompt(patent_doc)

    def stream_output():
        response = generate_func.generate_content(
            prompt=prompt,
            client=client,
            tool_mode="text",
        )
        for chunk in generate_func.stream(response):
            if not chunk:
                continue
            yield chunk

    return StreamingResponse(
        stream_output(),
        media_type="text/plain; charset=utf-8"
    )