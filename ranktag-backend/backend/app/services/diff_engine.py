"""
Content diff engine.

Compares new content against a session's stored block state to
determine which blocks need reprocessing. This is the decision
layer — it doesn't do analysis itself, just says what's dirty.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.services.session_service import AnalysisSession
from app.utils.diff_utils import BlockDiff, compute_block_diff
from app.utils.hashing import block_hash, split_into_blocks


@dataclass(slots=True)
class DiffResult:
    """Everything the incremental processor needs to act on."""
    new_blocks: list[str] = field(default_factory=list)
    new_hashes: list[str] = field(default_factory=list)
    diff: BlockDiff = field(default_factory=lambda: BlockDiff(is_unchanged=True))
    is_first_analysis: bool = False


def compute_content_diff(
    content: str,
    session: AnalysisSession,
) -> DiffResult:
    """
    Split new content into blocks, hash them, and diff against the
    session's previous block hashes.
    """
    new_blocks = split_into_blocks(content)
    new_hashes = [block_hash(b) for b in new_blocks]

    if not session.block_hashes:
        # First analysis — everything is new
        return DiffResult(
            new_blocks=new_blocks,
            new_hashes=new_hashes,
            diff=BlockDiff(
                changed_indices=list(range(len(new_blocks))),
            ),
            is_first_analysis=True,
        )

    diff = compute_block_diff(session.block_hashes, new_hashes)

    return DiffResult(
        new_blocks=new_blocks,
        new_hashes=new_hashes,
        diff=diff,
    )
