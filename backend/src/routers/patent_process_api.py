from fastapi import APIRouter, UploadFile, File
from src.func import patentpdf

## upload_api.py / 特許PDFを処理するエンドポイント ##

router = APIRouter(prefix="/patent", tags=["PDF処理"])

# ============================================================
# エンドポイント
# ============================================================

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read() # PDF を bytes として取得
    patent_doc = patentpdf.patent_text_extraction(pdf_bytes) # テキスト抽出＆整形＆オブジェクト化
    abstract = patent_doc.get_text(["abstract"]) # 要約のみ取得

    return {
        "filename": file.filename,
        "abstract": abstract,
    }
