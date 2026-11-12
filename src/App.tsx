/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  RoomState,
  ServerMessage,
  ClientMessage,
  BetType,
  ChatMessage,
  EmojiReaction,
  RoundWinner,
} from './types.ts';
import { sound } from './sound.ts';
import { Lobby } from './components/Lobby.tsx';
import { RoomHeader } from './components/RoomHeader.tsx';
import { Dice3D } from './components/Dice3D.tsx';
import { BettingTable } from './components/BettingTable.tsx';
import { ChipSelector } from './components/ChipSelector.tsx';
import { PlayersBar } from './components/PlayersBar.tsx';
import { HistoryStats } from './components/HistoryStats.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { MyStats } from './components/MyStats.tsx';
import { LiveChat } from './components/LiveChat.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import { WinModal } from './components/WinModal.tsx';
import type { UserStats } from './types.ts';
import { AlertCircle, WifiOff, Trophy, History, User } from 'lucide-react';

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  chipsWon: 0,
  chipsLost: 0,
  biggestWin: 0,
  currentStreak: 0,
  bestStreak: 0,
  luckySevenHits: 0,
  doublesHits: 0,
  betDistribution: { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 },
};

function loadSavedStats(): UserStats {
  try {
    const raw = localStorage.getItem('7up7down_player_stats');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATS,
        ...parsed,
        betDistribution: { ...DEFAULT_STATS.betDistribution, ...(parsed.betDistribution || {}) },
      };
    }
  } catch {}
  return DEFAULT_STATS;
}

export default function App() {
  // Navigation & Connection State
  const [inRoom, setInRoom] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'stats' | 'leaderboard' | 'history'>('stats');
  const [hadActiveBet, setHadActiveBet] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(loadSavedStats);

  // Selected chip denomination to bet ($10, $50, $100, $500, $1000)
  const [selectedChipAmount, setSelectedChipAmount] = useState<number>(50);

  // Live Chat & Emoji Reactions
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);

  // Socket and state references
  const socketRef = useRef<WebSocket | null>(null);
  const pendingJoinRef = useRef<{ roomCode: string; name: string; avatar: string } | null>(null);
  const inRoomRef = useRef(false);
  const roomStateRef = useRef<RoomState | null>(null);
  const myPlayerIdRef = useRef<string>('');

  // Check URL query parameters for ?room=CODE
  const initialRoomCode = new URLSearchParams(window.location.search).get('room') || '';

  const sendSocketMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to WebSocket server
  const connectSocket = useCallback((onConnected?: () => void) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      onConnected?.();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setErrorToast(null);
      onConnected?.();
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case 'ROOM_STATE': {
            roomStateRef.current = data.state;
            myPlayerIdRef.current = data.yourId;

            // Distinct JOIN ROOM audio trigger on initial entrance
            if (!inRoomRef.current) {
              inRoomRef.current = true;
              sound.playJoinRoom();
            }

            setRoomState(data.state);
            setMyPlayerId(data.yourId);
            setInRoom(true);

            // Sync URL room query parameter
            const url = new URL(window.location.href);
            url.searchParams.set('room', data.state.code);
            window.history.replaceState({}, '', url.toString());

            // Save chips to localStorage for persistence
            const me = data.state.players[data.yourId];
            if (me) {
              localStorage.setItem('7up7down_chips', String(me.chips));
            }
            break;
          }

          case 'TIMER_TICK': {
            if (data.phase === 'BETTING' && data.timer >= 14) {
              setHadActiveBet(false);
            }

            setRoomState((prev) => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                timer: data.timer,
                phase: data.phase,
              };
              roomStateRef.current = updated;
              return updated;
            });

            // Play countdown sound on last 3 seconds of betting
            if (data.phase === 'BETTING' && data.timer <= 3 && data.timer > 0) {
              sound.playTick();
            }
            break;
          }

          case 'ROLL_START': {
            sound.playDiceRoll();

            // Check if player had bets placed this round to determine win vs lose sound
            const currentMe = roomStateRef.current?.players[myPlayerIdRef.current];
            const activeBetTotal = currentMe
              ? (currentMe.bets.DOWN || 0) +
                (currentMe.bets.SEVEN || 0) +
                (currentMe.bets.UP || 0) +
                (currentMe.bets.DOUBLES || 0)
              : 0;
            setHadActiveBet(activeBetTotal > 0);

            setRoomState((prev) => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                phase: 'ROLLING' as const,
                timer: data.timer,
                lastRoll: data.roll,
              };
              roomStateRef.current = updated;
              return updated;
            });
            break;
          }

          case 'ROUND_SETTLED': {
            roomStateRef.current = data.state;
            setRoomState(data.state);
            // Save chips
            const me = data.state.players[myPlayerIdRef.current];
            if (me) {
              localStorage.setItem('7up7down_chips', String(me.chips));
            }

            // Update Progression & Career Stats if player participated
            const myWin = data.winners.find((w) => w.playerId === myPlayerIdRef.current);
            const playerBets = me?.bets || { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 };
            const totalBetPlaced =
              (playerBets.DOWN || 0) +
              (playerBets.SEVEN || 0) +
              (playerBets.UP || 0) +
              (playerBets.DOUBLES || 0);

            if (totalBetPlaced > 0 || hadActiveBet) {
              setUserStats((prev) => {
                const wonAmt = myWin ? myWin.winAmount : 0;
                const isWinner = wonAmt > 0;
                const currentStreak = isWinner ? prev.currentStreak + 1 : 0;
                const bestStreak = Math.max(prev.bestStreak, currentStreak);
                const biggestWin = Math.max(prev.biggestWin, wonAmt);

                const isLucky7 = isWinner && data.state.lastRoll?.outcome === 'SEVEN';
                const isDouble = isWinner && data.state.lastRoll?.isDouble;

                const lostThisRound = isWinner ? Math.max(0, totalBetPlaced - wonAmt) : (totalBetPlaced > 0 ? totalBetPlaced : 50);

                const updated: UserStats = {
                  ...prev,
                  gamesPlayed: prev.gamesPlayed + 1,
                  gamesWon: isWinner ? prev.gamesWon + 1 : prev.gamesWon,
                  chipsWon: prev.chipsWon + wonAmt,
                  chipsLost: prev.chipsLost + lostThisRound,
                  biggestWin,
                  currentStreak,
                  bestStreak,
                  luckySevenHits: isLucky7 ? prev.luckySevenHits + 1 : prev.luckySevenHits,
                  doublesHits: isDouble ? prev.doublesHits + 1 : prev.doublesHits,
                  betDistribution: {
                    DOWN: prev.betDistribution.DOWN + (playerBets.DOWN > 0 ? 1 : 0),
                    SEVEN: prev.betDistribution.SEVEN + (playerBets.SEVEN > 0 ? 1 : 0),
                    UP: prev.betDistribution.UP + (playerBets.UP > 0 ? 1 : 0),
                    DOUBLES: prev.betDistribution.DOUBLES + (playerBets.DOUBLES > 0 ? 1 : 0),
                  },
                };

                try {
                  localStorage.setItem('7up7down_player_stats', JSON.stringify(updated));
                } catch {}

                return updated;
              });
            }
            break;
          }

          case 'CHAT_MESSAGE': {
            setMessages((prev) => [...prev.slice(-40), data.message]);
            if (data.message.isSystem) {
              // Play distinct friend join audio when someone else joins table
              if (data.message.text.includes('joined the table')) {
                sound.playFriendJoined();
              }
            } else {
              sound.playPop();
            }
            break;
          }

          case 'EMOJI_BURST': {
            sound.playPop();
            setReactions((prev) => [...prev, data.reaction]);
            setTimeout(() => {
              setReactions((current) => current.filter((r) => r.id !== data.reaction.id));
            }, 3600);
            break;
          }

          case 'ERROR': {
            setErrorToast(data.message);
            setTimeout(() => setErrorToast(null), 3000);
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    socketRef.current = ws;
  }, [myPlayerId]);

  // Handle Join Room request from Lobby
  const handleJoinRoom = (roomCode: string, name: string, avatar: string) => {
    const savedChipsStr = localStorage.getItem('7up7down_chips');
    const savedChips = savedChipsStr ? parseInt(savedChipsStr, 10) : 1000;

    const joinPayload: ClientMessage = {
      type: 'JOIN_ROOM',
      roomCode,
      name,
      avatar,
      savedChips: isNaN(savedChips) ? 1000 : savedChips,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      sendSocketMessage(joinPayload);
    } else {
      pendingJoinRef.current = { roomCode, name, avatar };
      connectSocket(() => {
        sendSocketMessage(joinPayload);
      });
    }
  };

  // Leave room and return to lobby
  const handleLeaveRoom = () => {
    sendSocketMessage({ type: 'LEAVE_ROOM' });
    inRoomRef.current = false;
    roomStateRef.current = null;
    setHadActiveBet(false);
    setInRoom(false);
    setRoomState(null);
    setMessages([]);

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  // Place bet on table zone
  const handlePlaceBet = (betType: BetType, amount: number) => {
    sendSocketMessage({
      type: 'PLACE_BET',
      betType,
      amount,
    });
  };

  // Clear uncommitted bets
  const handleClearBets = () => {
    sendSocketMessage({ type: 'CLEAR_BETS' });
  };

  // Claim free chips faucet
  const handleClaimFreeChips = () => {
    sendSocketMessage({ type: 'CLAIM_FREE_CHIPS' });
  };

  // Roll now (Host action)
  const handleRollNow = () => {
    sendSocketMessage({ type: 'ROLL_NOW' });
  };

  // Chat and Emoji reactions
  const handleSendMessage = (text: string) => {
    sendSocketMessage({ type: 'SEND_CHAT', text });
  };

  const handleSendEmoji = (emoji: string) => {
    sendSocketMessage({ type: 'SEND_EMOJI', emoji });
  };

  // Calculate current player details
  const myPlayer = roomState && myPlayerId ? roomState.players[myPlayerId] : null;
  const myBets = myPlayer?.bets || { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 };
  const totalActiveBets =
    (myBets.DOWN || 0) + (myBets.SEVEN || 0) + (myBets.UP || 0) + (myBets.DOUBLES || 0);

  // Render Lobby if not in room
  if (!inRoom || !roomState) {
    return (
      <>
        <Lobby
          onJoinRoom={handleJoinRoom}
          initialRoomCode={initialRoomCode}
          onOpenRules={() => setShowRules(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenStats={() => setShowStatsModal(true)}
        />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        {showLeaderboardModal && (
          <Leaderboard
            players={{}}
            myPlayerId=""
            isModal={true}
            onClose={() => setShowLeaderboardModal(false)}
          />
        )}
        {showStatsModal && (
          <MyStats
            stats={userStats}
            currentChips={parseInt(localStorage.getItem('7up7down_chips') || '1000', 10)}
            playerName={localStorage.getItem('7up7down_name') || 'Player'}
            avatar={localStorage.getItem('7up7down_avatar') || '🎲'}
            isModal={true}
            onClose={() => setShowStatsModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-2 sm:p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white overflow-x-hidden">
      {/* Toast Error Alert */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Disconnected warning */}
      {!isConnected && (
        <div className="fixed top-2 right-2 z-50 bg-amber-600 text-black font-bold text-[10px] px-2.5 py-1 rounded-full shadow flex items-center gap-1.5">
          <WifiOff className="w-3 h-3" />
          <span>Reconnecting...</span>
        </div>
      )}

      {/* 1. Room Header (Room code, invite link, timer, host roll button, sound toggle, leaderboard, stats) */}
      <RoomHeader
        roomCode={roomState.code}
        roundNumber={roomState.roundNumber}
        phase={roomState.phase}
        timer={roomState.timer}
        isHost={myPlayer?.isHost || false}
        onRollNow={handleRollNow}
        onLeave={handleLeaveRoom}
        onOpenRules={() => setShowRules(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenStats={() => setShowStatsModal(true)}
      />

      {/* 2. Central Dice Rolling Stage */}
      <div className="my-2 sm:my-3">
        <Dice3D
          die1={roomState.lastRoll?.die1 || 3}
          die2={roomState.lastRoll?.die2 || 4}
          isRolling={roomState.phase === 'ROLLING'}
          outcome={roomState.phase === 'SETTLED' ? roomState.lastRoll?.outcome : null}
          isDouble={roomState.phase === 'SETTLED' ? roomState.lastRoll?.isDouble : false}
        />
      </div>

      {/* 3. Main Casino Betting Table (7 Down, Lucky 7, 7 Up, Doubles) */}
      <div className="flex-1 flex flex-col justify-center">
        <BettingTable
          phase={roomState.phase}
          myBets={myBets}
          totalBets={roomState.totalBets}
          players={roomState.players}
          myPlayerId={myPlayerId}
          selectedChipAmount={selectedChipAmount}
          onPlaceBet={handlePlaceBet}
          lastRoll={roomState.phase === 'SETTLED' ? roomState.lastRoll : null}
        />
      </div>

      {/* 4. Chip Denominations Selector & Player Wallet */}
      <div className="w-full max-w-5xl mx-auto mt-3">
        <ChipSelector
          selectedAmount={selectedChipAmount}
          onSelectAmount={setSelectedChipAmount}
          playerChips={myPlayer?.chips || 0}
          onClearBets={handleClearBets}
          onClaimFreeChips={handleClaimFreeChips}
          disabled={roomState.phase !== 'BETTING'}
          totalActiveBets={totalActiveBets}
        />
      </div>

      {/* 5. Connected Friends Table Bar */}
      <PlayersBar players={roomState.players} myPlayerId={myPlayerId} />

      {/* 6. Main Dashboard Layout: Progression & Stats, Top 10 Leaderboard, Roll Roadmap Tabs */}
      <div className="w-full max-w-5xl mx-auto mt-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 px-1 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                sound.playPop();
                setActiveBottomTab('stats');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeBottomTab === 'stats'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-md shadow-cyan-950/40'
                  : 'bg-neutral-800/80 text-neutral-400 border-white/10 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-cyan-300" />
              <span>My Progression & Stats</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                setActiveBottomTab('leaderboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeBottomTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 border-yellow-200 shadow-md shadow-amber-950/40'
                  : 'bg-neutral-800/80 text-neutral-400 border-white/10 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 fill-current" />
              <span>Top 10 Leaderboard</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                setActiveBottomTab('history');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeBottomTab === 'history'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 border-yellow-200 shadow-md shadow-amber-950/40'
                  : 'bg-neutral-800/80 text-neutral-400 border-white/10 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Roll Roadmap ({roomState.history.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-amber-300/80 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Player Progression Sync</span>
          </div>
        </div>

        {/* Tab Content */}
        {activeBottomTab === 'stats' ? (
          <MyStats
            stats={userStats}
            currentChips={myPlayer?.chips || 1000}
            playerName={myPlayer?.name || 'Player'}
            avatar={myPlayer?.avatar || '🎲'}
          />
        ) : activeBottomTab === 'leaderboard' ? (
          <Leaderboard
            players={roomState.players}
            myPlayerId={myPlayerId}
            roomCode={roomState.code}
          />
        ) : (
          <HistoryStats history={roomState.history} />
        )}
      </div>

      {/* 7. Live Chat & Floating Emoji Cannon */}
      <LiveChat
        messages={messages}
        reactions={reactions}
        onSendMessage={handleSendMessage}
        onSendEmoji={handleSendEmoji}
      />

      {/* 8. Settlement Celebration Overlay & Fanfare */}
      <WinModal
        phase={roomState.phase}
        lastRoll={roomState.lastRoll}
        winners={roomState.lastWinners}
        myPlayerId={myPlayerId}
        hadActiveBet={hadActiveBet}
      />

      {/* 9. Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* 10. Dedicated Leaderboard Modal (Quick Popout) */}
      {showLeaderboardModal && (
        <Leaderboard
          players={roomState.players}
          myPlayerId={myPlayerId}
          roomCode={roomState.code}
          isModal={true}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      {/* 11. Dedicated My Stats Modal (Quick Popout) */}
      {showStatsModal && (
        <MyStats
          stats={userStats}
          currentChips={myPlayer?.chips || 1000}
          playerName={myPlayer?.name || 'Player'}
          avatar={myPlayer?.avatar || '🎲'}
          isModal={true}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
}
