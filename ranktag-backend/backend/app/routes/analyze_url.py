"""POST /analyze-url — crawl a webpage and run keyword density analysis."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.schemas import (
    AnalyzeUrlRequest,
    AnalyzeUrlResponse,
    ErrorDetail,
    ErrorResponse,
)
from app.services.crawler_service import fetch_url
from app.services.extraction_service import extract_content
from app.services.keyword_analyzer import analyze
from app.services.metadata_service import extract_metadata

router = APIRouter()


@router.post(
    "/analyze-url",
    response_model=AnalyzeUrlResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or blocked URL"},
        502: {"model": ErrorResponse, "description": "Upstream fetch failed"},
        422: {"model": ErrorResponse, "description": "Content extraction failed"},
    },
)
async def analyze_url(payload: AnalyzeUrlRequest) -> AnalyzeUrlResponse | JSONResponse:
    """
    Crawl a webpage URL, extract main content and metadata, then run
    keyword density analysis using the Step 1 engine.
    """
    # ── Fetch ──
    crawl = await fetch_url(payload.url)

    if not crawl.success:
        status = 400 if crawl.error_type in ("invalid_url", "blocked_url") else 502
        return JSONResponse(
            status_code=status,
            content=ErrorResponse(
                error=ErrorDetail(type=crawl.error_type, message=crawl.error_message),
            ).model_dump(),
        )

    # ── Extract metadata ──
    meta = extract_metadata(crawl.html)

    # ── Extract main content ──
    content = extract_content(crawl.html, url=crawl.final_url)

    if not content or len(content.split()) < 5:
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                error=ErrorDetail(
                    type="extraction_error",
                    message="Could not extract meaningful content from the page.",
                ),
            ).model_dump(),
        )

    # ── Keyword analysis (reuse Step 1 engine) ──
    kw_result = analyze(
        content,
        remove_numbers=payload.remove_numbers,
        filter_stops=payload.filter_stopwords,
        min_frequency=payload.min_frequency,
        top_n=payload.top_n,
    )

    return AnalyzeUrlResponse(
        url=crawl.url,
        final_url=crawl.final_url,
        status_code=crawl.status_code,
        title=meta.title,
        meta_description=meta.meta_description,
        canonical=meta.canonical,
        robots=meta.robots,
        language=meta.language,
        h1_tags=meta.h1_tags,
        h2_tags=meta.h2_tags,
        og_title=meta.og_title,
        og_description=meta.og_description,
        content_word_count=len(content.split()),
        content=content,
        keyword_analysis=kw_result,
    )
