"""
PaySense One-Command Startup Script
Verifies environment, bootstraps database, compiles frontend assets if needed,
and launches the unified Flask application.
"""

import os
from pathlib import Path
import subprocess
import sys
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

REQUIRED_ENV_VARS = [
    "ANTHROPIC_API_KEY",
    "RAZORPAY_TEST_KEY_ID",
    "RAZORPAY_TEST_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "SENDGRID_API_KEY",
    "SENDGRID_FROM_EMAIL",
    "DATABASE_PATH",
]


def check_environment():
    """Validates that required environment variables are configured."""
    print("[1/4] Checking environment variables...")
    missing = []
    for var in REQUIRED_ENV_VARS:
        val = os.getenv(var)
        if not val or val.strip().endswith("_placeholder"):
            missing.append(var)

    if missing:
        print("[WARNING] The following environment variables are missing or using placeholder values:")
        for var in missing:
            print(f"  - {var}")
        print("  (System will operate using resilient local fallback heuristics for unconfigured external services.)")
    else:
        print("  All environment variables are properly set.")


def check_database():
    """Populates database with synthetic data if empty."""
    print("[2/4] Checking database records...")
    from audit import init_db, get_connection
    init_db()

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM failed_payments;")
        count = cursor.fetchone()["total"]
        if count == 0:
            print("  Database is empty. Generating 50 synthetic merchant payment failure events...")
            res = subprocess.run([sys.executable, "data_generator.py"], cwd=str(BASE_DIR), check=True)
        else:
            print(f"  Database already populated with {count} payment records.")
    finally:
        conn.close()


def check_frontend_build():
    """Builds React client if client/dist is missing or older than client/src."""
    print("[3/4] Checking frontend build...")
    client_dir = BASE_DIR / "client"
    dist_dir = client_dir / "dist"
    src_dir = client_dir / "src"

    needs_build = False
    if not dist_dir.exists() or not (dist_dir / "index.html").exists():
        needs_build = True
    else:
        dist_mtime = (dist_dir / "index.html").stat().st_mtime
        # Check if any source file is newer than dist
        for src_file in src_dir.rglob("*"):
            if src_file.is_file() and src_file.stat().st_mtime > dist_mtime:
                needs_build = True
                break

    if needs_build:
        print("  Building React frontend assets in client/dist...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "run", "build"], cwd=str(client_dir), check=True, shell=True)
        print("  Frontend build complete.")
    else:
        print("  Frontend assets are up to date.")


def start_server():
    """Starts the Flask server."""
    print("[4/4] Starting PaySense unified server on http://0.0.0.0:5000...")
    print("  Dashboard accessible at: http://127.0.0.1:5000")
    print("  Demo route accessible at: http://127.0.0.1:5000/demo")
    from app import app
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    check_environment()
    check_database()
    check_frontend_build()
    start_server()
