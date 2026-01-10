# supportsディレクトリの処理を統括
from src.services.patent.supports.patent_parser import extract_plaintext_and_images
from src.services.patent.supports.patent_text import parse_patent_text, patent_text_cleanup


def patent_text_extraction(pdf_bytes):
    """
    特許PDFのテキストを抽出・整形しPatentDocumentに変換
    """

    # Doclingで抽出
    plaintext, images = extract_plaintext_and_images(pdf_bytes)

    # 正規表現処理を適用
    cleaned_text = patent_text_cleanup(plaintext)
    # クラスオブジェクト化
    patent_doc = parse_patent_text(cleaned_text)

    # 欠損セクション確認
    missing_sections = patent_doc.get_missing_sections()
    if missing_sections:
        print("以下のセクションはこの文書に含まれていませんでした:")
        for section in missing_sections:
            print(f"- {section}")

    return patent_doc, images
