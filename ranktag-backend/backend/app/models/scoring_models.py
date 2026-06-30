"""Pydantic models for the SEO scoring API."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    """POST /score request body."""
    text: str = Field(..., min_length=1, max_length=500_000)
    preset: str = Field("blog", description="Scoring preset: blog, landing, ecommerce")
    filter_stopwords: bool = True
    min_frequency: int = Field(2, ge=1)
    top_n: int = Field(30, ge=1, le=200)


class CategoryScoreResult(BaseModel):
    name: str
    score: float
    weight: int
    weighted: float
    details: dict = Field(default_factory=dict)


class ReadabilityMetrics(BaseModel):
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    reading_level: str
    avg_sentence_length: float
    avg_syllables_per_word: float
    long_sentence_count: int
    long_sentence_pct: float
    passive_voice_count: int
    passive_voice_pct: float
    difficult_word_pct: float
    readability_score: float


class RecommendationResult(BaseModel):
    category: str
    severity: str
    message: str
    detail: str


class StrengthResult(BaseModel):
    category: str
    message: str


class ScoreResponse(BaseModel):
    overall_score: float
    grade: str
    category_scores: list[CategoryScoreResult]
    readability: ReadabilityMetrics
    recommendations: list[RecommendationResult]
    strengths: list[StrengthResult]
    warnings: list[RecommendationResult]
