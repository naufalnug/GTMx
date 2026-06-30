"""Pydantic models for the competitor analysis API."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.schemas import KeywordResult
from app.models.scoring_models import CategoryScoreResult, ReadabilityMetrics


class CompetitorRequest(BaseModel):
    """POST /competitor/analyze request body."""
    primary_url: str = Field(..., min_length=3)
    competitor_urls: list[str] = Field(..., min_length=1, max_length=10)
    min_frequency: int = Field(2, ge=1)
    top_n: int = Field(30, ge=1, le=200)


class PageAnalysisResult(BaseModel):
    """Full analysis result for a single page."""
    url: str
    final_url: str = ""
    title: str = ""
    meta_description: str = ""
    h1_tags: list[str] = Field(default_factory=list)
    h2_tags: list[str] = Field(default_factory=list)
    language: str = ""
    word_count: int = 0
    paragraph_count: int = 0
    heading_count: int = 0
    overall_score: float = 0
    grade: str = ""
    category_scores: list[CategoryScoreResult] = Field(default_factory=list)
    readability: ReadabilityMetrics | None = None
    keywords: dict[str, list[KeywordResult]] = Field(default_factory=dict)
    error: str | None = None


class KeywordGapItem(BaseModel):
    """A keyword the primary page is missing or underusing."""
    keyword: str
    primary_count: int = 0
    primary_density: float = 0
    competitor_avg_count: float = 0
    competitor_avg_density: float = 0
    competitor_presence: int = 0       # how many competitors use it
    gap_type: str = ""                 # "missing" | "underused" | "shared" | "unique_advantage"
    suggested_action: str = ""


class BenchmarkAverages(BaseModel):
    """Averages across all competitor pages."""
    avg_word_count: float = 0
    avg_paragraph_count: float = 0
    avg_heading_count: float = 0
    avg_overall_score: float = 0
    avg_readability_score: float = 0
    avg_keyword_count: float = 0       # unique 1-grams
    avg_top_density: float = 0         # avg density of top keyword


class CompetitorInsight(BaseModel):
    """An actionable insight from competitive comparison."""
    category: str
    severity: str        # "critical" | "warning" | "suggestion" | "strength"
    message: str
    detail: str


class CompetitorResponse(BaseModel):
    """POST /competitor/analyze response body."""
    primary: PageAnalysisResult
    competitors: list[PageAnalysisResult]
    keyword_gaps: list[KeywordGapItem]
    shared_keywords: list[KeywordGapItem]
    unique_advantages: list[KeywordGapItem]
    benchmarks: BenchmarkAverages
    insights: list[CompetitorInsight]
