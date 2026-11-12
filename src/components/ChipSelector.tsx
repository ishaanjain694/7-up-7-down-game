import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Sparkles, PlusCircle, Gift } from 'lucide-react';
import { sound } from '../sound.ts';

interface ChipSelectorProps {
  selectedAmount: number;
  onSelectAmount: (amt: number) => void;
  playerChips: number;
  onClearBets: () => void;
  onClaimFreeChips: () => void;
  disabled?: boolean;
  totalActiveBets: number;
  onOpenDailyBonus?: () => void;
  dailyBonusAvailable?: boolean;
}

const CHIP_VALUES = [
  { value: 10, label: '10', color: 'from-blue-600 via-blue-500 to-indigo-700', border: 'border-blue-300', ring: 'ring-blue-400' },
  { value: 50, label: '50', color: 'from-rose-600 via-red-500 to-rose-700', border: 'border-rose-300', ring: 'ring-rose-400' },
  { value: 100, label: '100', color: 'from-emerald-600 via-teal-500 to-emerald-700', border: 'border-emerald-300', ring: 'ring-emerald-400' },
  { value: 500, label: '500', color: 'from-amber-600 via-yellow-500 to-amber-700', border: 'border-amber-200', ring: 'ring-amber-400' },
  { value: 1000, label: '1K', color: 'from-purple-700 via-fuchsia-600 to-purple-900', border: 'border-fuchsia-300', ring: 'ring-fuchsia-400' },
];

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  selectedAmount,
  onSelectAmount,
  playerChips,
  onClearBets,
  onClaimFreeChips,
  disabled = false,
  totalActiveBets,
  onOpenDailyBonus,
  dailyBonusAvailable = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-neutral-900/90 border border-amber-500/20 rounded-2xl backdrop-blur-md shadow-2xl">
      {/* Balance, Faucet & Daily Bonus */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start flex-wrap">
        <div className="flex items-center gap-2.5 bg-black/60 px-4 py-2 rounded-xl border border-amber-400/30 shadow-inner">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-amber-950 font-black text-sm shadow-md ring-2 ring-amber-400/40">
            🪙
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] tracking-wider uppercase text-amber-300/70 font-semibold">
              Your Chips
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300 drop-shadow">
              ${playerChips.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Daily Bonus Ready Pill */}
        {dailyBonusAvailable && onOpenDailyBonus && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.playPop();
              onOpenDailyBonus();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/30 border border-yellow-200 animate-pulse cursor-pointer"
            title="Claim your Daily Chip Reward!"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Bonus Ready!</span>
          </motion.button>
        )}

        {/* Free bonus chips button if low balance */}
        {playerChips < 200 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.playCoin();
              onClaimFreeChips();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/50 border border-emerald-400/40 animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>+500 Refill</span>
          </motion.button>
        )}
      </div>

      {/* Chips Selection Row */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 px-1">
        {CHIP_VALUES.map((chip) => {
          const isSelected = selectedAmount === chip.value;
          const canAfford = playerChips >= chip.value;

          return (
            <motion.button
              key={chip.value}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sound.playChip();
                onSelectAmount(chip.value);
              }}
              disabled={disabled}
              className={`relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-b ${chip.color} border-2 ${chip.border} shadow-lg cursor-pointer transition-all ${
                isSelected
                  ? 'ring-4 ring-amber-400 scale-110 shadow-amber-500/50 -translate-y-1 z-10'
                  : 'opacity-90 hover:opacity-100'
              } ${!canAfford ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
            >
              {/* Outer dashed dashed casino stitching */}
              <div className="absolute inset-1 rounded-full border border-dashed border-white/60 pointer-events-none" />
              {/* Inner core circle */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-900/80 flex items-center justify-center text-[10px] sm:text-xs font-black font-mono text-white tracking-tighter drop-shadow">
                {chip.label}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Action Controls (Clear Bets, Current Bet Total) */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {totalActiveBets > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
            Bet: ${totalActiveBets.toLocaleString()}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            sound.playChip();
            onClearBets();
          }}
          disabled={disabled || totalActiveBets === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-300 rounded-xl text-xs font-semibold border border-white/10 transition-colors"
          title="Clear all active bets for this round"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </motion.button>
      </div>
    </div>
  );
};
