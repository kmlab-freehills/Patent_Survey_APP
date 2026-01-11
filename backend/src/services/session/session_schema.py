from typing import Dict, List, Optional

from pydantic import BaseModel, Field

# ============================================================
# セッション全体のスキーマ
# ============================================================

# 生成された成果物
class ArtifactOutput(BaseModel):
    text: str
    generated_at: str  # ISO 8601形式

# 生成された成果物のメタデータ
class ArtifactData(BaseModel):
    step: int
    type: str  # "single_shot"
    prompt_type: str  # "analysis", "idea"
    input: Dict[str, str]  # patent_text, analysis_text等
    output: Optional[ArtifactOutput] = None  # 未生成の場合はNone

# チャットメッセージ
class ConversationMessage(BaseModel):
    id: str
    role: str  # "user" | "assistant"
    content: str
    timestamp: str

# チャットメタデータ
class ConversationData(BaseModel):
    step: int
    type: str  # "multi_turn"
    context_refs: List[str]  # ["patent_summary", "idea_generation"]
    messages: List[ConversationMessage] = Field(default_factory=list)

# セッション全体のデータ
class SessionData(BaseModel):
    session_id: str
    created_at: str
    updated_at: str
    gemini_session_id: Optional[str] = None  # Gemini側のセッションID
    artifacts: Dict[str, ArtifactData] = Field(default_factory=dict) # 成果物
    conversation: Optional[ConversationData] = None # チャット


# ============================================================
# APIリクエスト・レスポンスのスキーマ
# ============================================================

# 成果物のセーブ
class SaveArtifactRequest(BaseModel):
    name: str  # "patent_summary", "idea_generation"
    data: ArtifactData

# 更新処理
class UpdateSessionRequest(BaseModel):
    artifacts: Optional[Dict[str, ArtifactData]] = None
    conversation: Optional[ConversationData] = None
    gemini_session_id: Optional[str] = None
