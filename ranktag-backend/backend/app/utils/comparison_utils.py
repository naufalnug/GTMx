"""
Comparison utilities for competitor analysis.

Computes benchmark averages and generates competitive insights.
"""
from __future__ import annotations

from app.models.competitor_models import (
    BenchmarkAverages,
    CompetitorInsight,
    KeywordGapItem,
    PageAnalysisResult,
)


def compute_benchmarks(
    competitors: list[PageAnalysisResult],
) -> BenchmarkAverages:
    """Compute average metrics across valid competitor pages."""
    valid = [c for c in competitors if not c.error]
    if not valid:
        return BenchmarkAverages()

    n = len(valid)

    avg_wc = sum(c.word_count for c in valid) / n
    avg_para = sum(c.paragraph_count for c in valid) / n
    avg_head = sum(c.heading_count for c in valid) / n
    avg_score = sum(c.overall_score for c in valid) / n
    avg_read = sum(
        (c.readability.readability_score if c.readability else 0) for c in valid
    ) / n
    avg_kw_count = sum(len(c.keywords.get("1gram", [])) for c in valid) / n

    top_densities = [
        c.keywords["1gram"][0].density
        for c in valid
        if c.keywords.get("1gram")
    ]
    avg_top_d = sum(top_densities) / len(top_densities) if top_densities else 0

    return BenchmarkAverages(
        avg_word_count=round(avg_wc, 0),
        avg_paragraph_count=round(avg_para, 0),
        avg_heading_count=round(avg_head, 0),
        avg_overall_score=round(avg_score, 1),
        avg_readability_score=round(avg_read, 1),
        avg_keyword_count=round(avg_kw_count, 0),
        avg_top_density=round(avg_top_d, 2),
    )


def generate_competitive_insights(
    primary: PageAnalysisResult,
    competitors: list[PageAnalysisResult],
    benchmarks: BenchmarkAverages,
    gaps: list[KeywordGapItem],
    shared: list[KeywordGapItem],
    unique: list[KeywordGapItem],
) -> list[CompetitorInsight]:
    """Generate actionable insights from the competitive comparison."""
    insights: list[CompetitorInsight] = []
    valid_comps = [c for c in competitors if not c.error]
    if not valid_comps:
        return insights

    # ── Content length ──
    if benchmarks.avg_word_count > 0:
        ratio = primary.word_count / benchmarks.avg_word_count
        if ratio < 0.6:
            diff = int(benchmarks.avg_word_count - primary.word_count)
            insights.append(CompetitorInsight(
                category="Content Length",
                severity="critical",
                message=f"Your content is significantly shorter than competitors",
                detail=f"You have {primary.word_count:,} words vs competitor avg of {int(benchmarks.avg_word_count):,}. Consider adding ~{diff:,} more words.",
            ))
        elif ratio < 0.85:
            insights.append(CompetitorInsight(
                category="Content Length",
                severity="warning",
                message=f"Competitors have more content on average",
                detail=f"Your {primary.word_count:,} words vs avg {int(benchmarks.avg_word_count):,}. Expanding could improve coverage.",
            ))
        elif ratio > 1.3:
            insights.append(CompetitorInsight(
                category="Content Length",
                severity="strength",
                message=f"Your content is more comprehensive than competitors",
                detail=f"{primary.word_count:,} words vs avg {int(benchmarks.avg_word_count):,}. Good depth advantage.",
            ))

    # ── SEO score ──
    if benchmarks.avg_overall_score > 0:
        diff = primary.overall_score - benchmarks.avg_overall_score
        if diff < -15:
            insights.append(CompetitorInsight(
                category="SEO Score",
                severity="critical",
                message=f"Your SEO score is well below competitor average",
                detail=f"Score: {primary.overall_score} vs avg {benchmarks.avg_overall_score}. Focus on keyword optimization and structure.",
            ))
        elif diff < -5:
            insights.append(CompetitorInsight(
                category="SEO Score",
                severity="warning",
                message=f"Competitors score slightly higher on average",
                detail=f"Score: {primary.overall_score} vs avg {benchmarks.avg_overall_score}.",
            ))
        elif diff > 10:
            insights.append(CompetitorInsight(
                category="SEO Score",
                severity="strength",
                message=f"Your SEO score exceeds competitor average",
                detail=f"Score: {primary.overall_score} vs avg {benchmarks.avg_overall_score}.",
            ))

    # ── Keyword gaps ──
    high_priority_gaps = [g for g in gaps if g.competitor_presence >= len(valid_comps) * 0.5]
    if len(high_priority_gaps) > 3:
        top_missing = [g.keyword for g in high_priority_gaps[:5]]
        insights.append(CompetitorInsight(
            category="Keyword Gaps",
            severity="critical",
            message=f"Missing {len(high_priority_gaps)} keywords that most competitors use",
            detail=f"Top missing: {', '.join(top_missing)}. These appear across multiple competitor pages.",
        ))
    elif high_priority_gaps:
        top_missing = [g.keyword for g in high_priority_gaps[:3]]
        insights.append(CompetitorInsight(
            category="Keyword Gaps",
            severity="warning",
            message=f"{len(high_priority_gaps)} keyword(s) used by most competitors are missing",
            detail=f"Consider adding: {', '.join(top_missing)}.",
        ))

    # ── Underused keywords ──
    underused = [s for s in shared if s.gap_type == "underused"]
    if underused:
        top_under = [u.keyword for u in underused[:3]]
        insights.append(CompetitorInsight(
            category="Keyword Density",
            severity="suggestion",
            message=f"{len(underused)} shared keyword(s) are underused compared to competitors",
            detail=f"Increase usage of: {', '.join(top_under)}.",
        ))

    # ── Unique advantages ──
    if len(unique) >= 3:
        top_unique = [u.keyword for u in unique[:3]]
        insights.append(CompetitorInsight(
            category="Unique Content",
            severity="strength",
            message=f"You have {len(unique)} unique keywords competitors don't use",
            detail=f"Competitive edge: {', '.join(top_unique)}. Maintain these differentiators.",
        ))

    # ── Structure ──
    if benchmarks.avg_heading_count > 0 and primary.heading_count < benchmarks.avg_heading_count * 0.5:
        insights.append(CompetitorInsight(
            category="Content Structure",
            severity="warning",
            message=f"Competitors use more headings for structure",
            detail=f"You have {primary.heading_count} headings vs avg {int(benchmarks.avg_heading_count)}. Add subheadings for better scannability.",
        ))

    # ── Readability ──
    if primary.readability and benchmarks.avg_readability_score > 0:
        rd_diff = primary.readability.readability_score - benchmarks.avg_readability_score
        if rd_diff < -15:
            insights.append(CompetitorInsight(
                category="Readability",
                severity="warning",
                message=f"Your content is harder to read than competitors",
                detail=f"Your readability: {primary.readability.readability_score} vs avg {benchmarks.avg_readability_score}. Simplify language.",
            ))
        elif rd_diff > 15:
            insights.append(CompetitorInsight(
                category="Readability",
                severity="strength",
                message=f"Your content is more readable than competitors",
                detail=f"Readability: {primary.readability.readability_score} vs avg {benchmarks.avg_readability_score}.",
            ))

    return insights
