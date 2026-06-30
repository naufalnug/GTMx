"""POST /analyze — keyword density analysis endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.keyword_analyzer import analyze

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_text(payload: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyse text for keyword density.

    Accepts raw text (including HTML), cleans it, tokenizes, generates
    1/2/3-gram keyword counts, and returns density percentages.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")

    return analyze(
        payload.text,
        remove_numbers=payload.remove_numbers,
        filter_stops=payload.filter_stopwords,
        min_frequency=payload.min_frequency,
        top_n=payload.top_n,
    )
