"""Session-based real-time analysis endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.session_models import (
    SessionAnalyzeRequest,
    SessionAnalyzeResponse,
    SessionCreateResponse,
    SessionDeleteResponse,
    SessionResetRequest,
    SessionResetResponse,
)
from app.services.realtime_analysis_service import run_realtime_analysis
from app.services.session_service import (
    active_session_count,
    create_session,
    delete_session,
    get_session,
    reset_session,
)

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/create", response_model=SessionCreateResponse)
def session_create() -> SessionCreateResponse:
    """Create a new real-time analysis session."""
    session = create_session()
    return SessionCreateResponse(session_id=session.session_id)


@router.post("/analyze", response_model=SessionAnalyzeResponse)
def session_analyze(payload: SessionAnalyzeRequest) -> SessionAnalyzeResponse:
    """
    Submit content for incremental analysis within a session.

    On the first call the full content is analyzed. On subsequent calls
    only changed paragraphs are reprocessed — unchanged blocks use
    cached results. This makes live-typing analysis fast.
    """
    session = get_session(payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content is empty.")

    return run_realtime_analysis(session, payload.content, payload.options)


@router.post("/reset", response_model=SessionResetResponse)
def session_reset(payload: SessionResetRequest) -> SessionResetResponse:
    """Clear all analysis state but keep the session alive."""
    ok = reset_session(payload.session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SessionResetResponse(session_id=payload.session_id, reset=True)


@router.delete("/{session_id}", response_model=SessionDeleteResponse)
def session_delete(session_id: str) -> SessionDeleteResponse:
    """Permanently delete a session and free its memory."""
    ok = delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SessionDeleteResponse(session_id=session_id, deleted=True)


@router.get("/count")
def session_count() -> dict:
    """Return the number of active sessions (health/monitoring)."""
    return {"active_sessions": active_session_count()}
