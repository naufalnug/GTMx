"""
URL validation and SSRF prevention utilities.

Validates user-supplied URLs before the crawler fetches them,
blocking private IPs, unsupported protocols, and malformed input.
"""
from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urlparse


# Protocols we allow
_ALLOWED_SCHEMES: set[str] = {"http", "https"}

# Domains we refuse to crawl (expand as needed)
_BLOCKED_HOSTS: set[str] = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
}

# Content-Type prefixes that indicate an HTML page
_HTML_CONTENT_TYPES: tuple[str, ...] = (
    "text/html",
    "application/xhtml+xml",
)


@dataclass(frozen=True, slots=True)
class ValidationResult:
    """Outcome of URL validation."""
    valid: bool
    url: str = ""
    error_type: str = ""
    error_message: str = ""


def _is_private_ip(host: str) -> bool:
    """Return True if *host* resolves to a private / reserved IP range."""
    try:
        # Resolve hostname → IP(s) and check every result
        for info in socket.getaddrinfo(host, None, socket.AF_UNSPEC, socket.SOCK_STREAM):
            addr = info[4][0]
            ip = ipaddress.ip_address(addr)
            if ip.is_private or ip.is_reserved or ip.is_loopback or ip.is_link_local:
                return True
    except (socket.gaierror, ValueError, OSError):
        # DNS resolution failed — caller decides how to handle
        pass
    return False


def validate_url(raw: str) -> ValidationResult:
    """
    Validate and normalise a user-supplied URL.

    Checks:
      - non-empty input
      - supported scheme (http / https)
      - parseable hostname
      - not a blocked host literal
      - not resolving to a private IP (SSRF)

    Returns a ValidationResult. On success, ``result.url`` contains
    the normalised URL ready for fetching.
    """
    raw = (raw or "").strip()
    if not raw:
        return ValidationResult(
            valid=False,
            error_type="invalid_url",
            error_message="URL is required.",
        )

    # Prepend scheme if missing
    if not raw.startswith(("http://", "https://")):
        raw = "https://" + raw

    parsed = urlparse(raw)

    # ── Scheme check ──
    if parsed.scheme not in _ALLOWED_SCHEMES:
        return ValidationResult(
            valid=False,
            error_type="invalid_url",
            error_message=f"Unsupported protocol: {parsed.scheme}. Only HTTP/HTTPS allowed.",
        )

    # ── Hostname check ──
    host = parsed.hostname or ""
    if not host or "." not in host:
        return ValidationResult(
            valid=False,
            error_type="invalid_url",
            error_message="Invalid or missing hostname.",
        )

    if host in _BLOCKED_HOSTS:
        return ValidationResult(
            valid=False,
            error_type="blocked_url",
            error_message="Access to localhost / loopback addresses is not allowed.",
        )

    # ── SSRF: reject private IPs ──
    if _is_private_ip(host):
        return ValidationResult(
            valid=False,
            error_type="blocked_url",
            error_message="Access to private / internal network addresses is not allowed.",
        )

    return ValidationResult(valid=True, url=raw)


def is_html_content_type(content_type: str) -> bool:
    """Return True if the Content-Type header indicates an HTML page."""
    ct = (content_type or "").lower().split(";")[0].strip()
    return ct in _HTML_CONTENT_TYPES
