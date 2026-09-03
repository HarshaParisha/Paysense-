"""
PaySense Flask API Server
Receives Razorpay webhooks, delivers activity logs, serves recovery analytics,
and delivers the built single-page dashboard at / and /demo.
"""

from datetime import datetime, timezone
import hashlib
import hmac
import json
import os
from pathlib import Path
import threading
import time
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS
from audit import init_db, get_activity, get_report
from agent import process_failure
import config

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "client" / "dist"

app = Flask(
    __name__,
    static_folder=str(DIST_DIR) if DIST_DIR.exists() else None,
    static_url_path="",
)

# Enable CORS for all routes during development
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SQLite database schema and triggers on startup
init_db()


@app.route("/", methods=["GET"])
@app.route("/demo", methods=["GET"])
def serve_demo():
    """Serves the single-page React frontend dashboard from client/dist."""
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return send_from_directory(str(DIST_DIR), "index.html")
    return jsonify({
        "status": "online",
        "service": "paysense-api",
        "message": "Frontend not built yet. Run 'npm run build' inside the client folder.",
    }), 200


@app.route("/assets/<path:path>", methods=["GET"])
def serve_assets(path):
    """Serves compiled JS/CSS assets from client/dist/assets."""
    assets_dir = DIST_DIR / "assets"
    if (assets_dir / path).exists():
        return send_from_directory(str(assets_dir), path)
    return ("Asset not found", 404)


@app.route("/vite.svg", methods=["GET"])
def serve_icon():
    if (DIST_DIR / "vite.svg").exists():
        return send_from_directory(str(DIST_DIR), "vite.svg")
    return ("", 404)


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "timestamp": int(time.time()),
        "service": "paysense-api",
    }), 200


@app.route("/webhook/razorpay", methods=["POST"])
def razorpay_webhook():
    """
    Validates HMAC SHA-256 signature from X-Razorpay-Signature header.
    Parses payment.failed event and processes recovery in a background thread.
    """
    raw_body = request.get_data()
    provided_signature = request.headers.get("X-Razorpay-Signature", "")
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", config.RAZORPAY_WEBHOOK_SECRET)

    # If webhook secret is configured, enforce timing-safe HMAC SHA-256 verification
    if webhook_secret and not webhook_secret.startswith("webhook_secret_placeholder"):
        expected_signature = hmac.new(
            webhook_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, provided_signature):
            return jsonify({"error": "Invalid HMAC signature"}), 400

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return jsonify({"error": "Malformed JSON payload"}), 400

    event_type = payload.get("event")
    if event_type == "payment.failed":
        payment_entity = (
            payload.get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )
        if payment_entity:
            # Process recovery pipeline in a daemon background thread for instant response
            threading.Thread(
                target=process_failure,
                args=(payment_entity,),
                daemon=True,
            ).start()

    return jsonify({"status": "received", "event": event_type}), 200


@app.route("/api/activity", methods=["GET"])
def api_activity():
    """Returns the last 100 payment failure and recovery events."""
    activity = get_activity()
    return jsonify(activity), 200


@app.route("/api/report", methods=["GET"])
def api_report():
    """Returns aggregated performance and recovery metrics."""
    report = get_report()
    return jsonify(report), 200


@app.route("/api/export", methods=["GET"])
def api_export():
    """
    Returns the full audit log as a downloadable JSON file.
    Contains:
    - generated_at: ISO format timestamp
    - report: full aggregated metrics
    - events: complete activity list across all rows (no 100 limit)
    """
    report_data = get_report()
    all_events = get_activity(limit=None)

    export_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report": report_data,
        "events": all_events,
    }

    response = Response(
        json.dumps(export_data, indent=2),
        mimetype="application/json",
        headers={
            "Content-Disposition": "attachment; filename=paysense_audit_export.json"
        },
    )
    return response


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
