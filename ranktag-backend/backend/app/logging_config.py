"""
Structured logging configuration.

In development: human-readable colored output.
In production (LOG_JSON=true): JSON lines for log aggregators.
"""
from __future__ import annotations

import logging
import sys
import time
import json
from typing import Any


class JsonFormatter(logging.Formatter):
    """Emit one JSON object per log line — Datadog / ELK / CloudWatch compatible."""

    def format(self, record: logging.LogRecord) -> str:
        log: dict[str, Any] = {
            "ts": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info and record.exc_info[1]:
            log["exception"] = self.formatException(record.exc_info)
        # Extra fields attached by middleware
        for key in ("request_id", "method", "path", "status", "duration_ms", "client_ip"):
            val = getattr(record, key, None)
            if val is not None:
                log[key] = val
        return json.dumps(log, default=str)


def setup_logging(level: str = "INFO", json_format: bool = False) -> None:
    """Configure the root logger."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers
    for h in root.handlers[:]:
        root.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    if json_format:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
            datefmt="%H:%M:%S",
        ))
    root.addHandler(handler)

    # Quiet noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("trafilatura").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
