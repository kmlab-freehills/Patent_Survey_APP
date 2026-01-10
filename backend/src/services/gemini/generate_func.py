# backend/src/services/gemini/generate_func.py

from google.genai.types import GenerateContentConfig

from typing import Any, Dict, Generator


def generate_text_engine(
    client, contents: list, system_instruction: str = None
) -> Generator[Dict[str, Any], None, None]:
    """
    Gemini生成エンジン（Ollama方式）
    contentsは参照渡しで、内部で自動的に更新される
    """
    config = GenerateContentConfig(system_instruction=system_instruction)

    response = client.models.generate_content_stream(model="gemini-2.5-flash", contents=contents, config=config)

    accumulated_text = ""

    for chunk in response:
        if not chunk.candidates:
            continue

        for part in chunk.candidates[0].content.parts:
            if not getattr(part, "text", None):
                continue

            text = part.text
            accumulated_text += text

            # UIイベント送信
            yield {"type": "content_delta", "data": {"chunk": text}}

    # 完全な応答をcontentsに追加（参照渡しで自動更新）
    contents.append({"role": "model", "parts": [{"text": accumulated_text}]})

    yield {"type": "done", "data": {}}
