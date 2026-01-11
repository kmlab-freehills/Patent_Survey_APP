from google.genai.types import GenerateContentConfig
from typing import Any, Dict, Generator

def generate_text_engine(
    client, contents: list, system_instruction: str = None
) -> Generator[Dict[str, Any], None, None]:
    
    config = GenerateContentConfig(system_instruction=system_instruction)

    # ストリーム生成
    response = client.models.generate_content_stream(
        model="gemini-2.5-flash", 
        contents=contents, 
        config=config
    )

    for chunk in response:
        if not chunk.candidates:
            continue
        
        for part in chunk.candidates[0].content.parts:
            text = part.text or ""
            if text:
                yield {"type": "content_delta", "data": {"chunk": text}}

    yield {"type": "done", "data": {}}