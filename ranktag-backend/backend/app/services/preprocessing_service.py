"""
Full SEO preprocessing pipeline.

Orchestrates: raw text → normalize → clean → tokenize → lemmatize/stem
→ stopword filter → keyword counting → density.

This builds on top of the Step 1 engine without duplicating it.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from app.utils.normalization import normalize_unicode, strip_accents, is_junk_token
from app.utils.stopwords import STOP_WORDS, build_custom_stop_set
from app.utils.text_cleaner import clean_text
from app.utils.tokenizer import tokenize
from app.services.linguistic_service import (
    build_lemma_map,
    build_stem_map,
    lemmatize_tokens,
    stem_tokens,
)


@dataclass(slots=True)
class PreprocessedText:
    """Result of the full preprocessing pipeline."""
    # Original cleaned tokens (before lemma/stem)
    original_tokens: list[str] = field(default_factory=list)
    # Final tokens used for analysis (after lemma/stem + stop filter)
    processed_tokens: list[str] = field(default_factory=list)
    # Cleaned text (after normalization, before tokenization)
    cleaned_text: str = ""
    # Original → normalized form mapping
    lemma_map: dict[str, str] = field(default_factory=dict)
    stem_map: dict[str, str] = field(default_factory=dict)
    # Counts
    total_words: int = 0
    filtered_words: int = 0


def preprocess(
    text: str,
    *,
    remove_numbers: bool = False,
    filter_stops: bool = True,
    lemmatize: bool = False,
    stemming: bool = False,
    strip_accents_flag: bool = False,
    custom_stopwords: list[str] | None = None,
) -> PreprocessedText:
    """
    Run the full preprocessing pipeline on raw text.

    Pipeline order:
      1. Unicode normalization (smart quotes, dashes, BOM)
      2. Optional accent stripping
      3. HTML / special-char cleaning (Step 1 text_cleaner)
      4. Tokenization
      5. Junk token removal
      6. Optional lemmatization OR stemming (not both)
      7. Stopword filtering

    Args:
        text: Raw input (may contain HTML).
        remove_numbers: Strip standalone numbers.
        filter_stops: Remove stopwords.
        lemmatize: Apply spaCy lemmatization.
        stemming: Apply SnowballStemmer (ignored if lemmatize=True).
        strip_accents_flag: Remove diacritical marks.
        custom_stopwords: Extra stopwords to remove.

    Returns:
        PreprocessedText with original and processed token lists.
    """
    # ── 1. Unicode normalization ──
    normalized = normalize_unicode(text)

    # ── 2. Optional accent stripping ──
    if strip_accents_flag:
        normalized = strip_accents(normalized)

    # ── 3. Clean (HTML, punctuation, whitespace) via Step 1 ──
    cleaned = clean_text(normalized, remove_numbers=remove_numbers)

    # ── 4. Tokenize ──
    tokens = tokenize(cleaned)

    # ── 5. Remove junk tokens ──
    tokens = [t for t in tokens if not is_junk_token(t)]

    total_words = len(tokens)
    original_tokens = list(tokens)

    # ── 6. Lemmatization or stemming ──
    lemma_map: dict[str, str] = {}
    stem_map_result: dict[str, str] = {}

    if lemmatize:
        lemma_map = build_lemma_map(tokens)
        tokens = lemmatize_tokens(tokens)
        # Remove junk again after lemmatization
        tokens = [t for t in tokens if not is_junk_token(t)]
    elif stemming:
        stem_map_result = build_stem_map(tokens)
        tokens = stem_tokens(tokens)
        tokens = [t for t in tokens if not is_junk_token(t)]

    # ── 7. Stopword filtering ──
    if filter_stops:
        stop_set = build_custom_stop_set(custom_stopwords)
        tokens = [t for t in tokens if t not in stop_set]

    return PreprocessedText(
        original_tokens=original_tokens,
        processed_tokens=tokens,
        cleaned_text=cleaned,
        lemma_map=lemma_map,
        stem_map=stem_map_result,
        total_words=total_words,
        filtered_words=len(tokens),
    )
