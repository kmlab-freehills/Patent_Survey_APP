# backend/src/services/gemini/session_store.py

import json
import uuid
from pathlib import Path
from typing import List, Dict


class SessionStore:
    def __init__(self, storage_path="./storage/sessions"):
        self.path = Path(storage_path)
        self.path.mkdir(exist_ok=True, parents=True)

    def create_session(self) -> str:
        """新規セッションID発行"""
        session_id = str(uuid.uuid4())
        self.save(session_id, [])
        return session_id

    def load(self, session_id: str) -> List[Dict]:
        """履歴読み込み"""
        target = self.path / f"{session_id}.json"
        if not target.exists():
            return []
        try:
            with open(target, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save(self, session_id: str, messages: List[Dict]):
        """履歴保存"""
        with open(self.path / f"{session_id}.json", "w", encoding="utf-8") as f:
            json.dump(messages, f, ensure_ascii=False, indent=2)


session_store = SessionStore()