"""
Production middleware stack.

- Request ID injection (correlation)
- Request timing
- Security headers
- Rate limiting (in-memory; swap to Redis in production)
- Global error handling
"""
from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("rankedtag.middleware")


# ── Request timing + logging ─────────────────────────────────────────────

class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Inject request ID, log request/response, measure duration."""

    async def dispatch(self, request: Request, call_next):
        request_id = uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        t0 = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled exception", extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
            })
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "request_id": request_id},
            )

        duration_ms = round((time.perf_counter() - t0) * 1000, 1)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"

        logger.info(
            "%s %s %s %sms",
            request.method, request.url.path, response.status_code, duration_ms,
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else "",
            },
        )
        return response


# ── Security headers ─────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add standard security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


# ── Rate limiting (in-memory — swap to Redis for multi-process) ──────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple sliding-window rate limiter per client IP."""

    def __init__(self, app, rpm: int = 60, burst: int = 10):
        super().__init__(app)
        self.rpm = rpm
        self.burst = burst
        self._windows: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Skip health checks
        if request.url.path in ("/health", "/health/deep"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = self._windows[client_ip]

        # Prune entries older than 60s
        window[:] = [t for t in window if now - t < 60]

        if len(window) >= self.rpm + self.burst:
            logger.warning("Rate limit exceeded for %s", client_ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again shortly."},
                headers={"Retry-After": "10"},
            )

        window.append(now)
        return await call_next(request)


# ── Wire all middleware ──────────────────────────────────────────────────

def install_middleware(app: FastAPI, *, rpm: int = 60, burst: int = 10) -> None:
    """Install the full production middleware stack (order matters — last added runs first)."""
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware, rpm=rpm, burst=burst)
    app.add_middleware(RequestTimingMiddleware)
