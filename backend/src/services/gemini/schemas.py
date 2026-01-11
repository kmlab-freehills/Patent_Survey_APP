# backend/src/services/gemini/schemas.py

from pydantic import BaseModel, Field
from typing import Dict, Optional, Literal

class GenerateRequest(BaseModel):
    """統一リクエスト"""
    # プロンプトの種類 (例: "analysis", "idea", "chat_system")
    prompt_type: str = Field(..., description="使用するプロンプトテンプレートのID")

    # 柔軟なコンテキスト辞書
    # キー: "patent_text", "analysis_result", "idea_list" など
    context: Dict[str, str] = Field(default_factory=dict, description="プロンプトに埋め込むためのコンテキスト情報")

    # チャットの場合のユーザー入力（解析などの場合は空でも可）
    user_message: Optional[str] = Field(..., description="ユーザー入力")

    # セッション管理用
    session_id: Optional[str] = Field(None, description="既存セッションID")
    save_context: bool = Field(default=True, description="履歴保存モード（False=シングルショット）")


class StreamEvent(BaseModel):
    """UIイベント"""

    type: Literal[
        "session_init",  # セッションID通知
        "content_delta",  # テキスト追記
        "done",  # 完了
        "error",  # エラー
    ]
    data: dict
