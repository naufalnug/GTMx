"""Pydantic request/response models for the keyword analysis API."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ── Shared keyword analysis params ───────────────────────────────────────

class _AnalysisOptions(BaseModel):
    """Keyword analysis options shared between text and URL endpoints."""
    remove_numbers: bool = Field(
        False,
        description="Strip standalone numbers before analysis.",
    )
    filter_stopwords: bool = Field(
        True,
        description="Remove common English stopwords from results.",
    )
    min_frequency: int = Field(
        2,
        ge=1,
        description="Minimum occurrence count to include a keyword in results.",
    )
    top_n: int = Field(
        20,
        ge=1,
        le=200,
        description="Maximum keywords to return per n-gram tier.",
    )


# ── Text analysis request / response ────────────────────────────────────

class AnalyzeRequest(_AnalysisOptions):
    """POST /analyze request body."""
    text: str = Field(
        ...,
        min_length=1,
        description="Raw text content to analyse (may contain HTML).",
    )


class KeywordResult(BaseModel):
    """A single keyword / phrase entry."""
    keyword: str
    count: int
    density: float = Field(
        ...,
        description="(count / total_words) * 100, rounded to 2 decimals.",
    )


class AnalyzeResponse(BaseModel):
    """POST /analyze response body."""
    total_words: int = Field(
        ...,
        description="Total token count before stopword filtering.",
    )
    filtered_words: int = Field(
        ...,
        description="Token count after stopword filtering.",
    )
    keywords: dict[str, list[KeywordResult]] = Field(
        ...,
        description="Keyword results keyed by '1gram', '2gram', '3gram'.",
    )


# ── URL analysis request / response ─────────────────────────────────────

class AnalyzeUrlRequest(_AnalysisOptions):
    """POST /analyze-url request body."""
    url: str = Field(
        ...,
        min_length=3,
        description="URL of the webpage to crawl and analyse.",
    )


class AnalyzeUrlResponse(BaseModel):
    """POST /analyze-url response body."""
    url: str = Field(..., description="Original URL submitted.")
    final_url: str = Field("", description="URL after following redirects.")
    status_code: int = Field(0, description="HTTP status code.")
    title: str = ""
    meta_description: str = ""
    canonical: str = ""
    robots: str = ""
    language: str = ""
    h1_tags: list[str] = Field(default_factory=list)
    h2_tags: list[str] = Field(default_factory=list)
    og_title: str = ""
    og_description: str = ""
    content_word_count: int = Field(0, description="Word count of extracted content.")
    content: str = Field("", description="Extracted plain-text content.")
    keyword_analysis: AnalyzeResponse = Field(
        ...,
        description="Full keyword density analysis from the Step 1 engine.",
    )


# ── Advanced analysis request / response ─────────────────────────────────

class AdvancedAnalyzeRequest(BaseModel):
    """POST /analyze-advanced request body."""
    text: str = Field(
        ...,
        min_length=1,
        description="Raw text content to analyse (may contain HTML).",
    )
    # Linguistic options
    lemmatize: bool = Field(
        False,
        description="Apply spaCy lemmatization (running→run, tools→tool).",
    )
    stemming: bool = Field(
        False,
        description="Apply SnowballStemmer. Ignored if lemmatize=True.",
    )
    group_similar_keywords: bool = Field(
        False,
        description="Cluster keyword variations (tool/tools) into groups.",
    )
    strip_accents: bool = Field(
        False,
        description="Remove diacritical marks (café→cafe).",
    )
    # Standard options
    remove_numbers: bool = Field(False)
    filter_stopwords: bool = Field(True)
    include_seo_fillers: bool = Field(
        False,
        description="Also filter SEO filler/boilerplate words.",
    )
    custom_stopwords: list[str] = Field(
        default_factory=list,
        description="Extra stopwords to remove.",
    )
    min_frequency: int = Field(2, ge=1)
    top_n: int = Field(20, ge=1, le=200)
    # Prominence context (optional — from URL analysis or manual)
    title: str = Field("", description="Page title for prominence analysis.")
    meta_description: str = Field("", description="Meta description for prominence.")
    h1_tags: list[str] = Field(default_factory=list)
    h2_tags: list[str] = Field(default_factory=list)


class KeywordGroupResult(BaseModel):
    """A cluster of keyword variations grouped by their base form."""
    base_form: str
    variations: list[str]
    total_count: int
    density: float


class ContextualTermResult(BaseModel):
    """A word that co-occurs with a target keyword."""
    term: str
    co_occurrences: int
    relatedness: float


class ContextualKeywordResult(BaseModel):
    """Contextual analysis for one keyword."""
    keyword: str
    count: int
    context_terms: list[ContextualTermResult]


class KeywordPositionResult(BaseModel):
    """Positional data for a keyword within the text."""
    keyword: str
    first_occurrence: int
    last_occurrence: int
    spread: float
    in_introduction: bool
    in_middle: bool
    in_conclusion: bool
    position_score: float


class ProminenceAnalysisResult(BaseModel):
    """Whether a keyword appears in key SEO elements."""
    keyword: str
    in_title: bool
    in_meta_description: bool
    in_h1: bool
    in_h2: bool
    in_first_paragraph: bool
    prominence_score: float


class ReadabilityPrepResult(BaseModel):
    """Pre-computed readability metrics."""
    sentence_count: int
    paragraph_count: int
    avg_words_per_sentence: float
    long_sentence_count: int
    total_words: int


class StatisticsResult(BaseModel):
    """Text-level statistics."""
    total_words: int
    unique_words: int
    filtered_words: int
    sentence_count: int
    paragraph_count: int
    avg_words_per_sentence: float
    long_sentence_count: int


class AdvancedAnalyzeResponse(BaseModel):
    """POST /analyze-advanced response body."""
    statistics: StatisticsResult
    keywords: dict[str, list[KeywordResult]] = Field(
        ...,
        description="Keyword results keyed by '1gram', '2gram', '3gram'.",
    )
    grouped_keywords: list[KeywordGroupResult] = Field(
        default_factory=list,
        description="Keyword variations clustered by base form.",
    )
    keyword_positions: list[KeywordPositionResult] = Field(
        default_factory=list,
    )
    contextual_terms: list[ContextualKeywordResult] = Field(
        default_factory=list,
    )
    prominence_analysis: list[ProminenceAnalysisResult] = Field(
        default_factory=list,
    )
    readability: ReadabilityPrepResult


# ── Error response ──────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    type: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
