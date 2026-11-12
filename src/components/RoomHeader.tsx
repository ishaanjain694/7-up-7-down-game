import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Share2,
  Check,
  Volume2,
  VolumeX,
  HelpCircle,
  LogOut,
  Play,
  Clock,
  Flame,
  Trophy,
  User,
  Gift,
} from 'lucide-react';
import { sound } from '../sound.ts';
import type { GamePhase } from '../types.ts';

interface RoomHeaderProps {
  roomCode: string;
  roundNumber: number;
  phase: GamePhase;
  timer: number;
  isHost: boolean;
  onRollNow: () => void;
  onLeave: () => void;
  onOpenRules: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenDailyBonus: () => void;
  dailyBonusAvailable?: boolean;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomCode,
  roundNumber,
  phase,
  timer,
  isHost,
  onRollNow,
  onLeave,
  onOpenRules,
  onOpenLeaderboard,
  onOpenStats,
  onOpenDailyBonus,
  dailyBonusAvailable = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleCopyLink = () => {
    sound.playPop();
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 px-3 py-2 bg-neutral-900/80 border border-amber-500/20 rounded-2xl backdrop-blur-xl shadow-xl">
      {/* Brand & Room Code */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-xl shadow-md ring-1 ring-amber-300/40">
            🎲
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 font-serif leading-none">
              7 Up 7 Down
            </h1>
            <span className="text-[10px] text-amber-200/60 font-mono">
              Round #{roundNumber}
            </span>
          </div>
        </div>

        {/* Room Code & Copy Invite */}
        <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-amber-400/30 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-amber-300/60 font-semibold">
              Room Code
            </span>
            <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
              {roomCode}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="ml-1 p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
            title="Copy Invite Link to play with friends"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Copied!
              </span>
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Center Countdown / Status Display */}
      <div className="flex items-center gap-3">
        {phase === 'BETTING' && (
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-colors ${
              timer <= 5
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {timer <= 5 ? 'Hurry! Bets Closing' : 'Betting Ends In'}
            </span>
            <span className="font-mono font-black text-base sm:text-lg">
              {timer}s
            </span>
          </div>
        )}

        {phase === 'ROLLING' && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-400 text-amber-300 shadow-lg animate-pulse">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider">
              Rolling the Dice!
            </span>
          </div>
        )}

        {phase === 'SETTLED' && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-400 text-purple-300 shadow-lg">
            <span className="text-xs font-black uppercase tracking-wider">
              Next Round in {timer}s
            </span>
          </div>
        )}

        {/* Host Roll Now Action */}
        {isHost && phase === 'BETTING' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sound.playDiceRoll();
              onRollNow();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all border border-yellow-200"
            title="Roll now without waiting for timer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Roll Now</span>
          </motion.button>
        )}
      </div>

      {/* Control Buttons (Bonus, Stats, Leaderboard, Sound, Rules, Leave) */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-end">
        <button
          onClick={onOpenDailyBonus}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            dailyBonusAvailable
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 border-yellow-200 shadow-md shadow-amber-500/30 animate-pulse'
              : 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 border-white/10'
          }`}
          title="Claim Daily Free Chips Bonus (Every 24 Hours)"
        >
          <Gift className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Daily Bonus</span>
          {dailyBonusAvailable && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
          )}
        </button>

        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-white/10 text-xs font-bold"
          title="My Stats & Progression"
        >
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">My Stats</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition-colors border border-amber-400/30 text-xs font-bold"
          title="Top 10 High Rollers Leaderboard"
        >
          <Trophy className="w-3.5 h-3.5 text-yellow-400 fill-current" />
          <span className="hidden sm:inline">Leaderboard</span>
        </button>

        <button
          onClick={handleToggleSound}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-white/10"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenRules}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-white/10"
          title="Game Rules & Payouts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onLeave}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 transition-colors border border-white/10 text-xs font-semibold"
          title="Leave Table"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
};
