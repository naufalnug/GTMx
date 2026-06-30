"""Pydantic models for the real-time session-based analysis API."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.schemas import KeywordResult


# ── Requests ─────────────────────────────────────────────────────────────

class SessionAnalyzeRequest(BaseModel):
    """POST /session/analyze request body."""
    session_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1, max_length=500_000)
    options: SessionAnalyzeOptions = Field(default_factory=lambda: SessionAnalyzeOptions())


class SessionAnalyzeOptions(BaseModel):
    """Analysis options for a session request."""
    remove_numbers: bool = False
    filter_stopwords: bool = True
    min_frequency: int = Field(2, ge=1)
    top_n: int = Field(20, ge=1, le=200)


class SessionResetRequest(BaseModel):
    """POST /session/reset request body."""
    session_id: str = Field(..., min_length=1)


# ── Responses ────────────────────────────────────────────────────────────

class SessionCreateResponse(BaseModel):
    """POST /session/create response."""
    session_id: str


class ProcessingMeta(BaseModel):
    """Performance metadata included in every analysis response."""
    total_processing_ms: float
    cache_hits: int
    reprocessed_blocks: int
    total_blocks: int
    is_full_reprocess: bool


class UpdatedBlock(BaseModel):
    """Summary of a single reprocessed block."""
    index: int
    word_count: int
    hash: str


class SessionAnalyzeResponse(BaseModel):
    """POST /session/analyze response."""
    session_id: str
    statistics: SessionStatistics
    keywords: dict[str, list[KeywordResult]]
    updated_blocks: list[UpdatedBlock]
    processing: ProcessingMeta


class SessionStatistics(BaseModel):
    """Aggregate text statistics across all blocks."""
    total_words: int
    filtered_words: int
    unique_words: int
    block_count: int


class SessionDeleteResponse(BaseModel):
    """DELETE /session/{id} response."""
    session_id: str
    deleted: bool


class SessionResetResponse(BaseModel):
    """POST /session/reset response."""
    session_id: str
    reset: bool
