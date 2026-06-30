"""
Advanced text normalization for SEO analysis.

Handles Unicode normalization, smart quotes, dashes, accented characters,
and other typographic variants that would otherwise fragment keyword counts.
"""
from __future__ import annotations

import re
import unicodedata

# ── Smart quote / dash mappings ──────────────────────────────────────────
_UNICODE_REPLACEMENTS: dict[str, str] = {
    # Smart / curly quotes → straight
    "\u2018": "'",   # '
    "\u2019": "'",   # '
    "\u201a": "'",   # ‚
    "\u201b": "'",   # ‛
    "\u201c": '"',   # "
    "\u201d": '"',   # "
    "\u201e": '"',   # „
    "\u201f": '"',   # ‟
    "\u2032": "'",   # ′
    "\u2033": '"',   # ″
    # Dashes → hyphen
    "\u2013": "-",   # en dash –
    "\u2014": "-",   # em dash —
    "\u2015": "-",   # horizontal bar ―
    "\u2212": "-",   # minus sign −
    # Spaces
    "\u00a0": " ",   # non-breaking space
    "\u2002": " ",   # en space
    "\u2003": " ",   # em space
    "\u2009": " ",   # thin space
    "\u200a": " ",   # hair space
    "\u200b": "",    # zero-width space (remove)
    "\ufeff": "",    # BOM / zero-width no-break space
    # Ellipsis
    "\u2026": "...",
}

_RE_UNICODE_REPLACE = re.compile(
    "[" + re.escape("".join(_UNICODE_REPLACEMENTS.keys())) + "]"
)


def _replace_unicode(match: re.Match) -> str:
    return _UNICODE_REPLACEMENTS[match.group(0)]


# ── Apostrophe contraction cleanup ───────────────────────────────────────
# "seo's" → "seos", "don't" → "dont" — keeps tokens intact for density
_RE_APOSTROPHE = re.compile(r"['`]")

# ── Repeated punctuation ────────────────────────────────────────────────
_RE_REPEATED_PUNCT = re.compile(r"([!?.]){2,}")

# ── Accented character pattern (used when stripping accents) ─────────────
# We do NFD decomposition and remove combining marks.


def normalize_unicode(text: str) -> str:
    """
    Normalize Unicode text for consistent keyword matching.

    Steps:
      1. NFC normalization (canonical composition)
      2. Replace smart quotes, dashes, special spaces with ASCII equivalents
      3. Strip zero-width characters and BOM
      4. Collapse repeated punctuation (!!!! → !)
      5. Strip apostrophes to merge possessives (SEO's → SEOs)
    """
    # NFC first to compose accented chars
    text = unicodedata.normalize("NFC", text)

    # Replace smart typographic chars
    text = _RE_UNICODE_REPLACE.sub(_replace_unicode, text)

    # Collapse repeated punctuation
    text = _RE_REPEATED_PUNCT.sub(r"\1", text)

    # Remove apostrophes to merge possessives/contractions into single tokens
    text = _RE_APOSTROPHE.sub("", text)

    return text


def strip_accents(text: str) -> str:
    """
    Remove diacritical marks from characters.

    "café" → "cafe", "résumé" → "resume"

    Useful for normalizing keyword variants. Called optionally — some
    SEO analyses need to preserve accented characters for non-English text.
    """
    nfd = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")


def is_junk_token(token: str) -> bool:
    """
    Return True if a token is meaningless for SEO analysis.

    Catches single-character fragments, pure digits shorter than 2 chars,
    and tokens that are only punctuation/symbols after cleaning.
    """
    if len(token) <= 1:
        return True
    # Token is entirely non-alphanumeric
    if not any(ch.isalnum() for ch in token):
        return True
    return False
