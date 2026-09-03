"""
PaySense Synthetic Data Generator
Generates 50 realistic Indian merchant payment failure events,
runs them through the complete agent recovery pipeline,
and populates the SQLite audit database for dashboard demonstration.
"""

import os
import random
import sys
import time
from pathlib import Path
from audit import (
    init_db,
    get_connection,
    get_report,
    update_action,
    write_stop,
)
from agent import process_failure
import config

# List of 32 authentic Indian first names and 20 surnames
FIRST_NAMES = [
    "Aarav", "Aditi", "Amit", "Ananya", "Arjun", "Deepak", "Divya", "Gaurav",
    "Harish", "Ishaan", "Kavita", "Manish", "Meera", "Neha", "Nikhil", "Pooja",
    "Pranav", "Priya", "Rahul", "Rajesh", "Ritu", "Rohan", "Rohit", "Sachin",
    "Sanjay", "Shilpa", "Sneha", "Suresh", "Swati", "Tanvi", "Varun", "Vikram",
]

LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Rao", "Iyer", "Nair", "Gupta", "Singh",
    "Kumar", "Joshi", "Reddy", "Mehta", "Chatterjee", "Das", "Sen", "Agarwal",
    "Bhat", "Nambiar", "Deshmukh", "Kulkarni",
]

UPI_HANDLES = ["@okicici", "@oksbi", "@ybl", "@paytm"]

FAILURE_CATEGORIES = [
    "upi_pin_error",
    "bank_timeout",
    "network_dropout",
    "insufficient_funds",
    "card_decline",
    "method_unsupported",
]

FAILURE_WEIGHTS = [0.30, 0.25, 0.15, 0.20, 0.07, 0.03]

CATEGORY_ERROR_MAP = {
    "upi_pin_error": {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "INCORRECT_PIN",
        "method": "upi",
    },
    "bank_timeout": {
        "error_code": "GATEWAY_ERROR",
        "error_description": "PAYMENT_TIMEOUT",
        "method": "netbanking",
    },
    "network_dropout": {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "PAYMENT_CANCELLED",
        "method": "upi",
    },
    "insufficient_funds": {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "INSUFFICIENT_FUNDS",
        "method": "upi",
    },
    "card_decline": {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "CARD_DECLINED",
        "method": "card",
    },
    "method_unsupported": {
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "METHOD_NOT_ALLOWED",
        "method": "wallet",
    },
}


def reset_database():
    """Drops and recreates the database and triggers."""
    db_path = Path(os.getenv("DATABASE_PATH", config.DATABASE_PATH))
    if db_path.exists():
        try:
            db_path.unlink()
        except Exception:
            # Fallback to dropping tables if file locked
            conn = get_connection()
            try:
                c = conn.cursor()
                c.execute("DROP TABLE IF EXISTS stop_events;")
                c.execute("DROP TABLE IF EXISTS recovery_actions;")
                c.execute("DROP TABLE IF EXISTS classifications;")
                c.execute("DROP TABLE IF EXISTS failed_payments;")
                conn.commit()
            finally:
                conn.close()
    init_db()
    print("Database reset successfully.")


def generate_synthetic_payments(count: int = 50):
    """
    Generates realistic payment failure events spread across the past 48 hours
    and processes them through the full agent pipeline.
    """
    now = int(time.time())
    forty_eight_hours = 48 * 3600
    
    # Generate random received_at timestamps spread uniformly over the last 48 hours
    timestamps = sorted([now - random.randint(300, forty_eight_hours) for _ in range(count)])

    generated_count = 0
    for i, received_at in enumerate(timestamps, 1):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        rand_four = f"{random.randint(1000, 9999)}"
        handle = random.choice(UPI_HANDLES)
        upi_id = f"{first.lower()}.{rand_four}{handle}"

        amount_rupees = random.randint(199, 14999)
        category = random.choices(FAILURE_CATEGORIES, weights=FAILURE_WEIGHTS, k=1)[0]
        mapping = CATEGORY_ERROR_MAP[category]

        payment_id = f"pay_syn_{int(received_at)}_{i:03d}"

        customer_display_name = f"{first} {last[0]}."

        payment_dict = {
            "id": payment_id,
            "razorpay_payment_id": payment_id,
            "amount_rupees": amount_rupees,
            "payment_method": mapping["method"],
            "customer_identifier": upi_id,
            "customer_display_name": customer_display_name,
            "error_code": mapping["error_code"],
            "error_description": mapping["error_description"],
            "received_at": received_at,
        }

        # Run full agent pipeline
        process_failure(payment_dict)
        generated_count += 1

    # For realistic historical simulation: actions that were scheduled in the past
    # should reflect real execution outcomes (e.g. resolved vs no_response)
    category_recovery_probs = {
        "upi_pin_error": 0.76,
        "bank_timeout": 0.82,
        "network_dropout": 0.64,
        "insufficient_funds": 0.52,
        "card_decline": 0.45,
        "method_unsupported": 0.0,
    }

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ra.id, ra.payment_id, ra.channel, ra.strategy, ra.scheduled_at, c.failure_category
            FROM recovery_actions ra
            LEFT JOIN classifications c ON ra.payment_id = c.payment_id;
        """)
        actions = cursor.fetchall()
        for action in actions:
            act_id = action["id"]
            strat = action["strategy"]
            sched_at = action["scheduled_at"]
            cat = action["failure_category"] or "upi_pin_error"

            if action["channel"] == "escalate":
                update_action(
                    action_id=act_id,
                    executed_at=sched_at,
                    delivery_status="skipped",
                    outcome="no_response",
                )
            elif sched_at < now:
                prob = category_recovery_probs.get(cat, 0.60)
                is_resolved = random.random() < prob
                outcome = "resolved" if is_resolved else "no_response"
                executed_at = sched_at + random.randint(2, 20)
                update_action(
                    action_id=act_id,
                    executed_at=executed_at,
                    delivery_status="sent",
                    outcome=outcome,
                )
    finally:
        conn.close()

    print(f"Summary: 50 events processed successfully.")
    return generated_count


if __name__ == "__main__":
    # Check for reset flag in command line arguments
    if "reset" in sys.argv or "--reset" in sys.argv:
        reset_database()
    else:
        init_db()

    generate_synthetic_payments(50)
    
    report = get_report()
    print("\n--- PaySense Generation Summary ---")
    print(f"Total Processed: {report['total_processed']}")
    print(f"Total Attempts: {report['total_attempts']}")
    print(f"Total Recovered: {report['total_recovered']}")
    print(f"Revenue Recovered: Rs. {report['total_revenue_recovered_rupees']:,}")
    print("Breakdown:")
    for b in report["category_breakdown"]:
        print(f"  {b['failure_category']}: {b['recovered']}/{b['attempts']} ({b['recovery_rate_percent']}%)")
