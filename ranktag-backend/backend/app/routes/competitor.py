"""POST /competitor/analyze — competitor comparison endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.competitor_models import CompetitorRequest, CompetitorResponse
from app.services.competitor_analysis_service import analyze_all_urls
from app.services.keyword_gap_service import compute_keyword_gaps
from app.utils.comparison_utils import compute_benchmarks, generate_competitive_insights

router = APIRouter(prefix="/competitor", tags=["competitor"])


@router.post("/analyze", response_model=CompetitorResponse)
async def competitor_analyze(payload: CompetitorRequest) -> CompetitorResponse:
    """
    Analyze a primary URL against competitor URLs.

    Crawls all URLs concurrently, runs the full analysis pipeline on
    each, then computes keyword gaps, benchmarks, and competitive insights.
    """
    all_urls = [payload.primary_url] + payload.competitor_urls

    # Validate: no duplicates
    if len(set(all_urls)) != len(all_urls):
        raise HTTPException(status_code=400, detail="Duplicate URLs detected.")

    # Analyze all URLs concurrently
    results = await analyze_all_urls(
        all_urls,
        min_frequency=payload.min_frequency,
        top_n=payload.top_n,
    )

    primary = results[0]
    competitors = results[1:]

    # Check primary succeeded
    if primary.error:
        raise HTTPException(
            status_code=422,
            detail=f"Could not analyze primary URL: {primary.error}",
        )

    # Keyword gap analysis
    gaps, shared, unique = compute_keyword_gaps(primary, competitors)

    # Benchmarks
    benchmarks = compute_benchmarks(competitors)

    # Competitive insights
    insights = generate_competitive_insights(
        primary, competitors, benchmarks, gaps, shared, unique,
    )

    return CompetitorResponse(
        primary=primary,
        competitors=competitors,
        keyword_gaps=gaps[:30],
        shared_keywords=shared[:30],
        unique_advantages=unique[:20],
        benchmarks=benchmarks,
        insights=insights,
    )
