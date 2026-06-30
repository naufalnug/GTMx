"""
Keyword gap analysis service.

Compares the primary page's keywords against competitor keywords to
find gaps, overlaps, and unique advantages.
"""
from __future__ import annotations

from app.models.competitor_models import KeywordGapItem, PageAnalysisResult


def _kw_dict(page: PageAnalysisResult, gram: str = "1gram") -> dict[str, tuple[int, float]]:
    """Build keyword → (count, density) lookup for a page."""
    return {
        kw.keyword: (kw.count, kw.density)
        for kw in page.keywords.get(gram, [])
    }


def compute_keyword_gaps(
    primary: PageAnalysisResult,
    competitors: list[PageAnalysisResult],
    *,
    gram: str = "1gram",
) -> tuple[list[KeywordGapItem], list[KeywordGapItem], list[KeywordGapItem]]:
    """
    Compute keyword gaps between the primary page and competitors.

    Returns: (missing, shared, unique_advantages)
      - missing: keywords competitors have that primary lacks
      - shared: keywords both primary and competitors share
      - unique_advantages: keywords only primary has
    """
    valid_competitors = [c for c in competitors if not c.error]
    if not valid_competitors:
        return [], [], []

    primary_kws = _kw_dict(primary, gram)

    # Aggregate competitor keywords: keyword → list of (count, density) per competitor
    comp_agg: dict[str, list[tuple[int, float]]] = {}
    for comp in valid_competitors:
        for kw, (cnt, den) in _kw_dict(comp, gram).items():
            comp_agg.setdefault(kw, []).append((cnt, den))

    all_comp_keywords = set(comp_agg.keys())
    primary_keywords = set(primary_kws.keys())

    missing: list[KeywordGapItem] = []
    shared: list[KeywordGapItem] = []
    unique_advantages: list[KeywordGapItem] = []

    # ── Missing: in competitors but not primary ──
    for kw in sorted(all_comp_keywords - primary_keywords):
        entries = comp_agg[kw]
        avg_count = sum(c for c, _ in entries) / len(entries)
        avg_density = sum(d for _, d in entries) / len(entries)
        presence = len(entries)

        if presence < 1:
            continue

        missing.append(KeywordGapItem(
            keyword=kw,
            primary_count=0,
            primary_density=0,
            competitor_avg_count=round(avg_count, 1),
            competitor_avg_density=round(avg_density, 2),
            competitor_presence=presence,
            gap_type="missing",
            suggested_action=f"Add \"{kw}\" to your content ({presence} competitor{'s' if presence > 1 else ''} use it)",
        ))

    # Sort missing: prioritize keywords used by more competitors, then by avg density
    missing.sort(key=lambda g: (-g.competitor_presence, -g.competitor_avg_density))

    # ── Shared: in both primary and competitors ──
    for kw in sorted(primary_keywords & all_comp_keywords):
        p_count, p_density = primary_kws[kw]
        entries = comp_agg[kw]
        avg_count = sum(c for c, _ in entries) / len(entries)
        avg_density = sum(d for _, d in entries) / len(entries)

        gap_type = "shared"
        action = ""
        if p_density < avg_density * 0.5:
            gap_type = "underused"
            action = f"Increase usage of \"{kw}\" (yours: {p_density}%, competitors avg: {round(avg_density, 2)}%)"
        elif p_density > avg_density * 2 and p_density > 3.0:
            gap_type = "overused"
            action = f"Reduce \"{kw}\" density (yours: {p_density}%, competitors avg: {round(avg_density, 2)}%)"

        shared.append(KeywordGapItem(
            keyword=kw,
            primary_count=p_count,
            primary_density=p_density,
            competitor_avg_count=round(avg_count, 1),
            competitor_avg_density=round(avg_density, 2),
            competitor_presence=len(entries),
            gap_type=gap_type,
            suggested_action=action,
        ))

    shared.sort(key=lambda g: (-g.competitor_presence, -g.competitor_avg_density))

    # ── Unique advantages: only in primary ──
    for kw in sorted(primary_keywords - all_comp_keywords):
        p_count, p_density = primary_kws[kw]
        unique_advantages.append(KeywordGapItem(
            keyword=kw,
            primary_count=p_count,
            primary_density=p_density,
            competitor_avg_count=0,
            competitor_avg_density=0,
            competitor_presence=0,
            gap_type="unique_advantage",
            suggested_action=f"\"{kw}\" is unique to your content — a competitive edge",
        ))

    unique_advantages.sort(key=lambda g: -g.primary_density)

    return missing, shared, unique_advantages
