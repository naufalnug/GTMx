"""
Linguistic processing service — lemmatization and stemming.

Uses spaCy for lemmatization (singleton model load) and NLTK
SnowballStemmer for stemming. Both are optional and togglable.
"""
from __future__ import annotations

import threading
from typing import Optional

import spacy
from nltk.stem import SnowballStemmer
from spacy.language import Language

# ── Singleton spaCy model ────────────────────────────────────────────────
# Loaded once on first use, shared across all requests.

_nlp: Optional[Language] = None
_nlp_lock = threading.Lock()


def _get_nlp() -> Language:
    """Load the spaCy English model once (thread-safe singleton)."""
    global _nlp
    if _nlp is None:
        with _nlp_lock:
            if _nlp is None:
                _nlp = spacy.load(
                    "en_core_web_sm",
                    disable=["ner", "parser", "textcat"],
                )
                # Increase max length for large articles
                _nlp.max_length = 2_000_000
    return _nlp


# ── Singleton stemmer ────────────────────────────────────────────────────

_stemmer = SnowballStemmer("english")


# ── Public API ───────────────────────────────────────────────────────────

def lemmatize_tokens(tokens: list[str]) -> list[str]:
    """
    Lemmatize a list of tokens using spaCy.

    "running" → "run", "tools" → "tool", "optimized" → "optimize"

    Returns a new list of lemmatized tokens in the same order.
    The spaCy model is loaded once and reused.
    """
    nlp = _get_nlp()
    # Join tokens and process — spaCy is faster on full text than token-by-token
    doc = nlp(" ".join(tokens))
    return [token.lemma_.lower() for token in doc if not token.is_space]


def lemmatize_text(text: str) -> list[str]:
    """Lemmatize raw text and return token list."""
    nlp = _get_nlp()
    doc = nlp(text.lower())
    return [token.lemma_ for token in doc if not token.is_space and len(token.text) > 1]


def stem_tokens(tokens: list[str]) -> list[str]:
    """
    Stem a list of tokens using SnowballStemmer.

    "running" → "run", "optimization" → "optim"

    Stemming is more aggressive than lemmatization. Results may not
    be real words but are consistent for grouping.
    """
    return [_stemmer.stem(t) for t in tokens]


def build_lemma_map(tokens: list[str]) -> dict[str, str]:
    """
    Build a mapping from original token → lemma.

    Useful for tracking which original forms map to the same lemma
    so we can report grouping to the user.
    """
    nlp = _get_nlp()
    doc = nlp(" ".join(tokens))
    mapping: dict[str, str] = {}
    for token in doc:
        if not token.is_space and len(token.text) > 1:
            mapping[token.text.lower()] = token.lemma_.lower()
    return mapping


def build_stem_map(tokens: list[str]) -> dict[str, str]:
    """Build a mapping from original token → stem."""
    return {t: _stemmer.stem(t) for t in tokens if len(t) > 1}
