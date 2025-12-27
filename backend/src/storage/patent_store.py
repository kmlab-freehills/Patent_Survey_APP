# src/storage/patent_store.py

from typing import Dict
from uuid import uuid4

patent_store: Dict[str, object] = {}

def save_patent(patent_doc) -> str:
    patent_id = str(uuid4())
    patent_store[patent_id] = patent_doc
    return patent_id

def get_patent(patent_id: str):
    return patent_store.get(patent_id)

# サーバ再起動で消える一時ストレージ（DBを使わず変数をアプリ内で共有する）