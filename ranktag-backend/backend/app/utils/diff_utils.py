"""
Diff detection utilities for incremental content analysis.

Compares old and new block-hash lists to determine which blocks
were added, removed, or modified.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class BlockDiff:
    """Result of comparing old and new content blocks."""
    # Indices into the NEW block list that need (re)processing
    changed_indices: list[int] = field(default_factory=list)
    # Indices into the OLD block list that were removed
    removed_indices: list[int] = field(default_factory=list)
    # True if nothing changed at all
    is_unchanged: bool = False


def compute_block_diff(
    old_hashes: list[str],
    new_hashes: list[str],
) -> BlockDiff:
    """
    Compare two ordered lists of block hashes.

    Returns which new-side indices need processing and which old-side
    indices were removed. Uses positional comparison — if block 3 changed
    its hash, index 3 is marked dirty. If the new list is longer, the
    extra indices are marked as added. If shorter, removed indices are
    reported.
    """
    if old_hashes == new_hashes:
        return BlockDiff(is_unchanged=True)

    changed: list[int] = []
    removed: list[int] = []

    max_len = max(len(old_hashes), len(new_hashes))

    for i in range(max_len):
        old_h = old_hashes[i] if i < len(old_hashes) else None
        new_h = new_hashes[i] if i < len(new_hashes) else None

        if new_h is not None and old_h != new_h:
            # Block is new or changed
            changed.append(i)
        elif new_h is None and old_h is not None:
            # Block was removed
            removed.append(i)

    return BlockDiff(changed_indices=changed, removed_indices=removed)
