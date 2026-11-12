import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Dice3DProps {
  die1: number;
  die2: number;
  isRolling: boolean;
  outcome?: 'DOWN' | 'SEVEN' | 'UP' | null;
  isDouble?: boolean;
}

// Visual pip layout coordinates for standard dice faces (1-6)
const PipLayout: React.FC<{ value: number }> = ({ value }) => {
  // Return grid of 3x3 for pips
  const pips: Record<number, number[]> = {
    1: [4], // Center
    2: [0, 8], // Top-left, Bottom-right
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const activePips = pips[value] || [4];

  return (
    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2.5 pointer-events-none">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {activePips.includes(i) && (
            <div
              className={`rounded-full shadow-inner ${
                value === 1
                  ? 'w-4 h-4 bg-red-600 shadow-red-900 ring-1 ring-red-400/50'
                  : 'w-3 h-3 bg-neutral-900 shadow-black'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export const Dice3D: React.FC<Dice3DProps> = ({
  die1,
  die2,
  isRolling,
  outcome,
  isDouble,
}) => {
  const [displayDie1, setDisplayDie1] = useState(die1 || 3);
  const [displayDie2, setDisplayDie2] = useState(die2 || 4);

  // During rolling animation, rapidly randomize faces for cinematic tumbling illusion
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayDie1(Math.floor(Math.random() * 6) + 1);
        setDisplayDie2(Math.floor(Math.random() * 6) + 1);
      }, 70);
    } else {
      setDisplayDie1(die1 || 1);
      setDisplayDie2(die2 || 6);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRolling, die1, die2]);

  const sum = displayDie1 + displayDie2;

  const outcomeColors = {
    DOWN: 'from-emerald-500 to-teal-700 text-emerald-200 border-emerald-400/60 shadow-emerald-950/60',
    SEVEN: 'from-amber-400 via-yellow-300 to-amber-600 text-amber-950 border-amber-300 shadow-amber-950/80',
    UP: 'from-rose-500 to-red-700 text-rose-200 border-rose-400/60 shadow-rose-950/60',
  };

  const outcomeLabel =
    outcome === 'SEVEN'
      ? '🌟 LUCKY 7 🌟'
      : outcome === 'DOWN'
      ? '7 DOWN (UNDER 7)'
      : outcome === 'UP'
      ? '7 UP (OVER 7)'
      : '';

  return (
    <div className="relative flex flex-col items-center justify-center py-4 px-3 select-none">
      {/* Visual Dice Arena Platform */}
      <div className="relative flex items-center justify-center gap-6 sm:gap-10 perspective-1000 py-3">
        {/* Soft shadow under dice cup */}
        <div className="absolute inset-0 bg-radial from-black/50 via-black/20 to-transparent blur-md rounded-full pointer-events-none -bottom-3" />

        {/* Die 1 */}
        <motion.div
          animate={
            isRolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, -360, -720, -1080],
                  rotateZ: [0, 45, -45, 0],
                  y: [-10, -40, 10, -20, 0],
                  scale: [1, 1.15, 0.95, 1.08, 1],
                }
              : {
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  y: 0,
                  scale: 1,
                }
          }
          transition={
            isRolling
              ? { duration: 2.2, ease: 'easeInOut', repeat: Infinity }
              : { type: 'spring', stiffness: 260, damping: 20 }
          }
          className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100 shadow-[0_12px_24px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.2)] border border-amber-200/80 flex items-center justify-center transform-gpu"
        >
          <PipLayout value={displayDie1} />
        </motion.div>

        {/* Plus separator or VS badge */}
        <div className="text-amber-200/60 font-black text-2xl sm:text-3xl drop-shadow-md">
          +
        </div>

        {/* Die 2 */}
        <motion.div
          animate={
            isRolling
              ? {
                  rotateX: [0, -360, -720, -1080],
                  rotateY: [0, 360, 720, 1080],
                  rotateZ: [0, -45, 45, 0],
                  y: [10, -35, -5, -25, 0],
                  scale: [1, 1.12, 0.96, 1.05, 1],
                }
              : {
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  y: 0,
                  scale: 1,
                }
          }
          transition={
            isRolling
              ? { duration: 2.3, ease: 'easeInOut', repeat: Infinity }
              : { type: 'spring', stiffness: 260, damping: 20 }
          }
          className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100 shadow-[0_12px_24px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.2)] border border-amber-200/80 flex items-center justify-center transform-gpu"
        >
          <PipLayout value={displayDie2} />
        </motion.div>
      </div>

      {/* Sum & Outcome Ribbon */}
      <div className="h-14 flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          {isRolling ? (
            <motion.div
              key="rolling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 font-bold text-sm tracking-widest uppercase shadow-lg shadow-black/40 backdrop-blur-md animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Rolling the Dice...
            </motion.div>
          ) : outcome ? (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r ${outcomeColors[outcome]} border-2 shadow-xl backdrop-blur-md`}
            >
              <span className="font-extrabold text-xl sm:text-2xl font-mono tracking-wider">
                {sum}
              </span>
              <span className="w-px h-5 bg-current opacity-30" />
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
                {outcomeLabel}
              </span>
              {isDouble && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-red-600 text-white animate-bounce shadow">
                  PAIR 5X!
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs tracking-wider text-amber-300/70 uppercase font-semibold bg-black/30 px-4 py-1.5 rounded-full border border-white/5"
            >
              Place your bets before the timer ends
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
