-- PaySense SQLite Database Schema
-- All tables are strictly append-only with SQLite triggers preventing DELETE operations.

CREATE TABLE IF NOT EXISTS failed_payments (
    id TEXT PRIMARY KEY,
    razorpay_payment_id TEXT,
    amount_rupees INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    customer_identifier TEXT NOT NULL,
    customer_display_name TEXT,
    error_code TEXT,
    error_description TEXT,
    received_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT NOT NULL,
    failure_category TEXT NOT NULL CHECK (
        failure_category IN (
            'upi_pin_error',
            'bank_timeout',
            'network_dropout',
            'insufficient_funds',
            'card_decline',
            'method_unsupported'
        )
    ),
    confidence_score REAL NOT NULL,
    llm_reasoning TEXT,
    classified_at INTEGER NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES failed_payments(id)
);

CREATE TABLE IF NOT EXISTS recovery_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    strategy TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (
        channel IN ('whatsapp', 'email', 'push', 'escalate')
    ),
    scheduled_at INTEGER NOT NULL,
    executed_at INTEGER,
    message_content TEXT,
    delivery_status TEXT NOT NULL CHECK (
        delivery_status IN ('sent', 'failed', 'skipped')
    ),
    outcome TEXT NOT NULL CHECK (
        outcome IN ('resolved', 'no_response', 'opted_out')
    ),
    FOREIGN KEY (payment_id) REFERENCES failed_payments(id)
);

CREATE TABLE IF NOT EXISTS stop_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT NOT NULL,
    stop_reason TEXT NOT NULL,
    stopped_at INTEGER NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES failed_payments(id)
);

-- Delete prevention triggers to guarantee append-only immutability

CREATE TRIGGER IF NOT EXISTS trg_prevent_delete_failed_payments
BEFORE DELETE ON failed_payments
BEGIN
    SELECT RAISE(ABORT, 'Deletes are prohibited on failed_payments: table is append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_delete_classifications
BEFORE DELETE ON classifications
BEGIN
    SELECT RAISE(ABORT, 'Deletes are prohibited on classifications: table is append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_delete_recovery_actions
BEFORE DELETE ON recovery_actions
BEGIN
    SELECT RAISE(ABORT, 'Deletes are prohibited on recovery_actions: table is append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_delete_stop_events
BEFORE DELETE ON stop_events
BEGIN
    SELECT RAISE(ABORT, 'Deletes are prohibited on stop_events: table is append-only');
END;
