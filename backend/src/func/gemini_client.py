import config
from google import genai

client = genai.Client(api_key=config.GEMINI_API_KEY)