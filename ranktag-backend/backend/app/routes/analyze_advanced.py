"""POST /analyze-advanced — full linguistic keyword analysis endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import AdvancedAnalyzeRequest, AdvancedAnalyzeResponse
from app.services.advanced_analyzer import analyze_advanced

router = APIRouter()


@router.post("/analyze-advanced", response_model=AdvancedAnalyzeResponse)
def advanced_analysis(payload: AdvancedAnalyzeRequest) -> AdvancedAnalyzeResponse:
    """
    Run advanced keyword density analysis with linguistic preprocessing.

    Extends the basic /analyze endpoint with:
      - Unicode normalization + accent stripping
      - Lemmatization (spaCy) or stemming (Snowball)
      - Keyword variation grouping
      - Positional analysis (intro / middle / conclusion)
      - Contextual co-occurrence analysis
      - SEO prominence scoring (title, H1, H2, meta, first paragraph)
      - Readability preprocessing metrics
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")

    return analyze_advanced(
        payload.text,
        remove_numbers=payload.remove_numbers,
        filter_stops=payload.filter_stopwords,
        lemmatize=payload.lemmatize,
        stemming=payload.stemming,
        group_similar=payload.group_similar_keywords,
        strip_accents=payload.strip_accents,
        include_seo_fillers=payload.include_seo_fillers,
        custom_stopwords=payload.custom_stopwords or None,
        min_frequency=payload.min_frequency,
        top_n=payload.top_n,
        title=payload.title,
        meta_description=payload.meta_description,
        h1_tags=payload.h1_tags,
        h2_tags=payload.h2_tags,
    )
