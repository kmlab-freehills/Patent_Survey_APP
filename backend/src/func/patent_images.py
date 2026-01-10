import os
from pathlib import Path

def save_patent_images(images: list, output_dir: str) -> list:
    """
    Doclingで抽出した画像を保存
    
    Args:
        images: PIL Imageオブジェクトのリスト
        output_dir: 保存先ディレクトリ
        
    Returns:
        figures: 画像メタデータのリスト
            [{"id": "fig_001", "label": "図1", "filename": "fig_001.png"}, ...]
    """
    os.makedirs(output_dir, exist_ok=True)
    
    figures = []
    for index, img in enumerate(images, start=1):
        fig_id = f"fig_{index:03d}"
        filename = f"{fig_id}.png"
        save_path = Path(output_dir) / filename
        
        # PNG形式で保存
        img.save(save_path, format="PNG")
        
        figures.append({
            "id": fig_id,
            "label": f"図{index}",
            "filename": filename,
        })
    
    return figures