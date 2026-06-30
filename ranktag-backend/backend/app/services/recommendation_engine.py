"""
SEO recommendation engine.

Generates actionable, context-specific recommendations from scoring
results. Every recommendation is tied to a real analysis finding —
nothing is hardcoded or generic.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.models.schemas import KeywordResult
from app.services.readability_service import ReadabilityResult
from app.services.scoring_engine import SeoScore


@dataclass(frozen=True, slots=True)
class Recommendation:
    category: str       # which scoring category
    severity: str       # "critical" | "warning" | "suggestion"
    message: str
    detail: str         # explanation of why


@dataclass(frozen=True, slots=True)
class Strength:
    category: str
    message: str


def generate_recommendations(
    score: SeoScore,
    keywords: dict[str, list[KeywordResult]],
    text: str,
    total_words: int,
    readability: ReadabilityResult,
) -> tuple[list[Recommendation], list[Strength], list[Recommendation]]:
    """
    Generate recommendations, strengths, and warnings from scoring data.

    Returns: (recommendations, strengths, warnings)
    """
    recs: list[Recommendation] = []
    strengths: list[Strength] = []
    warnings: list[Recommendation] = []

    grams = keywords.get("1gram", [])
    cats = {c.name: c for c in score.category_scores}

    # ── Keyword Optimization ──
    kw_cat = cats.get("Keyword Optimization")
    if kw_cat:
        stuffed = kw_cat.details.get("stuffed", 0)
        max_d = kw_cat.details.get("max_density", 0)

        if stuffed > 0:
            stuffed_kws = [k.keyword for k in grams if k.density > 3.5][:3]
            warnings.append(Recommendation(
                category="Keyword Optimization",
                severity="critical",
                message=f"Reduce density of over-used keywords: {', '.join(stuffed_kws)}",
                detail=f"{stuffed} keyword(s) exceed 3.5% density. Search engines may flag this as keyword stuffing.",
            ))
        elif kw_cat.score >= 80:
            strengths.append(Strength(
                category="Keyword Optimization",
                message="Keyword density is well-balanced across your content.",
            ))

        ideal_count = kw_cat.details.get("ideal_range", 0)
        if ideal_count == 0 and len(grams) > 0 and total_words > 200:
            recs.append(Recommendation(
                category="Keyword Optimization",
                severity="warning",
                message="No keywords in the ideal density range (0.8–2.5%)",
                detail="Try naturally increasing usage of your target keywords to reach the optimal range.",
            ))

    # ── Content Structure ──
    cs_cat = cats.get("Content Structure")
    if cs_cat:
        paras = cs_cat.details.get("paragraphs", 0)
        long_p = cs_cat.details.get("long_paragraphs", 0)
        headings = cs_cat.details.get("heading_like", 0)

        if total_words < 300:
            warnings.append(Recommendation(
                category="Content Structure",
                severity="critical",
                message=f"Content is very thin ({total_words} words)",
                detail="Most competitive topics require at least 800 words. Expand with subtopics and examples.",
            ))
        elif total_words < 800:
            recs.append(Recommendation(
                category="Content Structure",
                severity="warning",
                message=f"Content is short ({total_words} words)",
                detail="Consider expanding to 800-1,500 words for better search coverage.",
            ))
        elif total_words >= 800:
            strengths.append(Strength(
                category="Content Structure",
                message=f"Content length ({total_words:,} words) is good for SEO.",
            ))

        if long_p > 0:
            recs.append(Recommendation(
                category="Content Structure",
                severity="suggestion",
                message=f"Break up {long_p} long paragraph(s) into smaller sections",
                detail="Paragraphs over 150 words hurt readability. Split at natural topic shifts.",
            ))

        if headings < 2 and total_words > 500:
            recs.append(Recommendation(
                category="Content Structure",
                severity="warning",
                message="Add more headings to structure your content",
                detail="Use H2/H3 subheadings every 200-300 words to improve scannability and SEO.",
            ))

    # ── Readability ──
    rd_cat = cats.get("Readability")
    if rd_cat:
        if readability.flesch_reading_ease < 40:
            warnings.append(Recommendation(
                category="Readability",
                severity="critical",
                message=f"Content is very difficult to read (Flesch score: {readability.flesch_reading_ease})",
                detail="Simplify sentences, use shorter words, and break complex ideas into steps.",
            ))
        elif readability.flesch_reading_ease < 55:
            recs.append(Recommendation(
                category="Readability",
                severity="warning",
                message=f"Readability could be improved (Flesch score: {readability.flesch_reading_ease})",
                detail="Aim for a Flesch Reading Ease of 60-70 for web content.",
            ))
        elif readability.flesch_reading_ease >= 60:
            strengths.append(Strength(
                category="Readability",
                message=f"Good readability ({readability.reading_level}, grade {readability.flesch_kincaid_grade}).",
            ))

        if readability.long_sentence_pct > 30:
            recs.append(Recommendation(
                category="Readability",
                severity="suggestion",
                message=f"{readability.long_sentence_count} sentences are over 25 words ({readability.long_sentence_pct}%)",
                detail="Shorten long sentences. Mix short and medium sentences for rhythm.",
            ))

        if readability.passive_voice_pct > 15:
            recs.append(Recommendation(
                category="Readability",
                severity="suggestion",
                message=f"High passive voice usage ({readability.passive_voice_pct}%)",
                detail="Rewrite passive constructions to active voice for clarity and engagement.",
            ))

    # ── Keyword Prominence ──
    kp_cat = cats.get("Keyword Prominence")
    if kp_cat and grams:
        top_kw = grams[0].keyword
        if kp_cat.details.get("in_first_para", 0) == 0:
            recs.append(Recommendation(
                category="Keyword Prominence",
                severity="warning",
                message=f"Add \"{top_kw}\" to the first paragraph",
                detail="The primary keyword should appear in the opening paragraph for SEO prominence.",
            ))
        if kp_cat.details.get("in_conclusion", 0) == 0:
            recs.append(Recommendation(
                category="Keyword Prominence",
                severity="suggestion",
                message=f"Mention \"{top_kw}\" in the conclusion",
                detail="Reinforcing the primary keyword at the end signals relevance to search engines.",
            ))
        if kp_cat.score >= 80:
            strengths.append(Strength(
                category="Keyword Prominence",
                message="Primary keywords are well-placed across the content.",
            ))

    # ── Semantic Coverage ──
    sc_cat = cats.get("Semantic Coverage")
    if sc_cat:
        uni = sc_cat.details.get("unigrams", 0)
        bi = sc_cat.details.get("bigrams", 0)
        if uni < 5 and total_words > 200:
            recs.append(Recommendation(
                category="Semantic Coverage",
                severity="warning",
                message="Low keyword variety detected",
                detail="Use more topic-related terms and synonyms to signal comprehensive coverage.",
            ))
        elif uni >= 10 and bi >= 5:
            strengths.append(Strength(
                category="Semantic Coverage",
                message=f"Strong semantic coverage with {uni} unique keywords and {bi} phrases.",
            ))

    # ── Keyword Distribution ──
    kd_cat = cats.get("Keyword Distribution")
    if kd_cat:
        empty = kd_cat.details.get("empty_blocks", 0)
        if empty > 0:
            recs.append(Recommendation(
                category="Keyword Distribution",
                severity="suggestion",
                message=f"{empty} content section(s) contain no target keywords",
                detail="Spread keywords more evenly. Every section should naturally include relevant terms.",
            ))
        elif kd_cat.score >= 80:
            strengths.append(Strength(
                category="Keyword Distribution",
                message="Keywords are well-distributed across all content sections.",
            ))

    return recs, strengths, warnings
