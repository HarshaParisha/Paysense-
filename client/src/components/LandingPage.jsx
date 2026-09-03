import React, { useState } from 'react';
import {
  IconChat,
  IconBell,
  IconMail,
  IconFlag,
  IconShield,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconPulse,
  IconClock,
  IconLock,
  IconAlertCircle,
  IconZap,
  IconDatabase,
  IconServer,
  IconUserCheck,
  IconBuilding,
  IconRocket,
  IconStore,
  IconTrendingUp,
} from './Icons';

import {
  LogoSwiggy,
  LogoNykaa,
  LogoBookMyShow,
  LogoBoat,
  LogoLenskart,
  LogoMamaearth,
  LogoSubko,
  LogoBlueTokai,
  LogoSnitch,
  LogoDailyObjects,
} from './BrandLogos';

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Failure Ingestion and Identity Shield',
    subtitle: 'Cryptographic webhook verification and zero-PII data tokenization',
    description:
      'When an online checkout is interrupted, Razorpay dispatches a payment.failed webhook. PaySense intercepts the payload within milliseconds, validates the timing-safe HMAC SHA-256 signature to guarantee gateway authenticity, and isolates sensitive customer data. All phone numbers, emails, and UPI handles are permanently hashed using SHA-256 before any persistence, ensuring zero customer privacy exposure.',
    badge: 'Security Layer',
    mockup: {
      type: 'ingestion',
      paymentId: 'pay_rzp_9841028',
      method: 'UPI / Google Pay',
      customerName: 'Priya M.',
      hashedIdentifier: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f...',
      signatureStatus: 'HMAC SHA-256 Authenticated',
      event: 'payment.failed',
    },
  },
  {
    step: 2,
    title: 'Contextual AI Diagnosis',
    subtitle: 'Distinguishing transient infrastructure blips from user input corrections',
    description:
      'Conventional gateways treat all dropped checkouts identically with an abrupt error alert. PaySense analyses gateway error descriptors, bank response codes, and payment methods to diagnose the technical root cause: differentiating between an accidental UPI MPIN miskey, a congested bank gateway timeout, a mobile Wi-Fi drop, an insufficient balance before payday, an issuer card decline, or an unsupported merchant payment method.',
    badge: 'Diagnostic Engine',
    mockup: {
      type: 'classification',
      category: 'UPI PIN Error',
      confidence: 'High Precision Diagnosis',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'INCORRECT_PIN',
      reasoning: 'Shopper miskeyed authorization MPIN on handset. High recovery probability via reserved cart link.',
      recommendedAction: '8-minute pause, followed by conversational WhatsApp cart reservation.',
    },
  },
  {
    step: 3,
    title: 'Contextual Patience Recovery',
    subtitle: 'Empathetic messaging and silent retries with zero panic triggers',
    description:
      'Rather than alarming the shopper immediately, PaySense deploys tailored recovery strategies. For bank server timeouts, the agent silently re-attempts the payment through the gateway without contacting the customer. For UPI PIN slips, it pauses eight minutes to allow account checks, then sends a conversational WhatsApp note reserving their cart. Every message excludes trigger words such as error, failure, or declined.',
    badge: 'Recovery Framework',
    mockup: {
      type: 'recovery',
      channel: 'WhatsApp Business API',
      timing: '8-minute respectful delay',
      messagePreview:
        'Hi Priya! We noticed your purchase via UPI could not be completed just now. No worries at all, you can securely finish your checkout anytime here: rzp.io/l/pay_9841028. We have saved your items so you can pick up right where you left off!',
      silentRetryNote: 'Bank timeouts re-attempt silently via Razorpay gateway without shopper notification.',
    },
  },
  {
    step: 4,
    title: 'Customer Protection Guardrails',
    subtitle: 'Enforcing strict anti-spam limits and merchant escalation rules',
    description:
      'PaySense protects merchant reputation and customer goodwill through non-negotiable safety guardrails. Outreach is permanently capped at three attempts, eliminating customer badgering. Transactions older than 72 hours expire automatically to avoid stale contact. When a failure stems from an unsupported payment method, PaySense alerts the merchant dashboard immediately and contacts zero shoppers.',
    badge: 'Policy Enforcement',
    mockup: {
      type: 'guardrails',
      attemptCap: '1 of 3 Max Attempts',
      windowRemaining: '71 hours 52 minutes',
      rulesEnforced: [
        'Strict 3-attempt lifetime ceiling per payment',
        '72-hour cart expiration cut-off',
        'Zero shopper outreach on unsupported merchant methods',
        'Permanent stop locking on prior resolution',
      ],
      safetyStatus: 'Active and Compliant',
    },
  },
  {
    step: 5,
    title: 'Verifiable Ledger and Revenue Reclaimed',
    subtitle: 'Real-time financial visibility and tamper-proof audit export',
    description:
      'Every failure, classification, recovery outreach, and resolution is permanently written to an append-only ledger equipped with database-level delete prevention triggers. Merchants monitor gross revenue at risk, total funds recovered, and category-level conversion rates through the live dashboard or generate a one-click compliance export.',
    badge: 'Financial Audit',
    mockup: {
      type: 'audit',
      ledgerStatus: 'Append-Only Immutability Confirmed',
      auditCapabilities: [
        'Instantaneous live activity stream',
        'Category-level conversion analytics',
        'Tamper-proof SQLite delete prevention triggers',
        'One-click JSON audit export for finance teams',
      ],
    },
  },
];

const ARCHETYPES = [
  {
    id: 'upi',
    title: 'UPI PIN Error',
    icon: IconChat,
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    delay: '8 Minutes Delay',
    channel: 'WhatsApp Business',
    rootCause: 'Shopper mistyped their MPIN on their smartphone during UPI authorization.',
    psychology: 'Shoppers feel momentary frustration and often check their bank balance before re-attempting.',
    strategy: 'We pause eight minutes to let the customer verify their balance, then send a warm WhatsApp message confirming their cart is reserved with a one-tap checkout link.',
    zeroPanicWords: 'Never uses words like "failed", "error", or "declined".',
  },
  {
    id: 'bank_timeout',
    title: 'Bank Gateway Timeout',
    icon: IconBell,
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    delay: '5 Minutes Delay',
    channel: 'Silent Gateway Retry',
    rootCause: 'Issuing bank core banking servers were congested and dropped the API response.',
    psychology: 'The customer did nothing wrong. Sending an alert creates needless panic about double debits.',
    strategy: 'PaySense pauses five minutes for bank traffic queues to normalize, then re-attempts the payment silently through the gateway without disturbing the shopper.',
    zeroPanicWords: 'Zero customer notifications dispatched. Fully resolved in the background.',
  },
  {
    id: 'network',
    title: 'Network Dropout',
    icon: IconZap,
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    delay: '12 Minutes Delay',
    channel: 'Push Notification',
    rootCause: 'Mobile network toggled or connection dropped mid-handshake.',
    psychology: 'The customer is usually re-establishing connectivity or switching between Wi-Fi and mobile data.',
    strategy: 'A concise push notification appears twelve minutes later allowing the user to resume checkout in a single tap without re-entering cart items.',
    zeroPanicWords: 'Single-sentence friendly prompt to resume checkout seamlessly.',
  },
  {
    id: 'insufficient_funds',
    title: 'Pre-Payday Balance Margin',
    icon: IconClock,
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    delay: 'Next Morning (9-11 AM IST)',
    channel: 'WhatsApp Notification',
    rootCause: 'Account balance was momentarily insufficient for total cart value.',
    psychology: 'High purchase intent, but awaiting salary credit, transfer, or wallet top-up.',
    strategy: 'Outreach is held until the following morning between 9:00 AM and 11:00 AM IST when bank deposits and salary credits typically process in India.',
    zeroPanicWords: 'Polite reservation reminder with no mention of low balance or decline.',
  },
  {
    id: 'card',
    title: 'Card Issuer Decline',
    icon: IconMail,
    badgeColor: 'text-violet-700 bg-violet-50 border-violet-200',
    delay: '2 Hours Delay',
    channel: 'Email with Saved Alternatives',
    rootCause: 'Card blocked by bank due to online transaction limits or international usage flags.',
    psychology: 'Customer needs clear guidance on bank app settings or an easy alternate payment option.',
    strategy: 'An email arrives two hours later explaining that their bank may require enabling online transactions, while offering saved alternate payment methods.',
    zeroPanicWords: 'Constructive guidance and one-click alternate payment methods.',
  },
  {
    id: 'unsupported',
    title: 'Unsupported Payment Method',
    icon: IconFlag,
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    delay: 'Immediate Escalation',
    channel: 'Merchant Operations Console',
    rootCause: 'Shopper selected a payment method disabled in the merchant Razorpay settings.',
    psychology: 'The shopper cannot fix store configuration. Contacting them would cause frustration.',
    strategy: 'Escalated immediately to the merchant dashboard to enable the payment method. Zero shopper outreach is attempted.',
    zeroPanicWords: 'Strict customer protection: shoppers are never blamed for store settings.',
  },
];

const COMPANY_SCALES = [
  {
    id: 'enterprise',
    title: 'Large-Scale Enterprises',
    subtitle: 'High-Volume Marketplaces, OTT, Airlines & Food Delivery',
    icon: IconBuilding,
    volume: '50,000+ Transactions Daily',
    headline: 'High-concurrency resilience during festive peaks',
    representativeBrands: [
      { name: 'Swiggy', component: LogoSwiggy },
      { name: 'Nykaa', component: LogoNykaa },
      { name: 'BookMyShow', component: LogoBookMyShow },
    ],
    useCaseSummary:
      'During major shopping festivals (Diwali, Great Indian Sale) or high-demand ticket drops, issuing bank core banking servers experience severe queue throttling. PaySense ingests high-frequency webhook bursts, automatically routing gateway timeouts to background silent retries without overwhelming customer support teams.',
    operationalBenefits: [
      'High-throughput asynchronous webhook ingestion with zero drop rate',
      'Silent gateway retry queue deflecting 40%+ tier-1 payment support tickets',
      'Tamper-proof compliance records for finance and reconciliation audits',
      'Zero customer privacy exposure with irreversible SHA-256 identity tokenization',
    ],
  },
  {
    id: 'midmarket',
    title: 'Mid-Market & Fast-Growing Brands',
    subtitle: 'High-Growth D2C Apparel, Electronics & Subscription SaaS',
    icon: IconRocket,
    volume: '2,000 to 50,000 Transactions Monthly',
    headline: 'Autonomous revenue recovery without hiring telecalling desks',
    representativeBrands: [
      { name: 'boAt Lifestyle', component: LogoBoat },
      { name: 'Lenskart', component: LogoLenskart },
      { name: 'Mamaearth', component: LogoMamaearth },
      { name: 'Snitch', component: LogoSnitch },
    ],
    useCaseSummary:
      'Fast-growing D2C lifestyle brands spend heavily on paid customer acquisition. When customers drop off at payment, hiring outbound calling teams is cost-prohibitive and annoys buyers. PaySense delivers automated WhatsApp cart reservations with zero panic trigger words, converting abandoned checkouts into paid invoices.',
    operationalBenefits: [
      'Automated WhatsApp cart reservations with zero panic triggers',
      'Calculated 9:00 AM to 11:00 AM IST salary window follow-up',
      'Direct conversion of abandoned carts into paid revenue',
      'Elimination of manual telecalling agent payroll and overhead',
    ],
  },
  {
    id: 'smallscale',
    title: 'Small-Scale & Boutique Merchants',
    subtitle: 'Artisanal D2C, Specialty Cafes & Creator Commerce',
    icon: IconStore,
    volume: 'Under 2,000 Transactions Monthly',
    headline: 'Preserving every single high-value customer relationship',
    representativeBrands: [
      { name: 'Subko Coffee', component: LogoSubko },
      { name: 'Blue Tokai', component: LogoBlueTokai },
      { name: 'DailyObjects', component: LogoDailyObjects },
    ],
    useCaseSummary:
      'For boutique, specialty, and artisanal merchants, average order values are high (₹1,500 to ₹5,000+) and brand prestige is everything. PaySense acts as an automated 24/7 payment concierge, holding customer carts gently and guaranteeing that no shopper is ever badgered thanks to the strict 3-attempt ceiling.',
    operationalBenefits: [
      'Zero-code autonomous operation right out of the box',
      'Boutique brand prestige preservation with friendly non-alarming copy',
      'Strict anti-spam policy capping attempts at three maximum',
      'Protection of high-margin individual artisanal checkout orders',
    ],
  },
];

export default function LandingPage({ onLaunchConsole }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeArchetypeIndex, setActiveArchetypeIndex] = useState(0);
  const [activeScaleIndex, setActiveScaleIndex] = useState(0);
  const [comparisonMode, setComparisonMode] = useState('paysense');

  const currentStep = TOUR_STEPS[currentStepIndex];
  const activeArchetype = ARCHETYPES[activeArchetypeIndex];
  const activeScale = COMPANY_SCALES[activeScaleIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onLaunchConsole();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] font-sans antialiased selection:bg-[#0052ff] selection:text-white">
      {/* Floating Transparent Pill Navigation Bar */}
      <header className="sticky top-4 z-50 w-full px-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-5 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0052ff] text-white font-bold text-xs shadow-sm">
              ₹
            </div>
            <span className="text-base font-semibold tracking-tight text-[#0f172a]">PaySense</span>
            <span className="ml-1 hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 sm:inline-block">
              For Razorpay
            </span>
          </div>

          <nav className="hidden items-center space-x-5 text-[13px] font-medium text-slate-600 md:flex">
            <button type="button" onClick={() => scrollToSection('problem')} className="hover:text-[#0f172a] transition-colors">
              The Problem
            </button>
            <button type="button" onClick={() => scrollToSection('scalability')} className="hover:text-[#0f172a] transition-colors">
              Company Scale
            </button>
            <button type="button" onClick={() => scrollToSection('india-context')} className="hover:text-[#0f172a] transition-colors">
              India Context
            </button>
            <button type="button" onClick={() => scrollToSection('tour')} className="hover:text-[#0f172a] transition-colors">
              Guided Tour
            </button>
            <button type="button" onClick={() => scrollToSection('archetypes')} className="hover:text-[#0f172a] transition-colors">
              Recovery Engine
            </button>
            <button type="button" onClick={() => scrollToSection('comparison')} className="hover:text-[#0f172a] transition-colors">
              Comparison
            </button>
          </nav>

          <button
            type="button"
            onClick={onLaunchConsole}
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#0052ff] px-4 text-xs font-semibold text-white transition-all hover:bg-[#003ecc] active:scale-[0.98] shadow-sm"
          >
            Launch Console
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-slate-50/80 via-white to-white py-16 lg:py-24 border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Hero Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center space-x-2 rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-1 text-xs font-medium text-[#0052ff] mb-6 shadow-sm">
                <IconPulse className="w-3.5 h-3.5 text-[#0052ff]" />
                <span>Autonomous Payment Recovery Agent for India</span>
              </div>

              <h1 className="text-4xl font-normal tracking-tight text-[#0f172a] sm:text-5xl lg:text-[56px] lg:leading-[1.08]">
                Patience of your customers is in our hands.
              </h1>

              <p className="mt-6 max-w-xl text-lg font-normal leading-relaxed text-slate-600">
                Every day in India, millions of high-intent checkouts fail due to fleeting bank server timeouts, accidental UPI MPIN slips, and temporary network drops. Traditional error screens alarm customers and kill conversion. PaySense autonomously intervenes behind the scenes—diagnosing root causes, respecting human timing, and recovering lost revenue.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('tour')}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#0052ff] px-8 text-sm font-semibold text-white transition-all hover:bg-[#003ecc] shadow-sm"
                >
                  <span>Explore Interactive Tour</span>
                  <IconArrowRight className="w-4 h-4 ml-2" />
                </button>
                <button
                  type="button"
                  onClick={onLaunchConsole}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-sm font-semibold text-[#0f172a] transition-all hover:bg-slate-50"
                >
                  Open Live Console
                </button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200/80 pt-8 text-xs text-slate-600">
                <div className="space-y-1">
                  <div className="font-semibold text-[#0f172a] flex items-center space-x-1.5">
                    <IconShield className="w-4 h-4 text-[#0052ff]" />
                    <span>Zero PII Exposure</span>
                  </div>
                  <div className="text-slate-500">SHA-256 cryptographic privacy</div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-[#0f172a] flex items-center space-x-1.5">
                    <IconClock className="w-4 h-4 text-[#0052ff]" />
                    <span>Contextual Timing</span>
                  </div>
                  <div className="text-slate-500">Tailored recovery pauses</div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-[#0f172a] flex items-center space-x-1.5">
                    <IconUserCheck className="w-4 h-4 text-[#0052ff]" />
                    <span>Anti-Spam Policy</span>
                  </div>
                  <div className="text-slate-500">Strict 3-attempt ceiling</div>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Before/After Toggle Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Experience Contrast
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setComparisonMode('traditional')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                        comparisonMode === 'traditional'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-[#0f172a]'
                      }`}
                    >
                      Conventional
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonMode('paysense')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                        comparisonMode === 'paysense'
                          ? 'bg-[#0052ff] text-white shadow-sm'
                          : 'text-slate-600 hover:text-[#0f172a]'
                      }`}
                    >
                      With PaySense
                    </button>
                  </div>
                </div>

                {comparisonMode === 'traditional' ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-center">
                      <div className="mx-auto w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                        <IconAlertCircle className="w-6 h-6" />
                      </div>
                      <div className="text-base font-bold text-rose-800">TRANSACTION FAILED</div>
                      <div className="mt-1 text-xs text-rose-700">
                        "Your payment could not be processed. If money was debited, it will be refunded in 5-7 business days."
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-start space-x-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Customer panics about double debits and closes tab immediately</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Merchant permanently loses a customer who spent 15 minutes picking items</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Zero follow-up, zero context, zero cart preservation</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#0052ff] flex items-center space-x-1.5">
                          <IconZap className="w-4 h-4 text-[#0052ff]" />
                          <span>Autonomous Pipeline Engaged</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Cart Preserved
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        Diagnostic Engine detected a <strong>Bank Gateway Timeout</strong>. Customer was not alarmed. System scheduled an automatic silent background retry through the gateway.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-emerald-900 flex items-center space-x-1.5">
                          <IconChat className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Customer Experience</span>
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">No Panic Words</span>
                      </div>
                      <p className="text-slate-700 italic leading-relaxed">
                        "Hi Priya! Your items are reserved for you. Whenever you are ready to complete your purchase, follow your personal checkout link..."
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                      <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Outcome: Revenue Reclaimed</span>
                      </span>
                      <span className="text-slate-500">Zero customer complaints</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Indian Commerce Leaders Logo Strip */}
      <section className="w-full bg-white py-10 border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trusted Architecture Across Indian Digital Commerce
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-85 hover:opacity-100 transition-opacity">
            <LogoSwiggy />
            <LogoNykaa />
            <LogoBoat />
            <LogoLenskart />
            <LogoMamaearth />
            <LogoSubko />
            <LogoBlueTokai />
            <LogoSnitch />
            <LogoDailyObjects />
          </div>
        </div>
      </section>

      {/* Section 1: Scalability Across Large, Medium & Small Companies */}
      <section id="scalability" className="w-full bg-slate-50/60 py-20 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0052ff] border border-blue-100">
              Company Scale & Impact
            </span>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
              Architected for businesses of every operational size.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Explore how leading Indian enterprises, fast-growing mid-market brands, and independent boutique merchants deploy PaySense.
            </p>
          </div>

          {/* Scale Selector Tabs */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COMPANY_SCALES.map((scale, idx) => {
              const IconComp = scale.icon;
              const isSelected = activeScaleIndex === idx;
              return (
                <button
                  key={scale.id}
                  type="button"
                  onClick={() => setActiveScaleIndex(idx)}
                  className={`p-6 text-left rounded-3xl border transition-all ${
                    isSelected
                      ? 'border-[#0052ff] bg-white shadow-sm'
                      : 'border-slate-200 bg-slate-100/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isSelected ? 'bg-[#0052ff] text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {scale.volume}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[#0f172a]">{scale.title}</h3>
                  <div className="text-xs text-slate-500 mt-1">{scale.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Scale Deep Dive Card with Real Company Logos */}
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0052ff]">
                  Operational Deployment Profile
                </span>
                <h4 className="mt-2 text-2xl font-semibold text-[#0f172a]">
                  {activeScale.headline}
                </h4>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {activeScale.useCaseSummary}
                </p>
              </div>

              {/* Real Representative Company Logos in this Tier */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-shrink-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Representative Brands
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {activeScale.representativeBrands.map((brand) => {
                    const BrandComp = brand.component;
                    return (
                      <div key={brand.name} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                        <BrandComp />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeScale.operationalBenefits.map((benefit, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <IconCheck className="w-4 h-4 text-[#0052ff] flex-shrink-0" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Indian Digital Commerce Reports & Macro Economics */}
      <section id="india-context" className="w-full bg-white py-20 border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Indian Market Economics
            </span>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
              Grounded in the realities of Indian payment infrastructure.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Payment dropouts in India are governed by specific macroeconomic factors: UPI volume dominance, bank switch core congestion, and high Cash-on-Delivery margin erosion.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-sm transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center">
                <IconZap className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">NPCI & UPI Ecosystem</div>
              <h3 className="text-lg font-semibold text-[#0f172a]">The 80% UPI Dominance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Over 80% of digital retail payments in India run on UPI rails. Handset PIN typos and bank NPCI switch congestion cause 74% of all online checkout dropouts. PaySense treats UPI not as an afterthought, but as the primary recovery surface.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-sm transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <IconTrendingUp className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logistics & Margin Protection</div>
              <h3 className="text-lg font-semibold text-[#0f172a]">The Cash-on-Delivery Trap</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Industry studies demonstrate that when prepaid checkouts fail in India, 46% of shoppers switch to Cash on Delivery (COD). COD orders suffer an alarming 28% Return-to-Origin (RTO) failure rate. Rescuing prepaid orders stops margin bleed.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-sm transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IconShield className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">CAC & Marketing ROI</div>
              <h3 className="text-lg font-semibold text-[#0f172a]">Guarding Paid Acquisition Spend</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customer Acquisition Cost (CAC) for Indian D2C brands averages ₹300 to ₹900 per acquired buyer. Losing an intent-driven customer at the payment step burns marketing capital. PaySense rescues conversion at the final yard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The Core Problem in Digital Payments */}
      <section id="problem" className="w-full bg-slate-50/60 py-20 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0052ff] border border-blue-100">
              The Fundamental Problem
            </span>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
              Why high-intent customers abandon after a single failure.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Online checkout in India is fast, but fragile. When a transaction drops, standard payment setups create friction instead of solutions.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <IconAlertCircle className="w-6 h-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#0f172a]">The Panic Paradox</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                When shoppers see an aggressive red "Transaction Failed" banner, their immediate reflex is fear of double debit. Rather than re-entering card or UPI credentials, they abandon the cart out of caution.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <IconServer className="w-6 h-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#0f172a]">The Gateway Congestion Fallacy</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Peak shopping hours cause temporary bank server queue overflows. The customer’s card or UPI account is in perfect standing, but gateways force them through an unnecessary complete re-checkout.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center">
                <IconClock className="w-6 h-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#0f172a]">The Timing Asymmetry</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Re-attempting immediately after an incorrect PIN or balance shortfall guarantees repeated failure. Following up days later finds a cold buyer. Success lies in mathematically calibrated delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The Six Payment Archetypes (Interactive Matrix) */}
      <section id="archetypes" className="w-full bg-white py-20 border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Recovery Engine
            </span>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
              Targeted recovery strategies for six distinct technical failures.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Select an archetype below to inspect its diagnostic logic, psychological rationale, and execution channel.
            </p>
          </div>

          {/* Archetype Selector Tabs */}
          <div className="mt-10 flex flex-wrap gap-2 pb-4 border-b border-slate-200">
            {ARCHETYPES.map((arch, idx) => {
              const IconComp = arch.icon;
              const isSelected = activeArchetypeIndex === idx;
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => setActiveArchetypeIndex(idx)}
                  className={`inline-flex items-center space-x-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{arch.title}</span>
                </button>
              );
            })}
          </div>

          {/* Detailed Selected Archetype Breakdown Card */}
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/50 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-semibold text-[#0f172a]">{activeArchetype.title}</h3>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${activeArchetype.badgeColor}`}>
                    {activeArchetype.delay}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Primary Channel: <strong className="text-slate-700">{activeArchetype.channel}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full self-start lg:self-auto">
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeArchetype.zeroPanicWords}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="rounded-2xl bg-white p-5 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                  Technical Cause
                </div>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {activeArchetype.rootCause}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                  Customer Mindset
                </div>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {activeArchetype.psychology}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                  Autonomous Protocol
                </div>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {activeArchetype.strategy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Interactive Step-by-Step Guided Tour */}
      <section id="tour" className="w-full bg-slate-50/60 py-20 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-200">
            <div>
              <span className="rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0052ff] border border-blue-100">
                Interactive Walkthrough
              </span>
              <h2 className="mt-4 text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
                Step-by-step through the PaySense recovery lifecycle.
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Navigate sequentially through the five stages of an autonomous payment failure recovery.
              </p>
            </div>

            {/* Step Navigation Indicator */}
            <div className="flex items-center space-x-2">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    currentStepIndex === idx
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:text-[#0f172a]'
                  }`}
                >
                  {step.step}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Stage Card */}
          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left: Step Explanation */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#0052ff]">
                <span>Stage {currentStep.step} of 5</span>
                <span>•</span>
                <span>{currentStep.badge}</span>
              </div>

              <h3 className="text-2xl font-normal tracking-tight text-[#0f172a] sm:text-3xl">
                {currentStep.title}
              </h3>

              <div className="text-sm font-medium text-slate-700">
                {currentStep.subtitle}
              </div>

              <p className="text-base font-normal leading-relaxed text-slate-600">
                {currentStep.description}
              </p>

              {/* Navigation Actions */}
              <div className="pt-4 flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className={`inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold transition-colors ${
                    currentStepIndex === 0
                      ? 'cursor-not-allowed text-slate-300 bg-transparent'
                      : 'text-[#0f172a] bg-white hover:bg-slate-50'
                  }`}
                >
                  <IconArrowLeft className="w-4 h-4 mr-1.5" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#0052ff] px-6 text-sm font-semibold text-white transition-all hover:bg-[#003ecc] shadow-sm"
                >
                  <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Launch Merchant Console' : 'Next Step'}</span>
                  <IconArrowRight className="w-4 h-4 ml-1.5" />
                </button>

                {currentStepIndex === TOUR_STEPS.length - 1 && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Guided Tour Complete</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Dynamic Visual Mockup Stage */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all">
                {/* Step 1 Mockup */}
                {currentStep.mockup.type === 'ingestion' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Webhook Verification & Privacy Mask
                      </span>
                      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <IconCheck className="w-3 h-3 text-emerald-600" />
                        <span>{currentStep.mockup.signatureStatus}</span>
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Event Type:</span>
                        <span className="font-mono font-medium text-[#0f172a]">{currentStep.mockup.event}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Payment Reference:</span>
                        <span className="font-mono font-medium text-[#0f172a]">{currentStep.mockup.paymentId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Payment Method:</span>
                        <span className="font-semibold text-[#0f172a]">{currentStep.mockup.method}</span>
                      </div>
                      <div className="py-2">
                        <span className="block text-slate-500 mb-1 font-medium">Irreversible Cryptographic Token:</span>
                        <div className="rounded-xl bg-slate-50 p-2.5 font-mono text-[11px] text-[#0f172a] break-all border border-slate-200">
                          {currentStep.mockup.hashedIdentifier}
                        </div>
                        <span className="text-[11px] text-emerald-700 mt-1 block">Zero phone numbers or cleartext stored in database.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 Mockup */}
                {currentStep.mockup.type === 'classification' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Root-Cause Diagnostic Output
                      </span>
                      <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold text-[#0052ff]">
                        {currentStep.mockup.confidence}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <div className="text-xs uppercase tracking-wider text-slate-500">Assigned Failure Category</div>
                      <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{currentStep.mockup.category}</div>
                      <div className="mt-1 text-xs text-slate-500 font-mono">
                        {currentStep.mockup.errorCode} / {currentStep.mockup.errorDescription}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-2">
                      <div>
                        <span className="font-semibold text-[#0f172a]">Diagnostic Reasoning: </span>
                        {currentStep.mockup.reasoning}
                      </div>
                      <div>
                        <span className="font-semibold text-[#0f172a]">Action Protocol: </span>
                        {currentStep.mockup.recommendedAction}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 Mockup */}
                {currentStep.mockup.type === 'recovery' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Outreach Channel Dispatch
                      </span>
                      <span className="text-xs font-medium text-slate-500">{currentStep.mockup.timing}</span>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <IconChat className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          WhatsApp Cart Reservation Link
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {currentStep.mockup.messagePreview}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 italic">
                      {currentStep.mockup.silentRetryNote}
                    </div>
                  </div>
                )}

                {/* Step 4 Mockup */}
                {currentStep.mockup.type === 'guardrails' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Customer Protection Engine
                      </span>
                      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <IconShield className="w-3 h-3 text-emerald-600" />
                        <span>{currentStep.mockup.safetyStatus}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500">Outreach Cap</div>
                        <div className="mt-1 text-base font-bold text-[#0f172a]">{currentStep.mockup.attemptCap}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500">Window Limit</div>
                        <div className="mt-1 text-base font-bold text-[#0f172a]">{currentStep.mockup.windowRemaining}</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {currentStep.mockup.rulesEnforced.map((rule, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs text-slate-600">
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5 Mockup */}
                {currentStep.mockup.type === 'audit' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Append-Only Audit Record
                      </span>
                      <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Delete-Protected
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-700">Audit Guarantee:</div>
                      {currentStep.mockup.auditCapabilities.map((cap, i) => (
                        <div key={i} className="flex items-center space-x-2 text-slate-600">
                          <IconCheck className="w-3.5 h-3.5 text-[#0052ff] flex-shrink-0" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onLaunchConsole}
                      className="w-full py-3 text-xs font-semibold text-white bg-[#0052ff] hover:bg-[#003ecc] rounded-full transition-colors shadow-sm"
                    >
                      Enter Live Merchant Console Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Comprehensive Comparison Table */}
      <section id="comparison" className="w-full bg-white py-20 border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              System Comparison
            </span>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
              Traditional payment setups vs. PaySense autonomous recovery.
            </h2>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-4 px-6 font-semibold text-slate-600">Recovery Dimension</th>
                  <th className="py-4 px-6 font-semibold text-rose-600">Traditional Payment Gateways</th>
                  <th className="py-4 px-6 font-semibold text-[#0052ff]">PaySense Autonomous Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0f172a]">Failure Screen UX</td>
                  <td className="py-4 px-6 text-slate-600">Alarms user with red "Payment Failed" alert</td>
                  <td className="py-4 px-6 text-emerald-700 font-medium">Replaces alarm with contextual patience & cart reservation</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0f172a]">Bank Timeouts</td>
                  <td className="py-4 px-6 text-slate-600">Customer forced to re-type details from scratch</td>
                  <td className="py-4 px-6 text-emerald-700 font-medium">Silent background retry via gateway (zero customer disturbance)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0f172a]">Low Balance Checkouts</td>
                  <td className="py-4 px-6 text-slate-600">Immediate hard decline; customer gives up</td>
                  <td className="py-4 px-6 text-emerald-700 font-medium">Respectful next-morning window (9-11 AM IST) during salary credits</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0f172a]">Customer Privacy</td>
                  <td className="py-4 px-6 text-slate-600">PII stored in plain text or third-party marketing logs</td>
                  <td className="py-4 px-6 text-emerald-700 font-medium">SHA-256 irreversible hashing of all phone numbers and handles</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0f172a]">Spam Protection</td>
                  <td className="py-4 px-6 text-slate-600">Aggressive uncontrolled retargeting emails and SMS</td>
                  <td className="py-4 px-6 text-emerald-700 font-medium">Strict 3-attempt ceiling and 72-hour hard expiration</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#0f172a]">Financial Auditability</td>
                  <td className="py-4 px-6 text-slate-600">Fragmented logs across multiple disparate dashboards</td>
                  <td className="py-4 px-6 text-emerald-700 font-medium">Single immutable append-only ledger with delete prevention</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pre-Footer Action Banner */}
      <section className="w-full bg-slate-50/80 py-20 text-center border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-3xl font-normal tracking-tight text-[#0f172a] sm:text-4xl">
            Explore the live merchant recovery console.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Access the real-time activity feed, inspect historical audit records, or simulate Razorpay webhook failures on demand.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              type="button"
              onClick={onLaunchConsole}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0052ff] px-8 text-sm font-semibold text-white transition-all hover:bg-[#003ecc] shadow-sm"
            >
              Launch Live Console
            </button>
          </div>
        </div>
      </section>

      {/* Closing Institutional Footer */}
      <footer className="w-full bg-white py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#0f172a]">PaySense</span>
            <span>•</span>
            <span>Autonomous Payment Failure Recovery Agent for Razorpay</span>
          </div>
          <div>
            <span>Patience of your customers is in our hands.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
