export type BetType = 'DOWN' | 'SEVEN' | 'UP' | 'DOUBLES';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  isHost: boolean;
  connected: boolean;
  bets: Record<BetType, number>;
  lastWin: number;
  totalWon: number;
}

export type GamePhase = 'BETTING' | 'ROLLING' | 'SETTLED';

export interface RollResult {
  die1: number;
  die2: number;
  sum: number;
  isDouble: boolean;
  outcome: 'DOWN' | 'SEVEN' | 'UP';
}

export interface RoundWinner {
  playerId: string;
  name: string;
  avatar: string;
  winAmount: number;
  netProfit: number;
}

export interface HistoryItem {
  round: number;
  die1: number;
  die2: number;
  sum: number;
  outcome: 'DOWN' | 'SEVEN' | 'UP';
  isDouble: boolean;
  timestamp: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: GamePhase;
  timer: number;
  roundNumber: number;
  players: Record<string, Player>;
  history: HistoryItem[];
  lastRoll: RollResult | null;
  lastWinners: RoundWinner[];
  totalBets: Record<BetType, number>;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  chipsWon: number;
  chipsLost: number;
  biggestWin: number;
  currentStreak: number;
  bestStreak: number;
  luckySevenHits: number;
  doublesHits: number;
  betDistribution: Record<BetType, number>;
}

// Client -> Server messages
export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; name: string; avatar: string; savedChips?: number }
  | { type: 'PLACE_BET'; betType: BetType; amount: number }
  | { type: 'CLEAR_BETS' }
  | { type: 'REPEAT_LAST_BETS' }
  | { type: 'ROLL_NOW' }
  | { type: 'CLAIM_FREE_CHIPS' }
  | { type: 'CLAIM_DAILY_BONUS'; amount: number }
  | { type: 'SEND_CHAT'; text: string }
  | { type: 'SEND_EMOJI'; emoji: string }
  | { type: 'LEAVE_ROOM' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'ROOM_STATE'; state: RoomState; yourId: string }
  | { type: 'TIMER_TICK'; timer: number; phase: GamePhase }
  | { type: 'ROLL_START'; roll: RollResult; timer: number }
  | { type: 'ROUND_SETTLED'; state: RoomState; winners: RoundWinner[] }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'EMOJI_BURST'; reaction: EmojiReaction }
  | { type: 'ERROR'; message: string };
