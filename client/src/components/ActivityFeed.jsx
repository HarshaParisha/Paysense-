import React, { useEffect, useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { IconChat, IconBell, IconMail, IconFlag } from './Icons';
import { INITIAL_ACTIVITY, INITIAL_REASONING } from '../data/seedData';
import { generateSimulatedEvent } from '../data/simulationEngine';

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
  if (chan === 'push' || strat.includes('push')) {
    return 'Push notification with resume link';
  }
  if (chan === 'escalate' || strat.includes('escalat')) {
    return 'Flagged for merchant attention';
  }
  return strategy || 'Autonomous agent recovery in progress';
}

function ChannelIconComponent({ channel }) {
  const c = (channel || '').toLowerCase();
  if (c === 'whatsapp') return <IconChat className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />;
  if (c === 'email') return <IconMail className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />;
  if (c === 'push') return <IconBell className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
  if (c === 'escalate') return <IconFlag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />;
  return <IconChat className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
}

function ReasoningPanel({ paymentId, onClose, fallbackReasoning }) {
  const [data, setData] = useState(fallbackReasoning || null);
  const [loading, setLoading] = useState(!fallbackReasoning);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (fallbackReasoning) {
      setData(fallbackReasoning);
      setLoading(false);
      return;
    }

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
          if (fallbackReasoning) {
            setData(fallbackReasoning);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [paymentId, fallbackReasoning]);

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
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 p-1"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500 py-2">Loading reasoning analysis...</div>
      ) : error || !data ? (
        <div className="text-xs text-slate-500 py-2">
          Diagnostic analysis not available for this event.
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full font-medium bg-blue-50 text-[#0052ff] border border-blue-100">
              {formatFailureType(data.failure_category)}
            </span>
            <span className="px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              Confidence: {Math.round(data.confidence_score * 100)}%
            </span>
          </div>

          <div className="text-slate-700 pt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-semibold text-[#0f172a] block mb-1">Multi-Layer Root Cause Analysis:</span>
            {data.reasoning}
          </div>

          {data.recovery_hint && (
            <div className="text-slate-600 pt-1 flex items-start space-x-1.5">
              <span className="font-medium text-slate-800">Autonomous Hint:</span>
              <span>{data.recovery_hint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityFeed() {
  const [events, setEvents] = useState(INITIAL_ACTIVITY);
  const [simulationReasonings, setSimulationReasonings] = useState(INITIAL_REASONING);
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [previousIds, setPreviousIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoLoop, setAutoLoop] = useState(false);
  const [simStatus, setSimStatus] = useState(null);
  const isInitialMount = useRef(true);

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/activity');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setEvents((prev) => {
          if (isInitialMount.current) {
            isInitialMount.current = false;
            setPreviousIds(new Set(data.map((d) => d.payment_id)));
            return data;
          }
          const localSimulated = prev.filter((e) => e.is_simulation);
          const apiIds = new Set(data.map((d) => d.payment_id));
          const uniqueSimulated = localSimulated.filter((e) => !apiIds.has(e.payment_id));
          setPreviousIds(new Set(prev.map((d) => d.payment_id)));
          return [...uniqueSimulated, ...data];
        });
      }
    } catch (err) {
      // Gracefully maintain client seed activity feed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 3000);
    return () => clearInterval(interval);
  }, []);

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const { activity, reasoning, scenario } = generateSimulatedEvent();

    // Step 1: Detect failure
    setSimStatus({
      stage: 'detected',
      message: `🚨 Payment Interrupted: ${scenario.name} (₹${scenario.amount.toLocaleString('en-IN')}) — ${formatFailureType(scenario.category)}`,
      badge: 'Capture',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
    });

    // Step 2: Agent reasoning
    setTimeout(() => {
      setSimStatus({
        stage: 'reasoning',
        message: `🧠 AI Reasoning (${Math.round(reasoning.confidence_score * 100)}% Confidence): Root cause identified. Deploying ${scenario.strategy}...`,
        badge: 'Diagnostic',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }, 1200);

    // Step 3: Autonomously recovered
    setTimeout(() => {
      setSimStatus({
        stage: 'recovered',
        message: `⚡ Autonomously Recovered ₹${scenario.amount.toLocaleString('en-IN')} for ${scenario.name} via ${scenario.strategy}!`,
        badge: 'Recovered',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });

      // Save reasoning
      setSimulationReasonings((prev) => ({
        ...prev,
        [activity.payment_id]: reasoning,
      }));

      // Prepend to events
      setEvents((prev) => [activity, ...prev]);

      // Fire event to update App.jsx ticker and Report.jsx breakdown
      window.dispatchEvent(
        new CustomEvent('paysense:simulated-recovery', {
          detail: { activity, reasoning },
        })
      );

      setIsSimulating(false);

      // Dismiss status toast after 6s
      setTimeout(() => {
        setSimStatus(null);
      }, 6000);
    }, 2500);
  };

  // Autonomous agent loop toggle
  useEffect(() => {
    if (!autoLoop) return;
    const loopInterval = setInterval(() => {
      runSimulation();
    }, 8000);
    return () => clearInterval(loopInterval);
  }, [autoLoop, isSimulating]);

  const toggleExpand = (paymentId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  return (
    <div className="w-full">
      {/* Header with Title and Real-Time Polling Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-semibold text-[#0f172a]">Live Failure Activity</h2>
            <span className="text-xs px-2 py-0.5 font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              {events.length} Captured Events
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time payment failure capture, autonomous classification, and multi-channel recovery
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-simulate-ai"
            onClick={runSimulation}
            disabled={isSimulating}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
              isSimulating
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#0052ff] hover:bg-blue-600 text-white hover:shadow'
            }`}
            title="Trigger autonomous AI agent failure capture and recovery pipeline"
          >
            <span className={isSimulating ? 'animate-spin' : ''}>⚡</span>
            <span>{isSimulating ? 'AI Agent Processing...' : 'Simulate AI Recovery'}</span>
          </button>

          <label
            htmlFor="toggle-auto-pilot"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer select-none transition-colors"
          >
            <input
              type="checkbox"
              id="toggle-auto-pilot"
              checked={autoLoop}
              onChange={(e) => setAutoLoop(e.target.checked)}
              className="w-3.5 h-3.5 text-[#0052ff] rounded focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-700 font-semibold">Auto-Pilot AI Loop (8s)</span>
            {autoLoop && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
          </label>

          <div className="flex items-center space-x-2 text-xs text-slate-500 pl-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0052ff] animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Live Simulation Banner / Agent Pipeline Status */}
      {simStatus && (
        <div className="p-3.5 mb-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/90 border border-blue-200 rounded-2xl shadow-sm fade-in-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full bg-[#0052ff] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              ⚡
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#0052ff] uppercase tracking-wider">
                Autonomous AI Agent Pipeline
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-800">
                {simStatus.message}
              </div>
            </div>
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 self-start sm:self-auto ${simStatus.badgeColor}`}>
            {simStatus.badge}
          </span>
        </div>
      )}

      {loading && events.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          Loading real-time activity feed...
        </div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          No payment failure events captured yet. Click "Simulate AI Recovery" above to test the autonomous agent.
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {events.map((event) => {
            const isNew = !previousIds.has(event.payment_id) || event.isNew;
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
                  } ${isNew ? 'fade-in-card' : ''} ${event.is_simulation ? 'border-blue-200 bg-blue-50/10' : ''}`}
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
                      {event.is_simulation && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0052ff] border border-blue-200">
                          ⚡ AI Simulated
                        </span>
                      )}
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

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Click card to inspect Autonomous AI Reasoning & Diagnostic Proof</span>
                    <span className="text-[#0052ff] font-medium">{isSelected ? 'Hide Reasoning ▲' : 'View Reasoning ▼'}</span>
                  </div>
                </div>

                {/* Inline Live Agent Reasoning Panel */}
                {isSelected && (
                  <ReasoningPanel
                    paymentId={event.payment_id}
                    onClose={() => setSelectedPaymentId(null)}
                    fallbackReasoning={simulationReasonings[event.payment_id] || INITIAL_REASONING[event.payment_id]}
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
