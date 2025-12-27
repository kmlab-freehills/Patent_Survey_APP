from google.genai import types
from google.genai.types import GenerateContentConfig


# ============================================================
# テキスト生成実行関数
# ============================================================

def generate_content(prompt, client, tool_mode: str):
    """
    tool_mode:
        "text"       : ツールなし（純粋なテキスト生成）
        "search"     : Google Search のみ
        "search_url" : URL context + Google Search
    """

    tools = None

    # テキスト生成のみ
    if tool_mode == "text":
        pass

    # Google Searchのみ
    elif tool_mode == "search":
        grounding_tool = types.Tool(
            google_search=types.GoogleSearch()
        )
        tools = [grounding_tool]

    # URL context + Google Search を両方指定
    elif tool_mode == "search_url":
        tools = [
            {"url_context": {}},
            {"google_search": {}},
        ]

    else:
        raise ValueError(f"Unknown tool_mode: {tool_mode}")

    # config はツールがある場合のみ生成
    config = None
    if tools is not None:
        config = GenerateContentConfig(
            tools=tools,
        )

    response = client.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=prompt,
        config=config,
    )

    return response


def stream(response_stream):
    full_text = ""
    thoughts = ""
    answer = ""

    for chunk in response_stream:
        if not chunk.candidates: # ツール呼び出し中などで candidates が None の場合があるので防御的に
            continue

        for part in chunk.candidates[0].content.parts:
            if not getattr(part, "text", None):
                continue # 何も送らない

            # 思考テキスト
            if getattr(part, "thought", False):
                if not thoughts:
                    yield "**【思考の要約】**\n\n"
                thoughts += part.text
                full_text += part.text
                yield part.text

            # 回答テキスト
            else:
                if not answer:
                    yield "**【回答】**\n\n"
                answer += part.text
                full_text += part.text
                yield part.text

    return
