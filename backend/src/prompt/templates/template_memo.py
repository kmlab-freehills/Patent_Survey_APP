# プロンプト構築関数のひな型

def build_prompt(document: str) -> str:
    # 資料がない場合のフォールバック
    if not document:
        pass

    prompt = f"""
{document}
""".strip()

    return prompt