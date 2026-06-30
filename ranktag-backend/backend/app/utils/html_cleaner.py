"""
HTML content cleaning utilities for the extraction pipeline.

Provides targeted cleanup *before* trafilatura extraction and a
secondary pass *after* extraction to normalise text for keyword analysis.
"""
from __future__ import annotations

import re
from html import unescape


# Pre-compiled patterns
_RE_WHITESPACE = re.compile(r"[ \t]+")
_RE_BLANK_LINES = re.compile(r"\n{3,}")
_RE_LEADING_TRAILING = re.compile(r"^\s+|\s+$", re.MULTILINE)


def normalize_extracted_text(text: str) -> str:
    """
    Clean text that has already been extracted from HTML.

    Steps:
      1. Decode any remaining HTML entities
      2. Collapse runs of spaces / tabs on the same line
      3. Collapse 3+ consecutive newlines into 2
      4. Strip leading/trailing whitespace per line
      5. Strip leading/trailing whitespace overall
    """
    # Decode HTML entities (e.g. &amp; → &, &#8217; → ')
    text = unescape(text)

    # Collapse horizontal whitespace (preserve newlines)
    text = _RE_WHITESPACE.sub(" ", text)

    # Collapse excessive blank lines
    text = _RE_BLANK_LINES.sub("\n\n", text)

    # Trim each line
    text = _RE_LEADING_TRAILING.sub("", text)

    return text.strip()
