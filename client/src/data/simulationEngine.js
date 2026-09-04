/**
 * PaySense Autonomous AI Agent Simulation Engine
 * Generates realistic incoming payment failures, multi-layer reasoning classifications,
 * and autonomous recovery dispatches.
 */

const SCENARIOS = [
  {
    name: 'Priya S.',
    amount: 1850,
    category: 'upi_pin_error',
    method: 'upi',
    channel: 'whatsapp',
    strategy: 'WhatsApp 1-Click Biometric UPI Nudge',
    customerMessage: 'Hi Priya, we noticed your UPI payment of ₹1,850 was interrupted due to an MPIN mismatch. Your items are reserved! Tap here to complete securely with 1-click Biometric / GPay: https://pay.sense/retry/pr850',
    reasoning: 'Customer entered incorrect UPI PIN 2 consecutive times due to checkout session latency. Agent initiated an 8-minute cooldown to prevent bank MPIN lockout, then dispatched a personalized WhatsApp 1-click fallback link with biometric UPI Intent.',
    recoveryHint: 'wait 8 minutes and send WhatsApp nudge',
    confidenceScore: 0.96,
    recovered: true,
  },
  {
    name: 'Rahul V.',
    amount: 3499,
    category: 'bank_timeout',
    method: 'card',
    channel: 'silent_retry',
    strategy: 'Silent Switch Reroute (HDFC → ICICI Gateway)',
    customerMessage: 'Payment recovered silently via secondary clearing route. No customer friction required.',
    reasoning: 'Primary gateway reported 504 Gateway Timeout on HDFC core banking switch. Agent identified non-debit status and autonomously rerouted transaction via alternate ICICI route. Payment captured with 0 customer drop-off.',
    recoveryHint: 'silent re-attempt after 5 minutes',
    confidenceScore: 0.98,
    recovered: true,
  },
  {
    name: 'Ananya I.',
    amount: 1299,
    category: 'network_dropout',
    method: 'upi',
    channel: 'push',
    strategy: 'Instant Cart Resume Push Notification',
    customerMessage: 'Ananya, your connection dropped right after payment approval. We saved your cart! Tap to restore your session in 1 second.',
    reasoning: 'Mobile cellular carrier handover triggered 408 Request Timeout after OTP authorization. Agent cached order state and dispatched a push notification with a deep-link restoring cart and completing payment.',
    recoveryHint: 'send push notification after 12 minutes',
    confidenceScore: 0.92,
    recovered: true,
  },
  {
    name: 'Vikram M.',
    amount: 7499,
    category: 'insufficient_funds',
    method: 'card',
    channel: 'whatsapp',
    strategy: 'Next-Morning Salary Deposit Reminder',
    customerMessage: 'Good morning Vikram! Your order of ₹7,499 is held for you. When you are ready to complete your purchase, tap here: https://pay.sense/retry/vk749',
    reasoning: 'Card declined due to low balance threshold. Agent paused immediate retries to protect customer goodwill and avoid bank penalty charges. Scheduled a high-converting reminder link for the 9:30 AM morning window.',
    recoveryHint: 'schedule WhatsApp message next morning 9-11 AM IST',
    confidenceScore: 0.94,
    recovered: true,
  },
  {
    name: 'Sneha P.',
    amount: 4150,
    category: 'card_decline',
    method: 'card',
    channel: 'email',
    strategy: 'RBI Mandate Unblock Guide + UPI AutoPay Fallback',
    customerMessage: 'Hi Sneha, your card issuer declined this online transaction under RBI e-mandate rules. Follow this 1-step guide to enable e-commerce, or tap to pay via UPI.',
    reasoning: 'Issuer bank declined merchant tokenization. Agent dispatched email instructions with direct mobile banking deeplink to toggle online transactions, with fallback UPI option.',
    recoveryHint: 'send recovery email after 2 hours',
    confidenceScore: 0.89,
    recovered: true,
  },
  {
    name: 'Rohan G.',
    amount: 2800,
    category: 'bank_timeout',
    method: 'upi',
    channel: 'whatsapp',
    strategy: 'Dynamic UPI QR Code via WhatsApp',
    customerMessage: 'Hi Rohan, your bank experienced a temporary delay. We verified no amount was debited. Scan or tap this verified QR code to complete instantly: https://pay.sense/qr/rg280',
    reasoning: 'NPCI UPI authorization switch timeout. Agent confirmed no ledger deduction occurred, generated a dynamic QR code, and dispatched it directly to customer WhatsApp.',
    recoveryHint: 'silent re-attempt after 5 minutes',
    confidenceScore: 0.97,
    recovered: true,
  },
];

let scenarioIndex = 0;

export function generateSimulatedEvent() {
  const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];
  scenarioIndex++;

  const nowSec = Math.floor(Date.now() / 1000);
  const paymentId = `pay_sim_${Date.now().toString(36)}_${Math.floor(100 + Math.random() * 900)}`;

  const activityEvent = {
    payment_id: paymentId,
    razorpay_payment_id: paymentId,
    amount_rupees: scenario.amount,
    customer_display_name: scenario.name,
    payment_method: scenario.method,
    failure_category: scenario.category,
    confidence_score: Number((scenario.confidenceScore + (Math.random() * 0.03 - 0.015)).toFixed(2)),
    llm_reasoning: scenario.reasoning,
    strategy: scenario.strategy,
    channel: scenario.channel,
    message_content: scenario.customerMessage,
    current_status: scenario.recovered ? 'Recovered' : 'Pending',
    timestamp: nowSec,
    is_simulation: true,
    isNew: true,
  };

  const reasoningEvent = {
    payment_id: paymentId,
    failure_category: scenario.category,
    confidence_score: activityEvent.confidence_score,
    reasoning: scenario.reasoning,
    recovery_hint: scenario.recoveryHint,
    customer_name: scenario.name,
    amount_rupees: scenario.amount,
  };

  return {
    activity: activityEvent,
    reasoning: reasoningEvent,
    scenario,
  };
}
