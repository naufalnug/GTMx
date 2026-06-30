"""
Incremental block-level keyword processor.

Analyzes individual content blocks and produces per-block Counter
objects. The real-time service merges these into session-wide totals.

Reuses the Step 1 text_cleaner and tokenizer — no duplicated logic.
"""
from __future__ import annotations

from collections import Counter

from app.services.cache_service import BlockAnalysis, get_global_cache
from app.utils.hashing import block_hash as compute_block_hash
from app.utils.text_cleaner import clean_text
from app.utils.tokenizer import count_ngrams, filter_stopwords, tokenize


def analyze_block(
    text: str,
    *,
    remove_numbers: bool = False,
    filter_stops: bool = True,
) -> BlockAnalysis:
    """
    Analyze a single content block.

    Checks the global cache first. On cache miss, runs the Step 1
    cleaning/tokenizing pipeline and stores the result.

    Returns a BlockAnalysis with tokens and n-gram Counters.
    """
    bh = compute_block_hash(text)
    cache = get_global_cache()

    # ── Cache check ──
    cached = cache.get(bh)
    if cached is not None:
        return cached

    # ── Full analysis (cache miss) ──
    cleaned = clean_text(text, remove_numbers=remove_numbers)
    tokens = tokenize(cleaned)
    filtered = filter_stopwords(tokens) if filter_stops else tokens

    # N-grams use the full token list with stopword-aware filtering
    unigrams = count_ngrams(tokens, 1, filter_stops=filter_stops)
    bigrams = count_ngrams(tokens, 2, filter_stops=filter_stops)
    trigrams = count_ngrams(tokens, 3, filter_stops=filter_stops)

    result = BlockAnalysis(
        block_hash=bh,
        tokens=tokens,
        filtered_tokens=filtered,
        unigrams=unigrams,
        bigrams=bigrams,
        trigrams=trigrams,
        word_count=len(tokens),
        filtered_count=len(filtered),
    )

    cache.put(result)
    return result


def merge_block_counters(blocks: list[BlockAnalysis]) -> tuple[Counter, Counter, Counter, int, int]:
    """
    Merge per-block Counters into session-wide totals.

    Returns: (unigrams, bigrams, trigrams, total_words, filtered_words)
    """
    uni: Counter = Counter()
    bi: Counter = Counter()
    tri: Counter = Counter()
    total = 0
    filtered = 0

    for block in blocks:
        uni += block.unigrams
        bi += block.bigrams
        tri += block.trigrams
        total += block.word_count
        filtered += block.filtered_count

    return uni, bi, tri, total, filtered
