"""
Text cleaning utilities for SEO keyword analysis.

Pipeline:
  1. Strip HTML tags
  2. Remove special characters / punctuation
  3. Optionally remove numbers
  4. Normalize whitespace
  5. Lowercase
"""
from __future__ import annotations

import re

# Pre-compiled patterns for performance on large texts
_RE_HTML_TAGS = re.compile(r"<[^>]+>")
_RE_HTML_ENTITIES = re.compile(r"&[a-zA-Z]+;|&#\d+;")
_RE_URLS = re.compile(r"https?://\S+|www\.\S+")
_RE_EMAILS = re.compile(r"\S+@\S+\.\S+")
_RE_SPECIAL = re.compile(r"[^\w\s]", re.UNICODE)
_RE_NUMBERS = re.compile(r"\b\d+\b")
_RE_WHITESPACE = re.compile(r"\s+")


def clean_text(
    raw: str,
    *,
    remove_numbers: bool = False,
) -> str:
    """
    Clean raw text for keyword analysis.

    Args:
        raw: Input text (may contain HTML, special chars, etc.)
        remove_numbers: If True, strip standalone numeric tokens.

    Returns:
        Cleaned, lowercased, whitespace-normalised string.
    """
    text = raw

    # Strip HTML
    text = _RE_HTML_TAGS.sub(" ", text)
    text = _RE_HTML_ENTITIES.sub(" ", text)

    # Strip URLs and emails (noise for keyword density)
    text = _RE_URLS.sub(" ", text)
    text = _RE_EMAILS.sub(" ", text)

    # Lowercase
    text = text.lower()

    # Remove punctuation / special characters (keep Unicode letters + digits)
    text = _RE_SPECIAL.sub(" ", text)

    # Optionally strip standalone numbers
    if remove_numbers:
        text = _RE_NUMBERS.sub(" ", text)

    # Collapse whitespace
    text = _RE_WHITESPACE.sub(" ", text).strip()

    return text
