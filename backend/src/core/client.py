# Patent_Survey_APP/backend/src/core/client.py

# Gemini-APIのクライアント認証を実行する --> clientをインポートして利用

from src.core.config import GEMINI_API_KEY
from google import genai

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
