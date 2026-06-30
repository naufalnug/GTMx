"""
HTTP fetching service.

Fetches webpage HTML via httpx with proper headers, redirect handling,
timeouts, and error classification.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import httpx

from app.utils.validators import is_html_content_type, validate_url


_USER_AGENT = (
    "Mozilla/5.0 (compatible; RankedTagBot/2.0; +https://rankedtag.com/bot)"
)

_DEFAULT_HEADERS: dict[str, str] = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

# Timeouts: connect 10s, read 20s, total 30s
_TIMEOUT = httpx.Timeout(connect=10.0, read=20.0, pool=10.0, write=10.0)


@dataclass(slots=True)
class CrawlResult:
    """Outcome of an HTTP fetch."""
    success: bool
    html: str = ""
    url: str = ""
    final_url: str = ""
    status_code: int = 0
    content_type: str = ""
    error_type: str = ""
    error_message: str = ""
    headers: dict[str, str] = field(default_factory=dict)


async def fetch_url(url: str) -> CrawlResult:
    """
    Validate and fetch a URL, returning the raw HTML.

    Handles:
      - URL validation + SSRF blocking (via validators)
      - Redirect following (up to 5 hops)
      - Timeout / connection / SSL errors
      - Non-HTML content type rejection
    """
    # ── Validate ──
    vr = validate_url(url)
    if not vr.valid:
        return CrawlResult(
            success=False,
            url=url,
            error_type=vr.error_type,
            error_message=vr.error_message,
        )

    normalized_url = vr.url

    # ── Fetch ──
    try:
        async with httpx.AsyncClient(
            headers=_DEFAULT_HEADERS,
            timeout=_TIMEOUT,
            follow_redirects=True,
            max_redirects=5,
        ) as client:
            response = await client.get(normalized_url)
    except httpx.TimeoutException:
        return CrawlResult(
            success=False,
            url=normalized_url,
            error_type="timeout_error",
            error_message="Request timed out after 30 seconds.",
        )
    except httpx.ConnectError:
        return CrawlResult(
            success=False,
            url=normalized_url,
            error_type="connection_error",
            error_message="Could not connect to the server.",
        )
    except httpx.TooManyRedirects:
        return CrawlResult(
            success=False,
            url=normalized_url,
            error_type="redirect_error",
            error_message="Too many redirects (limit: 5).",
        )
    except Exception as exc:
        # Covers SSL errors, protocol errors, etc.
        return CrawlResult(
            success=False,
            url=normalized_url,
            error_type="fetch_error",
            error_message=str(exc)[:300],
        )

    # ── Status code check ──
    if response.status_code >= 400:
        return CrawlResult(
            success=False,
            url=normalized_url,
            final_url=str(response.url),
            status_code=response.status_code,
            error_type="http_error",
            error_message=f"Server returned HTTP {response.status_code}.",
        )

    # ── Content type check ──
    ct = response.headers.get("content-type", "")
    if not is_html_content_type(ct):
        return CrawlResult(
            success=False,
            url=normalized_url,
            final_url=str(response.url),
            status_code=response.status_code,
            content_type=ct,
            error_type="content_type_error",
            error_message=f"Expected HTML but got: {ct}",
        )

    return CrawlResult(
        success=True,
        html=response.text,
        url=normalized_url,
        final_url=str(response.url),
        status_code=response.status_code,
        content_type=ct,
        headers={k.lower(): v for k, v in response.headers.items()},
    )
