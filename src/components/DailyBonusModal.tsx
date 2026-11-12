import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { sound } from '../sound.ts';
import { Gift, Sparkles, Clock, Check, Crown, Flame, X, Coins } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (amount: number) => void;
}

const STORAGE_LAST_CLAIMED = '7up7down_daily_bonus_last_claimed';
const STORAGE_STREAK = '7up7down_daily_streak';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const STREAK_RESET_MS = 48 * 60 * 60 * 1000; // Reset streak if missed 48h

export const DAILY_REWARDS = [
  { day: 1, amount: 1000, label: 'Day 1', icon: '🪙' },
  { day: 2, amount: 1500, label: 'Day 2', icon: '🪙' },
  { day: 3, amount: 2000, label: 'Day 3', icon: '💰' },
  { day: 4, amount: 2500, label: 'Day 4', icon: '💰' },
  { day: 5, amount: 3000, label: 'Day 5', icon: '💎' },
  { day: 6, amount: 4000, label: 'Day 6', icon: '💎' },
  { day: 7, amount: 5000, label: 'Day 7', icon: '👑', isJackpot: true },
];

export function getDailyBonusStatus(): {
  canClaim: boolean;
  timeRemainingMs: number;
  currentStreak: number;
  nextRewardAmount: number;
} {
  if (typeof window === 'undefined') {
    return { canClaim: true, timeRemainingMs: 0, currentStreak: 1, nextRewardAmount: 1000 };
  }

  const lastClaimedRaw = localStorage.getItem(STORAGE_LAST_CLAIMED);
  const streakRaw = localStorage.getItem(STORAGE_STREAK);

  const now = Date.now();
  const lastClaimed = lastClaimedRaw ? parseInt(lastClaimedRaw, 10) : 0;
  let streak = streakRaw ? parseInt(streakRaw, 10) : 1;

  // If player hasn't claimed within 48h, reset streak to Day 1
  if (lastClaimed > 0 && now - lastClaimed > STREAK_RESET_MS) {
    streak = 1;
    localStorage.setItem(STORAGE_STREAK, '1');
  }

  const timeRemainingMs = Math.max(0, lastClaimed + COOLDOWN_MS - now);
  const canClaim = timeRemainingMs <= 0;

  // Streak wraps 1-7
  const currentDayIndex = ((streak - 1) % 7);
  const nextRewardAmount = DAILY_REWARDS[currentDayIndex].amount;

  return { canClaim, timeRemainingMs, currentStreak: streak, nextRewardAmount };
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  onClaim,
}) => {
  const [status, setStatus] = useState(getDailyBonusStatus);
  const [justClaimed, setJustClaimed] = useState(false);

  // Update countdown every second
  useEffect(() => {
    setStatus(getDailyBonusStatus());
    const interval = setInterval(() => {
      setStatus(getDailyBonusStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const { canClaim, timeRemainingMs, currentStreak, nextRewardAmount } = status;

  // Format countdown HH:MM:SS
  const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemainingMs % (1000 * 60)) / 1000);
  const countdownStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentDayIndex = ((currentStreak - 1) % 7);

  const handleClaim = () => {
    if (!canClaim) return;

    sound.playJackpot();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#eab308', '#10b981', '#3b82f6', '#ec4899'],
    });

    const now = Date.now();
    localStorage.setItem(STORAGE_LAST_CLAIMED, String(now));
    const nextStreak = currentStreak + 1;
    localStorage.setItem(STORAGE_STREAK, String(nextStreak));

    setJustClaimed(true);
    onClaim(nextRewardAmount);
    setStatus(getDailyBonusStatus());

    setTimeout(() => {
      setJustClaimed(false);
    }, 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-neutral-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-3xl shadow-[0_10px_30px_rgba(245,158,11,0.5)] border-2 border-yellow-200 ring-4 ring-amber-400/20">
                🎁
              </div>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono font-black text-[10px] shadow flex items-center gap-0.5">
                <Flame className="w-3 h-3 fill-current" />
                <span>Streak {currentStreak}</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500">
              Daily Chip Reward
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mt-1">
              Claim free in-game chips every 24 hours. Log in each consecutive day to boost your reward up to $5,000!
            </p>
          </div>

          {/* 7-Day Reward Calendar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-6">
            {DAILY_REWARDS.map((reward, idx) => {
              const isToday = idx === currentDayIndex;
              const isCompleted = idx < currentDayIndex && !canClaim;

              return (
                <div
                  key={reward.day}
                  className={`relative flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                    isToday
                      ? canClaim
                        ? 'bg-gradient-to-b from-amber-500/25 via-yellow-500/15 to-black border-2 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.4)] scale-105 z-10'
                        : 'bg-gradient-to-b from-amber-950/40 to-black border-amber-500/40 ring-1 ring-amber-400/30'
                      : isCompleted
                      ? 'bg-neutral-900/60 border-white/5 opacity-60'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  {/* Status Indicator */}
                  {isCompleted && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {reward.isJackpot && (
                    <div className="absolute -top-2 px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black text-[8px] uppercase rounded-full shadow">
                      JACKPOT
                    </div>
                  )}

                  <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">
                    {reward.label}
                  </span>

                  <div className="w-10 h-10 rounded-full bg-neutral-800/80 border border-white/10 flex items-center justify-center text-xl my-1 shadow">
                    {reward.icon}
                  </div>

                  <span
                    className={`text-xs font-black font-mono mt-1 ${
                      isToday ? 'text-amber-300' : 'text-white'
                    }`}
                  >
                    +${reward.amount.toLocaleString()}
                  </span>

                  {isToday && canClaim && (
                    <span className="text-[8px] font-black uppercase text-amber-950 bg-yellow-400 px-1.5 py-0.2 rounded-full mt-1.5 animate-pulse">
                      Ready
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Area: Claim Button OR Cooldown Timer */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/60 border border-white/10">
            {canClaim ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClaim}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black text-base rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.5)] border-2 border-yellow-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-950 fill-current animate-spin" />
                <span>Claim +${nextRewardAmount.toLocaleString()} Free Chips</span>
              </motion.button>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase font-bold tracking-wider">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Next Daily Bonus Available In:</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tracking-wider">
                  {countdownStr}
                </div>
                <span className="text-[11px] text-neutral-400">
                  Come back tomorrow to keep your {currentStreak}-day streak alive!
                </span>
              </div>
            )}

            {justClaimed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Successfully added +${nextRewardAmount.toLocaleString()} chips to your wallet!</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
