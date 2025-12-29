# Patent_Survey_APP/backend/src/routers/patent_process_api.py

from fastapi import APIRouter, File, HTTPException, UploadFile
from src.func.patent_images import extract_figures_from_pdf_bytes
from src.func.patent_pdf import patent_text_extraction
from src.schemas import patent_schemas
from src.storage.patent_store import (
    build_figure_url,
    get_patent_figure_dir,
    save_patent,
)

## upload_api.py / 特許PDFを処理するエンドポイント ##

router = APIRouter(prefix="/patent", tags=["PDF処理"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# ============================================================
# エンドポイント
# ============================================================


@router.post("/upload", response_model=patent_schemas.PatentUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """アップロードされたJ-PlatPat由来の特許PDFを処理し、ファイル情報・ID・本文・画像(メタデータ)を返す"""
    pdf_bytes = await file.read()  # PDF を bytes として取得

    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"ファイルサイズが上限({MAX_FILE_SIZE / 1024 / 1024}MB)を超えています",
        )

    # テキスト抽出＆整形&クラスオブジェクト化
    patent_doc = patent_text_extraction(pdf_bytes)

    # 一時的な特許ID発行&保存（別のエンドポイントとやり取りするため）
    patent_id = save_patent(patent_doc)

    # 図の抽出 & 保存
    figure_dir = get_patent_figure_dir(patent_id)
    figures = extract_figures_from_pdf_bytes(pdf_bytes, figure_dir)

    # 図にメタデータを付与（URLなど）
    images = [
        {
            "id": fig["id"],
            "label": fig["label"],
            "page": fig["page"],
            "url": build_figure_url(patent_id, fig["filename"]),
        }
        for fig in figures
    ]

    return {
        "filename": file.filename,
        "patent_id": patent_id,
        "patent_data": patent_doc.__dict__,
        "images": images,
    }
