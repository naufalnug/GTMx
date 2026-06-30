"""
Readability scoring service.

Implements actual Flesch Reading Ease and Flesch-Kincaid Grade Level
formulas. Uses a syllable counter for English text.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

_RE_SENTENCE = re.compile(r"[.!?]+\s+|\n")
_RE_WORD = re.compile(r"[a-zA-Z]+")
# Vowel groups for syllable estimation
_RE_VOWEL_GROUP = re.compile(r"[aeiouy]+", re.IGNORECASE)
_RE_SILENT_E = re.compile(r"[^l]e$", re.IGNORECASE)
_RE_PASSIVE = re.compile(
    r"\b(?:am|is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b",
    re.IGNORECASE,
)


def _count_syllables(word: str) -> int:
    """
    Estimate syllable count for an English word.

    Uses vowel-group heuristic: count vowel clusters, adjust for
    silent-e and common patterns. Accurate enough for readability
    formulas (exact syllable counting requires a dictionary).
    """
    word = word.lower().strip()
    if len(word) <= 2:
        return 1
    # Count vowel groups
    groups = _RE_VOWEL_GROUP.findall(word)
    count = len(groups)
    # Subtract silent-e (e.g. "make" = 1 syllable, not 2)
    if _RE_SILENT_E.search(word):
        count -= 1
    # Words ending in "le" preceded by consonant add a syllable
    if word.endswith("le") and len(word) > 2 and word[-3] not in "aeiou":
        count += 1
    return max(1, count)


@dataclass(frozen=True, slots=True)
class ReadabilityResult:
    """Full readability analysis."""
    flesch_reading_ease: float       # 0-100 (higher = easier)
    flesch_kincaid_grade: float      # US grade level
    sentence_count: int
    word_count: int
    syllable_count: int
    avg_sentence_length: float
    avg_syllables_per_word: float
    long_sentence_count: int
    long_sentence_pct: float
    passive_voice_count: int
    passive_voice_pct: float
    difficult_word_count: int        # words with 3+ syllables
    difficult_word_pct: float
    reading_level: str               # "Very Easy" .. "Very Difficult"
    readability_score: float         # 0-100 normalized score


def _classify_reading_level(fre: float) -> str:
    if fre >= 90: return "Very Easy"
    if fre >= 80: return "Easy"
    if fre >= 70: return "Fairly Easy"
    if fre >= 60: return "Standard"
    if fre >= 50: return "Fairly Difficult"
    if fre >= 30: return "Difficult"
    return "Very Difficult"


def _fre_to_score(fre: float) -> float:
    """Convert Flesch Reading Ease to a 0-100 readability score.
    Target for web content: 60-70 (Standard). Too easy or too hard both lose points."""
    # Ideal range: 55-75
    if 55 <= fre <= 75:
        return 100.0
    if fre > 75:
        # Too simple — slight penalty
        return max(60, 100 - (fre - 75) * 1.5)
    # Too difficult
    if fre >= 30:
        return max(30, 100 - (55 - fre) * 2.0)
    return max(10, fre)


def compute_readability(text: str) -> ReadabilityResult:
    """
    Compute full readability metrics from raw text.

    Implements:
      - Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
      - Flesch-Kincaid Grade: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
      - Passive voice estimation
      - Difficult word ratio (3+ syllables)
    """
    sentences = [s.strip() for s in _RE_SENTENCE.split(text) if s.strip()]
    words = _RE_WORD.findall(text)

    sentence_count = max(1, len(sentences))
    word_count = max(1, len(words))

    syllables = [_count_syllables(w) for w in words]
    syllable_count = sum(syllables)
    difficult_words = sum(1 for s in syllables if s >= 3)

    avg_sl = word_count / sentence_count
    avg_syl = syllable_count / word_count

    # Flesch Reading Ease
    fre = 206.835 - 1.015 * avg_sl - 84.6 * avg_syl
    fre = round(max(0, min(100, fre)), 1)

    # Flesch-Kincaid Grade Level
    fkgl = 0.39 * avg_sl + 11.8 * avg_syl - 15.59
    fkgl = round(max(0, fkgl), 1)

    # Long sentences
    sent_word_counts = [len(s.split()) for s in sentences]
    long_sents = sum(1 for wc in sent_word_counts if wc > 25)

    # Passive voice
    passive_matches = _RE_PASSIVE.findall(text)
    passive_count = len(passive_matches)

    return ReadabilityResult(
        flesch_reading_ease=fre,
        flesch_kincaid_grade=fkgl,
        sentence_count=sentence_count,
        word_count=word_count,
        syllable_count=syllable_count,
        avg_sentence_length=round(avg_sl, 1),
        avg_syllables_per_word=round(avg_syl, 2),
        long_sentence_count=long_sents,
        long_sentence_pct=round(long_sents / sentence_count * 100, 1),
        passive_voice_count=passive_count,
        passive_voice_pct=round(passive_count / sentence_count * 100, 1),
        difficult_word_count=difficult_words,
        difficult_word_pct=round(difficult_words / word_count * 100, 1),
        reading_level=_classify_reading_level(fre),
        readability_score=round(_fre_to_score(fre), 1),
    )
