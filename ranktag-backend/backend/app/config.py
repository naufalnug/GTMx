"""
Production configuration via environment variables.

Uses pydantic-settings to validate and type-check all config at startup.
Falls back to sensible defaults for local dev.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, loaded from env vars or .env file."""

    # ── App ──
    app_env: str = "development"      # development | staging | production
    app_name: str = "RankedTag SEO Analyzer"
    app_version: str = "8.0.0"
    debug: bool = True
    log_level: str = "INFO"
    log_json: bool = False            # True in production for structured logging

    # ── Server ──
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1                  # gunicorn workers; set to (2 * CPU + 1) in prod
    allowed_origins: str = "*"        # comma-separated; tighten in prod

    # ── Redis ──
    redis_url: str = ""               # redis://localhost:6379/0 — empty = in-memory fallback
    cache_ttl: int = 3600             # seconds
    cache_max_entries: int = 50_000

    # ── Database (prepared, not required yet) ──
    database_url: str = ""            # postgresql://user:pass@host/db

    # ── Rate limiting ──
    rate_limit_rpm: int = 60          # requests per minute per IP
    rate_limit_burst: int = 10        # burst allowance

    # ── Security ──
    max_content_length: int = 500_000  # max text payload chars
    max_competitor_urls: int = 10
    request_timeout: int = 60         # seconds

    # ── NLP ──
    spacy_model: str = "en_core_web_sm"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return the cached singleton settings instance."""
    return Settings()
