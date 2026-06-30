"""Pydantic models for the export API."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.schemas import KeywordResult
from app.models.scoring_models import (
    CategoryScoreResult,
    ReadabilityMetrics,
    RecommendationResult,
    StrengthResult,
)


class ExportKeywords(BaseModel):
    """Keyword data for export."""
    keywords_1gram: list[KeywordResult] = Field(default_factory=list, alias="1gram")
    keywords_2gram: list[KeywordResult] = Field(default_factory=list, alias="2gram")
    keywords_3gram: list[KeywordResult] = Field(default_factory=list, alias="3gram")

    model_config = {"populate_by_name": True}


class ExportRequest(BaseModel):
    """POST /export/pdf request body."""
    text: str = Field(..., min_length=1, max_length=500_000)
    total_words: int = Field(0, ge=0)
    # Scoring data (already computed client-side, avoids recomputation)
    overall_score: float = 0
    grade: str = ""
    category_scores: list[CategoryScoreResult] = Field(default_factory=list)
    readability: ReadabilityMetrics | None = None
    recommendations: list[RecommendationResult] = Field(default_factory=list)
    strengths: list[StrengthResult] = Field(default_factory=list)
    warnings: list[RecommendationResult] = Field(default_factory=list)
    # Keywords
    keywords: dict[str, list[KeywordResult]] = Field(default_factory=dict)
    # Options
    include_charts: bool = True
    include_recommendations: bool = True
    include_raw_keywords: bool = True
