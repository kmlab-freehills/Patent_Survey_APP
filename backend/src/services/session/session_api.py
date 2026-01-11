import uuid

from fastapi import APIRouter, HTTPException

from src.services.session.session_schema import SaveArtifactRequest, SessionData, UpdateSessionRequest
from src.services.session.session_store import session_store

router = APIRouter(prefix="/session", tags=["Session"])

# ============================================================
# セッション管理
# ============================================================


@router.post("/", response_model=SessionData)
async def create_session():
    """新規セッションを作成"""
    session_id = str(uuid.uuid4())
    session = session_store.create_session(session_id)
    return session


@router.get("/{session_id}", response_model=SessionData)
async def get_session(session_id: str):
    """セッションを取得"""
    session = session_store.load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.put("/{session_id}", response_model=SessionData)
async def update_session(session_id: str, request: UpdateSessionRequest):
    """セッションを更新（部分更新可能）"""
    session = session_store.update_session(
        session_id,
        artifacts=request.artifacts,
        conversation=request.conversation,
        gemini_session_id=request.gemini_session_id,
    )
    return session


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """セッションを削除"""
    session_store.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}


# ============================================================
# Artifact管理（簡易版）
# ============================================================


@router.post("/{session_id}/artifact", response_model=SessionData)
async def save_artifact(session_id: str, request: SaveArtifactRequest):
    """Artifactを保存"""
    session = session_store.save_artifact(session_id, request.name, request.data)
    return session
