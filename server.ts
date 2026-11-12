import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  ClientMessage,
  ServerMessage,
  RoomState,
  Player,
  BetType,
  RollResult,
  RoundWinner,
  HistoryItem,
  ChatMessage,
  EmojiReaction,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = Number(process.env.PORT) || 3000;
const BETTING_DURATION = 15; // 15 seconds to place bets
const SETTLED_DURATION = 5;  // 5 seconds to celebrate and view results

interface RoomData {
  state: RoomState;
  sockets: Map<string, WebSocket>;
  intervalId?: NodeJS.Timeout;
  lastActive: number;
}

const rooms = new Map<string, RoomData>();

// Helper to generate readable 5-letter room codes
function generateRoomCode(): string {
  const words = ['LUCKY', 'SEVEN', 'ROLLS', 'ACES', 'DICE', 'ROYAL', 'GOLD', 'CROWN', 'TITAN', 'VEGAS'];
  const base = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(10 + Math.random() * 89);
  const code = `${base}${num}`;
  return rooms.has(code) ? generateRoomCode() : code;
}

function broadcastToRoom(room: RoomData, msg: ServerMessage) {
  const payload = JSON.stringify(msg);
  for (const [_, ws] of room.sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function calculateTotalBets(players: Record<string, Player>): Record<BetType, number> {
  const totals: Record<BetType, number> = {
    DOWN: 0,
    SEVEN: 0,
    UP: 0,
    DOUBLES: 0,
  };
  for (const p of Object.values(players)) {
    totals.DOWN += p.bets.DOWN || 0;
    totals.SEVEN += p.bets.SEVEN || 0;
    totals.UP += p.bets.UP || 0;
    totals.DOUBLES += p.bets.DOUBLES || 0;
  }
  return totals;
}

function startRoomGameLoop(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || room.intervalId) return;

  room.intervalId = setInterval(() => {
    const r = rooms.get(roomCode);
    if (!r) return;

    r.lastActive = Date.now();

    // If no players are connected, pause loop after a while
    const connectedCount = Object.values(r.state.players).filter((p) => p.connected).length;
    if (connectedCount === 0) {
      // Room empty, continue timer or clean up after 10 mins
      if (Date.now() - r.lastActive > 10 * 60 * 1000) {
        clearInterval(r.intervalId);
        rooms.delete(roomCode);
        return;
      }
    }

    if (r.state.phase === 'BETTING') {
      if (r.state.timer > 0) {
        r.state.timer -= 1;
        broadcastToRoom(r, {
          type: 'TIMER_TICK',
          timer: r.state.timer,
          phase: 'BETTING',
        });
      } else {
        // Time is up: roll the dice!
        executeRoll(roomCode);
      }
    } else if (r.state.phase === 'SETTLED') {
      if (r.state.timer > 0) {
        r.state.timer -= 1;
        broadcastToRoom(r, {
          type: 'TIMER_TICK',
          timer: r.state.timer,
          phase: 'SETTLED',
        });
      } else {
        // Reset for next betting round
        r.state.phase = 'BETTING';
        r.state.timer = BETTING_DURATION;
        r.state.roundNumber += 1;
        r.state.lastWinners = [];

        // Reset player bets
        for (const p of Object.values(r.state.players)) {
          p.bets = { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 };
          p.lastWin = 0;
        }
        r.state.totalBets = calculateTotalBets(r.state.players);

        // Broadcast full fresh state
        for (const [pid, ws] of r.sockets) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ROOM_STATE', state: r.state, yourId: pid }));
          }
        }
      }
    }
  }, 1000);
}

function executeRoll(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || room.state.phase !== 'BETTING') return;

  room.state.phase = 'ROLLING';
  room.state.timer = 2; // 2.5s rolling animation on client

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const sum = die1 + die2;
  const isDouble = die1 === die2;
  const outcome: 'DOWN' | 'SEVEN' | 'UP' = sum < 7 ? 'DOWN' : sum === 7 ? 'SEVEN' : 'UP';

  const rollResult: RollResult = {
    die1,
    die2,
    sum,
    isDouble,
    outcome,
  };
  room.state.lastRoll = rollResult;

  broadcastToRoom(room, {
    type: 'ROLL_START',
    roll: rollResult,
    timer: 2,
  });

  // Wait 2.5s for 3D dice roll animation before settling
  setTimeout(() => {
    settleRound(roomCode, rollResult);
  }, 2500);
}

function settleRound(roomCode: string, roll: RollResult) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.state.phase = 'SETTLED';
  room.state.timer = SETTLED_DURATION;

  const winners: RoundWinner[] = [];

  for (const player of Object.values(room.state.players)) {
    let winAmount = 0;
    const totalBetPlaced =
      (player.bets.DOWN || 0) +
      (player.bets.SEVEN || 0) +
      (player.bets.UP || 0) +
      (player.bets.DOUBLES || 0);

    // DOWN: Pays 2x
    if (roll.outcome === 'DOWN' && player.bets.DOWN > 0) {
      winAmount += player.bets.DOWN * 2;
    }
    // SEVEN: Pays 3x (High excitement return on exact 7)
    if (roll.outcome === 'SEVEN' && player.bets.SEVEN > 0) {
      winAmount += player.bets.SEVEN * 3;
    }
    // UP: Pays 2x
    if (roll.outcome === 'UP' && player.bets.UP > 0) {
      winAmount += player.bets.UP * 2;
    }
    // DOUBLES: Pays 5x
    if (roll.isDouble && player.bets.DOUBLES > 0) {
      winAmount += player.bets.DOUBLES * 5;
    }

    if (winAmount > 0) {
      player.chips += winAmount;
      player.lastWin = winAmount;
      player.totalWon += winAmount;
      const netProfit = winAmount - totalBetPlaced;
      winners.push({
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        winAmount,
        netProfit,
      });
    } else {
      player.lastWin = 0;
    }
  }

  // Record in history
  const historyItem: HistoryItem = {
    round: room.state.roundNumber,
    die1: roll.die1,
    die2: roll.die2,
    sum: roll.sum,
    outcome: roll.outcome,
    isDouble: roll.isDouble,
    timestamp: Date.now(),
  };
  room.state.history.unshift(historyItem);
  if (room.state.history.length > 25) {
    room.state.history.pop();
  }

  room.state.lastWinners = winners;

  // Broadcast settlement with updated state
  broadcastToRoom(room, {
    type: 'ROUND_SETTLED',
    state: room.state,
    winners,
  });
}

// WebSocket Connection handling
wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let playerId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString()) as ClientMessage;

      switch (msg.type) {
        case 'JOIN_ROOM': {
          let code = (msg.roomCode || '').trim().toUpperCase();
          if (!code) {
            code = generateRoomCode();
          }

          let room = rooms.get(code);
          const isNewRoom = !room;

          if (!room) {
            room = {
              state: {
                code,
                hostId: '',
                phase: 'BETTING',
                timer: BETTING_DURATION,
                roundNumber: 1,
                players: {},
                history: [],
                lastRoll: null,
                lastWinners: [],
                totalBets: { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 },
              },
              sockets: new Map(),
              lastActive: Date.now(),
            };
            rooms.set(code, room);
          }

          playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
          currentRoomCode = code;

          const isHost = isNewRoom || Object.values(room.state.players).length === 0;
          if (isHost) {
            room.state.hostId = playerId;
          }

          const startingChips = typeof msg.savedChips === 'number' && msg.savedChips >= 100 ? msg.savedChips : 1000;

          const newPlayer: Player = {
            id: playerId,
            name: msg.name.trim() || `Player ${Object.keys(room.state.players).length + 1}`,
            avatar: msg.avatar || '🎲',
            chips: startingChips,
            isHost,
            connected: true,
            bets: { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 },
            lastWin: 0,
            totalWon: 0,
          };

          room.state.players[playerId] = newPlayer;
          room.sockets.set(playerId, ws);

          startRoomGameLoop(code);

          // Send current room state to joined player
          ws.send(
            JSON.stringify({
              type: 'ROOM_STATE',
              state: room.state,
              yourId: playerId,
            })
          );

          // Broadcast system message to all players
          broadcastToRoom(room, {
            type: 'CHAT_MESSAGE',
            message: {
              id: `sys_${Date.now()}_${Math.random()}`,
              playerId: 'system',
              name: 'Dealer',
              avatar: '🎩',
              text: `${newPlayer.name} joined the table!`,
              timestamp: Date.now(),
              isSystem: true,
            },
          });

          // Broadcast state update to everyone else
          for (const [pid, clientWs] of room.sockets) {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'ROOM_STATE',
                  state: room.state,
                  yourId: pid,
                })
              );
            }
          }
          break;
        }

        case 'PLACE_BET': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state.phase !== 'BETTING') return;

          const player = room.state.players[playerId];
          if (!player) return;

          const amount = Math.floor(msg.amount);
          if (amount <= 0 || player.chips < amount) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Not enough chips!' }));
            return;
          }

          player.chips -= amount;
          player.bets[msg.betType] = (player.bets[msg.betType] || 0) + amount;
          room.state.totalBets = calculateTotalBets(room.state.players);

          // Broadcast updated state to all
          for (const [pid, clientWs] of room.sockets) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'ROOM_STATE',
                  state: room.state,
                  yourId: pid,
                })
              );
            }
          }
          break;
        }

        case 'CLEAR_BETS': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state.phase !== 'BETTING') return;

          const player = room.state.players[playerId];
          if (!player) return;

          const refunded =
            player.bets.DOWN + player.bets.SEVEN + player.bets.UP + player.bets.DOUBLES;
          if (refunded > 0) {
            player.chips += refunded;
            player.bets = { DOWN: 0, SEVEN: 0, UP: 0, DOUBLES: 0 };
            room.state.totalBets = calculateTotalBets(room.state.players);

            for (const [pid, clientWs] of room.sockets) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'ROOM_STATE',
                    state: room.state,
                    yourId: pid,
                  })
                );
              }
            }
          }
          break;
        }

        case 'REPEAT_LAST_BETS': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state.phase !== 'BETTING') return;
          // repeat functionality handled on client side by sending multiple PLACE_BET or we can double
          break;
        }

        case 'ROLL_NOW': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.state.phase !== 'BETTING') return;

          const player = room.state.players[playerId];
          // Allow host to trigger roll immediately if at least someone bet or timer is running
          if (player && player.isHost) {
            executeRoll(currentRoomCode);
          }
          break;
        }

        case 'CLAIM_FREE_CHIPS': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.state.players[playerId];
          if (!player) return;

          // Free chips faucet when balance is low (< 200)
          if (player.chips < 200) {
            player.chips += 500;
            for (const [pid, clientWs] of room.sockets) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'ROOM_STATE',
                    state: room.state,
                    yourId: pid,
                  })
                );
              }
            }
            broadcastToRoom(room, {
              type: 'CHAT_MESSAGE',
              message: {
                id: `sys_${Date.now()}`,
                playerId: 'system',
                name: 'Casino Bank',
                avatar: '🏦',
                text: `${player.name} claimed 500 free bonus chips!`,
                timestamp: Date.now(),
                isSystem: true,
              },
            });
          }
          break;
        }

        case 'CLAIM_DAILY_BONUS': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.state.players[playerId];
          if (!player) return;

          const amount = Math.min(10000, Math.max(500, Math.floor(msg.amount || 1000)));
          player.chips += amount;

          for (const [pid, clientWs] of room.sockets) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'ROOM_STATE',
                  state: room.state,
                  yourId: pid,
                })
              );
            }
          }

          broadcastToRoom(room, {
            type: 'CHAT_MESSAGE',
            message: {
              id: `sys_daily_${Date.now()}`,
              playerId: 'system',
              name: 'Casino Bank',
              avatar: '🎁',
              text: `${player.name} claimed their Daily Bonus of $${amount.toLocaleString()} chips!`,
              timestamp: Date.now(),
              isSystem: true,
            },
          });
          break;
        }

        case 'SEND_CHAT': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.state.players[playerId];
          if (!player) return;

          const text = (msg.text || '').trim().slice(0, 140);
          if (!text) return;

          broadcastToRoom(room, {
            type: 'CHAT_MESSAGE',
            message: {
              id: `chat_${Date.now()}_${Math.random()}`,
              playerId,
              name: player.name,
              avatar: player.avatar,
              text,
              timestamp: Date.now(),
            },
          });
          break;
        }

        case 'SEND_EMOJI': {
          if (!currentRoomCode || !playerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.state.players[playerId];
          if (!player) return;

          const emoji = msg.emoji || '🎲';
          const reaction: EmojiReaction = {
            id: `react_${Date.now()}_${Math.random()}`,
            emoji,
            senderName: player.name,
            x: Math.floor(15 + Math.random() * 70), // Random percentage horizontal
          };

          broadcastToRoom(room, {
            type: 'EMOJI_BURST',
            reaction,
          });
          break;
        }

        case 'LEAVE_ROOM': {
          handleDisconnect();
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  const handleDisconnect = () => {
    if (!currentRoomCode || !playerId) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    room.sockets.delete(playerId);
    const player = room.state.players[playerId];

    if (player) {
      player.connected = false;

      // If disconnected player was host, transfer host to next connected player
      if (player.isHost) {
        player.isHost = false;
        const nextHost = Object.values(room.state.players).find((p) => p.connected && p.id !== playerId);
        if (nextHost) {
          nextHost.isHost = true;
          room.state.hostId = nextHost.id;
        }
      }

      broadcastToRoom(room, {
        type: 'CHAT_MESSAGE',
        message: {
          id: `sys_leave_${Date.now()}`,
          playerId: 'system',
          name: 'Dealer',
          avatar: '🎩',
          text: `${player.name} left the table.`,
          timestamp: Date.now(),
          isSystem: true,
        },
      });

      // Update room state for remaining players
      for (const [pid, clientWs] of room.sockets) {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'ROOM_STATE',
              state: room.state,
              yourId: pid,
            })
          );
        }
      }
    }
  };

  ws.on('close', handleDisconnect);
  ws.on('error', handleDisconnect);
});

// REST Health Check & Active Rooms API
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    roomsActive: rooms.size,
    timestamp: Date.now(),
  });
});

app.get('/api/room/:code', (req, res) => {
  const code = (req.params.code || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  const connectedPlayers = Object.values(room.state.players).filter((p) => p.connected);
  res.json({
    code,
    roundNumber: room.state.roundNumber,
    phase: room.state.phase,
    playerCount: connectedPlayers.length,
    players: connectedPlayers.map((p) => ({
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
    })),
  });
});

app.get('/api/leaderboard', (_req, res) => {
  const allPlayersMap = new Map<string, { id: string; name: string; avatar: string; chips: number; totalWon: number; roomCode: string; connected: boolean }>();

  for (const [code, r] of rooms) {
    for (const p of Object.values(r.state.players)) {
      const existing = allPlayersMap.get(p.name);
      if (!existing || p.chips > existing.chips) {
        allPlayersMap.set(p.name, {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips,
          totalWon: p.totalWon || 0,
          roomCode: code,
          connected: p.connected,
        });
      }
    }
  }

  const top10 = Array.from(allPlayersMap.values())
    .sort((a, b) => b.chips - a.chips)
    .slice(0, 10);

  res.json({ top10 });
});

// Vite middleware for development or Static server for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎰 7 Up 7 Down Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
