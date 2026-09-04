import React, { useEffect, useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { IconChat, IconBell, IconMail, IconFlag } from './Icons';

const STATUS_STYLES = {
  Recovered: { bg: '#E8F7F0', text: '#1A7A3C', border: '#bbf7d0' },
  Pending: { bg: '#EEF3FE', text: '#0052ff', border: '#bfdbfe' },
  Stopped: { bg: '#F3F4F8', text: '#6B7494', border: '#e2e8f0' },
  Escalated: { bg: '#FFF5E6', text: '#A05C00', border: '#fed7aa' },
};

const FAILURE_LABELS = {
  upi_pin_error: 'UPI PIN Error',
  bank_timeout: 'Bank Timeout',
  network_dropout: 'Network Dropout',
  insufficient_funds: 'Insufficient Funds',
  card_decline: 'Card Decline',
  method_unsupported: 'Method Unsupported',
};

function formatFailureType(slug) {
  if (!slug) return 'Unclassified';
  return FAILURE_LABELS[slug] || slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getPlainEnglishStrategy(strategy, channel) {
  const strat = (strategy || '').toLowerCase();
  const chan = (channel || '').toLowerCase();

  if (strat.includes('silent') || strat.includes('timeout') || (strat.includes('retry') && chan === 'push')) {
    return 'Auto-retrying in 5 minutes';
  }
  if (chan === 'whatsapp' || strat.includes('whatsapp')) {
    return 'Sending WhatsApp reminder';
  }
  if (chan === 'email' || strat.includes('email')) {
    return 'Sending email with alternate method';
  }
  if (chan === 'escalate' || strat.includes('escalate')) {
    return 'Escalated to merchant dashboard';
  }
  if (chan === 'push' || strat.includes('push')) {
    return 'Sending push notification';
  }
  return 'Auto-retrying in 5 minutes';
}

function ChannelIconComponent({ channel }) {
  const c = (channel || '').toLowerCase();
  if (c === 'whatsapp') return <IconChat className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />;
  if (c === 'email') return <IconMail className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />;
  if (c === 'push') return <IconBell className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
  if (c === 'escalate') return <IconFlag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />;
  return <IconChat className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
}

function ReasoningPanel({ paymentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(`/api/reasoning/${paymentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((resData) => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [paymentId]);

  return (
    <div
      id={`reasoning-panel-${paymentId}`}
      className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] fade-in-card"
      style={{
        transition: 'opacity 200ms ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#0f172a]">Agent Diagnostic Reasoning</h4>
        <button
          type="button"
          id={`close-reasoning-${paymentId}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          title="Close reasoning panel"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500">Loading agent reasoning</div>
      ) : error || !data ? (
        <div className="text-xs text-slate-500">Reasoning not available for this event</div>
      ) : (
        <div>
          {/* Two-column layout for failure category and confidence score percentage */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700">
              <span className="text-slate-500">Failure:</span>
              <span className="font-semibold text-[#0f172a]">{formatFailureType(data.failure_category)}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700">
              <span className="text-slate-500">Confidence:</span>
              <span className="font-semibold text-[#0f172a] font-mono">
                {Math.round((data.confidence_score || 0) * 100)}%
              </span>
            </div>
          </div>

          {/* Full LLM reasoning text with no truncation */}
          <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line break-words">
            {data.reasoning}
          </div>

          {/* Recovery hint text using secondary info style */}
          {data.recovery_hint && (
            <div className="mt-2.5 text-xs text-slate-600 flex items-center space-x-1.5 bg-slate-100 p-2 rounded-lg">
              <span className="font-medium text-slate-700">Recovery Hint:</span>
              <span>{data.recovery_hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [previousIds, setPreviousIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json();
      
      setEvents((prev) => {
        if (isInitialMount.current) {
          isInitialMount.current = false;
          setPreviousIds(new Set(data.map((d) => d.payment_id)));
          return data;
        }
        setPreviousIds(new Set(prev.map((d) => d.payment_id)));
        return data;
      });
    } catch (err) {
      console.error('Activity polling error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (paymentId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#0f172a]">Live Failure Activity</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time payment failure capture, autonomous classification, and recovery execution</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 shrink-0 self-start sm:self-auto">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0052ff] animate-pulse"></span>
          <span>Polling every 3s</span>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          Loading real-time activity feed...
        </div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          No payment failure events captured yet.
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {events.map((event) => {
            const isNew = !previousIds.has(event.payment_id);
            const statusKey = event.current_status || 'Pending';
            const statusColor = STATUS_STYLES[statusKey] || STATUS_STYLES.Pending;
            const isExpanded = !!expandedCards[event.payment_id];
            const isSelected = selectedPaymentId === event.payment_id;

            const message = event.message_content || '';
            const shouldTruncate = message.length > 120;
            const displayedMessage =
              shouldTruncate && !isExpanded ? `${message.slice(0, 120)}...` : message;

            let relativeTime = 'Just now';
            if (event.timestamp) {
              try {
                const date = new Date(event.timestamp * 1000);
                relativeTime = `${formatDistanceToNow(date)} ago`;
              } catch {
                relativeTime = 'Recently';
              }
            }

            const customerName = event.customer_display_name || 'Customer';
            const failureLabel = formatFailureType(event.failure_category);
            const strategyEnglish = getPlainEnglishStrategy(event.strategy, event.channel);

            return (
              <React.Fragment key={event.payment_id}>
                <div
                  id={`card-${event.payment_id}`}
                  onClick={() =>
                    setSelectedPaymentId((prev) =>
                      prev === event.payment_id ? null : event.payment_id
                    )
                  }
                  className={`p-4 bg-white border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0052ff] ring-1 ring-[#0052ff]'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${isNew ? 'fade-in-card' : ''}`}
                  style={{
                    transition: 'opacity 200ms ease-out',
                  }}
                >
                  {/* Top Row: Prominent Rupee Amount & Customer Details on Left, Status Tag & Time on Right */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 sm:gap-x-3 gap-y-0.5">
                      <span className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight font-mono">
                        ₹{(event.amount_rupees || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-semibold text-[#0f172a]">
                        {customerName}
                      </span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">
                        via {event.payment_method || 'UPI'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderColor: statusColor.border,
                        }}
                      >
                        {statusKey}
                      </span>
                      <span className="text-xs text-slate-500">{relativeTime}</span>
                    </div>
                  </div>

                  {/* Second Row: Human-Readable Failure Label & Plain English Strategy with Clean Icon */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs mb-3">
                    <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700">
                      <span className="text-slate-500">Failure:</span>
                      <span className="font-semibold text-[#0f172a]">{failureLabel}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-slate-700">
                      <ChannelIconComponent channel={event.channel} />
                      <span className="font-medium text-[#0f172a]">{strategyEnglish}</span>
                    </div>
                  </div>

                  {/* Customer Message Box or Silent Retry Notice */}
                  {message ? (
                    <div className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="whitespace-pre-line break-words">{displayedMessage}</div>
                      {shouldTruncate && (
                        <button
                          type="button"
                          id={`toggle-msg-${event.payment_id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(event.payment_id);
                          }}
                          className="mt-2 text-xs text-[#0052ff] font-semibold hover:underline block"
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  ) : event.strategy === 'Silent Gateway Retry' || event.failure_category === 'bank_timeout' ? (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
                      Silent internal retry scheduled via Razorpay test gateway (no customer notification sent).
                    </div>
                  ) : null}

                  {event.stop_reason && (
                    <div className="mt-2.5 text-xs text-slate-600 flex items-center space-x-1.5 bg-slate-100 p-2 rounded-lg">
                      <span className="font-medium text-slate-700">Stopping Rule:</span>
                      <span>{event.stop_reason}</span>
                    </div>
                  )}
                </div>

                {/* Inline Live Agent Reasoning Panel */}
                {isSelected && (
                  <ReasoningPanel
                    paymentId={event.payment_id}
                    onClose={() => setSelectedPaymentId(null)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
