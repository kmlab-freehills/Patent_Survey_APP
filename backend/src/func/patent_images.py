# Patent_Survey_APP/backend/src/func/patent_images.py

import os
from io import BytesIO

from PIL import Image
from pypdf import PdfReader


def extract_figures_from_pdf_bytes(
    pdf_bytes: bytes,
    output_dir: str,
    min_width=100,
    min_height=100,
):
    os.makedirs(output_dir, exist_ok=True)

    reader = PdfReader(BytesIO(pdf_bytes))
    raw_figures = []

    # ------------------------------------------------------------
    # 画像のみ抽出（番号は後で付与※逆順に格納されるため）
    # ------------------------------------------------------------

    for page_index, page in enumerate(reader.pages):
        if page_index == 0:  # 書誌情報ページは除外
            continue

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

                    raw_figures.append(
                        {
                            "page": page_index + 1,
                            "image": im.copy(),  # 後で使う
                        }
                    )

            except Exception:
                continue

    # ------------------------------------------------------------
    # 逆順にして処理して番号を付与
    # ------------------------------------------------------------

    figures = []
    for index, fig in enumerate(reversed(raw_figures), start=1):
        fig_id = f"fig_{index:03d}"
        filename = f"{fig_id}.png"
        save_path = os.path.join(output_dir, filename)

        fig["image"].save(save_path, format="PNG")

        figures.append(
            {
                "id": fig_id,
                "label": f"図{index}",
                "page": fig["page"],
                "filename": filename,
            }
        )

    return figures
