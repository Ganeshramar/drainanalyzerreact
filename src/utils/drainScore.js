/**
 * Client-side Drain Score calculator
 * Mirrors server/src/modules/analytics/drainEngine.js
 * Used for instant feedback in the UI without a network call.
 */

export const THRESHOLDS = { CRITICAL: 70, WARNING: 40 };
export const TIER_COLORS = {
  critical: { text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/25',     hex: '#ef4444' },
  warning:  { text: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/25',   hex: '#f59e0b' },
  healthy:  { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', hex: '#10b981' },
};

export const TIER_LABELS = {
  critical: '🔴 Critical Drain',
  warning:  '🟡 Warning',
  healthy:  '🟢 Healthy',
};

export const calculateDrainScore = ({ cost, frequency, daysSinceUse, budgetCap = 50, studentMode = false }) => {
  const effectiveCap = studentMode ? budgetCap * 0.6 : budgetCap;
  const costWeight    = Math.min(cost / Math.max(effectiveCap, 1), 1);
  const recencyWeight = Math.min(daysSinceUse / 30, 1);
  const usageWeight   = Math.max(0, 1 - frequency / 20);

  const score = Math.round(costWeight * 35 + recencyWeight * 40 + usageWeight * 25);
  const tier = score > THRESHOLDS.CRITICAL ? 'critical' : score >= THRESHOLDS.WARNING ? 'warning' : 'healthy';

  return { score, tier };
};

export const toMonthly = (cost, billingCycle) => {
  switch (billingCycle) {
    case 'Annual':   return +(cost / 12).toFixed(2);
    case 'Weekly':   return +(cost * 4.33).toFixed(2);
    case 'Lifetime': return 0;
    default:         return +cost.toFixed(2);
  }
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const getDaysUntilRenewal = (renewalDate) => {
  const diff = new Date(renewalDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDaysSinceLastUse = (lastUsedDate) => {
  if (!lastUsedDate) return 30;
  const diff = new Date() - new Date(lastUsedDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const CATEGORY_ICONS = {
  OTT: '📺',
  Music: '🎵',
  Productivity: '⚡',
  Gaming: '🎮',
  News: '📰',
  Fitness: '🏋️',
  Cloud: '☁️',
  Education: '🎓',
  Software: '💻',
  Other: '📦',
};

export const POPULAR_SERVICES = [
  { name: 'Netflix',        category: 'OTT',         color: '#E50914', cancelUrl: 'https://netflix.com/cancelplan' },
  { name: 'Disney+',        category: 'OTT',         color: '#113CCF', cancelUrl: 'https://disneyplus.com' },
  { name: 'Spotify',        category: 'Music',        color: '#1DB954', cancelUrl: 'https://spotify.com/account' },
  { name: 'Apple Music',    category: 'Music',        color: '#FA243C', cancelUrl: 'https://appleid.apple.com' },
  { name: 'YouTube Premium',category: 'OTT',         color: '#FF0000', cancelUrl: 'https://youtube.com/premium' },
  { name: 'Amazon Prime',   category: 'OTT',         color: '#FF9900', cancelUrl: 'https://amazon.com/prime' },
  { name: 'Microsoft 365',  category: 'Software',     color: '#D83B01', cancelUrl: 'https://account.microsoft.com' },
  { name: 'Adobe Creative', category: 'Software',     color: '#FF0000', cancelUrl: 'https://account.adobe.com' },
  { name: 'Notion',         category: 'Productivity', color: '#000000', cancelUrl: 'https://notion.so' },
  { name: 'ChatGPT Plus',   category: 'Productivity', color: '#74AA9C', cancelUrl: 'https://chat.openai.com' },
  { name: 'iCloud',         category: 'Cloud',        color: '#147EFB', cancelUrl: 'https://appleid.apple.com' },
  { name: 'Google One',     category: 'Cloud',        color: '#4285F4', cancelUrl: 'https://one.google.com' },
  { name: 'Dropbox',        category: 'Cloud',        color: '#0061FF', cancelUrl: 'https://dropbox.com/account' },
  { name: 'Xbox Game Pass', category: 'Gaming',       color: '#107C10', cancelUrl: 'https://xbox.com' },
  { name: 'PlayStation+',   category: 'Gaming',       color: '#003087', cancelUrl: 'https://playstation.com' },
  { name: 'Duolingo Plus',  category: 'Education',    color: '#58CC02', cancelUrl: 'https://duolingo.com' },
];
