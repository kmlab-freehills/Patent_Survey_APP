# Patent_Survey_APP/backend/src/routers/patent_process_api.py

from fastapi import APIRouter, File, HTTPException, UploadFile

from src.services.patent.functions import patent_text_extraction
from src.services.patent import patent_schemas
from src.services.patent.patent_store import (
    build_figure_url,
    get_patent_figure_dir,
    save_patent,
    load_patent_from_json,
    get_patent_images_list,
)

## upload_api.py / 特許PDFを処理するエンドポイント ##

router = APIRouter(prefix="/patent", tags=["PDF処理"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# ============================================================
# エンドポイント
# ============================================================


@router.post("/upload", response_model=patent_schemas.PatentUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read()

    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="ファイルサイズ超過")

    # Docling統合版: 画像も返される
    patent_doc, images = patent_text_extraction(pdf_bytes)

    # 保存 (画像も渡す)
    patent_id = save_patent(patent_doc, images)

    # 画像メタデータ構築 (既存処理を維持)
    figure_dir = get_patent_figure_dir(patent_id)

    # Docling版では既に保存済みなので、メタデータのみ再構築
    from pathlib import Path

    saved_figures = []
    for fig_file in sorted(Path(figure_dir).glob("fig_*.png")):
        idx = int(fig_file.stem.split("_")[1])
        saved_figures.append(
            {
                "id": fig_file.stem,
                "label": f"図{idx}",
                "page": 0,  # Doclingではページ情報なし (互換性のため0を設定)
                "url": build_figure_url(patent_id, fig_file.name),
            }
        )

    return {
        "filename": file.filename,
        "patent_id": patent_id,
        "patent_data": patent_doc.__dict__,
        "images": saved_figures,
    }

# 追加: IDによる特許データ再取得
@router.get("/{patent_id}", response_model=patent_schemas.PatentUploadResponse)
async def get_patent_data(patent_id: str):
    # 1. JSONデータの読み込み
    patent_data = load_patent_from_json(patent_id)
    if not patent_data:
        raise HTTPException(status_code=404, detail="Patent not found")
    
    # 2. 画像リストの再構築
    images = get_patent_images_list(patent_id)
    
    # 3. レスポンス（Upload時と同じ形式で返す）
    return {
        "filename": "Restored Data", 
        "patent_id": patent_id,
        "patent_data": patent_data,
        "images": images,
    }