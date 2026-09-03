"""
PaySense Failure Classifier
Classifies payment failures using Anthropic Claude (claude-sonnet-4-6)
with resilient offline fallback heuristics for synthetic testing.
"""

import json
import os
import re
import time
from dotenv import load_dotenv
import anthropic
from audit import write_classification

# Load environment variables
load_dotenv()

VALID_CATEGORIES = {
    "upi_pin_error",
    "bank_timeout",
    "network_dropout",
    "insufficient_funds",
    "card_decline",
    "method_unsupported",
}

FALLBACK_RESULT = {
    "failure_category": "method_unsupported",
    "confidence_score": 0.0,
    "reasoning": "classification failed",
    "recovery_hint": "escalate to merchant",
}


def _strip_markdown_fences(text: str) -> str:
    """Strip markdown code fences and whitespace from response."""
    cleaned = text.strip()
    # Match ```json ... ``` or ``` ... ```
    fence_pattern = r"^```(?:json)?\s*([\s\S]*?)\s*```$"
    match = re.search(fence_pattern, cleaned, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return cleaned


def _heuristic_classify(error_code: str, error_desc: str, method: str) -> dict:
    """Deterministic heuristic for offline testing or when API key is unavailable."""
    code = (error_code or "").upper()
    desc = (error_desc or "").upper()
    meth = (method or "").lower()

    if "INCORRECT_PIN" in desc or "PIN" in desc or "PIN" in code or "upi_pin_error" in desc:
        return {
            "failure_category": "upi_pin_error",
            "confidence_score": 0.96,
            "reasoning": "Customer entered an invalid UPI MPIN during authorization. Highly recoverable via nudge.",
            "recovery_hint": "wait 8 minutes and send WhatsApp nudge",
        }
    if "PAYMENT_TIMEOUT" in desc or "TIMEOUT" in desc or "GATEWAY_ERROR" in code or "bank_timeout" in desc:
        return {
            "failure_category": "bank_timeout",
            "confidence_score": 0.94,
            "reasoning": "Issuing bank gateway failed to respond before timeout threshold. Re-attempt silently.",
            "recovery_hint": "silent re-attempt after 5 minutes",
        }
    if "PAYMENT_CANCELLED" in desc or "CANCELLED" in desc or "network_dropout" in desc:
        return {
            "failure_category": "network_dropout",
            "confidence_score": 0.91,
            "reasoning": "Network connection dropped or app switched before authorization callback completed.",
            "recovery_hint": "send push notification after 12 minutes",
        }
    if "INSUFFICIENT_FUNDS" in desc or "LOW_BALANCE" in desc or "insufficient_funds" in desc:
        return {
            "failure_category": "insufficient_funds",
            "confidence_score": 0.95,
            "reasoning": "Account balance insufficient for requested transaction amount. Recover after salary/morning window.",
            "recovery_hint": "schedule WhatsApp message next morning 9-11 AM IST",
        }
    if "CARD_DECLINED" in desc or "CARD" in desc or "card_decline" in desc:
        return {
            "failure_category": "card_decline",
            "confidence_score": 0.92,
            "reasoning": "Card issuer declined transaction due to limits, international settings, or 3DS.",
            "recovery_hint": "send recovery email after 2 hours",
        }
    if "METHOD_NOT_ALLOWED" in desc or "UNSUPPORTED" in desc or "method_unsupported" in desc:
        return {
            "failure_category": "method_unsupported",
            "confidence_score": 0.99,
            "reasoning": "Requested payment method is not configured or allowed for merchant account.",
            "recovery_hint": "escalate to merchant immediately",
        }

    return FALLBACK_RESULT.copy()


def classify_failure(failure_dict: dict) -> dict:
    """
    Classifies a payment failure using Anthropic Claude claude-sonnet-4-6.
    Takes a dictionary with keys: error_code, error_description, payment_method, amount_rupees.
    Optionally accepts payment_id for logging to classifications table.
    """
    error_code = str(failure_dict.get("error_code") or "")
    error_description = str(failure_dict.get("error_description") or "")
    payment_method = str(failure_dict.get("payment_method") or "unknown")
    amount_rupees = failure_dict.get("amount_rupees", 0)
    payment_id = failure_dict.get("payment_id") or failure_dict.get("id", f"pay_gen_{int(time.time()*1000)}")

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    result = None

    # Call Anthropic Claude API if valid key is configured
    if api_key and not api_key.startswith("sk-ant-api03-placeholder") and len(api_key) > 20:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            system_prompt = (
                "You are a payment failure classification specialist for Indian digital payments. "
                "You must return only a valid JSON object with no other text before or after it. "
                "The JSON object must contain exactly four fields:\n"
                "1. failure_category: exactly one of [upi_pin_error, bank_timeout, network_dropout, insufficient_funds, card_decline, method_unsupported]\n"
                "2. confidence_score: a float between 0.0 and 1.0\n"
                "3. reasoning: a plain English explanation of no more than two sentences\n"
                "4. recovery_hint: a short phrase describing the recommended recovery timing"
            )

            user_message = (
                f"Payment Method: {payment_method}\n"
                f"Amount in Rupees: {amount_rupees}\n"
                f"Error Code: {error_code}\n"
                f"Error Description: {error_description}"
            )

            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=300,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )

            response_text = message.content[0].text
            clean_text = _strip_markdown_fences(response_text)
            parsed = json.loads(clean_text)

            # Validate fields
            cat = parsed.get("failure_category")
            if cat in VALID_CATEGORIES and "confidence_score" in parsed and "reasoning" in parsed and "recovery_hint" in parsed:
                result = {
                    "failure_category": cat,
                    "confidence_score": float(parsed["confidence_score"]),
                    "reasoning": str(parsed["reasoning"]),
                    "recovery_hint": str(parsed["recovery_hint"]),
                }
        except Exception:
            # Fall back to heuristic or fallback dictionary if parsing or API call fails
            result = None

    # If API not used or failed, use heuristic
    if result is None:
        heuristic = _heuristic_classify(error_code, error_description, payment_method)
        if heuristic["failure_category"] != "method_unsupported" or "METHOD" in error_code or "METHOD" in error_description:
            result = heuristic
        else:
            result = FALLBACK_RESULT.copy()

    # Log to classifications table
    classified_at = int(time.time())
    write_classification({
        "payment_id": payment_id,
        "failure_category": result["failure_category"],
        "confidence_score": result["confidence_score"],
        "llm_reasoning": result["reasoning"],
        "classified_at": classified_at,
    })

    return result
