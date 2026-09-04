import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ActivityFeed from './components/ActivityFeed';
import Report from './components/Report';
import { IconArrowLeft } from './components/Icons';
import { INITIAL_REPORT } from './data/seedData';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' or 'console'
  const [activeTab, setActiveTab] = useState('activity');
  const [tickerData, setTickerData] = useState({
    atRisk: INITIAL_REPORT.total_at_risk_rupees,
    recovered: INITIAL_REPORT.total_revenue_recovered_rupees,
    rate: ((INITIAL_REPORT.total_recovered / INITIAL_REPORT.total_attempts) * 100).toFixed(1),
  });

  const fetchTickerMetrics = async () => {
    try {
      const res = await fetch('/api/report');
      if (!res.ok) return;
      const data = await res.json();
      const atRisk = data.total_at_risk_rupees || 0;
      const recovered = data.total_revenue_recovered_rupees || 0;
      const attempts = data.total_attempts || 0;
      const succ = data.total_recovered || 0;
      const rate = attempts > 0 ? ((succ / attempts) * 100).toFixed(1) : '0.0';

      setTickerData({
        atRisk,
        recovered,
        rate,
      });
    } catch (err) {
      // Keep existing ticker metrics if API is unreachable
    }
  };

  useEffect(() => {
    fetchTickerMetrics();
    const interval = setInterval(fetchTickerMetrics, 3000);

    const handleSimulationEvent = (e) => {
      const { activity } = e.detail || {};
      if (!activity) return;
      setTickerData((prev) => {
        const atRisk = prev.atRisk + (activity.amount_rupees || 0);
        const recovered = activity.current_status === 'Recovered' ? prev.recovered + activity.amount_rupees : prev.recovered;
        const rate = atRisk > 0 ? ((recovered / atRisk) * 100).toFixed(1) : prev.rate;
        return { atRisk, recovered, rate };
      });
    };

    window.addEventListener('paysense:simulated-recovery', handleSimulationEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('paysense:simulated-recovery', handleSimulationEvent);
    };
  }, []);

  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchConsole={() => {
          setCurrentView('console');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0f172a] font-sans antialiased">
      {/* Light-Theme Real-Time Revenue Ticker Strip at the Very Top */}
      <div className="w-full bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
            <div className="px-1 sm:px-2 md:px-4">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                At Risk
              </div>
              <div className="text-sm sm:text-base md:text-xl font-bold text-[#0f172a] mt-0.5 tracking-tight font-mono truncate">
                ₹{tickerData.atRisk.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="px-1 sm:px-2 md:px-4">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recovered
              </div>
              <div className="text-sm sm:text-base md:text-xl font-bold text-emerald-600 mt-0.5 tracking-tight font-mono truncate">
                ₹{tickerData.recovered.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="px-1 sm:px-2 md:px-4">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recovery Rate
              </div>
              <div className="text-sm sm:text-base md:text-xl font-bold text-[#0052ff] mt-0.5 tracking-tight font-mono">
                {tickerData.rate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating/Sticky Header Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-[#0052ff] py-1.5 px-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0052ff] transition-all min-h-[36px]"
                title="Return to Landing Page and Guided Tour"
              >
                <IconArrowLeft className="w-3.5 h-3.5" />
                <span>Overview & Tour</span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#0052ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  ₹
                </div>
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#0f172a]">
                  PaySense
                </h1>
                <span className="hidden xs:inline-block text-[11px] px-2.5 py-0.5 font-medium bg-blue-50 text-[#0052ff] rounded-full border border-blue-100">
                  Console
                </span>
              </div>
            </div>

            {/* Switchable Pill Tab Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full border border-slate-200 w-full sm:w-auto">
              <button
                type="button"
                id="tab-live-activity"
                onClick={() => setActiveTab('activity')}
                className={`flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-full transition-all text-center min-h-[36px] flex items-center justify-center ${
                  activeTab === 'activity'
                    ? 'bg-[#0052ff] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0f172a] bg-transparent'
                }`}
              >
                Live Activity
              </button>
              <button
                type="button"
                id="tab-recovery-report"
                onClick={() => setActiveTab('report')}
                className={`flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-full transition-all text-center min-h-[36px] flex items-center justify-center ${
                  activeTab === 'report'
                    ? 'bg-[#0052ff] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0f172a] bg-transparent'
                }`}
              >
                Recovery Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {activeTab === 'activity' ? <ActivityFeed /> : <Report />}
      </main>
    </div>
  );
}
