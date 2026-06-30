"""
HTML metadata extraction service.

Parses an HTML document with BeautifulSoup and extracts SEO-relevant
metadata: title, description, canonical, robots, headings, language,
and Open Graph tags.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from bs4 import BeautifulSoup, Tag


@dataclass(slots=True)
class PageMetadata:
    """Structured metadata extracted from an HTML page."""
    title: str = ""
    meta_description: str = ""
    canonical: str = ""
    robots: str = ""
    language: str = ""
    h1_tags: list[str] = field(default_factory=list)
    h2_tags: list[str] = field(default_factory=list)
    og_title: str = ""
    og_description: str = ""


def _meta_content(soup: BeautifulSoup, **attrs: str) -> str:
    """Get the ``content`` attribute of a <meta> tag matching *attrs*."""
    tag = soup.find("meta", attrs=attrs)
    if isinstance(tag, Tag):
        return (tag.get("content") or "").strip()  # type: ignore[return-value]
    return ""


def extract_metadata(html: str) -> PageMetadata:
    """
    Extract SEO metadata from raw HTML.

    Uses the ``lxml`` parser for speed on large documents. Falls back to
    ``html.parser`` if lxml is not installed.
    """
    try:
        soup = BeautifulSoup(html, "lxml")
    except Exception:
        soup = BeautifulSoup(html, "html.parser")

    # ── Title ──
    title = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)

    # ── Meta tags ──
    meta_description = _meta_content(soup, name="description")
    robots = _meta_content(soup, name="robots")

    # ── Canonical ──
    canonical = ""
    link_canon = soup.find("link", attrs={"rel": "canonical"})
    if isinstance(link_canon, Tag):
        canonical = (link_canon.get("href") or "").strip()  # type: ignore[assignment]

    # ── Language ──
    language = ""
    html_tag = soup.find("html")
    if isinstance(html_tag, Tag):
        language = (html_tag.get("lang") or "").strip()  # type: ignore[assignment]

    # ── Headings ──
    h1_tags = [tag.get_text(strip=True) for tag in soup.find_all("h1") if tag.get_text(strip=True)]
    h2_tags = [tag.get_text(strip=True) for tag in soup.find_all("h2") if tag.get_text(strip=True)]

    # ── Open Graph ──
    og_title = _meta_content(soup, property="og:title")
    og_description = _meta_content(soup, property="og:description")

    return PageMetadata(
        title=title,
        meta_description=meta_description,
        canonical=canonical,
        robots=robots,
        language=language,
        h1_tags=h1_tags[:20],   # cap to avoid noise
        h2_tags=h2_tags[:50],
        og_title=og_title,
        og_description=og_description,
    )
