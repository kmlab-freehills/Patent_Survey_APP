# Patent_Survey_APP/backend/src/services/gemini/functions.py

from typing import Any, Dict, Generator

from google.genai.types import GenerateContentConfig
from src.core.client import gemini_client  # APIキー認証済みclient

# テキスト生成＆ストリーミング処理
def generate_text_engine(
    model: str, contents: list, temperature: float, system_instruction: str = None
) -> Generator[Dict[str, Any], None, None]:
    # コンフィグ構築
    config = GenerateContentConfig(system_instruction=system_instruction, temperature=temperature)

    # ストリーム生成
    response = gemini_client.models.generate_content_stream(model=model, contents=contents, config=config)

    for chunk in response:
        if not chunk.candidates:
            continue

        for part in chunk.candidates[0].content.parts:
            text = part.text or ""
            if text:
                yield {"type": "content_delta", "data": {"chunk": text}}

    yield {"type": "done", "data": {}}

# messagesオブジェクトをgeminiが要求する型に変換
def convert_messages_to_gemini_contents(messages):
    contents = []
    for msg in messages:
        contents.append({"role": msg.role, "parts": [{"text": msg.content}]})
    
    print(contents)
    return contents
