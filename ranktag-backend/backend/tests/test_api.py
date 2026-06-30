"""API integration tests — all endpoints."""
from __future__ import annotations


class TestHealth:
    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health_deep(self, client):
        r = client.get("/health/deep")
        assert r.status_code == 200
        data = r.json()
        assert "uptime_seconds" in data
        assert "sessions" in data


class TestAnalyze:
    def test_basic_analysis(self, client, sample_text):
        r = client.post("/analyze", json={"text": sample_text})
        assert r.status_code == 200
        data = r.json()
        assert data["total_words"] > 0
        assert len(data["keywords"]["1gram"]) > 0

    def test_empty_text_rejected(self, client):
        r = client.post("/analyze", json={"text": ""})
        assert r.status_code == 422  # pydantic validation

    def test_ngram_tiers(self, client, sample_text):
        r = client.post("/analyze", json={"text": sample_text, "min_frequency": 1, "top_n": 50})
        data = r.json()
        for gram in ("1gram", "2gram", "3gram"):
            assert gram in data["keywords"]

    def test_keyword_structure(self, client, sample_text):
        r = client.post("/analyze", json={"text": sample_text, "min_frequency": 1})
        kw = r.json()["keywords"]["1gram"][0]
        assert "keyword" in kw
        assert "count" in kw
        assert "density" in kw


class TestScore:
    def test_scoring(self, client, sample_text):
        r = client.post("/score", json={"text": sample_text})
        assert r.status_code == 200
        data = r.json()
        assert 0 <= data["overall_score"] <= 100
        assert data["grade"] in ("A+", "A", "B", "C", "D", "F")
        assert len(data["category_scores"]) == 6
        assert data["readability"]["flesch_reading_ease"] >= 0

    def test_scoring_presets(self, client, sample_text):
        for preset in ("blog", "landing", "ecommerce"):
            r = client.post("/score", json={"text": sample_text, "preset": preset})
            assert r.status_code == 200


class TestSession:
    def test_session_lifecycle(self, client, sample_text):
        # Create
        r = client.post("/session/create")
        assert r.status_code == 200
        sid = r.json()["session_id"]

        # Analyze
        r = client.post("/session/analyze", json={
            "session_id": sid, "content": sample_text,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["statistics"]["total_words"] > 0
        assert data["processing"]["total_processing_ms"] >= 0

        # Same content — should be fast (0 reprocessed)
        r = client.post("/session/analyze", json={
            "session_id": sid, "content": sample_text,
        })
        assert r.json()["processing"]["reprocessed_blocks"] == 0

        # Reset
        r = client.post("/session/reset", json={"session_id": sid})
        assert r.json()["reset"] is True

        # Delete
        r = client.delete(f"/session/{sid}")
        assert r.json()["deleted"] is True

    def test_expired_session(self, client):
        r = client.post("/session/analyze", json={
            "session_id": "nonexistent", "content": "test",
        })
        assert r.status_code == 404


class TestExport:
    def test_csv_export(self, client, sample_text):
        r = client.post("/export/csv", json={
            "text": sample_text, "total_words": 50, "keywords": {},
        })
        assert r.status_code == 200
        assert "text/csv" in r.headers["content-type"]

    def test_pdf_export(self, client, sample_text):
        r = client.post("/export/pdf", json={
            "text": sample_text, "total_words": 50, "keywords": {},
        })
        assert r.status_code == 200
        assert r.content[:5] == b"%PDF-"
