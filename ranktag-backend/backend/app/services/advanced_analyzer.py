"""
Advanced keyword analysis engine.

Extends the Step 1 engine with linguistic preprocessing, keyword grouping,
contextual analysis, positional tracking, and prominence scoring.
"""
from __future__ import annotations

from collections import Counter, defaultdict

from app.models.schemas import (
    AdvancedAnalyzeResponse,
    ContextualKeywordResult,
    ContextualTermResult,
    KeywordGroupResult,
    KeywordPositionResult,
    KeywordResult,
    ProminenceAnalysisResult,
    ReadabilityPrepResult,
    StatisticsResult,
)
from app.services.contextual_analysis_service import analyze_context
from app.services.preprocessing_service import preprocess
from app.services.prominence_service import (
    analyze_keyword_positions,
    analyze_prominence,
    compute_readability_prep,
)
from app.utils.tokenizer import count_ngrams


def _build_results(
    counter: Counter,
    total_words: int,
    *,
    min_frequency: int,
    top_n: int,
) -> list[KeywordResult]:
    """Convert a Counter into sorted KeywordResult list."""
    results: list[KeywordResult] = []
    for keyword, count in counter.most_common():
        if count < min_frequency:
            break
        density = round((count / total_words) * 100, 2) if total_words else 0.0
        results.append(KeywordResult(keyword=keyword, count=count, density=density))
        if len(results) >= top_n:
            break
    return results


def _group_keywords(
    original_tokens: list[str],
    processed_tokens: list[str],
    lemma_map: dict[str, str],
    stem_map: dict[str, str],
    total_words: int,
    *,
    min_frequency: int,
    top_n: int,
) -> list[KeywordGroupResult]:
    """
    Cluster keyword variations by their normalized base form.

    If lemmatization was used, group by lemma. If stemming, group by stem.
    Count the total across all variations.
    """
    # Determine which mapping to use
    mapping = lemma_map if lemma_map else stem_map
    if not mapping:
        return []

    # Group: base_form → {original_form: count}
    groups: dict[str, Counter[str]] = defaultdict(Counter)
    for orig in original_tokens:
        base = mapping.get(orig, orig)
        groups[base][orig] += 1

    results: list[KeywordGroupResult] = []
    for base_form, variation_counts in groups.items():
        total_count = sum(variation_counts.values())
        if total_count < min_frequency:
            continue
        # Sort variations by count descending
        variations = [v for v, _ in variation_counts.most_common()]
        density = round((total_count / total_words) * 100, 2) if total_words else 0.0
        results.append(KeywordGroupResult(
            base_form=base_form,
            variations=variations,
            total_count=total_count,
            density=density,
        ))

    # Sort by total_count descending
    results.sort(key=lambda r: r.total_count, reverse=True)
    return results[:top_n]


def analyze_advanced(
    text: str,
    *,
    remove_numbers: bool = False,
    filter_stops: bool = True,
    lemmatize: bool = False,
    stemming: bool = False,
    group_similar: bool = False,
    strip_accents: bool = False,
    include_seo_fillers: bool = False,
    custom_stopwords: list[str] | None = None,
    min_frequency: int = 2,
    top_n: int = 20,
    # Prominence inputs (from URL metadata or manual)
    title: str = "",
    meta_description: str = "",
    h1_tags: list[str] | None = None,
    h2_tags: list[str] | None = None,
) -> AdvancedAnalyzeResponse:
    """
    Run the full advanced analysis pipeline.

    Pipeline:
      1. Preprocessing (normalize → clean → tokenize → lemma/stem → filter)
      2. N-gram counting + density (reuses Step 1 logic)
      3. Keyword grouping (optional)
      4. Positional analysis
      5. Contextual co-occurrence
      6. Prominence analysis
      7. Readability preprocessing
    """
    h1_tags = h1_tags or []
    h2_tags = h2_tags or []

    # ── 1. Preprocessing ──
    pp = preprocess(
        text,
        remove_numbers=remove_numbers,
        filter_stops=filter_stops,
        lemmatize=lemmatize,
        stemming=stemming,
        strip_accents_flag=strip_accents,
        custom_stopwords=custom_stopwords,
    )

    total_words = pp.total_words
    tokens = pp.processed_tokens

    # ── 2. N-gram counting ──
    # Use processed tokens with stopword filtering already applied
    unigrams = count_ngrams(tokens, 1, filter_stops=False)
    bigrams = count_ngrams(tokens, 2, filter_stops=False)
    trigrams = count_ngrams(tokens, 3, filter_stops=False)

    build_kw = lambda c: _build_results(
        c, total_words, min_frequency=min_frequency, top_n=top_n,
    )

    kw_1gram = build_kw(unigrams)
    kw_2gram = build_kw(bigrams)
    kw_3gram = build_kw(trigrams)

    # ── 3. Keyword grouping ──
    grouped: list[KeywordGroupResult] = []
    if group_similar and (pp.lemma_map or pp.stem_map):
        grouped = _group_keywords(
            pp.original_tokens,
            pp.processed_tokens,
            pp.lemma_map,
            pp.stem_map,
            total_words,
            min_frequency=min_frequency,
            top_n=top_n,
        )

    # ── 4. Positional analysis (top 10 unigrams) ──
    top_kw_names = [k.keyword for k in kw_1gram[:10]]
    positions = analyze_keyword_positions(tokens, top_kw_names)
    position_results = [
        KeywordPositionResult(
            keyword=p.keyword,
            first_occurrence=p.first_occurrence,
            last_occurrence=p.last_occurrence,
            spread=p.spread,
            in_introduction=p.in_introduction,
            in_middle=p.in_middle,
            in_conclusion=p.in_conclusion,
            position_score=p.position_score,
        )
        for p in positions
    ]

    # ── 5. Contextual co-occurrence (top 5 unigrams) ──
    ctx_results = analyze_context(tokens, top_kw_names[:5], window=5, top_n=8)
    contextual_out = [
        ContextualKeywordResult(
            keyword=cr.keyword,
            count=cr.count,
            context_terms=[
                ContextualTermResult(
                    term=ct.term,
                    co_occurrences=ct.co_occurrences,
                    relatedness=ct.relatedness,
                )
                for ct in cr.context_terms
            ],
        )
        for cr in ctx_results
    ]

    # ── 6. Prominence analysis (top 5 unigrams) ──
    prominence_out: list[ProminenceAnalysisResult] = []
    if title or meta_description or h1_tags or h2_tags:
        for kw_name in top_kw_names[:5]:
            pr = analyze_prominence(
                kw_name,
                title=title,
                meta_description=meta_description,
                h1_tags=h1_tags,
                h2_tags=h2_tags,
                content=text,
            )
            prominence_out.append(ProminenceAnalysisResult(
                keyword=pr.keyword,
                in_title=pr.in_title,
                in_meta_description=pr.in_meta_description,
                in_h1=pr.in_h1,
                in_h2=pr.in_h2,
                in_first_paragraph=pr.in_first_paragraph,
                prominence_score=pr.prominence_score,
            ))

    # ── 7. Readability ──
    readability = compute_readability_prep(pp.cleaned_text)

    # ── 8. Statistics ──
    unique_words = len(set(tokens))

    return AdvancedAnalyzeResponse(
        statistics=StatisticsResult(
            total_words=total_words,
            unique_words=unique_words,
            filtered_words=pp.filtered_words,
            sentence_count=readability.sentence_count,
            paragraph_count=readability.paragraph_count,
            avg_words_per_sentence=readability.avg_words_per_sentence,
            long_sentence_count=readability.long_sentence_count,
        ),
        keywords={
            "1gram": kw_1gram,
            "2gram": kw_2gram,
            "3gram": kw_3gram,
        },
        grouped_keywords=grouped,
        keyword_positions=position_results,
        contextual_terms=contextual_out,
        prominence_analysis=prominence_out,
        readability=ReadabilityPrepResult(
            sentence_count=readability.sentence_count,
            paragraph_count=readability.paragraph_count,
            avg_words_per_sentence=readability.avg_words_per_sentence,
            long_sentence_count=readability.long_sentence_count,
            total_words=readability.total_words,
        ),
    )
