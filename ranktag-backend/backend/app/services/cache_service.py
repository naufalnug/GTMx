"""
In-memory TTL cache for the real-time analysis engine.

Stores per-block analysis results keyed by block hash so that
unchanged blocks are never reprocessed. Designed for later swap
to Redis with the same interface.
"""
from __future__ import annotations

import threading
import time
from collections import Counter
from dataclasses import dataclass, field
from typing import Optional


@dataclass(slots=True)
class BlockAnalysis:
    """Cached analysis result for a single content block."""
    block_hash: str
    tokens: list[str]
    filtered_tokens: list[str]
    unigrams: Counter = field(default_factory=Counter)
    bigrams: Counter = field(default_factory=Counter)
    trigrams: Counter = field(default_factory=Counter)
    word_count: int = 0
    filtered_count: int = 0
    created_at: float = field(default_factory=time.time)


class AnalysisCache:
    """
    Thread-safe in-memory cache mapping block hashes → BlockAnalysis.

    Supports TTL-based expiration and a hard capacity limit to
    prevent unbounded memory growth.
    """

    def __init__(
        self,
        ttl_seconds: float = 3600.0,
        max_entries: int = 10_000,
    ) -> None:
        self._store: dict[str, BlockAnalysis] = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds
        self._max_entries = max_entries
        self._hits = 0
        self._misses = 0

    # ── Public API ───────────────────────────────────────────────────────

    def get(self, block_hash: str) -> Optional[BlockAnalysis]:
        """Retrieve a cached block analysis, or None if miss / expired."""
        with self._lock:
            entry = self._store.get(block_hash)
            if entry is None:
                self._misses += 1
                return None
            if time.time() - entry.created_at > self._ttl:
                del self._store[block_hash]
                self._misses += 1
                return None
            self._hits += 1
            return entry

    def put(self, analysis: BlockAnalysis) -> None:
        """Store a block analysis result."""
        with self._lock:
            if len(self._store) >= self._max_entries:
                self._evict_oldest()
            self._store[analysis.block_hash] = analysis

    def invalidate(self, block_hash: str) -> None:
        """Remove a specific entry."""
        with self._lock:
            self._store.pop(block_hash, None)

    def clear(self) -> None:
        """Drop all cached entries."""
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    def stats(self) -> dict[str, int]:
        """Return cache hit/miss/size counters."""
        with self._lock:
            return {
                "hits": self._hits,
                "misses": self._misses,
                "size": len(self._store),
            }

    def reset_counters(self) -> None:
        """Reset hit/miss counters (e.g. at session reset)."""
        with self._lock:
            self._hits = 0
            self._misses = 0

    # ── Internals ────────────────────────────────────────────────────────

    def _evict_oldest(self) -> None:
        """Remove the oldest 10% of entries to free space."""
        entries = sorted(self._store.items(), key=lambda kv: kv[1].created_at)
        evict_count = max(1, len(entries) // 10)
        for key, _ in entries[:evict_count]:
            del self._store[key]


# ── Global cache singleton ───────────────────────────────────────────────
# Shared across all sessions. Block hashes are content-based so identical
# paragraphs in different sessions share the same cache entry.

_global_cache = AnalysisCache(ttl_seconds=3600.0, max_entries=50_000)


def get_global_cache() -> AnalysisCache:
    """Return the global block analysis cache."""
    return _global_cache
