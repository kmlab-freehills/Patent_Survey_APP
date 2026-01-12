import json
import shutil
from pathlib import Path
from typing import Optional

from src.core.config import STATIC_BASE_PATH

from .schemas import ReportDocument


class ReportStore:
    def __init__(self):
        # backend/storage/reports
        self.base_path = STATIC_BASE_PATH / "reports"
        self.base_path.mkdir(parents=True, exist_ok=True)

    # report_type を受け取って階層を下げる
    def _get_report_dir(self, report_type: str, report_id: str) -> Path:
        """
        レポートのルートディレクトリを取得（存在しない場合は作成しない）
        各機能（PatentServiceなど）が保存先を知るために使用
        """
        # backend/storage/{report_type}/{report_id}
        return self.base_path / report_type / report_id

    def _get_json_path(self, report_type: str, report_id: str) -> Path:
        """レポート本体ファイル(JSON)のパスを取得"""
        return self._get_report_dir(report_type, report_id) / "report.json"

    # ---------------------------------------------------------
    # 基本操作 (CRUD)
    # ---------------------------------------------------------

    def save_report(self, report: ReportDocument) -> str:
        """レポート(JSON)を保存/上書き"""
        report_type = report.metadata.report_type
        report_id = report.metadata.report_id

        # ディレクトリ作成: storage/reports/{type}/{id}
        report_dir = self._get_report_dir(report_type, report_id)
        report_dir.mkdir(parents=True, exist_ok=True)

        # JSON保存
        json_path = self._get_json_path(report_type, report_id)
        with open(json_path, "w", encoding="utf-8") as f:
            # 日本語文字化け防止のため ensure_ascii=False
            json.dump(report.model_dump(), f, ensure_ascii=False, indent=2)
        return report_id

    def load_report(self, report_type: str, report_id: str) -> Optional[ReportDocument]:
        """レポートを読み込む"""
        # レポートファイルのパスを取得
        json_path = self._get_json_path(report_type, report_id)
        if not json_path.exists():
            return None
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return ReportDocument(**data)
        except Exception as e:
            print(f"Error loading report {report_type}/{report_id}: {e}")
            return None

    def delete_report(self, report_type: str, report_id: str) -> bool:
        """レポート（ディレクトリごと）削除"""
        report_dir = self._get_report_dir(report_type, report_id)
        if report_dir.exists():
            shutil.rmtree(report_dir)
            return True
        return False

# インスタンス化
report_store = ReportStore()
