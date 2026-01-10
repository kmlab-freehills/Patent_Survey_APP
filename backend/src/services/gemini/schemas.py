# backend/src/services/gemini/schemas.py

from pydantic import BaseModel, Field
from typing import Optional, Literal

class GenerateRequest(BaseModel):
    """統一リクエスト"""
    
    # コア
    prompt: str = Field(..., description="ユーザー入力")
    session_id: Optional[str] = Field(None, description="既存セッションID")
    
    # 動作モード
    save_context: bool = Field(
        default=True, 
        description="履歴保存モード（False=シングルショット）"
    )
    
    # オプション
    system_instruction: Optional[str] = Field(
        None, 
        description="システムプロンプト"
    )
    patent_id: Optional[str] = Field(
        None, 
        description="特許IDを指定すると自動でプロンプト構築"
    )


class StreamEvent(BaseModel):
    """UIイベント"""
    type: Literal[
        "session_init",    # セッションID通知
        "content_delta",   # テキスト追記
        "done",            # 完了
        "error"            # エラー
    ]
    data: dict