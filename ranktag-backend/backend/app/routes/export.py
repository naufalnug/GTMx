"""Export endpoints — CSV and PDF report generation."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models.export_models import ExportRequest
from app.models.schemas import KeywordResult
from app.services.csv_export_service import export_full_report_csv, export_keywords_csv
from app.services.pdf_report_service import generate_pdf

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/csv")
def export_csv(payload: ExportRequest) -> Response:
    """Export a full SEO report as CSV."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")

    csv_data = export_full_report_csv(
        keywords=payload.keywords,
        total_words=payload.total_words,
        overall_score=payload.overall_score,
        grade=payload.grade,
        category_scores=[c.model_dump() for c in payload.category_scores],
        readability=payload.readability.model_dump() if payload.readability else None,
        recommendations=[r.model_dump() for r in payload.recommendations],
        warnings=[w.model_dump() for w in payload.warnings],
        strengths=[s.model_dump() for s in payload.strengths],
    )

    return Response(
        content=csv_data.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="seo-audit-report.csv"'},
    )


@router.post("/pdf")
def export_pdf(payload: ExportRequest) -> Response:
    """Generate a professional SEO audit PDF report."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")

    # Serialize keywords to dicts for the template
    kw_dicts: dict[str, list[dict]] = {}
    for gram_key, kw_list in payload.keywords.items():
        kw_dicts[gram_key] = [
            kw.model_dump() if isinstance(kw, KeywordResult) else kw
            for kw in kw_list
        ]

    try:
        pdf_bytes = generate_pdf(
            overall_score=payload.overall_score,
            grade=payload.grade,
            total_words=payload.total_words,
            category_scores=[c.model_dump() for c in payload.category_scores],
            readability=payload.readability.model_dump() if payload.readability else None,
            keywords=kw_dicts,
            recommendations=[r.model_dump() for r in payload.recommendations],
            warnings=[w.model_dump() for w in payload.warnings],
            strengths=[s.model_dump() for s in payload.strengths],
            include_recommendations=payload.include_recommendations,
            include_raw_keywords=payload.include_raw_keywords,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="seo-audit-report.pdf"'},
    )
