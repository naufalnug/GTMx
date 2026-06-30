"""
WebSocket endpoint for live real-time keyword analysis.

Clients connect, send content updates, and receive analysis results
as they type — lower latency than HTTP polling.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.realtime_analysis_service import run_realtime_analysis
from app.services.session_service import create_session, delete_session, get_session
from app.models.session_models import SessionAnalyzeOptions

logger = logging.getLogger("rankedtag.ws")

router = APIRouter()


@router.websocket("/ws/analyze")
async def ws_analyze(websocket: WebSocket):
    """
    WebSocket for live analysis.

    Protocol:
      1. Server creates a session on connect and sends {"session_id": "..."}
      2. Client sends {"content": "...", "options": {...}} messages
      3. Server responds with the analysis result JSON
      4. On disconnect, session is cleaned up
    """
    await websocket.accept()
    session = create_session()
    sid = session.session_id
    logger.info("WS connected: %s", sid)

    try:
        await websocket.send_json({"type": "session", "session_id": sid})

        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            content = msg.get("content", "")
            if not content or not content.strip():
                await websocket.send_json({"type": "error", "message": "Empty content"})
                continue

            opts_raw = msg.get("options", {})
            opts = SessionAnalyzeOptions(
                remove_numbers=opts_raw.get("remove_numbers", False),
                filter_stopwords=opts_raw.get("filter_stopwords", True),
                min_frequency=opts_raw.get("min_frequency", 2),
                top_n=opts_raw.get("top_n", 30),
            )

            session_obj = get_session(sid)
            if session_obj is None:
                # Session expired — recreate
                session_obj = create_session()
                sid = session_obj.session_id
                await websocket.send_json({"type": "session", "session_id": sid})

            result = run_realtime_analysis(session_obj, content, opts)
            await websocket.send_json({
                "type": "result",
                **result.model_dump(),
            })

    except WebSocketDisconnect:
        logger.info("WS disconnected: %s", sid)
    except Exception:
        logger.exception("WS error: %s", sid)
    finally:
        delete_session(sid)
