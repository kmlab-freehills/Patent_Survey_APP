# Patent_Survey_APP/backend/src/services/patent/supports/patent_parser.py

import torch
from docling.datamodel.base_models import InputFormat
from docling.datamodel.document import PictureItem, TableItem, TextItem
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

# グローバルでコンバーターを保持（起動時のオーバーヘッド削減）
_converter = None


def get_patent_converter() -> DocumentConverter:
    """Doclingのコンバーターを取得する関数"""
    global _converter
    if _converter is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[PatentTest] Initializing Docling on {device}...")

        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = (
            False  # OCR無効化（日本語対応OCRの環境設定が複雑であり、デフォルトモデルの日本語精度が悪いため）
        )
        pipeline_options.do_table_structure = True  # 表構造解析
        pipeline_options.generate_picture_images = True  # 図抽出
        pipeline_options.generate_table_images = True  # 表画像抽出
        pipeline_options.do_formula_enrichment = False  # 数式認識（オフ）

        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=pipeline_options,
                )
            }
        )
    return _converter


def parse_patent(pdf_bytes: bytes) -> dict:
    """特許PDFをDoclingで解析"""
    try:
        converter = get_patent_converter()

        # メモリ上から直接読み込み
        import io

        from docling.datamodel.document import DocumentStream

        pdf_stream = io.BytesIO(pdf_bytes)
        doc_stream = DocumentStream(name="input.pdf", stream=pdf_stream)

        # 変換実行
        result = converter.convert(doc_stream)

        # plaintextとして抽出（後処理で整形）
        texts = []
        # /// テキスト抽出処理 開始 ///
        for element, _level in result.document.iterate_items():
            if not isinstance(element, TextItem):
                continue

            if not element.text:
                continue

            # bboxを持つ要素
            bbox = getattr(element, "bbox", None)

            # 右マージン（行番号）除外
            if bbox and bbox.x0 > 0.98:
                continue

            # 数字のみ（行番号・ページ内カウンタ）
            if element.text.strip().isdigit():
                continue

            # リストに格納
            texts.append(element.text.strip())
        # /// テキスト抽出処理 終了 ///

        plain_text = "\n".join(texts)

        # 画像抽出
        extracted_images = []
        for element, _level in result.document.iterate_items():
            if isinstance(element, (PictureItem, TableItem)):
                if element.image and element.image.pil_image:
                    extracted_images.append(element.image.pil_image)

        return {"plaintext": plain_text, "images": extracted_images}

    except Exception as e:
        print(f"[PatentTest] Parsing error: {e}")
        raise e
