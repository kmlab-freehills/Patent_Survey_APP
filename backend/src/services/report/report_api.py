# Patent_Survey_APP/backend/src/services/report/report_api.py

import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from .schemas import CreateReportRequest, ReportDocument, ReportMetadata
from .store import report_store

# ルーター
router = APIRouter(prefix="/reports", tags=["レポート管理"])

# ============================================================
# レポート基本操作 (JSON)
# ============================================================


@router.post("/", response_model=ReportDocument)
async def create_report(request: CreateReportRequest):
    """
    新規レポート作成（空の雛形を作成して返す）
    """
    # ID発行とタイムスタンプ作成
    report_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    # 空のドキュメント作成
    new_report = ReportDocument(
        metadata=ReportMetadata(
            report_id=report_id,  # id
            title=request.title,  # タイトル
            report_type=request.report_type,  # 種類
            created_at=now,  # 作成日
            updated_at=now,  # 更新日
        ),
        content={},  # 空のコンテンツ
    )

    # 保存処理
    report_store.save_report(new_report)
    return new_report


@router.get("/{report_type}/{report_id}", response_model=ReportDocument)
async def get_report(report_type: str, report_id: str):
    """レポート取得"""
    report = report_store.load_report(report_type, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.put("/{report_type}/{report_id}", response_model=ReportDocument)
async def update_report(report_type: str, report_id: str, report: ReportDocument):
    """
    レポート更新（上書き保存）
    IDとTypeの一致を確認してから保存
    """
    if report.metadata.report_id != report_id or report.metadata.report_type != report_type:
        raise HTTPException(status_code=400, detail="Report ID or Type mismatch")
    # 更新日時をバックエンドで更新
    now = datetime.utcnow().isoformat() + "Z"
    report.metadata.updated_at = now
    # 保存処理
    report_store.save_report(report)
    return report


@router.delete("/{report_type}/{report_id}")
async def delete_report(report_type: str, report_id: str):
    """レポート削除"""
    success = report_store.delete_report(report_type, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"status": "deleted", "report_id": report_id}


# ============================================================
# アセット管理 (画像アップロード等)
# ============================================================


@router.post("/{report_type}/{report_id}/assets", response_model=List[str])
async def upload_assets(report_type: str, report_id: str, files: List[UploadFile] = File(...)):
    """
    アセットファイル（画像など）のアップロード
    戻り値: アクセス用URLのリスト
    """
    # 読み込み
    file_data = []
    for file in files:
        content = await file.read()
        file_data.append((file.filename, content))

    # 保存
    urls = report_store.save_assets(report_type, report_id, file_data)
    return urls
