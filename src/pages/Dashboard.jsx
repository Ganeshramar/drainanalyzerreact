import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  IndianRupee, TrendingDown, AlertTriangle, Zap,
  ExternalLink, ChevronDown, Plus, RefreshCw, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../hooks/useSubscriptions';
import DrainScoreBadge from '../components/DrainScoreBadge';
import { formatCurrency, CATEGORY_ICONS, TIER_COLORS, getDaysUntilRenewal } from '../utils/drainScore';

// ─── Summary Card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, accent, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="card p-6 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-slate-500 text-sm font-medium">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <div className="text-3xl font-black text-white font-mono">{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </motion.div>
);

// ─── Subscription Row ─────────────────────────────────────────────────────────
const SubRow = ({ sub, onLogUsage }) => {
  const colors = TIER_COLORS[sub.drainTier] || TIER_COLORS.healthy;
  const daysLeft = getDaysUntilRenewal(sub.renewalDate);

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 px-5 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">

      {/* Color swatch + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold"
          style={{ background: sub.color + '22', border: `1px solid ${sub.color}44` }}>
          {CATEGORY_ICONS[sub.category] || '📦'}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-white text-sm truncate">{sub.serviceName}</div>
          <div className="text-xs text-slate-500">{sub.category} · renews in {daysLeft}d</div>
        </div>
      </div>

      {/* Drain Score */}
      <div className="flex-shrink-0 hidden sm:block">
        <DrainScoreBadge score={sub.drainScore} tier={sub.drainTier} size="sm" showLabel={false} />
      </div>

      {/* Cost */}
      <div className="text-right flex-shrink-0">
        <div className="font-mono font-bold text-white text-sm">
          {formatCurrency(sub.costMonthly)}/mo
        </div>
        <div className="text-xs text-slate-500">
          {formatCurrency(sub.annualLoss)}/yr
        </div>
      </div>

      {/* Nudge Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {sub.drainTier === 'critical' && sub.cancelUrl && (
          <a href={sub.cancelUrl} target="_blank" rel="noopener noreferrer" className="btn-danger">
            Cancel <ExternalLink size={11} className="inline" />
          </a>
        )}
        {sub.drainTier === 'warning' && sub.downgradeUrl && (
          <a href={sub.downgradeUrl} target="_blank" rel="noopener noreferrer" className="btn-warning">
            Downgrade <ExternalLink size={11} className="inline" />
          </a>
        )}
        <button onClick={() => onLogUsage(sub._id)}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
          +Use
        </button>
      </div>
    </motion.div>
  );
};

// ─── Overlap Alert Card ───────────────────────────────────────────────────────
const OverlapAlert = ({ overlap }) => (
  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl">
    <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
    <div>
      <div className="text-sm font-semibold text-amber-300">{overlap.category} Overlap Detected</div>
      <div className="text-xs text-amber-400/70 mt-1">{overlap.recommendation}</div>
      <div className="text-xs font-mono text-amber-300 mt-1">
        Save ${overlap.potentialSaving}/mo · ${(overlap.potentialSaving * 12).toFixed(0)}/yr
      </div>
    </div>
  </div>
);

// ─── Custom Tooltip for Chart ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="font-mono font-bold" style={{ color: p.color }}>
          ${p.value.toFixed(2)}
        </div>
      ))}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { subscriptions, analytics, history, loading, error, refetch, logUsage } = useSubscriptions();
  const [sortBy, setSortBy] = useState('drain'); // 'drain' | 'cost' | 'name'

  const handleLogUsage = async (id) => {
    await logUsage(id, { minutesUsed: 30 });
  };

  const sorted = [...subscriptions].sort((a, b) => {
    if (sortBy === 'drain') return (b.drainScore || 0) - (a.drainScore || 0);
    if (sortBy === 'cost')  return b.costMonthly - a.costMonthly;
    return a.serviceName.localeCompare(b.serviceName);
  });

  // Build chart data from history + current month estimate
  const chartData = history.map((h) => ({
    name: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][h.month - 1]} ${h.year.toString().slice(2)}`,
    spend: h.totalMonthlySpend,
    savings: h.potentialMonthlySavings,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Analyzing your subscriptions…</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && subscriptions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">💸</div>
        <h2 className="text-2xl font-black text-white mb-2">No subscriptions tracked yet</h2>
        <p className="text-slate-400 mb-8">Add your first subscription to start analyzing your spending drain.</p>
        <Link to="/add" className="btn-primary">
          <Plus size={16} className="inline mr-2" />Add Your First Subscription
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Drain Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Hey {user?.name?.split(' ')[0]} 👋 — here's where your money is leaking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.studentMode && (
            <span className="text-xs font-bold bg-indigo-900/50 text-indigo-400 border border-indigo-800 px-3 py-1.5 rounded-full">
              🎓 Student Mode ON
            </span>
          )}
          <button onClick={refetch}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <RefreshCw size={16} />
          </button>
          <Link to="/add" className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add
          </Link>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Monthly Leakage"
            value={formatCurrency(analytics.summary.totalMonthlySpend)}
            sub={`${analytics.summary.counts.total} active subscriptions`}
            icon={ IndianRupee} accent="bg-indigo-600" delay={0} />
          <StatCard label="Annual Projection"
            value={formatCurrency(analytics.summary.projectedAnnualSpend)}
            sub="If nothing changes"
            icon={TrendingDown} accent="bg-rose-600" delay={0.05} />
          <StatCard label="Potential Savings"
            value={formatCurrency(analytics.summary.potentialMonthlySavings) + '/mo'}
            sub={`${formatCurrency(analytics.summary.potentialAnnualSavings)} saved/year`}
            icon={Zap} accent="bg-emerald-600" delay={0.1} />
          <StatCard label="Critical Drains"
            value={analytics.summary.counts.critical}
            sub={`${analytics.summary.counts.warning} warnings · ${analytics.summary.counts.healthy} healthy`}
            icon={AlertTriangle} accent="bg-amber-600" delay={0.15} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Subscription Health Table (2/3 width) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Overlap Alerts */}
          {analytics?.overlaps?.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">⚠️ Overlap Detection</h2>
              {analytics.overlaps.map((o, i) => (
                <OverlapAlert key={i} overlap={o} />
              ))}
            </div>
          )}

          {/* Subscription Table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="font-black text-white">Subscription Health</h2>
              <div className="flex items-center gap-1">
                {['drain', 'cost', 'name'].map((opt) => (
                  <button key={opt} onClick={() => setSortBy(opt)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      sortBy === opt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {sorted.map((sub) => (
                <SubRow key={sub._id} sub={sub} onLogUsage={handleLogUsage} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex flex-col gap-6">

          {/* Privacy badge */}
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-400">Privacy-First Mode</div>
              <div className="text-xs text-slate-500 mt-0.5">No bank link · Data stays in your account</div>
            </div>
          </div>

          {/* Usage Decline Chart */}
          {chartData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-white mb-1">Spend Trend</h3>
              <p className="text-xs text-slate-500 mb-4">Monthly spend over last {chartData.length} months</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40}
                    tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} />
                  <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2}
                    strokeDasharray="4 2" dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" /> Spend
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> Savings
                </span>
              </div>
            </div>
          )}

          {/* Budget progress */}
          {analytics && (
            <div className="card p-5">
              <h3 className="font-bold text-white mb-3">Budget Usage</h3>
              {(() => {
                const pct = Math.min((analytics.summary.totalMonthlySpend / (user?.monthlyBudgetCap || 50)) * 100, 100);
                const over = pct >= 100;
                return (
                  <>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>{formatCurrency(analytics.summary.totalMonthlySpend)} spent</span>
                      <span>Cap: {formatCurrency(user?.monthlyBudgetCap || 50)}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className={`text-xs mt-2 font-medium ${over ? 'text-red-400' : 'text-slate-400'}`}>
                      {over ? `🚨 ${Math.round(pct - 100)}% over budget` : `${Math.round(pct)}% of monthly cap used`}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
