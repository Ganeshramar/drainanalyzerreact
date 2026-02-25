import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, GraduationCap, IndianRupee, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    monthlyBudgetCap: user?.monthlyBudgetCap || 50,
    studentMode: user?.studentMode || false,
    currency: user?.currency || 'INR',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white mb-6">Settings</h1>

        <form onSubmit={submit} className="flex flex-col gap-5">
          {/* Profile */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">Profile</h2>
            <div>
              <label className="label">Display Name</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">₹ USD</option>
                <option value="INR">₹ INR</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-indigo-400" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">Budget Settings</h2>
            </div>
            <div>
              <label className="label">Monthly Budget Cap ($)</label>
              <input className="input" type="number" min="1" step="1"
                value={form.monthlyBudgetCap}
                onChange={(e) => setForm({ ...form, monthlyBudgetCap: parseFloat(e.target.value) })} />
              <p className="text-xs text-slate-500 mt-1.5">
                The Drain Score formula uses this cap to calculate cost weight. Lower cap = higher sensitivity.
              </p>
            </div>
          </div>

          {/* Student Mode Toggle */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap size={18} className="text-indigo-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Student / Budget Mode</div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Increases Drain Score sensitivity by reducing your effective budget cap by 40%.
                    Ideal for students or those on tight budgets.
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setForm({ ...form, studentMode: !form.studentMode })}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
                  form.studentMode ? 'bg-indigo-600' : 'bg-slate-700'
                }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.studentMode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary py-3 flex items-center justify-center gap-2">
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <><CheckCircle size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Settings</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Settings;
