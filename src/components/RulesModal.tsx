import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Dices, Users, Coins, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              🎲
            </div>
            <div>
              <h2 className="text-xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
                How to Play 7 Up 7 Down
              </h2>
              <p className="text-xs text-neutral-400">
                Classic casino dice game with friends & in-game chips
              </p>
            </div>
          </div>

          {/* Rule Cards */}
          <div className="space-y-3.5">
            {/* 7 Down */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                ▼
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-300">
                    7 DOWN (Under 7)
                  </span>
                  <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    2X PAYOUT
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  You win if the sum of both dice is between <strong>2 and 6</strong>. (e.g. 1+2, 2+3, 3+3).
                </p>
              </div>
            </div>

            {/* Lucky 7 */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-yellow-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                ★
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-amber-300">
                    LUCKY 7 (Exactly 7)
                  </span>
                  <span className="text-xs font-black text-amber-950 font-mono bg-gradient-to-r from-yellow-300 to-amber-400 px-2.5 py-0.5 rounded-full shadow">
                    3X PAYOUT
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  You win if the sum of both dice is exactly <strong>7</strong> (1+6, 2+5, 3+4).
                </p>
              </div>
            </div>

            {/* 7 Up */}
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                ▲
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-rose-300">
                    7 UP (Over 7)
                  </span>
                  <span className="text-xs font-black text-rose-400 font-mono bg-rose-500/20 px-2 py-0.5 rounded-full">
                    2X PAYOUT
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  You win if the sum of both dice is between <strong>8 and 12</strong>. (e.g. 4+5, 5+5, 6+6).
                </p>
              </div>
            </div>

            {/* Side Bet: Any Pair */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                ⚄⚄
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-purple-300">
                    SIDE BET: ANY PAIR
                  </span>
                  <span className="text-xs font-black text-purple-400 font-mono bg-purple-500/20 px-2 py-0.5 rounded-full">
                    5X PAYOUT
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  You win 5X your bet if both dice show identical values (1-1, 2-2, 3-3, 4-4, 5-5, 6-6). Can be combined with other bets!
                </p>
              </div>
            </div>
          </div>

          {/* In-Game Money & Multiplayer Notice */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2.5 text-xs text-neutral-400">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Coins className="w-4 h-4" />
              <span>In-Game Chips Only</span>
            </div>
            <p>
              This is 100% for entertainment. All currency is in-game virtual chips. If your chips fall below $200, tap the <strong>+500 Free</strong> refill button anytime!
            </p>

            <div className="flex items-center gap-2 text-amber-300 font-semibold mt-1">
              <Users className="w-4 h-4" />
              <span>Invite Friends Across Devices</span>
            </div>
            <p>
              Share your room code or copy the table URL. Friends on laptops, tablets, or phones will immediately appear at your table in real-time.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black rounded-2xl transition-all shadow-lg text-sm"
          >
            Got It, Let's Roll!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
