from pypdf import PdfReader
from io import BytesIO
from PIL import Image
import os

def extract_figures_from_pdf_bytes(
    pdf_bytes: bytes,
    output_dir: str,
    min_width=100,
    min_height=100,
):
    os.makedirs(output_dir, exist_ok=True)

    reader = PdfReader(BytesIO(pdf_bytes))
    figures = []
    fig_index = 1

    for page_index, page in enumerate(reader.pages):
        if page_index == 0:
            continue  # 書誌情報ページは除外

        try:
            images = page.images
        except Exception:
            continue

        for img in images:
            image_bytes = img.data

            try:
                with Image.open(BytesIO(image_bytes)) as im:
                    width, height = im.size
                    if width < min_width or height < min_height:
                        continue

                    fig_id = f"fig_{fig_index:03d}"
                    filename = f"{fig_id}.png"
                    save_path = os.path.join(output_dir, filename)

                    im.save(save_path, format="PNG")

                    figures.append({
                        "id": fig_id,
                        "label": f"図{fig_index}",
                        "page": page_index + 1,
                        "path": save_path,
                    })

                    fig_index += 1

            except Exception:
                continue

    return figures
