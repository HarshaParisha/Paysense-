"""
PaySense Decision Framework & Stopping Engine
Maps failure categories to recovery strategies, timing, and customer messages.
Evaluates stopping criteria to safeguard customer experience and merchant policy.
"""

from datetime import datetime, time as dt_time, timedelta, timezone
import time
from audit import get_connection, write_stop

# IST is UTC + 5:30
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))


def calculate_next_morning_ist_delay() -> int:
    """
    Computes delay in seconds so message arrives between 9 AM and 11 AM IST
    on the following day.
    """
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc.astimezone(IST_OFFSET)
    
    # Target 9:30 AM IST tomorrow
    tomorrow_ist_date = (now_ist + timedelta(days=1)).date()
    target_ist = datetime.combine(tomorrow_ist_date, dt_time(9, 30), tzinfo=IST_OFFSET)
    
    delay_seconds = int((target_ist - now_ist).total_seconds())
    return max(delay_seconds, 60)


def generate_message(channel: str, category: str, amount_rupees: int, payment_method: str) -> str:
    """
    Generates personalized messaging adhering to strict constraints:
    - Under 80 words (push is under 20 words)
    - Conversational English
    - NEVER contains: error, failure, declined, rejected
    - Contains RETRY_URL placeholder
    - WhatsApp: single paragraph
    - Email: subject line starting with 'one more step to complete your payment' and a body paragraph
    - Push: single sentence under 20 words
    """
    method_name = (payment_method or "digital payment").upper()
    amount_str = f"{amount_rupees:,}" if amount_rupees else "0"

    if channel == "whatsapp":
        if category == "insufficient_funds":
            return (
                f"Good morning! Your ₹{amount_str} order via {method_name} is reserved for you. "
                "Whenever you are ready to complete your purchase today, simply use this secure link: "
                "RETRY_URL. Please let us know if you have any questions!"
            )
        else:
            # upi_pin_error
            return (
                f"Hi there! We noticed your ₹{amount_str} purchase via {method_name} could not be completed just now. "
                "No worries at all, you can securely finish your checkout anytime here: RETRY_URL. "
                "We have held your items so you can pick up right where you left off!"
            )

    elif channel == "email":
        # card_decline
        return (
            f"Subject: one more step to complete your payment for your order\n\n"
            f"Hi there, we noticed your ₹{amount_str} transaction via {method_name} was interrupted before completion. "
            "Your cart items are safely reserved for you. To complete your purchase using your preferred card "
            "or an alternative payment option, please visit your personal link: RETRY_URL. "
            "Thank you for shopping with us!"
        )

    elif channel == "push":
        # network_dropout
        return f"Finish your ₹{amount_str} purchase via {method_name} in one tap: RETRY_URL"

    elif channel == "escalate":
        return "Escalated to merchant operations: payment method unsupported by merchant checkout settings."

    return ""


def get_strategy(failure_category: str, payment_context: dict) -> dict:
    """
    Maps failure_category and payment context to recovery strategy.
    Returns:
      {
        "channel": str,
        "delay_seconds": int,
        "message_content": str,
        "strategy_name": str
      }
    """
    cat = (failure_category or "").strip()
    amount = int(payment_context.get("amount_rupees", 0))
    method = str(payment_context.get("payment_method", "UPI"))

    if cat == "upi_pin_error":
        channel = "whatsapp"
        delay = 480  # 8 minutes
        name = "WhatsApp Smart Nudge"
        msg = generate_message(channel, cat, amount, method)

    elif cat == "bank_timeout":
        channel = "push"  # Silent internal retry channel
        delay = 300  # 5 minutes
        name = "Silent Gateway Retry"
        msg = ""  # No customer message

    elif cat == "network_dropout":
        channel = "push"
        delay = 720  # 12 minutes
        name = "Push Notification Recovery"
        msg = generate_message(channel, cat, amount, method)

    elif cat == "insufficient_funds":
        channel = "whatsapp"
        delay = calculate_next_morning_ist_delay()
        name = "Next-Morning WhatsApp Nudge"
        msg = generate_message(channel, cat, amount, method)

    elif cat == "card_decline":
        channel = "email"
        delay = 7200  # 2 hours
        name = "Email Card Assistance"
        msg = generate_message(channel, cat, amount, method)

    elif cat == "method_unsupported":
        channel = "escalate"
        delay = 0  # Immediate
        name = "Immediate Merchant Escalation"
        msg = generate_message(channel, cat, amount, method)

    else:
        channel = "escalate"
        delay = 0
        name = "Merchant Escalation"
        msg = "Escalated to merchant."

    return {
        "channel": channel,
        "delay_seconds": delay,
        "message_content": msg,
        "strategy_name": name,
    }


def should_stop(payment_id: str) -> tuple[bool, str]:
    """
    Evaluates stopping criteria for payment_id:
    1. 3 or more recovery actions already recorded -> stop
    2. stop_events table already has a row -> stop
    3. received_at older than 72 hours (259200 seconds) -> stop
    4. failure_category is method_unsupported -> stop (escalate)
    Returns (True, stop_reason) and writes to stop_events if stopping.
    Otherwise returns (False, "").
    """
    if not payment_id:
        return False, ""

    conn = get_connection()
    try:
        cursor = conn.cursor()

        # 1. Check if already stopped in stop_events
        cursor.execute("SELECT stop_reason FROM stop_events WHERE payment_id = ? LIMIT 1;", (payment_id,))
        existing_stop = cursor.fetchone()
        if existing_stop:
            return True, existing_stop["stop_reason"]

        # 2. Check retry attempts count in recovery_actions
        cursor.execute("SELECT COUNT(*) AS count FROM recovery_actions WHERE payment_id = ?;", (payment_id,))
        actions_count = cursor.fetchone()["count"]
        if actions_count >= 3:
            reason = "Maximum retry attempts (3) exceeded"
            write_stop(payment_id, reason)
            return True, reason

        # 3. Check 72-hour expiration window in failed_payments
        cursor.execute("SELECT received_at FROM failed_payments WHERE id = ?;", (payment_id,))
        pay_row = cursor.fetchone()
        if pay_row:
            received_at = pay_row["received_at"]
            now = int(time.time())
            if (now - received_at) > 259200:
                reason = "Payment expired (exceeded 72 hour window)"
                write_stop(payment_id, reason)
                return True, reason

        # 4. Check if classification is method_unsupported
        cursor.execute(
            """
            SELECT failure_category
            FROM classifications
            WHERE payment_id = ?
            ORDER BY id DESC LIMIT 1;
            """,
            (payment_id,),
        )
        class_row = cursor.fetchone()
        if class_row and class_row["failure_category"] == "method_unsupported":
            reason = "Payment method unsupported, escalated to merchant"
            write_stop(payment_id, reason)
            return True, reason

        return False, ""
    finally:
        conn.close()
