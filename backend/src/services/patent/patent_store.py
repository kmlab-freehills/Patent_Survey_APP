# backend/src/storage/patent_store.py

import json  # JSON保存用に追加
import os
import shutil
from pathlib import Path  # Path操作用に追加
from typing import Any, Dict, List
from uuid import uuid4

from src.core.config import STATIC_BASE_PATH, STATIC_BASE_URL
from src.services.patent.supports.patent_images import save_patent_images
from src.services.patent.supports.patent_text import PatentDocument

# ==========================================
# 1. 特許テキストデータ（idで管理）
# ==========================================

# サーバ再起動で消える一時ストレージ（DBを使わず変数をアプリ内で共有する）

patent_store: Dict[str, object] = {}


# ==========================================
# 1. 特許テキストデータ & JSON保存
# ==========================================


def save_patent(patent_doc, images: list = None) -> str:
    """
    特許文書と画像を保存
    構造: storage/patents/{patent_id}/
            ├── data.json      (解析結果)
            └── figures/       (画像フォルダ)
                ├── fig_001.png
                └── ...
    """
    patent_id = str(uuid4())

    # 1. オンメモリに保存（高速アクセス用）
    patent_store[patent_id] = patent_doc

    # 2. 保存先ディレクトリの構築: backend/storage/patents/{patent_id}
    patent_dir = STATIC_BASE_PATH / "patents" / patent_id
    os.makedirs(patent_dir, exist_ok=True)

    # 3. JSONデータの保存（要望対応）
    json_path = patent_dir / "data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        # patent_doc.to_dict() をダンプ
        json.dump(patent_doc.to_dict(), f, ensure_ascii=False, indent=2)

    # 4. 画像がある場合は保存
    if images:
        # storage/patents/{patent_id}/figures
        figure_dir = get_patent_figure_dir(patent_id)
        save_patent_images(images, figure_dir)

    # idを返す
    return patent_id


def get_patent(patent_id: str):
    # 基本はオンメモリから返す（将来的にJSONから読み込むロジックを追加）
    return patent_store.get(patent_id)


# ==========================================
# 2. 特許画像データ（ディレクトリで管理）
# ==========================================


def get_patent_figure_dir(patent_id: str) -> str:
    """
    画像の保存先ディレクトリパスを返す
    パス: backend/storage/patents/{patent_id}/figures
    """
    path = STATIC_BASE_PATH / "patents" / patent_id / "figures"
    return str(path)


def build_figure_url(patent_id: str, filename: str) -> str:
    """
    アクセス用URL作成
    URL: /static/patents/{patent_id}/figures/{filename}
    """
    return f"{STATIC_BASE_URL}/patents/{patent_id}/figures/{filename}"


# アプリ終了時に呼ばれるクリーンアップ関数
def cleanup_temp_files():
    if os.path.exists(STATIC_BASE_PATH):
        # storageフォルダの中身ごと削除（patentsディレクトリも含まれるため一括削除される）
        shutil.rmtree(STATIC_BASE_PATH)
        print(f"Cleanup: Deleted {STATIC_BASE_PATH}")


# ==========================================
# 3. チャット履歴管理
# ==========================================

# Gemini API の contents 形式で保存
# {patent_id: [{"role": "user", "parts": [{"text": "..."}]}, ...]}
chat_sessions: Dict[str, List[Dict[str, Any]]] = {}


def save_chat_message(patent_id: str, role: str, text: str):
    """
    チャット履歴に追加（Gemini contents形式）

    Args:
        patent_id: 特許ID
        role: "user" または "model"
        text: メッセージテキスト
    """
    if patent_id not in chat_sessions:
        chat_sessions[patent_id] = []

    chat_sessions[patent_id].append({"role": role, "parts": [{"text": text}]})


def get_chat_history(patent_id: str) -> List[Dict[str, Any]]:
    """
    チャット履歴を取得（Gemini contents形式）

    Args:
        patent_id: 特許ID

    Returns:
        Gemini API の contents 形式のリスト
    """
    return chat_sessions.get(patent_id, [])


def clear_chat_history(patent_id: str):
    """
    チャット履歴をクリア（将来的な機能拡張用）

    Args:
        patent_id: 特許ID
    """
    if patent_id in chat_sessions:
        chat_sessions[patent_id] = []


# ============================================================
# リロード保存処理
# ============================================================


def load_patent_from_json(patent_id: str) -> dict | None:
    """
    保存されたJSONから特許データを読み込む
    """
    patent_dir = STATIC_BASE_PATH / "patents" / patent_id
    json_path = patent_dir / "data.json"

    if not json_path.exists():
        return None

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

            # 一度データクラスを経由させることで、欠損している必須フィールド(abstract等)にデフォルト値("")を埋める
            doc = PatentDocument(**data)
            return doc.__dict__

    except Exception as e:
        print(f"Failed to load patent json: {e}")
        return None


def get_patent_images_list(patent_id: str) -> list:
    """
    保存された画像ディレクトリから画像リストを再構築する
    """
    figure_dir_path = Path(get_patent_figure_dir(patent_id))
    if not figure_dir_path.exists():
        return []

    saved_figures = []
    # ファイル名順にソート
    for fig_file in sorted(figure_dir_path.glob("fig_*.png")):
        # fig_001.png -> 1
        try:
            idx = int(fig_file.stem.split("_")[1])
            saved_figures.append(
                {
                    "id": fig_file.stem,
                    "label": f"図{idx}",
                    "page": 0,
                    "url": build_figure_url(patent_id, fig_file.name),
                }
            )
        except Exception as e:
            print(f"Failed to get patent images list: {e}")
            continue

    return saved_figures
