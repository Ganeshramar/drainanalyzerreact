import React from 'react';
import { TIER_COLORS, TIER_LABELS } from '../utils/drainScore';

const DrainScoreBadge = ({ score, tier, size = 'md', showLabel = true }) => {
  const colors = TIER_COLORS[tier] || TIER_COLORS.healthy;

  const sizes = {
    sm:  { ring: 'w-10 h-10', text: 'text-xs', bar: 'h-1' },
    md:  { ring: 'w-14 h-14', text: 'text-sm', bar: 'h-1.5' },
    lg:  { ring: 'w-20 h-20', text: 'text-lg', bar: 'h-2' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Circular score display */}
      <div
        className={`${s.ring} rounded-full flex items-center justify-center relative`}
        style={{
          background: `conic-gradient(${colors.hex} ${score * 3.6}deg, #1e293b ${score * 3.6}deg)`,
        }}
      >
        <div className="absolute inset-[3px] bg-slate-900 rounded-full flex items-center justify-center">
          <span className={`font-black font-mono ${s.text} ${colors.text}`}>{score}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: colors.hex }}
        />
      </div>

      {showLabel && (
        <span className={`text-xs font-semibold ${colors.text}`}>
          {TIER_LABELS[tier]}
        </span>
      )}
    </div>
  );
};

export default DrainScoreBadge;
