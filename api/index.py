import sys
import os
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# Inject project paths so `app.*` imports resolve correctly
# inside Vercel's serverless sandbox.
# ──────────────────────────────────────────────────────────────
_root = Path(__file__).resolve().parent.parent        # repo root
_backend = _root / "backend"                          # repo/backend/

for _p in [str(_root), str(_backend)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Expose the FastAPI ASGI application — Vercel looks for `app`
from app.main import app  # noqa: E402  (import after sys.path manipulation)

__all__ = ["app"]
