import {
  ClientMessage,
  ServerMessage,
  RoomState,
  PlayerInfo,
  RaceResult,
  PlayerRaceState,
  ShipDecalType,
  ShipUpgrades,
  TrackId,
  CustomRoomSettings,
  MultiplayerMode,
} from '../types';

export class GameNetworkClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private lastPingSent: number = 0;

  public playerId: string = '';
  public ping: number = 0;
  public isConnected: boolean = false;

  // Listeners
  public onRoomUpdate: ((room: RoomState) => void) | null = null;
  public onCountdownTick: ((count: number) => void) | null = null;
  public onRaceStarted: ((room: RoomState) => void) | null = null;
  public onRaceStateSync: ((players: Record<string, PlayerInfo>) => void) | null = null;
  public onPlayerFinished: ((results: RaceResult[]) => void) | null = null;
  public onRaceFinished: ((results: RaceResult[]) => void) | null = null;
  public onError: ((msg: string) => void) | null = null;
  public onConnectStatusChange: ((connected: boolean) => void) | null = null;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
    this.connect();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.onConnectStatusChange?.(true);
        this.startPingLoop();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS msg:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onConnectStatusChange?.(false);
        this.stopPingLoop();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.lastPingSent = Date.now();
        this.send({ type: 'PING', timestamp: this.lastPingSent });
      }
    }, 3000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(msg: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'CONNECTED':
        if (msg.playerId) this.playerId = msg.playerId;
        break;

      case 'PONG':
        if (msg.timestamp) {
          this.ping = Math.max(5, Date.now() - msg.timestamp);
        }
        break;

      case 'ROOM_JOINED':
      case 'ROOM_UPDATED':
        if (msg.playerId) this.playerId = msg.playerId;
        if (msg.room) {
          this.onRoomUpdate?.(msg.room);
        }
        break;

      case 'COUNTDOWN_TICK':
        if (typeof msg.countdown === 'number') {
          this.onCountdownTick?.(msg.countdown);
        }
        break;

      case 'RACE_STARTED':
        if (msg.room) {
          this.onRaceStarted?.(msg.room);
        }
        break;

      case 'RACE_STATE_SYNC':
        if (msg.players) {
          this.onRaceStateSync?.(msg.players);
        }
        break;

      case 'PLAYER_FINISHED':
        if (msg.results) {
          this.onPlayerFinished?.(msg.results);
        }
        break;

      case 'RACE_FINISHED':
        if (msg.results) {
          this.onRaceFinished?.(msg.results);
        }
        break;

      case 'ERROR':
        if (msg.message) {
          this.onError?.(msg.message);
        }
        break;
    }
  }

  // Public Action Methods
  public createRoom(
    name: string,
    shipId: string,
    color: string,
    secondaryColor?: string,
    decal?: ShipDecalType,
    upgrades?: ShipUpgrades,
    trackId?: TrackId,
    settings?: CustomRoomSettings,
    isSpectator?: boolean,
    team?: 'ALPHA' | 'OMEGA'
  ) {
    this.send({
      type: 'CREATE_ROOM',
      name,
      shipId,
      color,
      secondaryColor,
      decal,
      upgrades,
      trackId,
      settings,
      isSpectator,
      team,
    });
  }

  public joinRoom(
    roomId: string,
    name: string,
    shipId: string,
    color: string,
    secondaryColor?: string,
    decal?: ShipDecalType,
    upgrades?: ShipUpgrades,
    isSpectator?: boolean,
    team?: 'ALPHA' | 'OMEGA'
  ) {
    this.send({
      type: 'JOIN_ROOM',
      roomId,
      name,
      shipId,
      color,
      secondaryColor,
      decal,
      upgrades,
      isSpectator,
      team,
    });
  }

  public updateSettings(settings: CustomRoomSettings) {
    this.send({
      type: 'UPDATE_SETTINGS',
      settings,
    });
  }

  public setTeam(team: 'ALPHA' | 'OMEGA') {
    this.send({
      type: 'SET_TEAM',
      team,
    });
  }

  public setRole(isSpectator: boolean) {
    this.send({
      type: 'SET_ROLE',
      isSpectator,
    });
  }

  public async fetchPublicRooms(): Promise<any[]> {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) return [];
      const data = await res.json();
      return data.rooms || [];
    } catch {
      return [];
    }
  }

  public quickMatch(
    name: string,
    shipId: string,
    color: string,
    secondaryColor?: string,
    decal?: ShipDecalType,
    upgrades?: ShipUpgrades,
    trackId?: TrackId,
    mode?: MultiplayerMode
  ) {
    this.send({
      type: 'QUICK_MATCH',
      name,
      shipId,
      color,
      secondaryColor,
      decal,
      upgrades,
      trackId,
      mode,
    });
  }

  public setReady(isReady: boolean) {
    this.send({ type: 'SET_READY', isReady });
  }

  public setTrack(trackId: TrackId) {
    this.send({ type: 'SET_TRACK', trackId });
  }

  public updateShip(
    shipId: string,
    color: string,
    name?: string,
    secondaryColor?: string,
    decal?: ShipDecalType,
    upgrades?: ShipUpgrades
  ) {
    this.send({
      type: 'UPDATE_SHIP',
      shipId,
      color,
      name,
      secondaryColor,
      decal,
      upgrades,
    });
  }

  public addBot() {
    this.send({ type: 'ADD_BOT' });
  }

  public startRace() {
    this.send({ type: 'START_RACE' });
  }

  public sendPlayerUpdate(raceState: PlayerRaceState) {
    this.send({ type: 'PLAYER_UPDATE', raceState });
  }

  public restartRace() {
    this.send({ type: 'RESTART_RACE' });
  }

  public leaveRoom() {
    this.send({ type: 'LEAVE_ROOM' });
  }
}

export const networkClient = new GameNetworkClient();
