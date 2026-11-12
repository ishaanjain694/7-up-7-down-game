import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Dices,
  Users,
  Play,
  PlusCircle,
  LogIn,
  Sparkles,
  Shuffle,
  ShieldCheck,
  Flame,
  Volume2,
  VolumeX,
  Trophy,
  User,
  Gift,
} from 'lucide-react';
import { sound } from '../sound.ts';

interface LobbyProps {
  onJoinRoom: (roomCode: string, name: string, avatar: string) => void;
  initialRoomCode?: string;
  onOpenRules: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenDailyBonus: () => void;
  dailyBonusAvailable?: boolean;
}

const AVATARS = ['🦁', '🐯', '🦊', '👑', '🎩', '💎', '🎲', '🦄', '🐼', '🥷', '👾', '🤠'];

const FUN_NAMES = [
  'LuckyTiger',
  'HighRoller',
  'DiceKing',
  'VegasFox',
  'SevenMaster',
  'GoldBaron',
  'FortuneQueen',
  'AceChaser',
  'JackpotKid',
  'DoubleTrouble',
];

export const Lobby: React.FC<LobbyProps> = ({
  onJoinRoom,
  initialRoomCode = '',
  onOpenRules,
  onOpenLeaderboard,
  onOpenStats,
  onOpenDailyBonus,
  dailyBonusAvailable = false,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🎲');
  const [roomInput, setRoomInput] = useState(initialRoomCode);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  // Load saved nickname and avatar from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('7up7down_name');
    const savedAvatar = localStorage.getItem('7up7down_avatar');
    if (savedName) setName(savedName);
    else setName(FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]);

    if (savedAvatar && AVATARS.includes(savedAvatar)) setAvatar(savedAvatar);
    else setAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  }, []);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomInput(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const handleRandomizeName = () => {
    sound.playPop();
    const randomName = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    setName(randomName);
  };

  const handleCreateNewRoom = () => {
    const finalName = name.trim() || 'Lucky Player';
    localStorage.setItem('7up7down_name', finalName);
    localStorage.setItem('7up7down_avatar', avatar);
    sound.playCoin();
    // Passing empty roomCode prompts the server to generate a unique room code
    onJoinRoom('', finalName, avatar);
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Lucky Player';
    const finalCode = (roomInput || '').trim().toUpperCase();
    if (!finalCode) return;

    localStorage.setItem('7up7down_name', finalName);
    localStorage.setItem('7up7down_avatar', avatar);
    sound.playCoin();
    onJoinRoom(finalCode, finalName, avatar);
  };

  const handleQuickPlay = () => {
    const finalName = name.trim() || 'Lucky Player';
    localStorage.setItem('7up7down_name', finalName);
    localStorage.setItem('7up7down_avatar', avatar);
    sound.playCoin();
    // Default public community room
    onJoinRoom('LUCKY7', finalName, avatar);
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-neutral-950 to-black text-white">
      {/* Top Controls */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-semibold border border-amber-400/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rules & Payouts</span>
          </button>

          <button
            onClick={onOpenDailyBonus}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow ${
              dailyBonusAvailable
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 border-yellow-200 shadow-amber-500/40 animate-pulse'
                : 'bg-neutral-800/80 hover:bg-neutral-700 text-amber-300 border-amber-400/30'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Daily Bonus</span>
            {dailyBonusAvailable && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-white/15 transition-colors shadow"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Stats</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-400/30 transition-colors shadow"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400 fill-current" />
            <span>Top 10 High Rollers</span>
          </button>
        </div>

        <button
          onClick={handleToggleSound}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs border border-white/10 transition-colors"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl flex flex-col items-center"
      >
        {/* Hero Title & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-4xl shadow-[0_10px_30px_rgba(245,158,11,0.5)] border-2 border-yellow-200 ring-4 ring-amber-500/20">
              🎲
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-rose-600 text-[10px] font-black uppercase text-white tracking-widest shadow">
              Live
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 drop-shadow-md">
            7 UP 7 DOWN
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md">
            Real-time multiplayer dice arena. Play with friends on any phone, tablet, or PC with virtual chips!
          </p>
        </div>

        {/* Profile Card (Name + Avatar Picker) */}
        <div className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300/80 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Customize Your Player Profile</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Selected Avatar Display */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-lg ring-2 ring-amber-400/20">
                {avatar}
              </div>
              <span className="text-[10px] uppercase text-neutral-400 font-semibold mt-1">
                Avatar
              </span>
            </div>

            {/* Name input */}
            <div className="flex-1 w-full">
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                Your Nickname
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your nickname..."
                  maxLength={18}
                  className="flex-1 bg-neutral-800/90 border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-white/10 transition-colors"
                  title="Randomize Nickname"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Avatar Options Picker */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <span className="text-[11px] font-semibold text-neutral-400 block mb-2">
              Choose an Avatar:
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {AVATARS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setAvatar(item);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                    avatar === item
                      ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-neutral-800/60 hover:bg-neutral-800 border border-white/10'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Room Action Modes (Create / Join / Quick Play) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* 1. Quick Play */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuickPlay}
            className="flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-b from-amber-500/20 via-amber-600/10 to-black/60 border border-amber-500/40 hover:border-amber-400 text-left transition-all shadow-xl group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <h3 className="font-extrabold text-base text-amber-200">
                Quick Match
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Jump into the public community dice room instantly.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>Play Now</span>
              <span>→</span>
            </div>
          </motion.button>

          {/* 2. Create Private Room */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateNewRoom}
            className="flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-b from-emerald-500/20 via-emerald-600/10 to-black/60 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all shadow-xl group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-emerald-950 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-emerald-200">
                Create Room
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Host a private table for your friends with a shareable code & link.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Host Table</span>
              <span>→</span>
            </div>
          </motion.button>

          {/* 3. Join with Code */}
          <div className="flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-b from-purple-500/20 via-purple-600/10 to-black/60 border border-purple-500/40 text-left shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500 text-purple-950 flex items-center justify-center mb-3 shadow-md">
                <LogIn className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-purple-200">
                Join Friend's Room
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Enter your friend's room code to join their active table.
              </p>
            </div>

            <form onSubmit={handleJoinExistingRoom} className="mt-4 flex items-center gap-1.5">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={8}
                className="flex-1 bg-neutral-800 border border-white/20 focus:border-purple-400 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold uppercase text-white outline-none"
              />
              <button
                type="submit"
                disabled={!roomInput.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Starting Chips Assurance & Features footer */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-neutral-400 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>$1,000 Starting Free Chips</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Multi-Device Instant Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Dices className="w-4 h-4 text-purple-400" />
            <span>2x, 3x & 5x Payouts</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
