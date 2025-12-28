import os
from dotenv import load_dotenv

# .envファイル読み込み
load_dotenv()

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# フロントエンド側のURL
FRONTEND_URL = os.getenv("FRONTEND_URL")

# 終了時に一時ファイルを削除するかどうか
CLEANUP_ON_EXIT = os.getenv("CREANUP_ON_EXIT")