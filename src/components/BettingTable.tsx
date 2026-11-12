import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BetType, Player, GamePhase, RollResult } from '../types.ts';
import { sound } from '../sound.ts';
import { Crown, Sparkles, TrendingDown, TrendingUp, Layers } from 'lucide-react';

interface BettingTableProps {
  phase: GamePhase;
  myBets: Record<BetType, number>;
  totalBets: Record<BetType, number>;
  players: Record<string, Player>;
  myPlayerId: string;
  selectedChipAmount: number;
  onPlaceBet: (type: BetType, amount: number) => void;
  lastRoll: RollResult | null;
}

export const BettingTable: React.FC<BettingTableProps> = ({
  phase,
  myBets,
  totalBets,
  players,
  myPlayerId,
  selectedChipAmount,
  onPlaceBet,
  lastRoll,
}) => {
  const isBettingOpen = phase === 'BETTING';

  const handleBetClick = (betType: BetType) => {
    if (!isBettingOpen) return;
    sound.playChip();
    onPlaceBet(betType, selectedChipAmount);
  };

  // Check if a zone won in the last settled roll
  const isWinner = (type: BetType): boolean => {
    if (phase !== 'SETTLED' || !lastRoll) return false;
    if (type === 'DOWN') return lastRoll.outcome === 'DOWN';
    if (type === 'SEVEN') return lastRoll.outcome === 'SEVEN';
    if (type === 'UP') return lastRoll.outcome === 'UP';
    if (type === 'DOUBLES') return lastRoll.isDouble;
    return false;
  };

  // Find all players who bet on a specific zone
  const getBettorsForZone = (type: BetType) => {
    return Object.values(players).filter((p) => (p.bets[type] || 0) > 0);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-emerald-950/90 via-emerald-900/90 to-emerald-950/90 border-4 border-amber-600/40 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_12px_rgba(255,255,255,0.15)] backdrop-blur-xl">
      {/* Table Felt Perimeter Stitching */}
      <div className="absolute inset-1.5 sm:inset-2 rounded-2.5xl border border-dashed border-amber-500/30 pointer-events-none" />

      {/* Felt Watermark Header */}
      <div className="flex items-center justify-between mb-3 px-3 text-amber-400/60 font-serif text-[11px] sm:text-xs tracking-widest uppercase">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Casino Felt Layout</span>
        </div>
        <div className="font-sans font-semibold">
          {isBettingOpen ? (
            <span className="text-emerald-400 animate-pulse">● Betting Open</span>
          ) : (
            <span className="text-amber-400">● Dice In Motion</span>
          )}
        </div>
      </div>

      {/* Main 3 Zones (7 Down, Lucky 7, 7 Up) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. 7 DOWN ZONE */}
        <motion.div
          whileHover={isBettingOpen ? { scale: 1.015, y: -2 } : {}}
          whileTap={isBettingOpen ? { scale: 0.985 } : {}}
          onClick={() => handleBetClick('DOWN')}
          className={`relative group flex flex-col justify-between p-4 sm:p-6 rounded-2xl cursor-pointer transition-all border-2 ${
            isWinner('DOWN')
              ? 'bg-gradient-to-b from-emerald-600/80 via-emerald-700/80 to-emerald-900/90 border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.8)] ring-4 ring-emerald-400/80 scale-[1.02] z-10'
              : 'bg-gradient-to-b from-emerald-900/50 via-teal-950/40 to-black/60 border-emerald-500/30 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-950/60'
          } ${!isBettingOpen ? 'cursor-default' : ''}`}
        >
          {/* Top Badge */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-300">
              <TrendingDown className="w-4 h-4" /> 7 DOWN
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-black text-emerald-300">
              PAYS 2X
            </span>
          </div>

          {/* Central Odds & Dice Range */}
          <div className="my-4 text-center">
            <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight drop-shadow-md group-hover:text-emerald-200 transition-colors">
              2 - 6
            </div>
            <div className="text-[11px] font-medium text-emerald-300/80 mt-1 uppercase tracking-wider">
              Sum strictly under 7
            </div>
          </div>

          {/* Bettors & Chips Section */}
          <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
            {/* Local player bet */}
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-300/60 uppercase font-semibold">Your Bet</span>
              <span className="text-sm font-black font-mono text-emerald-300">
                ${(myBets.DOWN || 0).toLocaleString()}
              </span>
            </div>

            {/* Total table bet & player avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {getBettorsForZone('DOWN').slice(0, 3).map((bettor) => (
                  <span
                    key={bettor.id}
                    title={`${bettor.name}: $${bettor.bets.DOWN}`}
                    className="inline-block w-6 h-6 rounded-full bg-neutral-800 border border-emerald-400/40 text-xs flex items-center justify-center shadow"
                  >
                    {bettor.avatar}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-300/60 block uppercase font-semibold">Table Total</span>
                <span className="text-xs font-mono font-bold text-white">
                  ${(totalBets.DOWN || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Floating plus on hover when betting is active */}
          {isBettingOpen && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-emerald-500 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
              +${selectedChipAmount}
            </div>
          )}
        </motion.div>

        {/* 2. LUCKY 7 ZONE (CENTERPIECE) */}
        <motion.div
          whileHover={isBettingOpen ? { scale: 1.02, y: -2 } : {}}
          whileTap={isBettingOpen ? { scale: 0.985 } : {}}
          onClick={() => handleBetClick('SEVEN')}
          className={`relative group flex flex-col justify-between p-4 sm:p-6 rounded-2xl cursor-pointer transition-all border-2 ${
            isWinner('SEVEN')
              ? 'bg-gradient-to-b from-amber-500/90 via-yellow-600/90 to-amber-900/90 border-yellow-200 shadow-[0_0_40px_rgba(245,158,11,0.9)] ring-4 ring-yellow-400 scale-[1.04] z-10'
              : 'bg-gradient-to-b from-amber-900/40 via-yellow-950/30 to-black/70 border-amber-400/40 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-950/70'
          } ${!isBettingOpen ? 'cursor-default' : ''}`}
        >
          {/* Top Badge with Crown */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
              <Crown className="w-4 h-4 text-yellow-300 animate-bounce" /> LUCKY 7
            </span>
            <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black text-xs shadow-md">
              PAYS 3X
            </span>
          </div>

          {/* Central Odds */}
          <div className="my-4 text-center">
            <div className="text-4xl sm:text-5xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 tracking-tight drop-shadow-lg">
              7
            </div>
            <div className="text-[11px] font-bold text-amber-300 mt-1 uppercase tracking-wider">
              Exact Sum Equals 7
            </div>
          </div>

          {/* Bettors & Chips Section */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
            {/* Local player bet */}
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-300/60 uppercase font-semibold">Your Bet</span>
              <span className="text-sm font-black font-mono text-yellow-300">
                ${(myBets.SEVEN || 0).toLocaleString()}
              </span>
            </div>

            {/* Total table bet & player avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {getBettorsForZone('SEVEN').slice(0, 3).map((bettor) => (
                  <span
                    key={bettor.id}
                    title={`${bettor.name}: $${bettor.bets.SEVEN}`}
                    className="inline-block w-6 h-6 rounded-full bg-neutral-800 border border-amber-400/50 text-xs flex items-center justify-center shadow"
                  >
                    {bettor.avatar}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-300/60 block uppercase font-semibold">Table Total</span>
                <span className="text-xs font-mono font-bold text-white">
                  ${(totalBets.SEVEN || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Floating plus on hover */}
          {isBettingOpen && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-yellow-400 text-yellow-950 font-bold px-2 py-0.5 rounded-full">
              +${selectedChipAmount}
            </div>
          )}
        </motion.div>

        {/* 3. 7 UP ZONE */}
        <motion.div
          whileHover={isBettingOpen ? { scale: 1.015, y: -2 } : {}}
          whileTap={isBettingOpen ? { scale: 0.985 } : {}}
          onClick={() => handleBetClick('UP')}
          className={`relative group flex flex-col justify-between p-4 sm:p-6 rounded-2xl cursor-pointer transition-all border-2 ${
            isWinner('UP')
              ? 'bg-gradient-to-b from-rose-600/80 via-red-700/80 to-rose-900/90 border-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.8)] ring-4 ring-rose-400/80 scale-[1.02] z-10'
              : 'bg-gradient-to-b from-rose-950/40 via-red-950/40 to-black/60 border-rose-500/30 hover:border-rose-400/70 hover:shadow-lg hover:shadow-rose-950/60'
          } ${!isBettingOpen ? 'cursor-default' : ''}`}
        >
          {/* Top Badge */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-rose-300">
              <TrendingUp className="w-4 h-4" /> 7 UP
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-[11px] font-black text-rose-300">
              PAYS 2X
            </span>
          </div>

          {/* Central Odds & Dice Range */}
          <div className="my-4 text-center">
            <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight drop-shadow-md group-hover:text-rose-200 transition-colors">
              8 - 12
            </div>
            <div className="text-[11px] font-medium text-rose-300/80 mt-1 uppercase tracking-wider">
              Sum strictly over 7
            </div>
          </div>

          {/* Bettors & Chips Section */}
          <div className="flex items-center justify-between pt-2 border-t border-rose-500/20">
            {/* Local player bet */}
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-300/60 uppercase font-semibold">Your Bet</span>
              <span className="text-sm font-black font-mono text-rose-300">
                ${(myBets.UP || 0).toLocaleString()}
              </span>
            </div>

            {/* Total table bet & player avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {getBettorsForZone('UP').slice(0, 3).map((bettor) => (
                  <span
                    key={bettor.id}
                    title={`${bettor.name}: $${bettor.bets.UP}`}
                    className="inline-block w-6 h-6 rounded-full bg-neutral-800 border border-rose-400/40 text-xs flex items-center justify-center shadow"
                  >
                    {bettor.avatar}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-rose-300/60 block uppercase font-semibold">Table Total</span>
                <span className="text-xs font-mono font-bold text-white">
                  ${(totalBets.UP || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Floating plus on hover */}
          {isBettingOpen && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-rose-500 text-rose-950 font-bold px-2 py-0.5 rounded-full">
              +${selectedChipAmount}
            </div>
          )}
        </motion.div>
      </div>

      {/* Side Bet: ANY DOUBLE (Matching Dice 1-1, 2-2, 3-3, 4-4, 5-5, 6-6) */}
      <motion.div
        whileHover={isBettingOpen ? { scale: 1.01 } : {}}
        whileTap={isBettingOpen ? { scale: 0.99 } : {}}
        onClick={() => handleBetClick('DOUBLES')}
        className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isWinner('DOUBLES')
            ? 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-800 border-fuchsia-300 shadow-[0_0_30px_rgba(192,38,211,0.8)] ring-4 ring-fuchsia-400 scale-[1.02]'
            : 'bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border-purple-500/30 hover:border-purple-400/60'
        } ${!isBettingOpen ? 'cursor-default' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-purple-200">
                SIDE BET: ANY PAIR / DOUBLE
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300">
                PAYS 5X
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70">
              Both dice show identical numbers (1-1, 2-2, 3-3, 4-4, 5-5, 6-6)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-purple-300/60 uppercase block font-semibold">Your Bet</span>
            <span className="text-sm font-black font-mono text-purple-300">
              ${(myBets.DOUBLES || 0).toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-purple-300/60 uppercase block font-semibold">Table Total</span>
            <span className="text-xs font-mono font-bold text-white">
              ${(totalBets.DOUBLES || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
