from pydantic import BaseModel, Field
from typing import Dict, Optional

# 特許文書の中身そのもののスキーマ
class PatentContent(BaseModel):
    abstract: str = Field(..., description="要約")
    claims: str = Field(..., description="特許請求の範囲")
    tech_field: str = Field("", description="技術分野")
    background: str = Field("", description="背景技術")
    problem_to_solve: str = Field("", description="解決しようとする課題")
    means_to_solve: str = Field("", description="解決手段")
    effect: str = Field("", description="発明の効果")
    drawings_desc: str = Field("", description="図面の簡単な説明")
    embodiments: str = Field("", description="実施形態")
    symbols_desc: str = Field("", description="符号の説明")
    industrial_applicability: str = Field("", description="産業上の利用可能性")
    others: Dict[str, str] = Field(default_factory=dict, description="その他のセクション")

# APIが返す全体のレスポンススキーマ
class PatentUploadResponse(BaseModel):
    filename: str
    patent_id: str
    patent_data: PatentContent  # ここで上記のクラスをネストする