import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Medal, Sparkles, TrendingUp, Users, Globe, X } from 'lucide-react';
import type { Player } from '../types.ts';
import { sound } from '../sound.ts';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  totalWon?: number;
  roomCode?: string;
  connected?: boolean;
}

interface LeaderboardProps {
  players: Record<string, Player>;
  myPlayerId: string;
  roomCode?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  myPlayerId,
  roomCode,
  isModal = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'room' | 'all'>('room');
  const [globalTop10, setGlobalTop10] = useState<LeaderboardPlayer[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  // Derive sorted top 10 for the current room
  const roomTop10: LeaderboardPlayer[] = Object.values(players)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      totalWon: p.totalWon,
      connected: p.connected,
      roomCode: roomCode,
    }))
    .sort((a, b) => b.chips - a.chips)
    .slice(0, 10);

  // Fetch cross-game leaderboard when 'all' tab is clicked
  useEffect(() => {
    if (activeTab === 'all') {
      setIsLoadingGlobal(true);
      fetch('/api/leaderboard')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.top10)) {
            setGlobalTop10(data.top10);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch global leaderboard:', err);
        })
        .finally(() => {
          setIsLoadingGlobal(false);
        });
    }
  }, [activeTab]);

  const displayedList = activeTab === 'room' ? roomTop10 : globalTop10;

  // Podium players for top 3
  const top1 = displayedList[0];
  const top2 = displayedList[1];
  const top3 = displayedList[2];

  const content = (
    <div className="flex flex-col w-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-amber-950 font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30">
            <Trophy className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500">
              Top 10 High Rollers
            </h2>
            <p className="text-[11px] text-neutral-400">
              Ranked by total in-game chip balance
            </p>
          </div>
        </div>

        {/* Tab Switcher: Room vs All Games */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('room');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'room'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>This Room ({roomTop10.length})</span>
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('all');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Active Games</span>
          </button>
        </div>
      </div>

      {/* Top 3 Visual Championship Podium */}
      {displayedList.length >= 2 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 items-end pt-2 px-1">
          {/* 2nd Place (Silver) */}
          {top2 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-slate-400/40 shadow-lg text-center relative"
            >
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow">
                2
              </div>
              <div className="w-11 h-11 rounded-full bg-neutral-800 border-2 border-slate-300 flex items-center justify-center text-xl my-1 shadow">
                {top2.avatar}
              </div>
              <span className="text-xs font-bold text-slate-200 truncate max-w-full">
                {top2.name}
              </span>
              <span className="text-xs font-black font-mono text-slate-300 mt-0.5">
                ${top2.chips.toLocaleString()}
              </span>
            </motion.div>
          ) : <div />}

          {/* 1st Place (Gold Center, Elevated) */}
          {top1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/25 via-yellow-600/15 to-neutral-900 border-2 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.25)] text-center relative -translate-y-2"
            >
              <div className="absolute -top-4 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-950 font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-yellow-300">
                <Crown className="w-4 h-4 fill-current" />
              </div>
              <div className="w-13 h-13 rounded-full bg-neutral-800 border-2 border-yellow-300 flex items-center justify-center text-2xl my-1 shadow-md ring-2 ring-amber-400/50">
                {top1.avatar}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-yellow-200 truncate max-w-full">
                {top1.name}
              </span>
              <span className="text-sm font-black font-mono text-amber-300 mt-0.5">
                ${top1.chips.toLocaleString()}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-black text-amber-950 bg-yellow-400 px-2 py-0.2 rounded-full mt-1">
                Leader
              </span>
            </motion.div>
          )}

          {/* 3rd Place (Bronze) */}
          {top3 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-amber-700/40 shadow-lg text-center relative"
            >
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow">
                3
              </div>
              <div className="w-11 h-11 rounded-full bg-neutral-800 border-2 border-amber-600 flex items-center justify-center text-xl my-1 shadow">
                {top3.avatar}
              </div>
              <span className="text-xs font-bold text-amber-200 truncate max-w-full">
                {top3.name}
              </span>
              <span className="text-xs font-black font-mono text-amber-300 mt-0.5">
                ${top3.chips.toLocaleString()}
              </span>
            </motion.div>
          ) : <div />}
        </div>
      )}

      {/* Ranked Players List (Top 10) */}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin">
        {isLoadingGlobal ? (
          <div className="py-8 text-center text-xs text-amber-300/70 animate-pulse">
            Fetching active game rankings...
          </div>
        ) : displayedList.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 italic">
            No players recorded yet.
          </div>
        ) : (
          displayedList.map((player, index) => {
            const rank = index + 1;
            const isMe = player.id === myPlayerId;

            // Medal badge colors
            let rankBadge = (
              <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-400 font-mono font-bold text-xs flex items-center justify-center border border-white/10">
                #{rank}
              </span>
            );

            if (rank === 1) {
              rankBadge = (
                <span className="w-6 h-6 rounded-lg bg-yellow-400 text-yellow-950 font-black text-xs flex items-center justify-center shadow">
                  🥇
                </span>
              );
            } else if (rank === 2) {
              rankBadge = (
                <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow">
                  🥈
                </span>
              );
            } else if (rank === 3) {
              rankBadge = (
                <span className="w-6 h-6 rounded-lg bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                  🥉
                </span>
              );
            }

            return (
              <motion.div
                key={`${player.id}_${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-black/40 hover:bg-black/60 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Left: Rank + Avatar + Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {rankBadge}

                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center text-base shadow-inner">
                      {player.avatar}
                    </div>
                    {player.connected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-400/20 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                          YOU
                        </span>
                      )}
                    </div>
                    {player.roomCode && activeTab === 'all' && (
                      <span className="text-[9px] font-mono text-neutral-400">
                        Room: {player.roomCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Chips balance & Total Won */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm font-black font-mono text-amber-300">
                    <span className="text-xs">🪙</span>
                    <span>${player.chips.toLocaleString()}</span>
                  </div>
                  {typeof player.totalWon === 'number' && player.totalWon > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-400">
                      Won +${player.totalWon.toLocaleString()}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  // If rendered as a Modal
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
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

  // If rendered embedded in the layout
  return (
    <div className="w-full max-w-5xl mx-auto mt-3 p-4 sm:p-5 bg-neutral-900/80 border border-amber-500/20 rounded-2xl backdrop-blur-xl shadow-xl">
      {content}
    </div>
  );
};
