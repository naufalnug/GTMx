"""Shared test fixtures."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """FastAPI test client — no real HTTP, no server startup."""
    return TestClient(app)


@pytest.fixture
def sample_text():
    return (
        "Search engine optimization is essential for modern websites. "
        "The best SEO tools help marketers analyze keywords and track rankings.\n\n"
        "Keyword research is the foundation of any SEO strategy. "
        "The best keyword research tools discover high-volume keywords.\n\n"
        "Technical SEO tools identify crawling issues and broken links."
    )
