import React from 'react';
import type { HistoryItem } from '../types.ts';
import { History, BarChart3 } from 'lucide-react';

interface HistoryStatsProps {
  history: HistoryItem[];
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ history }) => {
  const total = history.length;
  const downCount = history.filter((h) => h.outcome === 'DOWN').length;
  const sevenCount = history.filter((h) => h.outcome === 'SEVEN').length;
  const upCount = history.filter((h) => h.outcome === 'UP').length;

  const downPct = total > 0 ? Math.round((downCount / total) * 100) : 42;
  const sevenPct = total > 0 ? Math.round((sevenCount / total) * 100) : 16;
  const upPct = total > 0 ? Math.round((upCount / total) * 100) : 42;

  return (
    <div className="w-full max-w-5xl mx-auto mt-3 p-3 bg-neutral-900/70 border border-white/10 rounded-2xl backdrop-blur-md">
      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300/80">
          <History className="w-3.5 h-3.5" />
          <span>Recent Roll Roadmap</span>
        </div>

        {/* Stats Summary Percentages */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            7 Down: {downPct}%
          </span>
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Lucky 7: {sevenPct}%
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            7 Up: {upPct}%
          </span>
        </div>
      </div>

      {/* Visual Roadmap Bead Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-thin">
        {history.length === 0 ? (
          <div className="text-xs text-neutral-500 py-1 italic">
            No rolls recorded yet. Place bets for the first roll!
          </div>
        ) : (
          history.slice(0, 18).map((item, idx) => {
            const isDown = item.outcome === 'DOWN';
            const isSeven = item.outcome === 'SEVEN';
            const isUp = item.outcome === 'UP';

            let badgeStyle = '';
            let label = '';

            if (isSeven) {
              badgeStyle =
                'bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 border-yellow-200 ring-2 ring-amber-400/50';
              label = `${item.sum}★`;
            } else if (isDown) {
              badgeStyle =
                'bg-emerald-900/60 text-emerald-300 border-emerald-500/50 hover:bg-emerald-800/80';
              label = `${item.sum}▼`;
            } else if (isUp) {
              badgeStyle =
                'bg-rose-900/60 text-rose-300 border-rose-500/50 hover:bg-rose-800/80';
              label = `${item.sum}▲`;
            }

            return (
              <div
                key={`${item.round}_${idx}`}
                title={`Round #${item.round}: Dice [${item.die1}, ${item.die2}] = ${item.sum} (${item.outcome})${item.isDouble ? ' [PAIR]' : ''}`}
                className={`relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border text-xs font-black font-mono shadow transition-transform hover:scale-110 cursor-pointer ${badgeStyle} ${
                  idx === 0 ? 'ring-2 ring-white scale-105' : ''
                }`}
              >
                {label}
                {item.isDouble && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 ring-1 ring-white" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Visual Proportional Bar */}
      {total > 0 && (
        <div className="w-full h-1.5 rounded-full overflow-hidden flex mt-2 bg-neutral-800">
          <div style={{ width: `${downPct}%` }} className="bg-emerald-500 transition-all duration-500" />
          <div style={{ width: `${sevenPct}%` }} className="bg-amber-400 transition-all duration-500" />
          <div style={{ width: `${upPct}%` }} className="bg-rose-500 transition-all duration-500" />
        </div>
      )}
    </div>
  );
};
