import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IconDownload } from './Icons';

function formatCategory(cat) {
  if (!cat) return '';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Report() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/report');
      if (!res.ok) throw new Error('Failed to load recovery report');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Error loading report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExport = async () => {
    try {
      setDownloading(true);
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'paysense_audit_export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download audit log export: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
        Generating recovery performance report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center text-sm text-red-600 bg-red-50 rounded-2xl border border-red-200">
        {error || 'Unable to retrieve report metrics.'}
      </div>
    );
  }

  const totalProcessed = report.total_processed || 0;
  const totalAttempts = report.total_attempts || 0;
  const totalRecovered = report.total_recovered || 0;
  const totalRevenue = report.total_revenue_recovered_rupees || 0;
  const overallRate =
    totalAttempts > 0
      ? ((totalRecovered / totalAttempts) * 100).toFixed(1)
      : '0.0';

  const breakdown = report.category_breakdown || [];

  const chartData = breakdown.map((row) => ({
    category: formatCategory(row.failure_category),
    Attempts: row.attempts || 0,
    Recovered: row.recovered || 0,
  }));

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#0f172a]">Autonomous Recovery Report</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Comprehensive audit metrics and category conversion efficiency</p>
        </div>

        {/* Export Audit Log Button with Icon */}
        <button
          type="button"
          id="btn-export-audit"
          onClick={handleExport}
          disabled={downloading}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0052ff] hover:bg-[#003ecc] rounded-full transition-colors self-start sm:self-auto shadow-sm"
        >
          <IconDownload className="w-3.5 h-3.5" />
          <span>{downloading ? 'Downloading...' : 'Export Audit Log'}</span>
        </button>
      </div>

      {/* Five metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Failures Processed
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-[#0f172a] font-mono">
            {totalProcessed.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Captured from Razorpay</div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Recovery Attempts
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-[#0f172a] font-mono">
            {totalAttempts.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Dispatched actions</div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Successful Recoveries
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
            {totalRecovered.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Resolved transactions</div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Revenue Recovered
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-[#0052ff] font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Direct gross value saved</div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Overall Recovery Rate
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-[#0f172a] font-mono">
            {overallRate}%
          </div>
          <div className="mt-1 text-xs text-slate-400">Efficiency on attempts</div>
        </div>
      </div>

      {/* Category Breakdown Table (Placed first before the chart) */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto smooth-scroll-x w-full">
          <table className="w-full min-w-[540px] text-left border-collapse">
            <thead>
              <tr className="bg-[#0052ff] text-white text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Failure Category</th>
                <th className="py-3 px-4 font-semibold text-right">Attempts</th>
                <th className="py-3 px-4 font-semibold text-right">Recovered</th>
                <th className="py-3 px-4 font-semibold text-right">Recovery Rate %</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {breakdown.map((row, idx) => {
                const isEven = idx % 2 === 1;
                const rateNum = Number(row.recovery_rate_percent || 0);
                return (
                  <tr
                    key={row.failure_category}
                    className={`border-t border-slate-100 ${
                      isEven ? 'bg-slate-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-[#0f172a]">
                      {formatCategory(row.failure_category)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                      {(row.attempts || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 font-mono">
                      {(row.recovered || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
                          rateNum > 50
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rateNum > 0
                            ? 'bg-blue-50 text-[#0052ff] border border-blue-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {rateNum.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery Performance Chart (Placed directly beneath the table) */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#0f172a]">Recovery Performance</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Attempts versus successful recoveries across failure categories</p>
        </div>
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="category"
                angle={-20}
                textAnchor="end"
                interval={0}
                height={45}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar dataKey="Attempts" fill="#475569" isAnimationActive={false} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recovered" fill="#059669" isAnimationActive={false} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
