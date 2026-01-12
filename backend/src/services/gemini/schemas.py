# backend/src/services/gemini/schemas.py

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# ============================================================
# 方針:
# - 生成処理自体は各機能で汎用的かつ共通で使用できるように
#   - 引数や表示の工夫でカスタマイズ
# - Gemini側にセッション情報は持たせない
# - レポートが唯一の状態
# レポートのフィールド:
# - content: 機能ごとに自由
# - generated: 各機能共通 <-- 対象
# 責任:
# - フロントエンド:
#   - プロンプトタイプ指定
#   - 資料テキストの実体を取得して送信
#   - 完全な会話履歴を構築して送信
# - バックエンド:
#   - プロンプト構築
#   - UIイベントの送信
#   - レポート保存(?)
# ============================================================


# ============================================================
# 【共通・汎用】
# ============================================================


class Message(BaseModel):
    # systemはgeminiの場合、messagesに含めなくていい（引数で直接挿入）、tool等は今は不要
    role: Literal["user", "assistant"]
    content: str


class GeneratedMeta(BaseModel):
    """生成 AI 実行時のメタ情報（フロント型と一致）"""

    model: str
    temperature: float
    last_run_at: str


class GeneratedArtifact(BaseModel):
    """単発生成 artifact"""

    type: Literal["single_shot"] = "single_shot"
    system_prompt_type: str
    prompt_type: Optional[str] = None
    input: List[str]
    output: str
    meta: Optional[GeneratedMeta] = None


# ============================================================
# 【シングルショット】
# ============================================================


class GenerateSingleShotRequest(BaseModel):
    """シングルショット生成のリクエスト"""

    # --- プロンプトの指定 --- (例: "analysis", "idea", "chat_system")
    prompt_type: str = Field(..., description="使用するプロンプトの識別子（必須）")
    system_prompt_type: Optional[str] = Field(None, description="使用するシステムプロンプトの識別子（任意）")

    # --- 柔軟なコンテキスト辞書 ---
    # キー: "patent_text", "analysis_result", "idea_list" など
    # バリュー: フロントエンドで取得したテキスト全文
    context: Dict[str, str] = Field(default_factory=dict, description="プロンプトに埋め込むためのコンテキスト情報")

    # --- 保存先 ---
    report_type: str = Field(..., description="レポートの種類")
    report_id: str = Field(..., description="レポートID")
    artifact_name: str = Field(..., description="生成物の名称")  # 例: "patent_summary", "idea_generation"


# ============================================================
# 【マルチターン】
# ============================================================


class GenerateMultiTurnRequest(BaseModel):
    """マルチターン生成（対話等）のリクエスト"""

    messages: List[Message] = Field(..., description="今回の user メッセージを含む完全な会話履歴")

    # --- プロンプトの種類 ---
    system_prompt_type: Optional[str] = Field(None, description="使用するシステムプロンプトの識別子（任意）")

    # --- 柔軟なコンテキスト辞書 ---
    # キー: "patent_text", "analysis_result", "idea_list" など
    context: Dict[str, str] = Field(default_factory=dict, description="プロンプトに埋め込むためのコンテキスト情報")

    # --- 保存先 ---
    report_type: str = Field(..., description="レポートの種類")
    report_id: str = Field(..., description="レポートID")


# ============================================================
# 【UIイベント】
# ============================================================


class StreamEvent(BaseModel):
    """UIイベント"""

    type: Literal[
        "content_delta",  # テキスト追記
        "done",  # 完了
        "error",  # エラー
    ]
    data: dict
