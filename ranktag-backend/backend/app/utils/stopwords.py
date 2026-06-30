"""
English stopword list for SEO keyword analysis.

Uses NLTK's English stopword corpus with SEO-important additions removed
so that terms like "best", "free", "how", "top" survive filtering —
these carry search intent and matter for keyword density.

Supports custom stopword sets for advanced analysis.
"""
from __future__ import annotations

import nltk

# Download once; silent if already present
try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords", quiet=True)

from nltk.corpus import stopwords as _sw

# Base NLTK English stopwords
_NLTK_STOPS: set[str] = set(_sw.words("english"))

# Words NLTK flags as stop words but that carry SEO search intent.
# We remove them from the stop list so they survive filtering.
_SEO_KEEP: set[str] = {
    "best", "free", "top", "new", "how", "why", "what", "when",
    "where", "which", "who", "review", "reviews", "guide", "vs",
    "near", "cheap", "online", "buy", "price", "cost",
}

# SEO filler words — common in web content but add noise to density
# analysis. These supplement standard stopwords.
SEO_FILLER_WORDS: set[str] = {
    "click", "here", "read", "more", "learn", "subscribe", "share",
    "tweet", "follow", "comment", "comments", "reply", "like", "likes",
    "post", "posted", "updated", "published", "written", "author",
    "admin", "tags", "category", "categories", "related", "previous",
    "next", "page", "pages", "menu", "sidebar", "footer", "header",
    "navigation", "copyright", "rights", "reserved", "privacy",
    "policy", "terms", "conditions", "disclaimer", "cookie", "cookies",
    "accept", "close", "toggle", "search", "skip", "content",
}

# The final stop set: NLTK minus SEO-important words
STOP_WORDS: set[str] = _NLTK_STOPS - _SEO_KEEP


def is_stopword(token: str) -> bool:
    """Check if a single lowercase token is a stopword."""
    return token in STOP_WORDS


def build_custom_stop_set(
    extra: list[str] | None = None,
    *,
    include_seo_fillers: bool = False,
) -> set[str]:
    """
    Build a stopword set with optional customisation.

    Args:
        extra: Additional user-defined stopwords.
        include_seo_fillers: If True, also remove SEO_FILLER_WORDS.

    Returns:
        Combined set of stopwords.
    """
    result = set(STOP_WORDS)
    if include_seo_fillers:
        result |= SEO_FILLER_WORDS
    if extra:
        result |= {w.lower().strip() for w in extra if w.strip()}
    return result
