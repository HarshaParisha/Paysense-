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
from audit import init_db, get_activity, get_report, get_connection
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


@app.after_request
def add_security_and_caching_headers(response):
    """Adds standard security headers and optimal caching policies for production."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Static assets cache with immutable hash, HTML and APIs never stale
    if request.path.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif request.path in ["/", "/demo"] or request.path.endswith(".html"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


@app.errorhandler(404)
def spa_fallback(e):
    """SPA fallback: serve index.html for client-side routing on non-API paths."""
    if not request.path.startswith("/api/") and not request.path.startswith("/webhook/"):
        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return send_from_directory(str(DIST_DIR), "index.html")
    return jsonify({"error": "Not Found", "path": request.path}), 404


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


@app.route("/simulate", methods=["POST", "GET"])
@app.route("/api/simulate", methods=["POST", "GET"])
def api_simulate():
    """Generates a synthetic payment failure and triggers autonomous recovery."""
    import random
    categories = [
        ("BAD_REQUEST_ERROR", "INSUFFICIENT_FUNDS", "insufficient_funds"),
        ("GATEWAY_ERROR", "GATEWAY_TIMEOUT", "bank_timeout"),
        ("BAD_REQUEST_ERROR", "PAYMENT_FAILED", "upi_pin_error"),
        ("GATEWAY_ERROR", "NETWORK_ERROR", "network_dropout"),
        ("BAD_REQUEST_ERROR", "CARD_DECLINE", "card_decline"),
    ]
    code, desc, cat = random.choice(categories)
    sim_id = f"pay_sim_{int(time.time())}_{random.randint(100, 999)}"
    payment_entity = {
        "id": sim_id,
        "amount": random.randint(500, 8000) * 100,
        "currency": "INR",
        "method": "upi",
        "email": "customer.sim@example.com",
        "contact": "+919876543210",
        "error_code": code,
        "error_description": desc,
        "notes": {"name": "Simulated User"},
    }
    process_failure(payment_entity)
    return jsonify({"status": "simulated", "payment_id": sim_id, "amount_rupees": payment_entity["amount"] // 100}), 200


@app.route("/activity", methods=["GET"])
@app.route("/api/activity", methods=["GET"])
def api_activity():
    """Returns the last 100 payment failure and recovery events."""
    activity = get_activity()
    return jsonify(activity), 200


@app.route("/report", methods=["GET"])
@app.route("/api/report", methods=["GET"])
def api_report():
    """Returns aggregated performance and recovery metrics."""
    report = get_report()
    return jsonify(report), 200


@app.route("/export", methods=["GET"])
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


RECOVERY_HINTS = {
    "upi_pin_error": "wait 8 minutes and send WhatsApp nudge",
    "bank_timeout": "silent re-attempt after 5 minutes",
    "network_dropout": "send push notification after 12 minutes",
    "insufficient_funds": "schedule WhatsApp message next morning 9-11 AM IST",
    "card_decline": "send recovery email after 2 hours",
    "method_unsupported": "escalate to merchant immediately",
}


@app.route("/reasoning/<payment_id>", methods=["GET"])
@app.route("/api/reasoning/<payment_id>", methods=["GET"])
def api_reasoning(payment_id):
    """
    Returns diagnostic classification and reasoning for payment_id.
    Queries classifications table for matching row.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT payment_id, failure_category, confidence_score, llm_reasoning
            FROM classifications
            WHERE payment_id = ?
            ORDER BY id DESC LIMIT 1;
            """,
            (payment_id,),
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "no classification found"}), 404

        cat = row["failure_category"]
        hint = RECOVERY_HINTS.get(cat, "escalate to merchant immediately")

        return jsonify({
            "payment_id": row["payment_id"],
            "failure_category": cat,
            "confidence_score": float(row["confidence_score"]),
            "reasoning": row["llm_reasoning"] or "No reasoning recorded",
            "recovery_hint": hint,
        }), 200
    finally:
        conn.close()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
