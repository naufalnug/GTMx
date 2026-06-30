"""
SEO scoring engine.

Computes an overall SEO score (0-100) from weighted category scores.
Each category scorer is a pure function that returns 0-100.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.models.schemas import KeywordResult
from app.services.readability_service import ReadabilityResult
from app.utils.seo_thresholds import (
    DEFAULT_CONTENT,
    DEFAULT_DENSITY,
    DEFAULT_WEIGHTS,
    ContentThresholds,
    DensityThresholds,
    ScoringWeights,
)


# ── Category result ──────────────────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class CategoryScore:
    name: str
    score: float          # 0-100
    weight: int           # percentage weight
    weighted: float       # score * weight / 100
    details: dict = field(default_factory=dict)


@dataclass(slots=True)
class SeoScore:
    """Complete SEO scoring result."""
    overall_score: float
    grade: str
    category_scores: list[CategoryScore] = field(default_factory=list)


def _grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"


# ── Category scorers ─────────────────────────────────────────────────────

def score_keyword_optimization(
    keywords: dict[str, list[KeywordResult]],
    total_words: int,
    dt: DensityThresholds = DEFAULT_DENSITY,
) -> CategoryScore:
    """Score based on keyword density distribution."""
    grams = keywords.get("1gram", [])
    if not grams or total_words == 0:
        return CategoryScore(name="Keyword Optimization", score=0, weight=0, weighted=0)

    n = len(grams)
    stuffed = sum(1 for k in grams if k.density > dt.stuffed_above)
    in_ideal = sum(1 for k in grams if dt.ideal_min <= k.density <= dt.ideal_max)
    max_density = grams[0].density if grams else 0

    # Start with ideal-range ratio (what fraction of top keywords are healthy)
    ideal_ratio = in_ideal / min(n, 10) if n > 0 else 0
    score = ideal_ratio * 100

    # Penalties for stuffing (applied after, so they can't be offset)
    if stuffed > 0:
        score -= stuffed * 18
    if max_density > 5.0:
        score -= (max_density - 5.0) * 10
    # Penalty for no meaningful keywords
    if n < 3 and total_words > 200:
        score -= 20

    score = max(0, min(100, score))
    return CategoryScore(
        name="Keyword Optimization", score=round(score, 1), weight=0, weighted=0,
        details={"stuffed": stuffed, "ideal_range": in_ideal, "max_density": max_density},
    )


def score_content_structure(
    text: str,
    total_words: int,
    ct: ContentThresholds = DEFAULT_CONTENT,
) -> CategoryScore:
    """Score content structure: length, paragraphs, heading-like lines."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    para_count = len(paragraphs)
    long_paras = sum(1 for p in paragraphs if len(p.split()) > ct.max_paragraph_words)

    # Heading heuristic: lines that look like headings (short, no ending punctuation)
    lines = text.split("\n")
    heading_like = sum(
        1 for ln in lines
        if ln.strip() and len(ln.split()) <= 10 and not ln.strip().endswith((".", "!", "?", ","))
    )

    score = 100.0

    # Word count scoring
    if total_words < ct.min_words_short:
        score -= 30
    elif total_words < ct.min_words_medium:
        score -= 10
    elif total_words > 5000:
        score -= 5  # slight penalty for very long without structure

    # Paragraph scoring
    if para_count < ct.min_paragraphs:
        score -= 20
    if long_paras > 0:
        score -= long_paras * 5

    # Headings
    if heading_like < ct.min_headings and total_words > 300:
        score -= 15

    score = max(0, min(100, score))
    return CategoryScore(
        name="Content Structure", score=round(score, 1), weight=0, weighted=0,
        details={"paragraphs": para_count, "long_paragraphs": long_paras, "heading_like": heading_like},
    )


def score_readability(readability: ReadabilityResult) -> CategoryScore:
    """Score from readability metrics."""
    score = readability.readability_score

    # Extra penalties
    if readability.long_sentence_pct > 30:
        score -= 10
    if readability.passive_voice_pct > 20:
        score -= 5
    if readability.difficult_word_pct > 25:
        score -= 5

    score = max(0, min(100, score))
    return CategoryScore(
        name="Readability", score=round(score, 1), weight=0, weighted=0,
        details={
            "flesch_reading_ease": readability.flesch_reading_ease,
            "grade_level": readability.flesch_kincaid_grade,
            "reading_level": readability.reading_level,
            "avg_sentence_length": readability.avg_sentence_length,
            "passive_voice_pct": readability.passive_voice_pct,
        },
    )


def score_keyword_prominence(
    keywords: dict[str, list[KeywordResult]],
    text: str,
) -> CategoryScore:
    """Score based on where top keywords appear in the content."""
    grams = keywords.get("1gram", [])
    if not grams:
        return CategoryScore(name="Keyword Prominence", score=0, weight=0, weighted=0)

    top5 = [k.keyword for k in grams[:5]]
    lower = text.lower()
    words = lower.split()
    total = len(words)
    if total == 0:
        return CategoryScore(name="Keyword Prominence", score=0, weight=0, weighted=0)

    intro_boundary = max(1, int(total * 0.15))
    conclusion_start = max(intro_boundary + 1, total - int(total * 0.15))
    intro_text = " ".join(words[:intro_boundary])
    conclusion_text = " ".join(words[conclusion_start:])

    # First paragraph
    parts = re.split(r"\n\s*\n", text, maxsplit=1)
    first_para = parts[0].lower() if parts else ""

    in_intro = sum(1 for kw in top5 if kw in intro_text)
    in_conclusion = sum(1 for kw in top5 if kw in conclusion_text)
    in_first_para = sum(1 for kw in top5 if kw in first_para)

    score = 0.0
    # Intro presence: 40 pts
    score += min(40, (in_intro / max(1, len(top5))) * 40)
    # Conclusion presence: 25 pts
    score += min(25, (in_conclusion / max(1, len(top5))) * 25)
    # First paragraph: 35 pts
    score += min(35, (in_first_para / max(1, len(top5))) * 35)

    return CategoryScore(
        name="Keyword Prominence", score=round(score, 1), weight=0, weighted=0,
        details={"in_intro": in_intro, "in_conclusion": in_conclusion, "in_first_para": in_first_para},
    )


def score_semantic_coverage(
    keywords: dict[str, list[KeywordResult]],
    total_words: int,
) -> CategoryScore:
    """Score semantic diversity: how many unique meaningful keywords exist."""
    grams_1 = keywords.get("1gram", [])
    grams_2 = keywords.get("2gram", [])
    grams_3 = keywords.get("3gram", [])

    unique_1 = len(grams_1)
    unique_2 = len(grams_2)
    unique_3 = len(grams_3)

    if total_words == 0:
        return CategoryScore(name="Semantic Coverage", score=0, weight=0, weighted=0)

    # Keyword-to-word ratio (higher = richer vocabulary)
    diversity_ratio = unique_1 / max(1, total_words) * 100

    score = 0.0
    # Unigram diversity: 50 pts
    if unique_1 >= 15:
        score += 50
    elif unique_1 >= 8:
        score += 35
    elif unique_1 >= 3:
        score += 20

    # Bigram presence: 30 pts
    if unique_2 >= 8:
        score += 30
    elif unique_2 >= 3:
        score += 20
    elif unique_2 >= 1:
        score += 10

    # Trigram presence: 20 pts
    if unique_3 >= 5:
        score += 20
    elif unique_3 >= 2:
        score += 12
    elif unique_3 >= 1:
        score += 5

    return CategoryScore(
        name="Semantic Coverage", score=round(min(100, score), 1), weight=0, weighted=0,
        details={"unigrams": unique_1, "bigrams": unique_2, "trigrams": unique_3, "diversity_ratio": round(diversity_ratio, 2)},
    )


def score_keyword_distribution(
    keywords: dict[str, list[KeywordResult]],
    text: str,
) -> CategoryScore:
    """Score how evenly keywords are distributed across content."""
    grams = keywords.get("1gram", [])
    if not grams or not text.strip():
        return CategoryScore(name="Keyword Distribution", score=0, weight=0, weighted=0)

    blocks = [b.strip() for b in re.split(r"\n\s*\n", text) if b.strip()]
    if len(blocks) <= 1:
        # Single block — can't assess distribution
        return CategoryScore(name="Keyword Distribution", score=70, weight=0, weighted=0,
                             details={"blocks": 1, "note": "single_block"})

    top3 = [k.keyword for k in grams[:3]]
    block_scores: list[float] = []

    for block in blocks:
        lower = block.lower()
        hits = sum(lower.count(kw) for kw in top3)
        block_scores.append(hits)

    total_hits = sum(block_scores)
    if total_hits == 0:
        return CategoryScore(name="Keyword Distribution", score=50, weight=0, weighted=0)

    # Ideal: equal distribution across blocks
    expected = total_hits / len(blocks)
    variance = sum((h - expected) ** 2 for h in block_scores) / len(blocks)
    cv = (variance ** 0.5) / max(expected, 0.01)  # coefficient of variation

    # Lower CV = more even distribution = higher score
    if cv < 0.5:
        score = 100
    elif cv < 1.0:
        score = 80
    elif cv < 1.5:
        score = 60
    elif cv < 2.5:
        score = 40
    else:
        score = 20

    # Penalty if any block has zero hits
    empty_blocks = sum(1 for h in block_scores if h == 0)
    if empty_blocks > 0:
        score -= empty_blocks * 5

    return CategoryScore(
        name="Keyword Distribution", score=round(max(0, min(100, score)), 1), weight=0, weighted=0,
        details={"blocks": len(blocks), "cv": round(cv, 2), "empty_blocks": empty_blocks},
    )


# ── Main scoring orchestrator ────────────────────────────────────────────

def compute_seo_score(
    keywords: dict[str, list[KeywordResult]],
    text: str,
    total_words: int,
    readability: ReadabilityResult,
    weights: ScoringWeights = DEFAULT_WEIGHTS,
) -> SeoScore:
    """
    Compute the overall SEO score from all category scores.
    """
    # Run all category scorers
    cats_raw = [
        (score_keyword_optimization(keywords, total_words), weights.keyword_optimization),
        (score_content_structure(text, total_words), weights.content_structure),
        (score_readability(readability), weights.readability),
        (score_keyword_prominence(keywords, text), weights.keyword_prominence),
        (score_semantic_coverage(keywords, total_words), weights.semantic_coverage),
        (score_keyword_distribution(keywords, text), weights.keyword_distribution),
    ]

    categories: list[CategoryScore] = []
    for cat, w in cats_raw:
        weighted = round(cat.score * w / 100, 2)
        categories.append(CategoryScore(
            name=cat.name, score=cat.score, weight=w, weighted=weighted,
            details=cat.details,
        ))

    overall = round(sum(c.weighted for c in categories), 1)

    return SeoScore(
        overall_score=overall,
        grade=_grade(overall),
        category_scores=categories,
    )
