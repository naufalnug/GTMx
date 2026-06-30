"""
Session lifecycle management.

Creates, retrieves, resets, and deletes analysis sessions.
Sessions hold per-user state: the current block hashes, per-block
analysis results, and aggregate keyword counters.

Sessions auto-expire after a configurable TTL.
"""
from __future__ import annotations

import threading
import time
import uuid
from collections import Counter
from dataclasses import dataclass, field
from typing import Optional

from app.services.cache_service import BlockAnalysis


# ── Session state ────────────────────────────────────────────────────────

@dataclass(slots=True)
class AnalysisSession:
    """In-memory state for one real-time analysis session."""
    session_id: str
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)

    # Ordered list of block hashes from the most recent content
    block_hashes: list[str] = field(default_factory=list)

    # Per-block analysis results (indexed same as block_hashes)
    block_results: list[BlockAnalysis] = field(default_factory=list)

    # Aggregate counters (merged from all blocks)
    total_unigrams: Counter = field(default_factory=Counter)
    total_bigrams: Counter = field(default_factory=Counter)
    total_trigrams: Counter = field(default_factory=Counter)
    total_words: int = 0
    filtered_words: int = 0


# ── Session store ────────────────────────────────────────────────────────

_SESSION_TTL = 1800.0       # 30 minutes of inactivity
_MAX_SESSIONS = 500         # hard cap to prevent memory exhaustion

_sessions: dict[str, AnalysisSession] = {}
_lock = threading.Lock()


def create_session() -> AnalysisSession:
    """Create a new analysis session and return it."""
    _cleanup_expired()
    sid = uuid.uuid4().hex[:16]
    session = AnalysisSession(session_id=sid)
    with _lock:
        if len(_sessions) >= _MAX_SESSIONS:
            _evict_oldest_locked()
        _sessions[sid] = session
    return session


def get_session(session_id: str) -> Optional[AnalysisSession]:
    """Retrieve a session by ID, updating last_active. None if not found / expired."""
    with _lock:
        session = _sessions.get(session_id)
        if session is None:
            return None
        if time.time() - session.last_active > _SESSION_TTL:
            del _sessions[session_id]
            return None
        session.last_active = time.time()
        return session


def reset_session(session_id: str) -> bool:
    """Clear all analysis state in a session but keep the session alive."""
    with _lock:
        session = _sessions.get(session_id)
        if session is None:
            return False
        session.block_hashes = []
        session.block_results = []
        session.total_unigrams = Counter()
        session.total_bigrams = Counter()
        session.total_trigrams = Counter()
        session.total_words = 0
        session.filtered_words = 0
        session.last_active = time.time()
        return True


def delete_session(session_id: str) -> bool:
    """Permanently remove a session."""
    with _lock:
        return _sessions.pop(session_id, None) is not None


def active_session_count() -> int:
    """Return number of live sessions (for health checks)."""
    with _lock:
        return len(_sessions)


# ── Internals ────────────────────────────────────────────────────────────

def _cleanup_expired() -> None:
    """Remove sessions idle longer than TTL."""
    now = time.time()
    with _lock:
        expired = [
            sid for sid, s in _sessions.items()
            if now - s.last_active > _SESSION_TTL
        ]
        for sid in expired:
            del _sessions[sid]


def _evict_oldest_locked() -> None:
    """Evict the least recently active session. Caller must hold _lock."""
    if not _sessions:
        return
    oldest_id = min(_sessions, key=lambda sid: _sessions[sid].last_active)
    del _sessions[oldest_id]
