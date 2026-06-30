"""
Content fingerprinting and paragraph-level hashing.

Used by the real-time engine to detect which content blocks have
changed between requests, so only dirty blocks are reprocessed.
"""
from __future__ import annotations

import hashlib
import re

_RE_BLOCK_SPLIT = re.compile(r"\n\s*\n")

# Minimum characters for a block to be worth analyzing independently.
# Shorter fragments get merged into the previous block.
_MIN_BLOCK_LEN = 40


def content_hash(text: str) -> str:
    """Fast whole-content fingerprint (SHA-256, hex-truncated to 16 chars)."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def block_hash(text: str) -> str:
    """Hash a single content block (paragraph / section)."""
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:12]


def split_into_blocks(text: str) -> list[str]:
    """
    Split text into paragraph-level blocks for incremental processing.

    Splits on double-newlines (standard paragraph separator). Blocks
    shorter than _MIN_BLOCK_LEN are merged into the previous block
    to avoid creating tiny fragments that produce noisy n-grams.
    """
    raw_blocks = _RE_BLOCK_SPLIT.split(text)
    blocks: list[str] = []

    for raw in raw_blocks:
        stripped = raw.strip()
        if not stripped:
            continue
        if blocks and len(stripped) < _MIN_BLOCK_LEN:
            # Merge short fragment into previous block
            blocks[-1] = blocks[-1] + " " + stripped
        else:
            blocks.append(stripped)

    # If no paragraph breaks exist, split into ~500-word chunks
    # so very long single-paragraph texts still benefit from incremental
    if len(blocks) <= 1 and text.strip():
        words = text.split()
        if len(words) > 600:
            chunk_size = 500
            blocks = []
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i : i + chunk_size])
                blocks.append(chunk)
        elif text.strip():
            blocks = [text.strip()]

    return blocks
