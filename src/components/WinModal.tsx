import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import type { RoundWinner, RollResult, GamePhase } from '../types.ts';
import { sound } from '../sound.ts';
import { Trophy, Sparkles, Frown, TrendingDown } from 'lucide-react';

interface WinModalProps {
  phase: GamePhase;
  lastRoll: RollResult | null;
  winners: RoundWinner[];
  myPlayerId: string;
  hadActiveBet?: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({
  phase,
  lastRoll,
  winners,
  myPlayerId,
  hadActiveBet = false,
}) => {
  const isSettled = phase === 'SETTLED' && lastRoll !== null;
  const myWin = winners.find((w) => w.playerId === myPlayerId);

  useEffect(() => {
    if (isSettled) {
      if (myWin && myWin.winAmount > 0) {
        // Distinct WINNING audio trigger
        if (lastRoll?.outcome === 'SEVEN' || myWin.winAmount >= 1000) {
          sound.playJackpot();
        } else {
          sound.playWin();
        }

        // Trigger confetti celebration!
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#eab308', '#10b981', '#ffffff', '#ec4899'],
        });
      } else if (hadActiveBet) {
        // Distinct LOSING audio trigger when the player had an active bet
        sound.playLose();
      } else if (winners.length > 0) {
        // Spectator: friends won
        sound.playCoin();
      } else {
        // Neutral dice impact
        sound.playDiceImpact();
      }
    }
  }, [isSettled, myWin, lastRoll, hadActiveBet]);

  if (!isSettled) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.85 }}
          className={`rounded-3xl p-4 border-2 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-center ${
            myWin && myWin.winAmount > 0
              ? 'bg-black/95 border-amber-400/90 ring-4 ring-amber-400/20'
              : hadActiveBet
              ? 'bg-neutral-950/95 border-rose-500/50'
              : 'bg-black/90 border-white/20'
          }`}
        >
          {/* Main user win or table summary */}
          {myWin && myWin.winAmount > 0 ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-yellow-300">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                <span>You Won This Round!</span>
                <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 drop-shadow-md my-1">
                +${myWin.winAmount.toLocaleString()}
              </div>
              {myWin.netProfit > 0 && (
                <span className="text-[11px] font-bold text-emerald-400 font-mono">
                  (Net Profit: +${myWin.netProfit.toLocaleString()})
                </span>
              )}
            </div>
          ) : hadActiveBet ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-rose-400 font-bold">
                <TrendingDown className="w-4 h-4" />
                <span>Round Lost</span>
              </div>
              <div className="text-lg font-black text-white font-serif my-0.5">
                {lastRoll.outcome === 'SEVEN'
                  ? '🌟 Lucky 7 🌟'
                  : lastRoll.outcome === 'DOWN'
                  ? '7 Down Won'
                  : '7 Up Won'}
                {lastRoll.isDouble && ' + Doubles!'}
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                Tough luck! Double down and try again next roll.
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
                Round Settled
              </span>
              <div className="text-lg font-black text-amber-300 font-serif my-0.5">
                {lastRoll.outcome === 'SEVEN'
                  ? '🌟 Lucky 7 🌟'
                  : lastRoll.outcome === 'DOWN'
                  ? '7 Down Won'
                  : '7 Up Won'}
                {lastRoll.isDouble && ' + Double Dice!'}
              </div>
            </div>
          )}

          {/* Table winners row if other friends won */}
          {winners.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/10">
              <div className="text-[10px] uppercase font-bold text-amber-300/60 mb-1.5 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Round Winners</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {winners.map((w) => (
                  <div
                    key={w.playerId}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800/90 border border-amber-400/30 text-xs font-semibold"
                  >
                    <span>{w.avatar}</span>
                    <span className="text-white max-w-[80px] truncate">{w.name}:</span>
                    <span className="text-amber-300 font-mono font-bold">+${w.winAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
