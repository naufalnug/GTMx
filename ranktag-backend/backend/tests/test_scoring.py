"""Unit tests for the scoring engine."""
from __future__ import annotations

from app.models.schemas import KeywordResult
from app.services.readability_service import compute_readability
from app.services.scoring_engine import (
    compute_seo_score,
    score_keyword_optimization,
    score_content_structure,
    score_keyword_distribution,
    score_semantic_coverage,
)


def _kw(keyword: str, count: int, density: float) -> KeywordResult:
    return KeywordResult(keyword=keyword, count=count, density=density)


class TestKeywordOptimization:
    def test_stuffed_keywords_penalized(self):
        keywords = {"1gram": [_kw("seo", 50, 10.0), _kw("tools", 40, 8.0)]}
        result = score_keyword_optimization(keywords, 500)
        assert result.score < 30

    def test_ideal_range_rewarded(self):
        keywords = {"1gram": [
            _kw("seo", 10, 1.5), _kw("tools", 8, 1.2),
            _kw("keyword", 6, 0.9), _kw("search", 5, 0.8),
        ]}
        result = score_keyword_optimization(keywords, 650)
        assert result.score >= 70

    def test_empty_keywords(self):
        result = score_keyword_optimization({"1gram": []}, 100)
        assert result.score == 0


class TestReadability:
    def test_simple_text(self):
        r = compute_readability("The cat sat on the mat. It was a good day. The sun was bright.")
        assert r.flesch_reading_ease > 70
        assert r.reading_level in ("Easy", "Very Easy")

    def test_complex_text(self):
        r = compute_readability(
            "The implementation of sophisticated algorithmic methodologies "
            "necessitates comprehensive understanding of computational paradigms."
        )
        assert r.flesch_reading_ease < 50


class TestContentStructure:
    def test_short_content_penalized(self):
        result = score_content_structure("Short text.", 10)
        assert result.score < 80

    def test_multiple_paragraphs_rewarded(self):
        text = "Para one about SEO.\n\nPara two about keywords.\n\nPara three about tools."
        result = score_content_structure(text, 300)
        assert result.details["paragraphs"] == 3


class TestSemanticCoverage:
    def test_rich_vocabulary(self):
        keywords = {
            "1gram": [_kw(f"kw{i}", i + 1, 0.5) for i in range(20)],
            "2gram": [_kw(f"phrase{i}", i + 1, 0.3) for i in range(10)],
            "3gram": [_kw(f"triple{i}", i + 1, 0.1) for i in range(6)],
        }
        result = score_semantic_coverage(keywords, 1000)
        assert result.score >= 90

    def test_thin_vocabulary(self):
        keywords = {"1gram": [_kw("seo", 5, 2.0)], "2gram": [], "3gram": []}
        result = score_semantic_coverage(keywords, 200)
        assert result.score < 40


class TestFullScore:
    def test_end_to_end(self):
        text = (
            "Search engine optimization helps websites. "
            "SEO tools analyze keywords effectively.\n\n"
            "Keyword research is important. "
            "Technical SEO identifies issues."
        )
        readability = compute_readability(text)
        keywords = {
            "1gram": [_kw("seo", 3, 4.0), _kw("tools", 2, 2.7), _kw("keyword", 2, 2.7)],
            "2gram": [_kw("seo tools", 2, 2.7)],
            "3gram": [],
        }
        score = compute_seo_score(keywords, text, 30, readability)
        assert 0 <= score.overall_score <= 100
        assert len(score.category_scores) == 6
