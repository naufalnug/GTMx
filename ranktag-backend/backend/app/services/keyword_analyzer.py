"""
Core keyword analysis engine.

Orchestrates text cleaning → tokenization → n-gram counting → density
calculation and returns structured results.
"""
from __future__ import annotations

from collections import Counter

from app.models.schemas import AnalyzeResponse, KeywordResult
from app.utils.text_cleaner import clean_text
from app.utils.tokenizer import count_ngrams, filter_stopwords, tokenize


def _build_results(
    counter: Counter,
    total_words: int,
    *,
    min_frequency: int,
    top_n: int,
) -> list[KeywordResult]:
    """
    Convert a Counter into a sorted list of KeywordResult.

    Sorted by count descending, then density descending.
    """
    results: list[KeywordResult] = []
    for keyword, count in counter.most_common():
        if count < min_frequency:
            break  # Counter.most_common is sorted; once below threshold, done
        density = round((count / total_words) * 100, 2) if total_words else 0.0
        results.append(KeywordResult(keyword=keyword, count=count, density=density))
        if len(results) >= top_n:
            break
    return results


def analyze(
    text: str,
    *,
    remove_numbers: bool = False,
    filter_stops: bool = True,
    min_frequency: int = 2,
    top_n: int = 20,
) -> AnalyzeResponse:
    """
    Run full keyword density analysis on the given text.

    Args:
        text: Raw input text (may contain HTML).
        remove_numbers: Strip standalone numbers.
        filter_stops: Remove stopwords from results.
        min_frequency: Minimum occurrence to appear in output.
        top_n: Max results per n-gram tier.

    Returns:
        AnalyzeResponse with total_words, filtered_words, and keyword tiers.
    """
    cleaned = clean_text(text, remove_numbers=remove_numbers)
    tokens = tokenize(cleaned)
    total_words = len(tokens)

    filtered_tokens = filter_stopwords(tokens) if filter_stops else tokens
    filtered_words = len(filtered_tokens)

    # Count n-grams (1, 2, 3)
    unigrams = count_ngrams(tokens, 1, filter_stops=filter_stops)
    bigrams = count_ngrams(tokens, 2, filter_stops=filter_stops)
    trigrams = count_ngrams(tokens, 3, filter_stops=filter_stops)

    build_kw = lambda c: _build_results(
        c, total_words, min_frequency=min_frequency, top_n=top_n,
    )

    return AnalyzeResponse(
        total_words=total_words,
        filtered_words=filtered_words,
        keywords={
            "1gram": build_kw(unigrams),
            "2gram": build_kw(bigrams),
            "3gram": build_kw(trigrams),
        },
    )
