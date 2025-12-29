# Patent_Survey_APP/backend/src/func/gemini_client.py

# Gemini-APIのクライアント認証を実行する --> clientをインポートして利用

import config
from google import genai

client = genai.Client(api_key=config.GEMINI_API_KEY)
