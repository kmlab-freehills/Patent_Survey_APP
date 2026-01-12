# Patent_Survey_APP/backend/src/services/patent/functions.py

from src.services.patent.supports.patent_parser import parse_patent
from src.services.patent.supports.patent_text import PatentDocument, parse_patent_text, patent_text_cleanup


def extract_patent_with_docling(pdf_bytes: bytes) -> PatentDocument:
    """
    Doclingで抽出したplaintextを既存の正規表現で処理し、
    PatentDocumentオブジェクトを返す
    """
    # 1. Doclingでplaintextと画像を抽出
    result = parse_patent(pdf_bytes)
    raw_text = result["plaintext"]
    images = result["images"]

    # 2. 正規表現処理を適用
    cleaned_text = patent_text_cleanup(raw_text)

    # 3. PatentDocumentに変換
    patent_doc = parse_patent_text(cleaned_text)

    # 4. 存在しないセクションの抽出
    missing_sections = patent_doc.get_missing_sections()
    if missing_sections:
        print("以下のセクションはこの文書に含まれていませんでした:")
        for section in missing_sections:
            print(f"- {section}")
    else:
        print("定義されたすべてのセクションが存在します。")

    return patent_doc, images
