def build_patent_prompt(patent_doc):
    prompt = f"""
## 指示
この特許の技術内容をわかりやすく説明してください。

## 資料
<document title="patent">
{patent_doc.get_text()}
</document>
""".strip()
    return prompt
