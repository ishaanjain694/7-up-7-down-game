import React from 'react';
import type { Player } from '../types.ts';
import { Crown, Users } from 'lucide-react';

interface PlayersBarProps {
  players: Record<string, Player>;
  myPlayerId: string;
}

export const PlayersBar: React.FC<PlayersBarProps> = ({ players, myPlayerId }) => {
  const playerList = Object.values(players).filter((p) => p.connected);

  return (
    <div className="w-full max-w-5xl mx-auto mt-3 px-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300/80">
          <Users className="w-3.5 h-3.5" />
          <span>Friends at Table ({playerList.length})</span>
        </div>
        <span className="text-[10px] text-amber-200/50">Multi-device Live Sync</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {playerList.map((player) => {
          const isMe = player.id === myPlayerId;
          const activeRoundBet =
            (player.bets.DOWN || 0) +
            (player.bets.SEVEN || 0) +
            (player.bets.UP || 0) +
            (player.bets.DOUBLES || 0);

          return (
            <div
              key={player.id}
              className={`relative flex items-center gap-2 p-2 rounded-xl border backdrop-blur-md transition-all ${
                isMe
                  ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/30'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Avatar + Host Crown + Online dot */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center text-lg shadow-inner">
                  {player.avatar}
                </div>
                {player.isHost && (
                  <div
                    title="Room Host"
                    className="absolute -top-1.5 -right-1 bg-amber-500 text-amber-950 rounded-full p-0.5 shadow"
                  >
                    <Crown className="w-2.5 h-2.5 fill-current" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate">
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-400/20 px-1 rounded">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-300 font-semibold truncate">
                    ${player.chips.toLocaleString()}
                  </span>
                  {activeRoundBet > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ${activeRoundBet}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
