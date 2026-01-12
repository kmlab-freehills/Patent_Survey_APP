# Patent_Survey_APP/backend/src/services/report/schemas.py

from typing import Any, Dict

from pydantic import BaseModel, Field


# 1. メタデータ
class ReportMetadata(BaseModel):
    """レポートのメタデータ：検索や一覧表示、ルーティングに必要な最低限の情報"""

    report_id: str = Field(..., description="レポートのID")
    title: str = Field(..., description="レポートのタイトル")
    report_type: str = Field(..., description="レポートの種類: idea | search | matching")
    created_at: str = Field(..., description="レポートの作成日時")
    updated_at: str = Field(..., description="レポートの更新日時")


# 2. レポート全体構造
class ReportDocument(BaseModel):
    """レポート全体構造：中身はブラックボックス（任意のJSONオブジェクト）として許容"""

    metadata: ReportMetadata = Field(..., description="レポートのメタデータ")
    content: Dict[str, Any] = Field(default_factory=dict, description="任意のJSONオブジェクト")

# 3. 新規作成時のリクエストボディ
class CreateReportRequest(BaseModel):
    """レポート作成"""
    title: str = Field(..., description="レポートのタイトル")
    report_type: str = Field(..., description="レポートの種類: idea | search | matching")