"""
Keyword prominence and position analysis service.

Tracks where keywords appear within the text (introduction / middle /
conclusion) and whether they appear in structural SEO elements
(title, meta description, H1, H2, first paragraph).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field


# ── Position analysis ────────────────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class KeywordPosition:
    """Positional data for a single keyword."""
    keyword: str
    first_occurrence: int       # token index
    last_occurrence: int        # token index
    spread: float               # (last - first) / total_tokens — 0 to 1
    in_introduction: bool       # appears in first 10% of tokens
    in_middle: bool             # appears in middle 80%
    in_conclusion: bool         # appears in last 10% of tokens
    position_score: float       # 0-100 composite


def analyze_keyword_positions(
    tokens: list[str],
    target_keywords: list[str],
) -> list[KeywordPosition]:
    """
    Compute positional metrics for each target keyword.

    Introduction = first 10% of tokens.
    Conclusion   = last 10% of tokens.
    Middle       = everything in between.

    Position score rewards keywords that appear across all three zones.
    """
    total = len(tokens)
    if total == 0:
        return []

    intro_boundary = max(1, int(total * 0.10))
    conclusion_boundary = max(intro_boundary + 1, total - int(total * 0.10))

    results: list[KeywordPosition] = []

    for kw in target_keywords:
        positions = [i for i, t in enumerate(tokens) if t == kw]
        if not positions:
            continue

        first = positions[0]
        last = positions[-1]
        spread = round((last - first) / total, 4) if total > 1 else 0.0

        in_intro = any(p < intro_boundary for p in positions)
        in_mid = any(intro_boundary <= p < conclusion_boundary for p in positions)
        in_conc = any(p >= conclusion_boundary for p in positions)

        # Score: 33 pts each for intro/mid/conclusion presence
        score = round(
            (33.3 if in_intro else 0)
            + (33.4 if in_mid else 0)
            + (33.3 if in_conc else 0),
            1,
        )

        results.append(KeywordPosition(
            keyword=kw,
            first_occurrence=first,
            last_occurrence=last,
            spread=spread,
            in_introduction=in_intro,
            in_middle=in_mid,
            in_conclusion=in_conc,
            position_score=score,
        ))

    return results


# ── Prominence analysis (structural SEO elements) ────────────────────────

@dataclass(slots=True)
class ProminenceResult:
    """Whether a keyword appears in key SEO elements."""
    keyword: str
    in_title: bool = False
    in_meta_description: bool = False
    in_h1: bool = False
    in_h2: bool = False
    in_first_paragraph: bool = False
    prominence_score: float = 0.0   # 0-100


def analyze_prominence(
    keyword: str,
    *,
    title: str = "",
    meta_description: str = "",
    h1_tags: list[str] | None = None,
    h2_tags: list[str] | None = None,
    content: str = "",
) -> ProminenceResult:
    """
    Check if a keyword appears in key SEO structural elements.

    Weights:
      - Title:            25 pts
      - Meta description: 20 pts
      - H1:               25 pts
      - H2:               15 pts
      - First paragraph:  15 pts
    """
    kw_lower = keyword.lower()
    h1_tags = h1_tags or []
    h2_tags = h2_tags or []

    in_title = kw_lower in title.lower()
    in_meta = kw_lower in meta_description.lower()
    in_h1 = any(kw_lower in h.lower() for h in h1_tags)
    in_h2 = any(kw_lower in h.lower() for h in h2_tags)

    # First paragraph: text before the first double-newline or first 200 words
    first_para = ""
    if content:
        parts = re.split(r"\n\s*\n", content, maxsplit=1)
        first_para = parts[0] if parts else ""
        # Fallback: first 200 words
        if len(first_para.split()) < 10:
            first_para = " ".join(content.split()[:200])
    in_first_para = kw_lower in first_para.lower()

    score = round(
        (25.0 if in_title else 0)
        + (20.0 if in_meta else 0)
        + (25.0 if in_h1 else 0)
        + (15.0 if in_h2 else 0)
        + (15.0 if in_first_para else 0),
        1,
    )

    return ProminenceResult(
        keyword=kw_lower,
        in_title=in_title,
        in_meta_description=in_meta,
        in_h1=in_h1,
        in_h2=in_h2,
        in_first_paragraph=in_first_para,
        prominence_score=score,
    )


# ── Readability preprocessing ────────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class ReadabilityPrep:
    """Pre-computed metrics for future readability scoring."""
    sentence_count: int
    paragraph_count: int
    avg_words_per_sentence: float
    long_sentence_count: int        # sentences with > 25 words
    total_words: int


_RE_SENTENCE_SPLIT = re.compile(r"[.!?]+\s+|\n")
_RE_PARAGRAPH_SPLIT = re.compile(r"\n\s*\n")

_LONG_SENTENCE_THRESHOLD = 25


def compute_readability_prep(text: str) -> ReadabilityPrep:
    """
    Compute sentence / paragraph metrics from cleaned text.

    This is preprocessing only — the actual readability score
    (Flesch-Kincaid etc.) will be added in a later step.
    """
    if not text.strip():
        return ReadabilityPrep(
            sentence_count=0, paragraph_count=0,
            avg_words_per_sentence=0.0, long_sentence_count=0, total_words=0,
        )

    paragraphs = [p.strip() for p in _RE_PARAGRAPH_SPLIT.split(text) if p.strip()]
    sentences = [s.strip() for s in _RE_SENTENCE_SPLIT.split(text) if s.strip()]

    word_counts = [len(s.split()) for s in sentences]
    total_words = sum(word_counts)
    sentence_count = len(sentences)
    avg_wps = round(total_words / sentence_count, 1) if sentence_count else 0.0
    long_count = sum(1 for wc in word_counts if wc > _LONG_SENTENCE_THRESHOLD)

    return ReadabilityPrep(
        sentence_count=sentence_count,
        paragraph_count=len(paragraphs),
        avg_words_per_sentence=avg_wps,
        long_sentence_count=long_count,
        total_words=total_words,
    )
