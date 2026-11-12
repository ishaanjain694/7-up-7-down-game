import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserStats } from '../types.ts';
import {
  Trophy,
  Crown,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Award,
  Zap,
  RotateCcw,
  X,
  Shield,
  Coins,
} from 'lucide-react';
import { sound } from '../sound.ts';

interface MyStatsProps {
  stats: UserStats;
  currentChips: number;
  playerName: string;
  avatar: string;
  isModal?: boolean;
  onClose?: () => void;
  onResetStats?: () => void;
}

// Progression Tier calculation based on games played & chips won
function getPlayerTier(games: number, chipsWon: number) {
  if (games >= 75 || chipsWon >= 50000) {
    return {
      title: 'Diamond Vegas Legend',
      badge: '👑',
      level: 5,
      nextLevelTarget: 100,
      color: 'from-amber-400 via-yellow-200 to-amber-500 text-amber-950 border-yellow-300',
      bgGlow: 'shadow-amber-500/30',
    };
  }
  if (games >= 35 || chipsWon >= 20000) {
    return {
      title: 'Platinum VIP',
      badge: '💎',
      level: 4,
      nextLevelTarget: 75,
      color: 'from-cyan-400 via-teal-200 to-cyan-500 text-cyan-950 border-cyan-300',
      bgGlow: 'shadow-cyan-500/30',
    };
  }
  if (games >= 15 || chipsWon >= 8000) {
    return {
      title: 'Gold High Roller',
      badge: '🥇',
      level: 3,
      nextLevelTarget: 35,
      color: 'from-yellow-400 via-amber-300 to-yellow-600 text-yellow-950 border-yellow-300',
      bgGlow: 'shadow-yellow-500/30',
    };
  }
  if (games >= 5 || chipsWon >= 2500) {
    return {
      title: 'Silver Gambler',
      badge: '🥈',
      level: 2,
      nextLevelTarget: 15,
      color: 'from-slate-200 via-neutral-100 to-slate-400 text-slate-950 border-slate-300',
      bgGlow: 'shadow-slate-400/30',
    };
  }
  return {
    title: 'Bronze Roller',
    badge: '🥉',
    level: 1,
    nextLevelTarget: 5,
    color: 'from-amber-600 via-amber-500 to-amber-800 text-amber-100 border-amber-600',
    bgGlow: 'shadow-amber-700/30',
  };
}

export const MyStats: React.FC<MyStatsProps> = ({
  stats,
  currentChips,
  playerName,
  avatar,
  isModal = false,
  onClose,
  onResetStats,
}) => {
  const {
    gamesPlayed,
    gamesWon,
    chipsWon,
    chipsLost,
    biggestWin,
    currentStreak,
    bestStreak,
    luckySevenHits,
    doublesHits,
    betDistribution,
  } = stats;

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const netProfit = chipsWon - chipsLost;
  const tier = getPlayerTier(gamesPlayed, chipsWon);

  // Progress to next tier
  const progressPercent = Math.min(
    100,
    Math.round((gamesPlayed / tier.nextLevelTarget) * 100)
  );

  // Bet zone total for percentage breakdown
  const totalZoneBets =
    (betDistribution.DOWN || 0) +
    (betDistribution.SEVEN || 0) +
    (betDistribution.UP || 0) +
    (betDistribution.DOUBLES || 0);

  const downPct = totalZoneBets > 0 ? Math.round((betDistribution.DOWN / totalZoneBets) * 100) : 25;
  const sevenPct = totalZoneBets > 0 ? Math.round((betDistribution.SEVEN / totalZoneBets) * 100) : 25;
  const upPct = totalZoneBets > 0 ? Math.round((betDistribution.UP / totalZoneBets) * 100) : 25;
  const doublePct = totalZoneBets > 0 ? Math.round((betDistribution.DOUBLES / totalZoneBets) * 100) : 25;

  // Progression Achievements
  const achievements = [
    {
      id: 'first_roll',
      name: 'First Roll',
      desc: 'Participate in your first round',
      icon: '🎲',
      unlocked: gamesPlayed >= 1,
    },
    {
      id: 'lucky7_sniper',
      name: '7 Sniper',
      desc: 'Hit the exact Lucky 7 bet',
      icon: '🍀',
      unlocked: luckySevenHits >= 1,
    },
    {
      id: 'double_trouble',
      name: 'Pair Master',
      desc: 'Win the 5X Doubles side bet',
      icon: '⚄',
      unlocked: doublesHits >= 1,
    },
    {
      id: 'hot_streak',
      name: 'On Fire',
      desc: 'Achieve a 3-win streak',
      icon: '🔥',
      unlocked: bestStreak >= 3,
    },
    {
      id: 'high_roller',
      name: 'High Roller',
      desc: 'Win over $1,500 in one roll',
      icon: '💰',
      unlocked: biggestWin >= 1500,
    },
    {
      id: 'veteran',
      name: 'Arena Veteran',
      desc: 'Complete 20+ rounds of play',
      icon: '🎖️',
      unlocked: gamesPlayed >= 20,
    },
  ];

  const content = (
    <div className="flex flex-col w-full text-white">
      {/* 1. Header with Player Avatar, Nickname & Rank Tier */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-13 h-13 rounded-2xl bg-neutral-800 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-lg ring-2 ring-amber-400/20">
              {avatar}
            </div>
            <div className="absolute -bottom-1 -right-1 text-sm">
              {tier.badge}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-white">
                {playerName}
              </span>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-gradient-to-r ${tier.color} border shadow`}
              >
                {tier.title}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <span>Current In-Game Balance:</span>
              <span className="text-amber-300 font-bold font-mono">
                ${currentChips.toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div className="w-full sm:w-56 flex flex-col gap-1 bg-black/40 p-2.5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-neutral-400">Tier Progress (Level {tier.level})</span>
            <span className="text-amber-300 font-mono">
              {gamesPlayed}/{tier.nextLevelTarget} Games
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden border border-white/5">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
            />
          </div>
        </div>
      </div>

      {/* 2. Key Progression Metric Cards (Games, Win Rate, Won, Lost, Net Profit, Streak) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 my-4">
        {/* Total Games */}
        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Games</span>
            <Target className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">
            {gamesPlayed}
          </div>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {gamesWon} Wins / {Math.max(0, gamesPlayed - gamesWon)} Losses
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Win Rate</span>
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono ${
              winRate >= 50
                ? 'text-emerald-400'
                : winRate >= 35
                ? 'text-amber-300'
                : 'text-neutral-300'
            }`}
          >
            {winRate}%
          </div>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {gamesWon} successful rounds
          </span>
        </div>

        {/* Total Chips Won */}
        <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400/80 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Chips Won</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 truncate">
            ${chipsWon.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400/70 mt-0.5">
            Gross payouts
          </span>
        </div>

        {/* Total Chips Lost */}
        <div className="p-3 rounded-2xl bg-black/50 border border-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400/80 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Chips Lost</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 truncate">
            ${chipsLost.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-400/70 mt-0.5">
            Bets not returned
          </span>
        </div>

        {/* Net Career Profit */}
        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Net Profit</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono truncate ${
              netProfit > 0
                ? 'text-emerald-400'
                : netProfit < 0
                ? 'text-rose-400'
                : 'text-neutral-300'
            }`}
          >
            {netProfit >= 0 ? `+$${netProfit.toLocaleString()}` : `-$${Math.abs(netProfit).toLocaleString()}`}
          </div>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            Career balance diff
          </span>
        </div>

        {/* Win Streaks */}
        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Streak</span>
            <Flame className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-orange-400">
            {currentStreak}🔥
          </div>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            Best All-Time: {bestStreak}
          </span>
        </div>
      </div>

      {/* 3. Betting Tendency Distribution & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Betting Zone Preferences */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Favorite Bet Zones
            </span>
            <span className="text-[10px] text-neutral-400">
              {totalZoneBets} Total Bets
            </span>
          </div>

          {/* Visual Multi-Segment Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-800 border border-white/5 my-2">
            <div style={{ width: `${downPct}%` }} title={`7 Down: ${downPct}%`} className="bg-emerald-500" />
            <div style={{ width: `${sevenPct}%` }} title={`Lucky 7: ${sevenPct}%`} className="bg-amber-400" />
            <div style={{ width: `${upPct}%` }} title={`7 Up: ${upPct}%`} className="bg-rose-500" />
            <div style={{ width: `${doublePct}%` }} title={`Doubles: ${doublePct}%`} className="bg-purple-500" />
          </div>

          {/* Zone Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono mt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              7 Down: {downPct}%
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Lucky 7: {sevenPct}%
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              7 Up: {upPct}%
            </span>
            <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Pairs: {doublePct}%
            </span>
          </div>
        </div>

        {/* Career Records Highlights */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
            Career Records & Highs
          </span>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-neutral-800/60 border border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
                Biggest Win
              </span>
              <span className="text-sm font-black font-mono text-yellow-300">
                ${biggestWin.toLocaleString()}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800/60 border border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
                Lucky 7 Hits
              </span>
              <span className="text-sm font-black font-mono text-amber-300">
                {luckySevenHits}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-800/60 border border-white/5">
              <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
                Pairs Hit (5x)
              </span>
              <span className="text-sm font-black font-mono text-purple-300">
                {doublesHits}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Player Achievements Showcase */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Award className="w-3.5 h-3.5" />
            <span>Progression Badges & Trophies</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                ach.unlocked
                  ? 'bg-amber-500/15 border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                  : 'bg-neutral-900/40 border-white/5 opacity-40 grayscale'
              }`}
            >
              <div className="text-2xl mb-1">{ach.icon}</div>
              <span className="text-xs font-bold text-white truncate max-w-full">
                {ach.name}
              </span>
              <span className="text-[9px] text-neutral-300 line-clamp-1 mt-0.5">
                {ach.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // If rendered as Modal Popup
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-neutral-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {content}
        </motion.div>
      </div>
    );
  }

  // If rendered directly in Dashboard tab
  return (
    <div className="w-full max-w-5xl mx-auto mt-3 p-4 sm:p-5 bg-neutral-900/80 border border-amber-500/20 rounded-2xl backdrop-blur-xl shadow-xl">
      {content}
    </div>
  );
};
