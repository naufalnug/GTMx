"""
PDF report generation service.

Uses ReportLab to produce a professional SEO audit report PDF.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ── Brand colors ──
_RED = colors.HexColor("#FF3B14")
_SUCCESS = colors.HexColor("#2D8A5C")
_WARN = colors.HexColor("#D97706")
_INK = colors.HexColor("#0E0E10")
_MUTED = colors.HexColor("#6E6E76")
_PAPER = colors.HexColor("#F4EFE7")
_PAPER3 = colors.HexColor("#E4DCCC")
_WHITE = colors.white


def _score_color(score: float) -> colors.HexColor:
    if score >= 80: return _SUCCESS
    if score >= 60: return _WARN
    return _RED


def _severity_color(sev: str) -> colors.HexColor:
    if sev == "critical": return _RED
    if sev == "warning": return _WARN
    return colors.HexColor("#6B77E0")


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle("Brand_Title", fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=_INK, alignment=1))
    ss.add(ParagraphStyle("Brand_Sub", fontName="Helvetica", fontSize=11, leading=14, textColor=_MUTED, alignment=1))
    ss.add(ParagraphStyle("Section_Head", fontName="Helvetica-Bold", fontSize=13, leading=18, textColor=_INK, spaceBefore=18, spaceAfter=8))
    ss.add(ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=14, textColor=_INK))
    ss.add(ParagraphStyle("Small", fontName="Helvetica", fontSize=8, leading=11, textColor=_MUTED))
    ss.add(ParagraphStyle("Rec_Title", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=_INK))
    ss.add(ParagraphStyle("Rec_Detail", fontName="Helvetica", fontSize=9, leading=12, textColor=_MUTED))
    ss.add(ParagraphStyle("Strength", fontName="Helvetica", fontSize=10, leading=13, textColor=_SUCCESS))
    return ss


def generate_pdf(
    overall_score: float,
    grade: str,
    total_words: int,
    category_scores: list[dict[str, Any]],
    readability: dict[str, Any] | None,
    keywords: dict,
    recommendations: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
    strengths: list[dict[str, Any]],
    *,
    include_recommendations: bool = True,
    include_raw_keywords: bool = True,
) -> bytes:
    """Render a professional SEO audit report PDF and return raw bytes."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )
    ss = _styles()
    story: list = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # ── Cover ──
    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph("SEO Audit Report", ss["Brand_Title"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Powered by RankedTag Keyword Density Analyzer", ss["Brand_Sub"]))
    story.append(Spacer(1, 1.2 * cm))

    # Score badge
    sc = _score_color(overall_score)
    badge_data = [[Paragraph(f'<font size="28" color="{sc.hexval()}">{overall_score}</font>', ss["Brand_Title"])]]
    badge_table = Table(badge_data, colWidths=[5 * cm])
    badge_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), _PAPER),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    # Center the badge
    outer = Table([[badge_table]], colWidths=[doc.width])
    outer.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(outer)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(f"Grade: <b>{grade}</b> &nbsp;&bull;&nbsp; Total Words: {total_words:,} &nbsp;&bull;&nbsp; {now}", ss["Brand_Sub"]))
    story.append(Spacer(1, 1.2 * cm))

    # ── Category scores ──
    story.append(Paragraph("Score Breakdown", ss["Section_Head"]))
    cat_header = ["Category", "Weight", "Score"]
    cat_rows = [cat_header]
    for cat in category_scores:
        sc_val = cat.get("score", 0)
        sc_col = _score_color(sc_val)
        cat_rows.append([
            cat.get("name", ""),
            f'{cat.get("weight", 0)}%',
            Paragraph(f'<font color="{sc_col.hexval()}"><b>{sc_val}</b></font>', ss["Body"]),
        ])
    cat_table = Table(cat_rows, colWidths=[doc.width * 0.55, doc.width * 0.2, doc.width * 0.25])
    cat_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, 0), _MUTED),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, _PAPER3),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, _PAPER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
    ]))
    story.append(cat_table)
    story.append(Spacer(1, 8 * mm))

    # ── Readability ──
    if readability:
        story.append(Paragraph("Readability", ss["Section_Head"]))
        rd_data = [
            ["Flesch Score", "Grade Level", "Avg Sentence", "Passive Voice", "Level"],
            [
                str(readability.get("flesch_reading_ease", "")),
                str(readability.get("flesch_kincaid_grade", "")),
                f'{readability.get("avg_sentence_length", "")} words',
                f'{readability.get("passive_voice_pct", "")}%',
                readability.get("reading_level", ""),
            ],
        ]
        rd_table = Table(rd_data, colWidths=[doc.width / 5] * 5)
        rd_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("TEXTCOLOR", (0, 0), (-1, 0), _MUTED),
            ("FONTSIZE", (0, 1), (-1, 1), 12),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 1), (-1, 1), _PAPER),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ]))
        story.append(rd_table)
        story.append(Spacer(1, 8 * mm))

    # ── Warnings ──
    if warnings:
        story.append(Paragraph('<font color="#FF3B14">Warnings</font>', ss["Section_Head"]))
        for w in warnings:
            story.append(Paragraph(
                f'<font color="{_severity_color(w.get("severity", "")).hexval()}" size="8">'
                f'[{w.get("severity", "").upper()}]</font> '
                f'<b>{w.get("message", "")}</b>', ss["Rec_Title"]
            ))
            story.append(Paragraph(w.get("detail", ""), ss["Rec_Detail"]))
            story.append(Spacer(1, 3 * mm))

    # ── Recommendations ──
    if include_recommendations and recommendations:
        story.append(Paragraph("Recommendations", ss["Section_Head"]))
        for r in recommendations:
            story.append(Paragraph(
                f'<font color="{_severity_color(r.get("severity", "")).hexval()}" size="8">'
                f'[{r.get("severity", "").upper()}]</font> '
                f'<b>{r.get("message", "")}</b>', ss["Rec_Title"]
            ))
            story.append(Paragraph(r.get("detail", ""), ss["Rec_Detail"]))
            story.append(Spacer(1, 3 * mm))

    # ── Strengths ──
    if strengths:
        story.append(Paragraph('<font color="#2D8A5C">Strengths</font>', ss["Section_Head"]))
        for s in strengths:
            story.append(Paragraph(f'<font color="#2D8A5C">&#10003;</font> {s.get("message", "")}', ss["Strength"]))

    # ── Keywords ──
    if include_raw_keywords:
        for gram_key, label in [("1gram", "1-Word Keywords"), ("2gram", "2-Word Phrases"), ("3gram", "3-Word Phrases")]:
            kw_list = keywords.get(gram_key, [])
            if not kw_list:
                continue
            story.append(Paragraph(label, ss["Section_Head"]))
            kw_header = ["#", "Keyword", "Count", "Density"]
            kw_rows = [kw_header]
            for i, kw in enumerate(kw_list[:20], 1):
                d = kw if isinstance(kw, dict) else kw
                density = d.get("density", 0) if isinstance(d, dict) else d.density
                keyword = d.get("keyword", "") if isinstance(d, dict) else d.keyword
                count = d.get("count", 0) if isinstance(d, dict) else d.count
                dc = _score_color(100 - density * 20)
                kw_rows.append([
                    str(i),
                    keyword,
                    str(count),
                    Paragraph(f'<font color="{dc.hexval()}"><b>{density}%</b></font>', ss["Body"]),
                ])
            kw_table = Table(kw_rows, colWidths=[doc.width * 0.08, doc.width * 0.52, doc.width * 0.15, doc.width * 0.25])
            kw_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("TEXTCOLOR", (0, 0), (-1, 0), _MUTED),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, _PAPER3),
                ("LINEBELOW", (0, 1), (-1, -1), 0.25, _PAPER),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                ("ALIGN", (3, 0), (3, -1), "RIGHT"),
            ]))
            story.append(kw_table)
            story.append(Spacer(1, 4 * mm))

    # ── Footer ──
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph(f"RankedTag SEO Audit &bull; {now}", ss["Small"]))

    doc.build(story)
    return buf.getvalue()
