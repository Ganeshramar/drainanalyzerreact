import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Search, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../hooks/useSubscriptions';
import DrainScoreBadge from '../components/DrainScoreBadge';
import {
  calculateDrainScore, toMonthly, POPULAR_SERVICES,
  CATEGORY_ICONS, getDaysSinceLastUse,
} from '../utils/drainScore';

const CATEGORIES = ['OTT','Music','Productivity','Gaming','News','Fitness','Cloud','Education','Software','Other'];
const BILLING_CYCLES = ['Monthly','Annual','Weekly','Lifetime'];

const AddSubscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addSubscription } = useSubscriptions();

  const [form, setForm] = useState({
    serviceName: '',
    category: 'OTT',
    originalCost: '',
    billingCycle: 'Monthly',
    renewalDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    usageFrequency: '',
    cancelUrl: '',
    downgradeUrl: '',
    color: '#6366f1',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [liveScore, setLiveScore] = useState(null);

  // Quick-fill from popular service
  const quickFill = (service) => {
    setForm((f) => ({
      ...f,
      serviceName: service.name,
      category: service.category,
      color: service.color,
      cancelUrl: service.cancelUrl,
    }));
    setServiceSearch('');
  };

  const filteredServices = POPULAR_SERVICES.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // Live Drain Score preview
  useEffect(() => {
    const cost = parseFloat(form.originalCost);
    if (!cost || cost <= 0) { setLiveScore(null); return; }

    const monthly = toMonthly(cost, form.billingCycle);
    const freq = parseInt(form.usageFrequency) || 0;
    const result = calculateDrainScore({
      cost: monthly,
      frequency: freq,
      daysSinceUse: 15, // Assume middle ground for new entries
      budgetCap: user?.monthlyBudgetCap || 50,
      studentMode: user?.studentMode || false,
    });
    setLiveScore(result);
  }, [form.originalCost, form.billingCycle, form.usageFrequency, user]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addSubscription({
        ...form,
        originalCost: parseFloat(form.originalCost),
        usageFrequency: parseInt(form.usageFrequency) || 0,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">No Bank Link Required</span>
          </div>
          <h1 className="text-2xl font-black text-white">Add Subscription</h1>
          <p className="text-slate-400 text-sm mt-1">Enter details manually — your privacy is protected.</p>
        </div>

        {/* Quick-pick popular services */}
        <div className="card p-5 mb-6">
          <label className="label">Quick Pick a Service</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-9" placeholder="Search Netflix, Spotify, Adobe…"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)} />
          </div>

          {serviceSearch && filteredServices.length > 0 && (
            <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {filteredServices.map((s) => (
                <button key={s.name} type="button" onClick={() => quickFill(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: s.color + '22' }}>
                    {CATEGORY_ICONS[s.category]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.category}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider text-slate-400">Service Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Service Name *</label>
                <input className="input" placeholder="e.g. Netflix" value={form.serviceName}
                  onChange={(e) => set('serviceName', e.target.value)} required />
              </div>

              <div>
                <label className="label">Category *</label>
                <div className="relative">
                  <select className="input appearance-none pr-9" value={form.category}
                    onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="label">Billing Cycle *</label>
                <div className="relative">
                  <select className="input appearance-none pr-9" value={form.billingCycle}
                    onChange={(e) => set('billingCycle', e.target.value)}>
                    {BILLING_CYCLES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="label">
                  Cost ({form.billingCycle}) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input className="input pl-7" type="number" step="0.01" min="0" placeholder="9.99"
                    value={form.originalCost}
                    onChange={(e) => set('originalCost', e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Next Renewal *</label>
                <input className="input" type="date" value={form.renewalDate}
                  onChange={(e) => set('renewalDate', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Usage Tracking */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">Usage Tracking</h2>
            <div>
              <label className="label">Times Used This Month</label>
              <input className="input" type="number" min="0" max="31" placeholder="e.g. 8 times"
                value={form.usageFrequency}
                onChange={(e) => set('usageFrequency', e.target.value)} />
              <p className="text-xs text-slate-500 mt-1.5">
                How often did you actually use this service this month? (0 = never)
              </p>
            </div>
          </div>

          {/* Nudge URLs */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">Quick Action URLs (Optional)</h2>
            <div>
              <label className="label">Cancel Page URL</label>
              <input className="input" type="url" placeholder="https://example.com/cancel"
                value={form.cancelUrl}
                onChange={(e) => set('cancelUrl', e.target.value)} />
            </div>
            <div>
              <label className="label">Downgrade Plan URL</label>
              <input className="input" type="url" placeholder="https://example.com/plans"
                value={form.downgradeUrl}
                onChange={(e) => set('downgradeUrl', e.target.value)} />
            </div>
          </div>

          {/* Live Drain Score Preview */}
          {liveScore && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="card p-6 flex items-center gap-6">
              <DrainScoreBadge score={liveScore.score} tier={liveScore.tier} size="lg" />
              <div>
                <div className="text-sm font-bold text-white">Predicted Drain Score</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Based on cost and usage. Update usage frequency after a month for accurate scoring.
                </div>
                {form.originalCost && (
                  <div className="text-xs font-mono text-slate-400 mt-2">
                    Monthly: ${toMonthly(parseFloat(form.originalCost), form.billingCycle)} ·
                    Annual: ${(toMonthly(parseFloat(form.originalCost), form.billingCycle) * 12).toFixed(2)}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={15} /> Add Subscription
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddSubscription;
