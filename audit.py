"""
PaySense Audit & Database Layer
Manages all reads and writes to the append-only SQLite database.
"""

import hashlib
import os
import sqlite3
import time
from pathlib import Path
from config import DATABASE_PATH

# Predefined failure categories in consistent display order
ALL_FAILURE_CATEGORIES = [
    "upi_pin_error",
    "bank_timeout",
    "network_dropout",
    "insufficient_funds",
    "card_decline",
    "method_unsupported",
]


def get_connection():
    """Return a thread-safe SQLite connection with a 10s timeout."""
    db_path = os.getenv("DATABASE_PATH", DATABASE_PATH)
    conn = sqlite3.connect(db_path, check_same_thread=False, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initialize database from schema.sql and configure delete prevention triggers."""
    base_dir = Path(__file__).resolve().parent
    db_path = Path(os.getenv("DATABASE_PATH", DATABASE_PATH))

    # Fast bootstrap on serverless/fresh instances: copy seed.db if destination does not exist
    seed_db = base_dir / "seed.db"
    if not db_path.exists() and seed_db.exists():
        try:
            import shutil
            db_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(seed_db, db_path)
            return
        except Exception as e:
            print(f"Warning: unable to copy seed.db ({e}), falling back to schema.sql")

    schema_path = base_dir / "schema.sql"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    try:
        conn.executescript(schema_sql)
        # Ensure customer_display_name column exists for migrations
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(failed_payments);")
        columns = [col["name"] for col in cursor.fetchall()]
        if "customer_display_name" not in columns:
            cursor.execute("ALTER TABLE failed_payments ADD COLUMN customer_display_name TEXT;")
        conn.commit()

        # Check if database is empty; if so, populate initial records
        cursor.execute("SELECT COUNT(*) AS total FROM failed_payments;")
        row = cursor.fetchone()
        count = row["total"] if row else 0
        if count == 0:
            try:
                from data_generator import generate_synthetic_payments
                generate_synthetic_payments(50)
            except Exception as gen_err:
                print(f"Auto-generate fallback note: {gen_err}")
    finally:
        conn.close()


def write_payment(payment_dict):
    """
    Insert a row into failed_payments.
    Hashes customer_identifier with SHA-256 before storage for privacy.
    Stores customer_display_name (e.g. 'Rahul S.') for merchant-facing demo.
    """
    conn = get_connection()
    try:
        raw_cust = payment_dict.get("customer_identifier") or ""
        # Hash with SHA-256 if not already a 64-character hex hash
        if len(raw_cust) == 64 and all(c in "0123456789abcdefABCDEF" for c in raw_cust):
            hashed_cust = raw_cust.lower()
        else:
            hashed_cust = hashlib.sha256(raw_cust.encode("utf-8")).hexdigest()

        payment_id = payment_dict.get("id") or payment_dict.get("razorpay_payment_id")
        received_at = payment_dict.get("received_at") or int(time.time())
        display_name = payment_dict.get("customer_display_name") or "Customer"

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR IGNORE INTO failed_payments
            (id, razorpay_payment_id, amount_rupees, payment_method, customer_identifier, customer_display_name, error_code, error_description, received_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payment_id,
                payment_dict.get("razorpay_payment_id", payment_id),
                int(payment_dict.get("amount_rupees", 0)),
                payment_dict.get("payment_method", "unknown"),
                hashed_cust,
                display_name,
                payment_dict.get("error_code", ""),
                payment_dict.get("error_description", ""),
                int(received_at),
            ),
        )
        conn.commit()
        return payment_id
    finally:
        conn.close()


def write_classification(classification_dict):
    """Insert a row into classifications."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        classified_at = classification_dict.get("classified_at") or int(time.time())
        cursor.execute(
            """
            INSERT INTO classifications
            (payment_id, failure_category, confidence_score, llm_reasoning, classified_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                classification_dict["payment_id"],
                classification_dict["failure_category"],
                float(classification_dict.get("confidence_score", 0.0)),
                classification_dict.get("llm_reasoning", ""),
                int(classified_at),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def write_action(action_dict):
    """Insert a row into recovery_actions."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        scheduled_at = action_dict.get("scheduled_at") or int(time.time())
        executed_at = action_dict.get("executed_at")
        cursor.execute(
            """
            INSERT INTO recovery_actions
            (payment_id, attempt_number, strategy, channel, scheduled_at, executed_at, message_content, delivery_status, outcome)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                action_dict["payment_id"],
                int(action_dict.get("attempt_number", 1)),
                action_dict.get("strategy", ""),
                action_dict.get("channel", "escalate"),
                int(scheduled_at),
                int(executed_at) if executed_at is not None else None,
                action_dict.get("message_content", ""),
                action_dict.get("delivery_status", "skipped"),
                action_dict.get("outcome", "no_response"),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def update_action(action_id, executed_at=None, delivery_status=None, outcome=None):
    """Update execution details of an existing recovery action."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        now = int(time.time()) if executed_at is None else int(executed_at)
        cursor.execute(
            """
            UPDATE recovery_actions
            SET executed_at = ?, delivery_status = COALESCE(?, delivery_status), outcome = COALESCE(?, outcome)
            WHERE id = ?
            """,
            (now, delivery_status, outcome, action_id),
        )
        conn.commit()
    finally:
        conn.close()


def write_stop(payment_id, stop_reason, stopped_at=None):
    """Insert a row into stop_events."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        timestamp = int(time.time()) if stopped_at is None else int(stopped_at)
        cursor.execute(
            """
            INSERT INTO stop_events (payment_id, stop_reason, stopped_at)
            VALUES (?, ?, ?)
            """,
            (payment_id, stop_reason, timestamp),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_activity(limit: int | None = 100):
    """
    Returns the events across all four tables joined on payment_id
    ordered by the most recent timestamp, serialized as a list of dictionaries.
    If limit is None or <= 0, returns all rows.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        limit_clause = f"LIMIT {int(limit)}" if limit and limit > 0 else ""
        # Query joining failed_payments, latest classification, latest action, and latest stop_event
        query = f"""
        SELECT
            fp.id AS payment_id,
            fp.razorpay_payment_id,
            fp.amount_rupees,
            fp.payment_method,
            fp.customer_identifier,
            fp.customer_display_name,
            fp.error_code,
            fp.error_description,
            fp.received_at,
            c.failure_category,
            c.confidence_score,
            c.llm_reasoning,
            c.classified_at,
            ra.id AS action_id,
            ra.attempt_number,
            ra.strategy,
            ra.channel,
            ra.scheduled_at,
            ra.executed_at,
            ra.message_content,
            ra.delivery_status,
            ra.outcome,
            se.stop_reason,
            se.stopped_at,
            COALESCE(se.stopped_at, ra.executed_at, ra.scheduled_at, c.classified_at, fp.received_at) AS latest_timestamp
        FROM failed_payments fp
        LEFT JOIN (
            SELECT payment_id, failure_category, confidence_score, llm_reasoning, classified_at
            FROM classifications
            WHERE id IN (SELECT MAX(id) FROM classifications GROUP BY payment_id)
        ) c ON fp.id = c.payment_id
        LEFT JOIN (
            SELECT id, payment_id, attempt_number, strategy, channel, scheduled_at, executed_at, message_content, delivery_status, outcome
            FROM recovery_actions
            WHERE id IN (SELECT MAX(id) FROM recovery_actions GROUP BY payment_id)
        ) ra ON fp.id = ra.payment_id
        LEFT JOIN (
            SELECT payment_id, stop_reason, stopped_at
            FROM stop_events
            WHERE id IN (SELECT MAX(id) FROM stop_events GROUP BY payment_id)
        ) se ON fp.id = se.payment_id
        ORDER BY latest_timestamp DESC
        {limit_clause};
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        events = []
        for row in rows:
            d = dict(row)
            # Determine high-level current_status for UI
            if d.get("outcome") == "resolved":
                status = "Recovered"
            elif d.get("failure_category") == "method_unsupported" or d.get("channel") == "escalate":
                status = "Escalated"
            elif d.get("stop_reason") is not None:
                status = "Stopped"
            else:
                status = "Pending"

            d["current_status"] = status
            d["timestamp"] = d["latest_timestamp"]
            events.append(d)

        return events
    finally:
        conn.close()


def get_report():
    """
    Runs aggregation queries and returns a dictionary with keys:
    - total_processed
    - total_attempts
    - total_recovered
    - total_at_risk_rupees
    - total_revenue_recovered_rupees
    - category_breakdown (list of failure_category, attempts, recovered, recovery_rate_percent)
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Total failures processed
        cursor.execute("SELECT COUNT(*) AS total FROM failed_payments;")
        total_processed = cursor.fetchone()["total"]

        # Total revenue at risk (sum of all failed payments)
        cursor.execute("SELECT COALESCE(SUM(amount_rupees), 0) AS at_risk FROM failed_payments;")
        total_at_risk_rupees = cursor.fetchone()["at_risk"]

        # Total recovery attempts (excluding skipped placeholder/escalate if unattempted)
        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM recovery_actions
            WHERE delivery_status IN ('sent', 'failed') OR executed_at IS NOT NULL;
            """
        )
        total_attempts = cursor.fetchone()["total"]

        # Total successfully recovered payments
        cursor.execute(
            """
            SELECT COUNT(DISTINCT payment_id) AS total
            FROM recovery_actions
            WHERE outcome = 'resolved';
            """
        )
        total_recovered = cursor.fetchone()["total"]

        # Total revenue recovered
        cursor.execute(
            """
            SELECT COALESCE(SUM(fp.amount_rupees), 0) AS total_revenue
            FROM failed_payments fp
            WHERE fp.id IN (
                SELECT DISTINCT payment_id FROM recovery_actions WHERE outcome = 'resolved'
            );
            """
        )
        total_revenue_recovered_rupees = cursor.fetchone()["total_revenue"]

        # Category breakdown
        breakdown = []
        for cat in ALL_FAILURE_CATEGORIES:
            cursor.execute(
                """
                SELECT
                    COUNT(ra.id) AS attempts,
                    SUM(CASE WHEN ra.outcome = 'resolved' THEN 1 ELSE 0 END) AS recovered
                FROM classifications c
                LEFT JOIN recovery_actions ra ON c.payment_id = ra.payment_id
                    AND (ra.delivery_status IN ('sent', 'failed') OR ra.executed_at IS NOT NULL)
                WHERE c.failure_category = ?;
                """,
                (cat,),
            )
            stats = cursor.fetchone()
            attempts = stats["attempts"] or 0
            recovered = stats["recovered"] or 0
            rate = round((recovered / attempts * 100.0), 1) if attempts > 0 else 0.0

            breakdown.append({
                "failure_category": cat,
                "attempts": attempts,
                "recovered": recovered,
                "recovery_rate_percent": rate,
            })

        return {
            "total_processed": total_processed,
            "total_attempts": total_attempts,
            "total_recovered": total_recovered,
            "total_at_risk_rupees": total_at_risk_rupees,
            "total_revenue_recovered_rupees": total_revenue_recovered_rupees,
            "category_breakdown": breakdown,
        }
    finally:
        conn.close()
