"""
PaySense Razorpay Webhook Simulator
Constructs realistic Razorpay payment.failed webhook payloads,
signs them with HMAC SHA-256, POSTs to the PaySense webhook endpoint,
and monitors real-time recovery status transitions.
"""

import argparse
import hashlib
import hmac
import json
import os
from pathlib import Path
import sys
import time
import urllib.request
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

CATEGORY_DETAILS = {
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


def simulate(failure_type: str, amount_rupees: int, customer_name: str, base_url: str = "http://127.0.0.1:5000"):
    cat = failure_type.lower().strip()
    mapping = CATEGORY_DETAILS.get(cat, CATEGORY_DETAILS["upi_pin_error"])

    now = int(time.time())
    payment_id = f"pay_sim_{now}"
    amount_paise = amount_rupees * 100

    parts = customer_name.strip().split()
    display_name = f"{parts[0]} {parts[1][0]}." if len(parts) > 1 else parts[0]

    # Construct realistic Razorpay webhook payload
    payload = {
        "entity": "event",
        "account_id": "acc_LiveDemoTest",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "failed",
                    "order_id": f"order_{payment_id[4:]}",
                    "invoice_id": None,
                    "international": False,
                    "method": mapping["method"],
                    "amount_refunded": 0,
                    "refund_status": None,
                    "captured": False,
                    "description": "Merchant checkout payment",
                    "card_id": None,
                    "bank": "HDFC" if mapping["method"] == "netbanking" else None,
                    "wallet": "paytm" if mapping["method"] == "wallet" else None,
                    "vpa": f"{parts[0].lower()}@okhdfcbank" if mapping["method"] == "upi" else None,
                    "email": f"{parts[0].lower()}@example.com",
                    "contact": "+919876543210",
                    "name": customer_name,
                    "customer_name": customer_name,
                    "customer_display_name": display_name,
                    "is_simulation": True,
                    "error_code": mapping["error_code"],
                    "error_description": mapping["error_description"],
                    "error_source": "gateway" if cat == "bank_timeout" else "customer",
                    "error_step": "payment_authorization",
                    "error_reason": "payment_failed",
                    "created_at": now,
                }
            }
        },
        "created_at": now,
    }

    raw_body = json.dumps(payload).encode("utf-8")

    # Compute HMAC SHA-256 signature
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    signature = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    webhook_url = f"{base_url.rstrip('/')}/webhook/razorpay"
    req = urllib.request.Request(
        webhook_url,
        data=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": signature,
            "User-Agent": "Razorpay-Webhook-Simulator/1.0",
        },
        method="POST",
    )

    print(f"--- Injecting Razorpay Webhook Failure ---")
    print(f"Payment ID : {payment_id}")
    print(f"Customer   : {customer_name} ({display_name})")
    print(f"Amount     : ₹{amount_rupees:,}")
    print(f"Failure    : {cat} ({mapping['error_code']} / {mapping['error_description']})")
    print(f"Target URL : {webhook_url}")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            print(f"Webhook Response HTTP {resp.status}: {resp_body.strip()}")
    except Exception as e:
        print(f"[ERROR] Failed to dispatch webhook: {e}")
        return False

    print("\n--- Monitoring Real-Time Recovery Status ---")
    start_time = time.time()
    last_status = None

    while time.time() - start_time < 30:
        elapsed = int(time.time() - start_time)
        try:
            act_url = f"{base_url.rstrip('/')}/api/activity"
            with urllib.request.urlopen(act_url, timeout=5) as act_resp:
                events = json.loads(act_resp.read().decode("utf-8"))
                match = next((e for e in events if e.get("payment_id") == payment_id), None)

                if match:
                    status = match.get("current_status", "Unknown")
                    strat = match.get("strategy", "Recovery")
                    chan = match.get("channel", "internal")
                    print(f"[{elapsed:02d}s] Status: {status:<10} | Strategy: {strat} | Channel: {chan}")

                    if status != "Pending":
                        print(f"\n[SUCCESS] Payment moved from Pending -> {status} in {elapsed}s!")
                        return True
                else:
                    print(f"[{elapsed:02d}s] Ingesting into pipeline...")
        except Exception as err:
            print(f"[{elapsed:02d}s] Polling error: {err}")

        time.sleep(2)

    print("\n[TIMEOUT] Polling window of 30s elapsed.")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate Razorpay payment failure webhook")
    parser.add_argument("--type", default="bank_timeout", help="Failure category slug")
    parser.add_argument("--amount", type=int, default=2500, help="Transaction amount in Rupees")
    parser.add_argument("--name", default="Priya Mehta", help="Customer name")
    parser.add_argument("--url", default="http://127.0.0.1:5000", help="PaySense backend URL")
    args = parser.parse_args()

    simulate(
        failure_type=args.type,
        amount_rupees=args.amount,
        customer_name=args.name,
        base_url=args.url,
    )
