"""POST /score — SEO scoring endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.scoring_models import (
    CategoryScoreResult,
    ReadabilityMetrics,
    RecommendationResult,
    ScoreRequest,
    ScoreResponse,
    StrengthResult,
)
from app.services.keyword_analyzer import analyze
from app.services.readability_service import compute_readability
from app.services.recommendation_engine import generate_recommendations
from app.services.scoring_engine import compute_seo_score
from app.utils.seo_thresholds import DEFAULT_WEIGHTS, PRESETS

router = APIRouter()


@router.post("/score", response_model=ScoreResponse)
def seo_score(payload: ScoreRequest) -> ScoreResponse:
    """
    Run a full SEO audit and return scored results with recommendations.

    Combines: keyword analysis (Step 1) + readability scoring +
    6-category SEO score + recommendation engine.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")

    weights = PRESETS.get(payload.preset, DEFAULT_WEIGHTS)

    # Step 1 keyword analysis
    kw_result = analyze(
        payload.text,
        filter_stops=payload.filter_stopwords,
        min_frequency=payload.min_frequency,
        top_n=payload.top_n,
    )

    # Readability
    readability = compute_readability(payload.text)

    # SEO scoring
    score = compute_seo_score(
        kw_result.keywords,
        payload.text,
        kw_result.total_words,
        readability,
        weights,
    )

    # Recommendations
    recs, strengths, warnings = generate_recommendations(
        score, kw_result.keywords, payload.text, kw_result.total_words, readability,
    )

    return ScoreResponse(
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
        recommendations=[
            RecommendationResult(
                category=r.category, severity=r.severity,
                message=r.message, detail=r.detail,
            ) for r in recs
        ],
        strengths=[
            StrengthResult(category=s.category, message=s.message)
            for s in strengths
        ],
        warnings=[
            RecommendationResult(
                category=w.category, severity=w.severity,
                message=w.message, detail=w.detail,
            ) for w in warnings
        ],
    )
