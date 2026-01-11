import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from src.services.session.session_schema import ArtifactData, ConversationData, SessionData


class SessionStore:
    def __init__(self, storage_path: str = "./storage/sessions"):
        self.path = Path(storage_path)
        self.path.mkdir(exist_ok=True, parents=True)

    def _get_session_path(self, session_id: str) -> Path:
        return self.path / f"{session_id}.json"

    def _now_iso(self) -> str:
        """現在時刻をISO 8601形式で返す"""
        return datetime.utcnow().isoformat() + "Z"

    # ============================================================
    # 基本操作
    # ============================================================

    def create_session(self, session_id: str) -> SessionData:
        """新規セッションを作成"""
        now = self._now_iso()
        session = SessionData(session_id=session_id, created_at=now, updated_at=now)
        self._write_session(session)
        return session

    def load_session(self, session_id: str) -> Optional[SessionData]:
        """セッションを読み込み（存在しない場合はNone）"""
        path = self._get_session_path(session_id)
        if not path.exists():
            return None

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return SessionData(**data)
        except Exception as e:
            print(f"Failed to load session {session_id}: {e}")
            return None

    def _write_session(self, session: SessionData):
        """セッションをJSONに書き込み"""
        path = self._get_session_path(session.session_id)

        # デバッグログ
        print(f"[Session] Saving: {session.session_id}")
        print(f"  - Artifacts: {list(session.artifacts.keys())}")
        print(f"  - Conversation messages: {len(session.conversation.messages) if session.conversation else 0}")

        with open(path, "w", encoding="utf-8") as f:
            json.dump(session.dict(), f, ensure_ascii=False, indent=2)

    # ============================================================
    # 部分更新
    # ============================================================

    def save_artifact(self, session_id: str, artifact_name: str, artifact_data: ArtifactData) -> SessionData:
        """Artifactを保存（部分更新）"""
        session = self.load_session(session_id)
        if not session:
            session = self.create_session(session_id)

        session.artifacts[artifact_name] = artifact_data
        session.updated_at = self._now_iso()

        self._write_session(session)
        return session

    def save_conversation(self, session_id: str, conversation: ConversationData) -> SessionData:
        """Conversationを保存（上書き）"""
        session = self.load_session(session_id)
        if not session:
            session = self.create_session(session_id)

        session.conversation = conversation
        session.updated_at = self._now_iso()

        self._write_session(session)
        return session

    def update_session(
        self,
        session_id: str,
        artifacts: Optional[Dict[str, ArtifactData]] = None,
        conversation: Optional[ConversationData] = None,
        gemini_session_id: Optional[str] = None,
    ) -> SessionData:
        """セッション全体を更新"""
        session = self.load_session(session_id)
        if not session:
            session = self.create_session(session_id)

        if artifacts:
            session.artifacts.update(artifacts)
        if conversation:
            session.conversation = conversation
        if gemini_session_id:
            session.gemini_session_id = gemini_session_id

        session.updated_at = self._now_iso()

        self._write_session(session)
        return session

    # ============================================================
    # クリーンアップ
    # ============================================================

    def delete_session(self, session_id: str):
        """セッションを削除"""
        path = self._get_session_path(session_id)
        if path.exists():
            os.remove(path)


# シングルトンインスタンス
session_store = SessionStore()
