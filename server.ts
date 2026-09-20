import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  RoomState,
  PlayerInfo,
  PlayerRaceState,
  ClientMessage,
  ServerMessage,
  RaceResult,
  CustomRoomSettings,
} from './src/types';

const PORT = 3000;
const app = express();
const server = http.createServer(app);

app.use(express.json());

// In-memory room store
const rooms = new Map<string, RoomState>();
const playerSockets = new Map<string, { ws: WebSocket; roomId?: string; name: string }>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function broadcastToRoom(roomId: string, message: ServerMessage, exceptPlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const pid of Object.keys(room.players)) {
    if (exceptPlayerId && pid === exceptPlayerId) continue;
    const client = playerSockets.get(pid);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, activePlayers: playerSockets.size });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values()).map(r => ({
    code: r.code,
    name: r.name,
    status: r.status,
    playerCount: Object.keys(r.players).length,
    maxPlayers: r.maxPlayers,
    trackId: r.trackId || 'neon_orbit',
    laps: r.laps || 2,
    settings: r.settings,
  }));
  res.json({ rooms: publicRooms });
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });
let nextPlayerId = 1;

wss.on('connection', (ws: WebSocket) => {
  const playerId = `pilot_${nextPlayerId++}_${Math.random().toString(36).substring(2, 6)}`;
  playerSockets.set(playerId, { ws, name: `Rider ${nextPlayerId}` });

  // Send initial connection ACK
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    playerId,
    timestamp: Date.now(),
  } as ServerMessage));

  ws.on('message', (raw: string) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());
      handleClientMessage(playerId, ws, msg);
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  });

  ws.on('close', () => {
    handlePlayerDisconnect(playerId);
  });

  ws.on('error', (err) => {
    console.warn(`WebSocket error for player ${playerId}:`, err);
  });
});

function handlePlayerDisconnect(playerId: string) {
  const info = playerSockets.get(playerId);
  if (!info) return;

  if (info.roomId) {
    const room = rooms.get(info.roomId);
    if (room) {
      delete room.players[playerId];
      const remainingPids = Object.keys(room.players);
      if (remainingPids.length === 0) {
        // Clean up empty room
        rooms.delete(info.roomId);
      } else {
        // If host disconnected, reassign host to the next non-bot player
        if (room.hostId === playerId) {
          const nextHost = remainingPids.find(pid => !room.players[pid].isBot) || remainingPids[0];
          room.hostId = nextHost;
          if (room.players[nextHost]) {
            room.players[nextHost].isHost = true;
          }
        }
        broadcastToRoom(info.roomId, {
          type: 'ROOM_UPDATED',
          room,
        });
      }
    }
  }
  playerSockets.delete(playerId);
}

const TRACK_LENGTHS: Record<string, number> = {
  neon_orbit: 4600,
  void_rift: 5300,
  pulsar_station: 4800,
  solar_drift: 4950,
  event_horizon: 5500,
  cyber_canyon: 5100,
  quantum_slipstream: 5200,
  stellar_graveyard: 5600,
  circuit_alpha: 4600,
  nebula_rift: 5300,
};

function addBotToRoom(room: RoomState): boolean {
  const pCount = Object.keys(room.players).length;
  if (pCount >= room.maxPlayers) return false;

  const botNames = ['K-9000', 'Nova-7', 'Aero-X', 'Spectre', 'Hyperion', 'Zero-G', 'Cosmo', 'Titan-V'];
  const botShips = ['apex_phantom', 'vortex_nemesis', 'solaris_stinger', 'void_valkyrie'];
  const botColors = ['#ff0055', '#ffaa00', '#00e5ff', '#9900ff', '#39ff14', '#ffffff'];

  const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const name = botNames[Math.floor(Math.random() * botNames.length)];
  const shipId = botShips[Math.floor(Math.random() * botShips.length)];
  const color = botColors[Math.floor(Math.random() * botColors.length)];

  // Balance team assignments for bots in team modes
  const alphaCount = Object.values(room.players).filter(p => p.team === 'ALPHA').length;
  const omegaCount = Object.values(room.players).filter(p => p.team === 'OMEGA').length;
  const team = alphaCount <= omegaCount ? 'ALPHA' : 'OMEGA';

  room.players[botId] = {
    id: botId,
    name: `[AI] ${name}`,
    shipId,
    color,
    isHost: false,
    isReady: true,
    isBot: true,
    team,
    ping: 0,
  };
  return true;
}

function handleClientMessage(playerId: string, ws: WebSocket, msg: ClientMessage) {
  const playerEntry = playerSockets.get(playerId);
  if (!playerEntry) return;

  switch (msg.type) {
    case 'PING': {
      ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: msg.timestamp,
      } as ServerMessage));
      break;
    }
    case 'CREATE_ROOM': {
      const code = generateRoomCode();
      const playerName = msg.name?.trim() || `Pilot ${code.slice(0, 3)}`;
      const playerShip = msg.shipId || 'apex_phantom';
      const playerColor = msg.color || '#00f0ff';
      const playerSecondaryColor = msg.secondaryColor || '#ff00e5';
      const playerDecal = msg.decal || 'none';
      const playerUpgrades = msg.upgrades || { engine: 0, handling: 0, boost: 0, chassis: 0 };
      const trackId = msg.trackId || msg.settings?.trackId || 'neon_orbit';
      const laps = msg.laps || msg.settings?.laps || 2;
      const isDuel = msg.settings?.mode === 'DUEL_1V1';
      const maxPlayers = isDuel ? 2 : 8;

      const settings = msg.settings || {
        mode: isDuel ? 'DUEL_1V1' : 'CASUAL',
        trackId,
        laps,
        aiBots: true,
        collisionsEnabled: true,
        powerUpsEnabled: true,
        damageMode: 'CASUAL',
      };

      const newRoom: RoomState = {
        code,
        name: `${playerName}'s Circuit`,
        hostId: playerId,
        status: 'LOBBY',
        maxPlayers,
        laps,
        countdown: 3,
        raceStartTime: 0,
        trackId,
        settings,
        players: {
          [playerId]: {
            id: playerId,
            name: playerName,
            shipId: playerShip,
            color: playerColor,
            secondaryColor: playerSecondaryColor,
            decal: playerDecal,
            upgrades: playerUpgrades,
            isHost: true,
            isReady: true,
            isSpectator: !!msg.isSpectator,
            team: msg.team || 'ALPHA',
            ping: 20,
          },
        },
        results: [],
      };
      rooms.set(code, newRoom);
      playerEntry.roomId = code;
      playerEntry.name = playerName;

      ws.send(JSON.stringify({
        type: 'ROOM_JOINED',
        room: newRoom,
        playerId,
      } as ServerMessage));
      break;
    }
    case 'QUICK_MATCH': {
      // Find open lobby with space (and matching mode if requested)
      let foundRoom: RoomState | null = null;
      for (const room of rooms.values()) {
        const pCount = Object.keys(room.players).length;
        const matchesMode = !msg.mode || room.settings?.mode === msg.mode;
        if (room.status === 'LOBBY' && pCount < room.maxPlayers && matchesMode) {
          foundRoom = room;
          break;
        }
      }

      if (foundRoom) {
        // Join found room
        joinExistingRoom(playerId, ws, foundRoom.code, msg);
      } else {
        // Create new public room
        const defaultMode = msg.mode || 'CASUAL';
        const isDuel = defaultMode === 'DUEL_1V1';
        const createSettings: CustomRoomSettings = {
          mode: defaultMode,
          trackId: msg.trackId || 'neon_orbit',
          laps: 2,
          aiBots: !isDuel,
          collisionsEnabled: true,
          powerUpsEnabled: true,
          damageMode: defaultMode === 'COMPETITIVE' ? 'REALISTIC' : 'CASUAL',
        };
        handleClientMessage(playerId, ws, { ...msg, type: 'CREATE_ROOM', settings: createSettings });
        const currentEntry = playerSockets.get(playerId);
        if (currentEntry?.roomId) {
          const createdRoom = rooms.get(currentEntry.roomId);
          if (createdRoom && !isDuel) {
            addBotToRoom(createdRoom);
            addBotToRoom(createdRoom);
            broadcastToRoom(createdRoom.code, {
              type: 'ROOM_UPDATED',
              room: createdRoom,
            });
          }
        }
      }
      break;
    }
    case 'JOIN_ROOM': {
      const code = msg.roomId?.toUpperCase().trim();
      if (!code || !rooms.has(code)) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Room not found. Check the 6-character code and try again.',
        } as ServerMessage));
        return;
      }
      joinExistingRoom(playerId, ws, code, msg);
      break;
    }
    case 'SET_READY': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || !room.players[playerId]) return;

      room.players[playerId].isReady = !!msg.isReady;
      broadcastToRoom(room.code, {
        type: 'ROOM_UPDATED',
        room,
      });
      break;
    }
    case 'SET_TRACK': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.hostId !== playerId) return;

      if (msg.trackId) {
        room.trackId = msg.trackId;
        broadcastToRoom(room.code, {
          type: 'ROOM_UPDATED',
          room,
        });
      }
      break;
    }
    case 'UPDATE_SHIP': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || !room.players[playerId]) return;

      if (msg.shipId) room.players[playerId].shipId = msg.shipId;
      if (msg.color) room.players[playerId].color = msg.color;
      if (msg.secondaryColor) room.players[playerId].secondaryColor = msg.secondaryColor;
      if (msg.decal) room.players[playerId].decal = msg.decal;
      if (msg.upgrades) room.players[playerId].upgrades = msg.upgrades;
      if (msg.name) room.players[playerId].name = msg.name;

      broadcastToRoom(room.code, {
        type: 'ROOM_UPDATED',
        room,
      });
      break;
    }
    case 'ADD_BOT': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.hostId !== playerId) return;

      const added = addBotToRoom(room);
      if (added) {
        broadcastToRoom(room.code, {
          type: 'ROOM_UPDATED',
          room,
        });
      }
      break;
    }
    case 'START_RACE': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.hostId !== playerId) return;
      if (room.status !== 'LOBBY' && room.status !== 'FINISHED') return;

      // Start countdown sequence
      room.status = 'COUNTDOWN';
      room.countdown = 3;
      room.results = [];

      // Reset players' race state
      for (const pid of Object.keys(room.players)) {
        room.players[pid].raceState = {
          x: 0,
          y: 0,
          z: 0,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
          speed: 0,
          boost: 100,
          isBoosting: false,
          isDrifting: false,
          lap: 1,
          currentCheckpoint: 0,
          progressDistance: 0,
          rank: 1,
        };
      }

      broadcastToRoom(room.code, {
        type: 'ROOM_UPDATED',
        room,
      });

      // Handle 3, 2, 1, GO countdown
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        if (!rooms.has(room.code)) {
          clearInterval(countdownInterval);
          return;
        }
        room.countdown = count;
        if (count > 0) {
          broadcastToRoom(room.code, {
            type: 'COUNTDOWN_TICK',
            countdown: count,
          });
        } else if (count === 0) {
          room.status = 'RACING';
          room.raceStartTime = Date.now();
          broadcastToRoom(room.code, {
            type: 'RACE_STARTED',
            room,
          });
          clearInterval(countdownInterval);
        }
      }, 1000);
      break;
    }
    case 'PLAYER_UPDATE': {
      if (!playerEntry.roomId || !msg.raceState) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.status !== 'RACING') return;

      const p = room.players[playerId];
      if (!p) return;

      // Anti-Cheat: Validate and clamp speed (max realistic speed with all upgrades + full boost is 480 km/h)
      const incoming = msg.raceState;
      const validatedSpeed = Math.min(Math.max(incoming.speed || 0, 0), 480);
      incoming.speed = validatedSpeed;

      // Anti-Cheat: Prevent checkpoint teleportation / backwards skipping
      const prevCheckpoint = p.raceState?.currentCheckpoint ?? 0;
      const prevLap = p.raceState?.lap ?? 1;
      const cpDelta = (incoming.currentCheckpoint - prevCheckpoint + 12) % 12;
      if (cpDelta > 4 && cpDelta < 9) {
        // Reject suspicious checkpoint jumps across the track
        incoming.currentCheckpoint = prevCheckpoint;
      }

      // Anti-Cheat: Validate lap completion elapsed time (minimum 12s per full cosmic lap)
      const elapsedSec = (Date.now() - room.raceStartTime) / 1000;
      if (incoming.lap > prevLap && elapsedSec < (incoming.lap - 1) * 12) {
        incoming.lap = prevLap;
      }

      p.raceState = {
        ...p.raceState,
        ...incoming,
      };

      // Check if finished
      if (p.raceState.lap > room.laps && !p.raceState.finishTime) {
        const finishTime = Date.now() - room.raceStartTime;
        p.raceState.finishTime = finishTime;
        const rank = room.results.length + 1;
        p.raceState.rank = rank;

        const result: RaceResult = {
          playerId: p.id,
          name: p.name,
          shipId: p.shipId,
          rank,
          finishTime,
          bestLapTime: Math.floor(finishTime / room.laps),
        };
        room.results.push(result);

        broadcastToRoom(room.code, {
          type: 'PLAYER_FINISHED',
          results: room.results,
        });

        // Check if all players (or sufficient players) have completed
        const totalNonBots = Object.values(room.players).filter(pl => !pl.isBot && !pl.isSpectator).length;
        const finishedNonBots = room.results.filter(r => !r.name?.startsWith('[AI]')).length;

        if (finishedNonBots >= totalNonBots || room.results.length >= Object.keys(room.players).length) {
          room.status = 'FINISHED';
          broadcastToRoom(room.code, {
            type: 'RACE_FINISHED',
            room,
            results: room.results,
          });
        }
      }
      break;
    }
    case 'UPDATE_SETTINGS': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.hostId !== playerId) return;
      if (msg.settings) {
        room.settings = { ...room.settings, ...msg.settings };
        if (msg.settings.laps) room.laps = msg.settings.laps;
        if (msg.settings.trackId) room.trackId = msg.settings.trackId;
        broadcastToRoom(room.code, {
          type: 'ROOM_UPDATED',
          room,
        });
      }
      break;
    }
    case 'SET_TEAM': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || !room.players[playerId]) return;
      if (msg.team === 'ALPHA' || msg.team === 'OMEGA') {
        room.players[playerId].team = msg.team;
        broadcastToRoom(room.code, {
          type: 'ROOM_UPDATED',
          room,
        });
      }
      break;
    }
    case 'SET_ROLE': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || !room.players[playerId]) return;
      room.players[playerId].isSpectator = !!msg.isSpectator;
      broadcastToRoom(room.code, {
        type: 'ROOM_UPDATED',
        room,
      });
      break;
    }
    case 'RESTART_RACE': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room) return;

      room.status = 'LOBBY';
      room.results = [];
      broadcastToRoom(room.code, {
        type: 'ROOM_UPDATED',
        room,
      });
      break;
    }
    case 'USE_POWERUP': {
      if (!playerEntry.roomId || !msg.powerUpType) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.status !== 'RACING') return;

      broadcastToRoom(room.code, {
        type: 'POWERUP_EVENT',
        playerId,
        powerUpType: msg.powerUpType,
      });
      break;
    }
    case 'DAMAGE_EVENT': {
      if (!playerEntry.roomId) return;
      const room = rooms.get(playerEntry.roomId);
      if (!room || room.status !== 'RACING') return;

      // Authoritative damage tracking for multiplayer
      const p = room.players[playerId];
      if (p && p.raceState) {
        // Can be used for spectator or hull broadcast
      }
      break;
    }
    case 'LEAVE_ROOM': {
      handlePlayerDisconnect(playerId);
      break;
    }
  }
}

function joinExistingRoom(playerId: string, ws: WebSocket, code: string, msg: ClientMessage) {
  const room = rooms.get(code);
  if (!room) return;

  const currentCount = Object.keys(room.players).length;
  if (currentCount >= room.maxPlayers) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Room is full (maximum 8 players).',
    } as ServerMessage));
    return;
  }

  const playerEntry = playerSockets.get(playerId);
  if (playerEntry) {
    playerEntry.roomId = code;
    playerEntry.name = msg.name?.trim() || `Pilot ${code.slice(0, 3)}`;
  }

  const playerName = playerEntry?.name || 'Rider';
  const playerShip = msg.shipId || 'apex_phantom';
  const playerColor = msg.color || '#00f0ff';
  const playerSecondaryColor = msg.secondaryColor || '#ff00e5';
  const playerDecal = msg.decal || 'none';
  const playerUpgrades = msg.upgrades || { engine: 0, handling: 0, boost: 0, chassis: 0 };

  // Determine team balance
  const alphaCount = Object.values(room.players).filter(p => p.team === 'ALPHA').length;
  const omegaCount = Object.values(room.players).filter(p => p.team === 'OMEGA').length;
  const assignedTeam = msg.team || (alphaCount <= omegaCount ? 'ALPHA' : 'OMEGA');

  room.players[playerId] = {
    id: playerId,
    name: playerName,
    shipId: playerShip,
    color: playerColor,
    secondaryColor: playerSecondaryColor,
    decal: playerDecal,
    upgrades: playerUpgrades,
    isHost: false,
    isReady: false,
    isSpectator: !!msg.isSpectator,
    team: assignedTeam,
    ping: 25,
  };

  ws.send(JSON.stringify({
    type: 'ROOM_JOINED',
    room,
    playerId,
  } as ServerMessage));

  broadcastToRoom(code, {
    type: 'ROOM_UPDATED',
    room,
  }, playerId);
}

// Server tick loop: AI Bots progression & authoritative ranks broadcast (25Hz)
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.status !== 'RACING') continue;

    const now = Date.now();
    const elapsed = (now - room.raceStartTime) / 1000;

    // Simulate AI Bot progress if any bots in the race
    const trackLen = TRACK_LENGTHS[room.trackId || 'circuit_alpha'] || 4600;
    for (const p of Object.values(room.players)) {
      if (p.isBot && p.raceState && !p.raceState.finishTime) {
        // Bots travel at competitive ~220-270 km/h with subtle pacing dynamics
        const botSpeed = 230 + Math.sin(elapsed * 1.5 + p.name.length) * 35;
        p.raceState.speed = botSpeed;
        p.raceState.progressDistance += (botSpeed / 3.6) * (1 / 25);
        p.raceState.currentCheckpoint = Math.floor(((p.raceState.progressDistance % trackLen) / trackLen) * 12);
        const curLap = Math.min(room.laps + 1, Math.floor(p.raceState.progressDistance / trackLen) + 1);
        p.raceState.lap = curLap;

        if (curLap > room.laps && !p.raceState.finishTime) {
          const finishTime = Date.now() - room.raceStartTime;
          p.raceState.finishTime = finishTime;
          const rank = room.results.length + 1;
          p.raceState.rank = rank;
          room.results.push({
            playerId: p.id,
            name: p.name,
            shipId: p.shipId,
            rank,
            finishTime,
            bestLapTime: Math.floor(finishTime / room.laps),
          });
        }
      }
    }

    // Sort players by race progress to assign ranks (1st, 2nd, etc.)
    const sorted = Object.values(room.players)
      .filter(p => p.raceState)
      .sort((a, b) => {
        if (a.raceState?.finishTime && b.raceState?.finishTime) {
          return a.raceState.finishTime - b.raceState.finishTime;
        }
        if (a.raceState?.finishTime) return -1;
        if (b.raceState?.finishTime) return 1;
        return (b.raceState?.progressDistance || 0) - (a.raceState?.progressDistance || 0);
      });

    sorted.forEach((p, idx) => {
      if (p.raceState && !p.raceState.finishTime) {
        p.raceState.rank = idx + 1;
      }
    });

    // Broadcast state sync snapshot
    broadcastToRoom(room.code, {
      type: 'RACE_STATE_SYNC',
      players: room.players,
      timestamp: Date.now(),
    });
  }
}, 40); // 25 times per second

// Setup Vite middleware / static files
async function start() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const isHmrDisabled = process.env.DISABLE_HMR === 'true';
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: isHmrDisabled ? false : { server },
        },
        appType: 'spa',
        clearScreen: false,
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Void-Rider 3D Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('[Void-Rider 3D Server] Fatal error during startup:', error);
    process.exit(1);
  }
}

start();
