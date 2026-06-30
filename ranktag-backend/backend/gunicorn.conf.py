"""
Gunicorn production configuration.

Run with: gunicorn -c gunicorn.conf.py app.main:app
"""
import multiprocessing
import os

# ── Bind ──
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# ── Workers ──
# Rule of thumb: (2 * CPU cores) + 1 for I/O-bound workloads
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_tmp_dir = "/dev/shm"  # faster health checks

# ── Timeouts ──
timeout = 120           # kill worker after 120s of silence
graceful_timeout = 30   # 30s grace for in-flight requests on restart
keepalive = 5

# ── Limits ──
max_requests = 2000           # restart worker after N requests (prevents memory leaks)
max_requests_jitter = 200     # randomize to avoid all workers restarting at once

# ── Logging ──
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()

# ── Process naming ──
proc_name = "rankedtag-api"

# ── Preload ──
preload_app = True  # load app once, fork into workers (saves memory)
