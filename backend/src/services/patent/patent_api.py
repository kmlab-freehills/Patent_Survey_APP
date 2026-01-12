import json
import shutil
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from src.core.config import STATIC_BASE_URL
from src.services.patent.functions import extract_patent_with_docling
from src.services.patent.schemas import PatentImage
from src.services.report.store import report_store

# ルーター
router = APIRouter(prefix="/reports", tags=["特許解析"])

# エンドポイント
@router.post("/{report_type}/{report_id}/patent")
async def upload_and_analyze_patent(report_type: str, report_id: str, file: UploadFile = File(...)):
    """
    特許PDFをアップロード・解析し、レポート配下に保存する
    このAPIが「特許ディレクトリの作成」「画像の保存」「JSONの保存」の責任を持つ
    """
    # --- 1. レポートが存在するか確認 ---
    report = report_store.load_report(report_type, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # --- 2. PDF読み込み & Docling解析 ---
    try:
        pdf_bytes = await file.read()
        # extract_patent_with_docling は (PatentDocument, List[PIL.Image]) を返す想定
        patent_doc, pil_images = extract_patent_with_docling(pdf_bytes)
    except Exception as e:
        print(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Patent analysis failed: {str(e)}")

    # --- 3. 保存先ディレクトリの準備 ---
    # storage/reports/{type}/{id}/patent/
    report_dir = report_store.get_report_dir(report_type, report_id)
    patent_dir = report_dir / "patent"
    figures_dir = patent_dir / "figures"

    # 既存があれば削除して作り直す（再アップロード対応）
    if patent_dir.exists():
        shutil.rmtree(patent_dir)

    patent_dir.mkdir(parents=True, exist_ok=True)
    figures_dir.mkdir(parents=True, exist_ok=True)

    # --- 4. 画像の保存 ---
    saved_images: List[PatentImage] = []

    for idx, img in enumerate(pil_images, start=1):
        # ファイル名: fig_001.png
        filename = f"fig_{idx:03d}.png"
        save_path = figures_dir / filename

        # 保存
        img.save(save_path, format="PNG")

        # URL生成: /static/reports/{type}/{id}/patent/figures/{filename}
        url = f"{STATIC_BASE_URL}/reports/{report_type}/{report_id}/patent/figures/{filename}"

        saved_images.append(PatentImage(id=f"fig_{idx:03d}", label=f"図{idx}", url=url))

    # --- 5. テキストデータの保存 (data.json) ---
    # PatentContentスキーマ (pydantic) を辞書化して保存
    # patent_doc は dataclass なので asdict または .to_dict() が必要
    # ※ patent_schemas.py の PatentContent に合わせるため、ここでは dataclass -> dict 変換を行う
    patent_data_dict = patent_doc.to_dict()

    # JSONファイルパス（storage/reports/{type}/{id}/patent/data.json）
    json_path = patent_dir / "data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(patent_data_dict, f, ensure_ascii=False, indent=2)

    # --- 6. レポート本体 (report.json) の更新 ---
    # 「特許データを持っています」というフラグや、基本情報を記録
    report.content["patent_info"] = {
        "filename": file.filename,
        "patent_id": report_id,  # 現時点でレポートIDと特許IDを同一視（別途管理も可）
        "has_patent": True,
        "image_count": len(saved_images),
    }

    # レポートの保存
    report_store.save_report(report)

    # --- 7. フロントエンドへのレスポンス ---
    # PatentUploadResponse の形式に合わせて返す
    return {"filename": file.filename, "patent_id": report_id, "patent_data": patent_data_dict, "images": saved_images}
