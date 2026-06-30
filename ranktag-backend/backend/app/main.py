"""
RankedTag Keyword Density Analyzer — FastAPI application.

Production-ready entrypoint with middleware, logging, and health checks.
"""
from __future__ import annotations

import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logging_config import setup_logging
from app.middleware import install_middleware

# ── Setup logging before anything else ──
_settings = get_settings()
setup_logging(level=_settings.log_level, json_format=_settings.log_json)

# ── App ──
app = FastAPI(
    title=_settings.app_name,
    version=_settings.app_version,
    description="Professional SEO keyword density analysis engine.",
    docs_url="/docs" if not _settings.is_production else None,
    redoc_url=None,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE"],
    allow_headers=["*"],
)

# ── Production middleware (timing, security headers, rate limiting) ──
install_middleware(app, rpm=_settings.rate_limit_rpm, burst=_settings.rate_limit_burst)

# ── Routes ──
from app.routes.analyze import router as analyze_router           # noqa: E402
from app.routes.analyze_url import router as analyze_url_router   # noqa: E402
from app.routes.analyze_advanced import router as adv_router      # noqa: E402
from app.routes.session import router as session_router           # noqa: E402
from app.routes.score import router as score_router               # noqa: E402
from app.routes.export import router as export_router             # noqa: E402
from app.routes.competitor import router as competitor_router      # noqa: E402
from app.routes.websocket import router as ws_router              # noqa: E402

app.include_router(analyze_router)
app.include_router(analyze_url_router)
app.include_router(adv_router)
app.include_router(session_router)
app.include_router(score_router)
app.include_router(export_router)
app.include_router(competitor_router)
app.include_router(ws_router)

# ── Startup timestamp ──
_start_time = time.time()


# ── Health checks ──
@app.get("/health")
def health() -> dict:
    """Lightweight health check for load balancers."""
    return {"status": "ok", "engine": f"rankedtag-v{_settings.app_version}"}


@app.get("/health/deep")
def health_deep() -> dict:
    """Deep health check with dependency status."""
    from app.services.cache_service import get_global_cache
    from app.services.session_service import active_session_count

    uptime_s = round(time.time() - _start_time)

    # Redis check
    redis_ok = False
    if _settings.redis_url:
        try:
            import redis
            r = redis.from_url(_settings.redis_url, socket_timeout=2)
            r.ping()
            redis_ok = True
        except Exception:
            pass

    return {
        "status": "ok",
        "env": _settings.app_env,
        "version": _settings.app_version,
        "uptime_seconds": uptime_s,
        "sessions": {
            "active": active_session_count(),
            "cache": get_global_cache().stats(),
        },
        "redis": {
            "configured": bool(_settings.redis_url),
            "connected": redis_ok,
        },
        "database": {
            "configured": bool(_settings.database_url),
        },
    }
