import os
from dotenv import load_dotenv

# .envファイル読み込み
load_dotenv()

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

FRONTEND_URL = os.getenv("FRONTEND_URL")