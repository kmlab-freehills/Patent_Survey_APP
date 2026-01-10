# Patent_Survey_APP/backend/src/core/config.py

import os
from pathlib import Path
from dotenv import load_dotenv

# .envファイル読み込み
load_dotenv()

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# フロントエンド側のURL
FRONTEND_URL = os.getenv("FRONTEND_URL")

# 終了時に一時ファイルを削除するかどうか
CLEANUP_ON_EXIT = os.getenv("CLEANUP_ON_EXIT")

# プロジェクトのルートパス
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# 静的ファイル
STATIC_BASE_PATH = PROJECT_ROOT / "storage"
STATIC_BASE_URL = "/static"