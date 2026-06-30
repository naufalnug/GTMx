"""
CSV export service.

Generates clean, UTF-8 CSV files from analysis data.
"""
from __future__ import annotations

import csv
import io
from typing import Any

from app.models.schemas import KeywordResult


def export_keywords_csv(
    keywords: dict[str, list[KeywordResult]],
    total_words: int,
) -> str:
    """
    Generate a CSV string with all keyword data.

    Columns: Rank, Keyword, Type, Count, Density(%)
    """
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Rank", "Keyword", "Type", "Count", "Density (%)"])

    type_labels = {"1gram": "1-Word", "2gram": "2-Word", "3gram": "3-Word"}

    for gram_key in ("1gram", "2gram", "3gram"):
        for i, kw in enumerate(keywords.get(gram_key, []), 1):
            writer.writerow([i, kw.keyword, type_labels.get(gram_key, gram_key), kw.count, kw.density])

    return buf.getvalue()


def export_full_report_csv(
    keywords: dict[str, list[KeywordResult]],
    total_words: int,
    overall_score: float,
    grade: str,
    category_scores: list[dict[str, Any]],
    readability: dict[str, Any] | None,
    recommendations: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
    strengths: list[dict[str, Any]],
) -> str:
    """
    Generate a multi-section CSV string with the full SEO report.
    """
    buf = io.StringIO()
    writer = csv.writer(buf)

    # Section: Summary
    writer.writerow(["=== SEO AUDIT SUMMARY ==="])
    writer.writerow(["Overall Score", overall_score])
    writer.writerow(["Grade", grade])
    writer.writerow(["Total Words", total_words])
    writer.writerow([])

    # Section: Category Scores
    writer.writerow(["=== CATEGORY SCORES ==="])
    writer.writerow(["Category", "Score", "Weight (%)", "Weighted"])
    for cat in category_scores:
        writer.writerow([cat.get("name", ""), cat.get("score", 0), cat.get("weight", 0), cat.get("weighted", 0)])
    writer.writerow([])

    # Section: Readability
    if readability:
        writer.writerow(["=== READABILITY ==="])
        writer.writerow(["Flesch Reading Ease", readability.get("flesch_reading_ease", "")])
        writer.writerow(["Flesch-Kincaid Grade", readability.get("flesch_kincaid_grade", "")])
        writer.writerow(["Reading Level", readability.get("reading_level", "")])
        writer.writerow(["Avg Sentence Length", readability.get("avg_sentence_length", "")])
        writer.writerow(["Passive Voice %", readability.get("passive_voice_pct", "")])
        writer.writerow(["Difficult Words %", readability.get("difficult_word_pct", "")])
        writer.writerow([])

    # Section: Warnings
    if warnings:
        writer.writerow(["=== WARNINGS ==="])
        writer.writerow(["Severity", "Category", "Message", "Detail"])
        for w in warnings:
            writer.writerow([w.get("severity", ""), w.get("category", ""), w.get("message", ""), w.get("detail", "")])
        writer.writerow([])

    # Section: Recommendations
    if recommendations:
        writer.writerow(["=== RECOMMENDATIONS ==="])
        writer.writerow(["Severity", "Category", "Message", "Detail"])
        for r in recommendations:
            writer.writerow([r.get("severity", ""), r.get("category", ""), r.get("message", ""), r.get("detail", "")])
        writer.writerow([])

    # Section: Strengths
    if strengths:
        writer.writerow(["=== STRENGTHS ==="])
        writer.writerow(["Category", "Message"])
        for s in strengths:
            writer.writerow([s.get("category", ""), s.get("message", "")])
        writer.writerow([])

    # Section: Keywords
    writer.writerow(["=== KEYWORDS ==="])
    writer.writerow(["Rank", "Keyword", "Type", "Count", "Density (%)"])
    type_labels = {"1gram": "1-Word", "2gram": "2-Word", "3gram": "3-Word"}
    for gram_key in ("1gram", "2gram", "3gram"):
        for i, kw in enumerate(keywords.get(gram_key, []), 1):
            writer.writerow([i, kw.keyword, type_labels.get(gram_key, gram_key), kw.count, kw.density])

    return buf.getvalue()
