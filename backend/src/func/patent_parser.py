import torch
from docling.datamodel.base_models import InputFormat
from docling.datamodel.document import PictureItem, TableItem, TextItem
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

_converter = None

def get_patent_converter() -> DocumentConverter:
    """Doclingコンバーターのシングルトン取得"""
    global _converter
    if _converter is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Docling] Initializing on {device}...")
        
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False
        pipeline_options.do_table_structure = True
        pipeline_options.generate_picture_images = True
        pipeline_options.generate_table_images = True
        
        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
    return _converter

def extract_plaintext_and_images(pdf_bytes: bytes) -> tuple[str, list]:
    """
    PDFからテキストと画像を抽出
    
    Returns:
        tuple: (plaintext, images)
            - plaintext: 抽出されたテキスト (既存の正規表現処理に渡す)
            - images: PIL Imageオブジェクトのリスト
    """
    import io
    from docling.datamodel.document import DocumentStream
    
    converter = get_patent_converter()
    pdf_stream = io.BytesIO(pdf_bytes)
    doc_stream = DocumentStream(name="input.pdf", stream=pdf_stream)
    
    result = converter.convert(doc_stream)
    
    # テキスト抽出
    texts = []
    for element, _level in result.document.iterate_items():
        if not isinstance(element, TextItem):
            continue
        if not element.text:
            continue
            
        bbox = getattr(element, "bbox", None)
        
        # 右マージン除外 (行番号)
        if bbox and bbox.x0 > 0.98:
            continue
            
        # 数字のみ除外
        if element.text.strip().isdigit():
            continue
            
        texts.append(element.text.strip())
    
    plaintext = "\n".join(texts)
    
    # 画像抽出
    images = []
    for element, _level in result.document.iterate_items():
        if isinstance(element, (PictureItem, TableItem)):
            if element.image and element.image.pil_image:
                images.append(element.image.pil_image)
    
    return plaintext, images