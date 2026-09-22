import sys
from pathlib import Path

# Add project root and backend directory to PYTHONPATH
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for path in [str(root_dir), str(backend_dir)]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    # pyrefly: ignore [missing-import]
    from app.main import app
except ImportError:
    from backend.app.main import app
