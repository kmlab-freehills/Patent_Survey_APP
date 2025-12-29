# backend/src/storage/patent_store.py

import os
import shutil
from pathlib import Path
from typing import Dict # 辞書型
from uuid import uuid4 # ID生成

# ==========================================
# 1. 特許テキストデータ（idで管理）
# ==========================================

# サーバ再起動で消える一時ストレージ（DBを使わず変数をアプリ内で共有する）

patent_store: Dict[str, object] = {}


# 保存用
def save_patent(patent_doc) -> str:
    patent_id = str(uuid4())
    patent_store[patent_id] = patent_doc  # {id: 本文}
    return patent_id


# 取得用
def get_patent(patent_id: str):
    return patent_store.get(patent_id)


# ==========================================
# 2. 特許画像データ（一時フォルダで管理）
# ==========================================

# サーバー起動でディレクトリ作成&終了時にディレクトリ削除（※リロード時にも削除処理が走る）


# .parent.parent.parent で src -> storage -> backend へ遡る
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# 2. プロジェクトルート直下に一時フォルダを作成
STATIC_DIR_NAME = "temp_patents"
STATIC_BASE_PATH = str(PROJECT_ROOT / STATIC_DIR_NAME)

STATIC_BASE_URL = "/static/patents"


def get_patent_figure_dir(patent_id: str) -> str:
    # Pathオブジェクトを使って結合し、文字列で返す
    path = PROJECT_ROOT / STATIC_DIR_NAME / patent_id / "figures"
    return str(path)


# アクセス用URL作成
def build_figure_url(patent_id: str, filename: str) -> str:
    return f"{STATIC_BASE_URL}/{patent_id}/figures/{filename}"


# アプリ終了時に呼ばれるクリーンアップ関数
def cleanup_temp_files():
    if os.path.exists(STATIC_BASE_PATH):
        # フォルダの中身ごと完全に削除
        shutil.rmtree(STATIC_BASE_PATH)
        print(f"Cleanup: Deleted {STATIC_BASE_PATH}")
