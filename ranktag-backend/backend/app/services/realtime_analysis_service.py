"""
Real-time analysis service — the top-level orchestrator.

Accepts a session + new content, runs the diff engine to find dirty
blocks, processes only those blocks, patches the session state via
incremental counter arithmetic, and returns the merged result.

Key optimization: on partial updates we subtract the old block's counters
and add the new block's counters instead of re-merging all blocks.
"""
from __future__ import annotations

import time
from collections import Counter

from app.models.schemas import KeywordResult
from app.models.session_models import (
    ProcessingMeta,
    SessionAnalyzeOptions,
    SessionAnalyzeResponse,
    SessionStatistics,
    UpdatedBlock,
)
from app.services.cache_service import BlockAnalysis, get_global_cache
from app.services.diff_engine import compute_content_diff
from app.services.incremental_processor import analyze_block, merge_block_counters
from app.services.session_service import AnalysisSession


def _build_results(
    counter: Counter,
    total_words: int,
    *,
    min_frequency: int,
    top_n: int,
) -> list[KeywordResult]:
    """Convert a Counter into sorted KeywordResult list (same as Step 1)."""
    results: list[KeywordResult] = []
    for keyword, count in counter.most_common():
        if count < min_frequency:
            break
        density = round((count / total_words) * 100, 2) if total_words else 0.0
        results.append(KeywordResult(keyword=keyword, count=count, density=density))
        if len(results) >= top_n:
            break
    return results


def _subtract_counter(total: Counter, block: Counter) -> None:
    """Subtract block counts from total, removing zero/negative entries."""
    for key, cnt in block.items():
        total[key] -= cnt
        if total[key] <= 0:
            del total[key]


def _add_counter(total: Counter, block: Counter) -> None:
    """Add block counts to total."""
    total.update(block)


def run_realtime_analysis(
    session: AnalysisSession,
    content: str,
    options: SessionAnalyzeOptions,
) -> SessionAnalyzeResponse:
    """
    Run incremental keyword analysis for a session.

    On first analysis: process all blocks, merge counters.
    On subsequent updates: only reprocess changed blocks, then
    patch the session totals by subtracting old + adding new counts.
    This is O(changed_blocks) not O(total_blocks).
    """
    t0 = time.perf_counter()
    cache = get_global_cache()
    cache.reset_counters()

    # ── 1. Diff ──
    diff_result = compute_content_diff(content, session)

    # ── 2. Early return if unchanged ──
    if diff_result.diff.is_unchanged:
        elapsed = (time.perf_counter() - t0) * 1000
        stats = cache.stats()
        return _build_response(
            session=session,
            updated_blocks=[],
            processing=ProcessingMeta(
                total_processing_ms=round(elapsed, 2),
                cache_hits=stats["hits"],
                reprocessed_blocks=0,
                total_blocks=len(session.block_hashes),
                is_full_reprocess=False,
            ),
            options=options,
        )

    # ── 3. First analysis → full merge ──
    if diff_result.is_first_analysis:
        block_results: list[BlockAnalysis] = []
        updated: list[UpdatedBlock] = []

        for idx, block_text in enumerate(diff_result.new_blocks):
            ba = analyze_block(
                block_text,
                remove_numbers=options.remove_numbers,
                filter_stops=options.filter_stopwords,
            )
            block_results.append(ba)
            updated.append(UpdatedBlock(
                index=idx, word_count=ba.word_count, hash=ba.block_hash,
            ))

        uni, bi, tri, total, filtered = merge_block_counters(block_results)
        session.block_hashes = diff_result.new_hashes
        session.block_results = block_results
        session.total_unigrams = uni
        session.total_bigrams = bi
        session.total_trigrams = tri
        session.total_words = total
        session.filtered_words = filtered

        elapsed = (time.perf_counter() - t0) * 1000
        stats = cache.stats()
        return _build_response(
            session=session,
            updated_blocks=updated,
            processing=ProcessingMeta(
                total_processing_ms=round(elapsed, 2),
                cache_hits=stats["hits"],
                reprocessed_blocks=len(block_results),
                total_blocks=len(block_results),
                is_full_reprocess=True,
            ),
            options=options,
        )

    # ── 4. Incremental update → patch counters ──
    changed = set(diff_result.diff.changed_indices)
    removed = set(diff_result.diff.removed_indices)
    updated_list: list[UpdatedBlock] = []

    # Build new block_results array, carrying forward unchanged blocks
    new_block_results: list[BlockAnalysis | None] = [None] * len(diff_result.new_blocks)
    for i in range(len(diff_result.new_blocks)):
        if i not in changed and i < len(session.block_results):
            new_block_results[i] = session.block_results[i]

    # Subtract removed blocks from totals
    for idx in removed:
        if idx < len(session.block_results):
            old_ba = session.block_results[idx]
            _subtract_counter(session.total_unigrams, old_ba.unigrams)
            _subtract_counter(session.total_bigrams, old_ba.bigrams)
            _subtract_counter(session.total_trigrams, old_ba.trigrams)
            session.total_words -= old_ba.word_count
            session.filtered_words -= old_ba.filtered_count

    # Process changed blocks: subtract old, add new
    for idx in changed:
        # Subtract old block if it existed
        if idx < len(session.block_results):
            old_ba = session.block_results[idx]
            _subtract_counter(session.total_unigrams, old_ba.unigrams)
            _subtract_counter(session.total_bigrams, old_ba.bigrams)
            _subtract_counter(session.total_trigrams, old_ba.trigrams)
            session.total_words -= old_ba.word_count
            session.filtered_words -= old_ba.filtered_count

        # Analyze new block
        new_ba = analyze_block(
            diff_result.new_blocks[idx],
            remove_numbers=options.remove_numbers,
            filter_stops=options.filter_stopwords,
        )
        new_block_results[idx] = new_ba

        # Add new block to totals
        _add_counter(session.total_unigrams, new_ba.unigrams)
        _add_counter(session.total_bigrams, new_ba.bigrams)
        _add_counter(session.total_trigrams, new_ba.trigrams)
        session.total_words += new_ba.word_count
        session.filtered_words += new_ba.filtered_count

        updated_list.append(UpdatedBlock(
            index=idx, word_count=new_ba.word_count, hash=new_ba.block_hash,
        ))

    # Commit new state
    final_results = [b for b in new_block_results if b is not None]
    session.block_hashes = diff_result.new_hashes
    session.block_results = final_results

    elapsed = (time.perf_counter() - t0) * 1000
    stats = cache.stats()

    return _build_response(
        session=session,
        updated_blocks=updated_list,
        processing=ProcessingMeta(
            total_processing_ms=round(elapsed, 2),
            cache_hits=stats["hits"],
            reprocessed_blocks=len(changed),
            total_blocks=len(final_results),
            is_full_reprocess=False,
        ),
        options=options,
    )


def _build_response(
    *,
    session: AnalysisSession,
    updated_blocks: list[UpdatedBlock],
    processing: ProcessingMeta,
    options: SessionAnalyzeOptions,
) -> SessionAnalyzeResponse:
    """Assemble the final response from session state."""
    total = session.total_words
    build = lambda c: _build_results(
        c, total, min_frequency=options.min_frequency, top_n=options.top_n,
    )

    # Unique words from unigram keys (fast — just count keys)
    unique_count = len(session.total_unigrams)

    return SessionAnalyzeResponse(
        session_id=session.session_id,
        statistics=SessionStatistics(
            total_words=total,
            filtered_words=session.filtered_words,
            unique_words=unique_count,
            block_count=len(session.block_results),
        ),
        keywords={
            "1gram": build(session.total_unigrams),
            "2gram": build(session.total_bigrams),
            "3gram": build(session.total_trigrams),
        },
        updated_blocks=updated_blocks,
        processing=processing,
    )
