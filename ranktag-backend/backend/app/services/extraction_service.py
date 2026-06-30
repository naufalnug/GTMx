"""
Main content extraction service.

Uses trafilatura to pull the readable article / page body from raw HTML,
then normalises the text for keyword analysis.

Trafilatura handles removal of navigation, sidebars, footers, ads,
cookie banners, and other boilerplate automatically.
"""
from __future__ import annotations

from typing import Optional

import trafilatura

from app.utils.html_cleaner import normalize_extracted_text


def extract_content(html: str, url: str = "") -> Optional[str]:
    """
    Extract the main readable content from an HTML document.

    Args:
        html: Raw HTML string.
        url:  Original URL (helps trafilatura resolve relative links).

    Returns:
        Cleaned plain-text content, or None if extraction fails.
    """
    # trafilatura.extract does the heavy lifting:
    #   - Removes scripts, styles, nav, footer, sidebar, ads
    #   - Identifies the main content area
    #   - Returns plain text
    text = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_tables=True,
        include_links=False,
        include_images=False,
        favor_recall=True,      # prefer more content over precision
        deduplicate=True,       # drop repeated boilerplate paragraphs
    )

    if not text:
        return None

    # Secondary normalization pass
    return normalize_extracted_text(text)
