import sys
from pathlib import Path

# Add project root directory to sys.path so app, audit, config, etc. are importable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app import app

# Export app for Vercel WSGI serverless runtime
app = app
