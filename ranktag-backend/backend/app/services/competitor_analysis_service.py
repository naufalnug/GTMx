"""
Competitor analysis orchestrator.

Crawls and analyzes multiple URLs concurrently, reusing the existing
pipeline: crawler → extractor → metadata → keyword analyzer → scorer.

No logic is duplicated — every step delegates to existing services.
"""
from __future__ import annotations

import asyncio
import re

from app.models.competitor_models import PageAnalysisResult
from app.models.scoring_models import CategoryScoreResult, ReadabilityMetrics
from app.services.crawler_service import fetch_url
from app.services.extraction_service import extract_content
from app.services.keyword_analyzer import analyze
from app.services.metadata_service import extract_metadata
from app.services.readability_service import compute_readability
from app.services.scoring_engine import compute_seo_score


async def analyze_single_url(
    url: str,
    *,
    min_frequency: int = 2,
    top_n: int = 30,
) -> PageAnalysisResult:
    """
    Run the full analysis pipeline on a single URL.

    Reuses:
      - Step 2: crawler + extractor + metadata
      - Step 1: keyword analyzer
      - Step 7: readability + scoring engine
    """
    # ── Crawl ──
    crawl = await fetch_url(url)
    if not crawl.success:
        return PageAnalysisResult(url=url, error=crawl.error_message)

    # ── Extract ──
    meta = extract_metadata(crawl.html)
    content = extract_content(crawl.html, url=crawl.final_url)
    if not content or len(content.split()) < 5:
        return PageAnalysisResult(
            url=url, final_url=crawl.final_url,
            title=meta.title, error="Could not extract meaningful content.",
        )

    # ── Keyword analysis (Step 1) ──
    kw_result = analyze(content, min_frequency=min_frequency, top_n=top_n)

    # ── Readability (Step 7) ──
    readability = compute_readability(content)

    # ── Scoring (Step 7) ──
    score = compute_seo_score(
        kw_result.keywords, content, kw_result.total_words, readability,
    )

    # ── Structure metrics ──
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    heading_count = len(meta.h1_tags) + len(meta.h2_tags)

    return PageAnalysisResult(
        url=url,
        final_url=crawl.final_url,
        title=meta.title,
        meta_description=meta.meta_description,
        h1_tags=meta.h1_tags,
        h2_tags=meta.h2_tags,
        language=meta.language,
        word_count=kw_result.total_words,
        paragraph_count=len(paragraphs),
        heading_count=heading_count,
        overall_score=score.overall_score,
        grade=score.grade,
        category_scores=[
            CategoryScoreResult(
                name=c.name, score=c.score, weight=c.weight,
                weighted=c.weighted, details=c.details,
            )
            for c in score.category_scores
        ],
        readability=ReadabilityMetrics(
            flesch_reading_ease=readability.flesch_reading_ease,
            flesch_kincaid_grade=readability.flesch_kincaid_grade,
            reading_level=readability.reading_level,
            avg_sentence_length=readability.avg_sentence_length,
            avg_syllables_per_word=readability.avg_syllables_per_word,
            long_sentence_count=readability.long_sentence_count,
            long_sentence_pct=readability.long_sentence_pct,
            passive_voice_count=readability.passive_voice_count,
            passive_voice_pct=readability.passive_voice_pct,
            difficult_word_pct=readability.difficult_word_pct,
            readability_score=readability.readability_score,
        ),
        keywords=kw_result.keywords,
    )


async def analyze_all_urls(
    urls: list[str],
    *,
    min_frequency: int = 2,
    top_n: int = 30,
) -> list[PageAnalysisResult]:
    """
    Analyze multiple URLs concurrently.

    Uses asyncio.gather for parallel crawling — each URL is fetched
    and analyzed independently.
    """
    tasks = [
        analyze_single_url(url, min_frequency=min_frequency, top_n=top_n)
        for url in urls
    ]
    return list(await asyncio.gather(*tasks))
