"""
Tokenization and n-gram generation utilities.
"""
from __future__ import annotations

from collections import Counter
from typing import Generator

from app.utils.stopwords import STOP_WORDS


def tokenize(text: str) -> list[str]:
    """
    Split cleaned text into tokens.

    Assumes text is already lowercased and cleaned (via text_cleaner).
    Filters out empty strings and single-character tokens.
    """
    return [t for t in text.split() if len(t) > 1]


def filter_stopwords(tokens: list[str]) -> list[str]:
    """Remove stopwords from a token list."""
    return [t for t in tokens if t not in STOP_WORDS]


def generate_ngrams(
    tokens: list[str],
    n: int,
    *,
    filter_stops: bool = True,
) -> Generator[str, None, None]:
    """
    Yield n-gram strings from a token list.

    For 1-grams: each token not in the stop list (if filter_stops=True).
    For 2-grams: skip if BOTH tokens are stopwords.
    For 3-grams: skip if the first AND last tokens are both stopwords.

    This mirrors how professional SEO tools handle n-gram stopword
    filtering — allowing stopwords in the middle of phrases preserves
    natural queries like "how to rank" or "best of breed".
    """
    if n < 1 or not tokens:
        return

    for i in range(len(tokens) - n + 1):
        gram_tokens = tokens[i : i + n]

        if filter_stops:
            if n == 1:
                if gram_tokens[0] in STOP_WORDS:
                    continue
            elif n == 2:
                if gram_tokens[0] in STOP_WORDS and gram_tokens[1] in STOP_WORDS:
                    continue
            else:
                # n >= 3: skip if first AND last are stopwords
                if gram_tokens[0] in STOP_WORDS and gram_tokens[-1] in STOP_WORDS:
                    continue

        yield " ".join(gram_tokens)


def count_ngrams(
    tokens: list[str],
    n: int,
    *,
    filter_stops: bool = True,
) -> Counter:
    """Count n-gram occurrences and return a Counter."""
    return Counter(generate_ngrams(tokens, n, filter_stops=filter_stops))
