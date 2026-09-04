"""
PaySense Configuration Module
Loads environment variables using python-dotenv.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Anthropic Claude API configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Razorpay Test Mode credentials
RAZORPAY_TEST_KEY_ID = os.getenv("RAZORPAY_TEST_KEY_ID", "")
RAZORPAY_TEST_KEY_SECRET = os.getenv("RAZORPAY_TEST_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

# Twilio WhatsApp configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")

# SendGrid Email configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "")

def _resolve_database_path():
    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        return env_path
    # Vercel and AWS Lambda serverless read-only environments
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/paysense.db"
    # Test local filesystem writability
    try:
        test_file = BASE_DIR / ".write_test"
        test_file.touch()
        test_file.unlink()
        return str(BASE_DIR / "paysense.db")
    except Exception:
        return "/tmp/paysense.db"

# SQLite Database Path
DATABASE_PATH = _resolve_database_path()
