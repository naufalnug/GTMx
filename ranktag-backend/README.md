# RankedTag SEO Analyzer — Backend

Faithful reproduction of the **backend** of [vekcodes/ranktag-website](https://github.com/vekcodes/ranktag-website): the FastAPI keyword-density / SEO analysis service (`backend/` in the source). The Vite frontend, the parallel Vercel serverless JS in `api/`, and `_legacy/` are out of scope and not reproduced.

## Structure (mirrors the source)

```
ranktag-backend/
  backend/              # FastAPI service (== source `backend/`)
    app/
      config.py  main.py  middleware.py  logging_config.py
      models/  routes/  services/  utils/
    tests/
    gunicorn.conf.py
    requirements.txt
    run.py
    .env.example
  nginx/default.conf    # reverse proxy (== source `nginx/`)
  README.md
```

## Stack

- **Python 3.13**, **FastAPI 0.115.0**, **Pydantic 2.9.2** + pydantic-settings
- **gunicorn** (UvicornWorker) for prod, **uvicorn** reload for dev
- **Redis** optional cache/session store — falls back to in-memory when `REDIS_URL` is empty
- NLP/scraping: **spaCy**, **NLTK**, **BeautifulSoup/lxml/trafilatura**; **reportlab** for PDF export
- **No SQL database / ORM / migrations** — `DATABASE_URL` is prepared in config but unused by the current backend (only surfaced in `/health/deep`), so there is nothing to migrate or seed.

## Run

```bash
cd ranktag-backend/backend
python -m venv .venv && . .venv/Scripts/activate    # (.venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('stopwords')"
cp .env.example .env                                 # placeholders only; edit if needed

python run.py                                        # dev: uvicorn on :8000 (reload)
# prod: gunicorn -c gunicorn.conf.py app.main:app
```

- API + docs: http://localhost:8000 / http://localhost:8000/docs
- Optional reverse proxy: run nginx with `nginx/default.conf` (upstream `127.0.0.1:8000`) to expose `/api`, `/ws/analyze`, `/health`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/analyze` | Keyword-density analysis of raw text |
| POST | `/analyze-url` | Fetch + analyze a live URL |
| POST | `/analyze-advanced` | Advanced/contextual analysis |
| POST | `/score` | SEO scoring |
| POST | `/competitor/analyze` | Competitor keyword-gap analysis |
| POST | `/export/csv` · `/export/pdf` | Export results |
| POST | `/session/create` · `/session/analyze` · `/session/reset` | Session lifecycle |
| GET | `/session/count` · DELETE `/session/{id}` | Session management |
| WS | `/ws/analyze` | Real-time incremental analysis |
| GET | `/health` · `/health/deep` | Health checks |

Request/response shapes live in `app/models/` (Pydantic). CORS, rate limiting, timing, and security headers are in `app/middleware.py`; env-driven config in `app/config.py`.

## Notes / deviations from source

- **No Docker**: the upstream `Dockerfile` and `docker-compose.yml` are intentionally omitted; run directly with uvicorn/gunicorn as above.
- `nginx/default.conf` keeps the `/api`, `/ws`, `/health` proxy rules; upstream repointed to `127.0.0.1:8000` (local backend) and the static-frontend `location /` repointed to the API.
- No secrets exist in the source config; `.env.example` is non-secret config and `.env` is gitignored.
