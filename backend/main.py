import sys
from pathlib import Path

# Ensure root and backend directories are in PYTHONPATH for Vercel
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent

for path in [str(project_root), str(current_dir)]:
    if path not in sys.path:
        sys.path.insert(0, path)

from backend.app.main import app
