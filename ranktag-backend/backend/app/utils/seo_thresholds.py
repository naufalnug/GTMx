"""
Configurable SEO scoring thresholds and weights.

Central configuration for all scoring algorithms. Supports preset
profiles for different content types.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class ScoringWeights:
    """Category weights (must sum to 100)."""
    keyword_optimization: int = 25
    content_structure: int = 20
    readability: int = 20
    keyword_prominence: int = 15
    semantic_coverage: int = 10
    keyword_distribution: int = 10


@dataclass(frozen=True, slots=True)
class DensityThresholds:
    """Keyword density zone boundaries."""
    stuffed_above: float = 3.5
    high_above: float = 2.0
    healthy_above: float = 0.5
    ideal_min: float = 0.8
    ideal_max: float = 2.5


@dataclass(frozen=True, slots=True)
class ContentThresholds:
    """Content length and structure thresholds."""
    min_words_short: int = 300
    min_words_medium: int = 800
    min_words_long: int = 1500
    ideal_words_min: int = 800
    ideal_words_max: int = 3000
    max_paragraph_words: int = 150
    ideal_sentence_length: float = 18.0
    long_sentence_threshold: int = 25
    min_paragraphs: int = 3
    min_headings: int = 2


# ── Presets ──────────────────────────────────────────────────────────────

PRESET_BLOG = ScoringWeights(
    keyword_optimization=25, content_structure=20, readability=20,
    keyword_prominence=15, semantic_coverage=10, keyword_distribution=10,
)

PRESET_LANDING = ScoringWeights(
    keyword_optimization=30, content_structure=15, readability=15,
    keyword_prominence=25, semantic_coverage=5, keyword_distribution=10,
)

PRESET_ECOMMERCE = ScoringWeights(
    keyword_optimization=30, content_structure=15, readability=20,
    keyword_prominence=20, semantic_coverage=10, keyword_distribution=5,
)

PRESETS: dict[str, ScoringWeights] = {
    "blog": PRESET_BLOG,
    "landing": PRESET_LANDING,
    "ecommerce": PRESET_ECOMMERCE,
}

DEFAULT_WEIGHTS = PRESET_BLOG
DEFAULT_DENSITY = DensityThresholds()
DEFAULT_CONTENT = ContentThresholds()
