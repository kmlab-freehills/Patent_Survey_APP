from fastapi import APIRouter, UploadFile, File
from src.storage.patent_store import save_patent
from src.func import patentpdf
from src.schemas import patent_schemas

## upload_api.py / 特許PDFを処理するエンドポイント ##

router = APIRouter(prefix="/patent", tags=["PDF処理"])

# ============================================================
# エンドポイント
# ============================================================

@router.post("/upload", response_model=patent_schemas.PatentUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read() # PDF を bytes として取得
    patent_doc = patentpdf.patent_text_extraction(pdf_bytes) # テキスト抽出＆整形＆オブジェクト化
    patent_id = save_patent(patent_doc) # 一時的なIDを保存

    return {
        "filename": file.filename,
        "patent_id": patent_id,
        "patent_data": patent_doc.__dict__,
    }