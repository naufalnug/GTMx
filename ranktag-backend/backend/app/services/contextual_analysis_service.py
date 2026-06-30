"""
Contextual keyword analysis service.

Finds words that frequently co-occur near a target keyword within a
configurable window, revealing semantic relationships.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from app.utils.stopwords import STOP_WORDS


@dataclass(frozen=True, slots=True)
class ContextualTerm:
    """A word that co-occurs with the target keyword."""
    term: str
    co_occurrences: int
    relatedness: float  # co_occurrences / target_count


@dataclass(slots=True)
class ContextualResult:
    """Contextual analysis for one keyword."""
    keyword: str
    count: int
    context_terms: list[ContextualTerm] = field(default_factory=list)


def analyze_context(
    tokens: list[str],
    target_keywords: list[str],
    *,
    window: int = 5,
    top_n: int = 10,
) -> list[ContextualResult]:
    """
    For each target keyword, find the most common neighbouring words.

    Args:
        tokens: Preprocessed token list (lowercased, cleaned).
        target_keywords: Keywords to compute context for.
        window: Number of tokens on each side to consider.
        top_n: Max context terms to return per keyword.

    Returns:
        List of ContextualResult, one per target keyword.
    """
    results: list[ContextualResult] = []

    for kw in target_keywords:
        positions = [i for i, t in enumerate(tokens) if t == kw]
        if not positions:
            continue

        neighbour_counter: Counter[str] = Counter()
        for pos in positions:
            start = max(0, pos - window)
            end = min(len(tokens), pos + window + 1)
            for j in range(start, end):
                if j == pos:
                    continue
                neighbour = tokens[j]
                if neighbour in STOP_WORDS or len(neighbour) <= 1:
                    continue
                if neighbour == kw:
                    continue
                neighbour_counter[neighbour] += 1

        target_count = len(positions)
        context_terms = [
            ContextualTerm(
                term=term,
                co_occurrences=cnt,
                relatedness=round(cnt / target_count, 2),
            )
            for term, cnt in neighbour_counter.most_common(top_n)
        ]

        results.append(ContextualResult(
            keyword=kw,
            count=target_count,
            context_terms=context_terms,
        ))

    return results
