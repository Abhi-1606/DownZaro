import sys
import os
from pathlib import Path

# Add project root and backend directory to PYTHONPATH
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
backend_dir = root_dir / "backend"

for candidate in [
    str(root_dir),
    str(backend_dir),
    str(current_dir),
    "/var/task",
    "/var/task/backend"
]:
    if os.path.exists(candidate) and candidate not in sys.path:
        sys.path.insert(0, candidate)

from app.main import app
