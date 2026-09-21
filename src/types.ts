export type GameState =
  | 'MENU'
  | 'GARAGE'
  | 'UPGRADES'
  | 'LOBBY'
  | 'RACE'
  | 'RESULTS'
  | 'GAME_OVER'
  | 'AI_SELECT'
  | 'MISSIONS'
  | 'LEADERBOARDS'
  | 'PROFILE'
  | 'MODE_SELECT'
  | 'STORY'
  | 'SPACE_HUB';

export type GameMode =
  // 20 UNIQUE GAME MODES
  | 'SINGULARITY_RUN'       // 01 — The only Black Hole mode
  | 'NEON_CIRCUIT'          // 02 — 3-lane neon megacity racing
  | 'ASTEROID_RUN'          // 03 — Dense asteroid field weaving
  | 'WORMHOLE_EXPRESS'      // 04 — Unstable wormhole sequence
  | 'SOLAR_STORM'           // 05 — Heat meter & solar flares
  | 'GRAVITY_FREE'          // 06 — 3D stunt aerobatics & combos
  | 'PLASMA_STORM'          // 07 — Advancing storm wall survival
  | 'SKYLINE_RUSH'          // 08 — Orbital skyscrapers & corridors
  | 'DEBRIS_SURVIVAL'       // 09 — Endless procedural debris stream
  | 'QUANTUM_TIME_TRIAL'    // 10 — Pure speed, gates & ghost racer
  | 'ENERGY_HEIST'          // 11 — Core collection, mass penalty & extraction
  | 'DRONE_ASSAULT'         // 12 — Combat drone waves & defense
  | 'COLLAPSING_TRACK'      // 13 — Disintegrating track sections
  | 'RING_RUNNER'           // 14 — Rotating orbital rings
  | 'HYPERSPACE_SPRINT'     // 15 — Warp speed & hyperspace tunnels
  | 'RIVAL_DUEL'            // 16 — 1v1 AI ace dogfight race
  | 'RELAY_RACE'            // 17 — Multi-ship specialty team relay
  | 'SURVIVAL_ELIMINATION'  // 18 — Progressive knockout elimination
  | 'COSMIC_TREASURE_HUNT'  // 19 — Radar scanner & ancient relics
  | 'VOID_CHAMPIONSHIP'     // 20 — 6-stage premier championship
  // Backward compatibility aliases
  | 'STANDARD'
  | 'GRAND_PRIX'
  | 'TIME_TRIAL'
  | 'SURVIVAL'
  | 'ELIMINATION'
  | 'ELIMINATOR'
  | 'ENDURANCE'
  | 'DUEL'
  | 'CHALLENGE'
  | 'FREE_RIDE';

export type RoomStatus = 'LOBBY' | 'COUNTDOWN' | 'RACING' | 'FINISHED';

export type TrackId =
  | 'neon_orbit'
  | 'asteroid_run'
  | 'void_rift'
  | 'cosmic_ring'
  | 'quantum_highway'
  | 'circuit_alpha'
  | 'nebula_rift';

export type AIDifficulty = 'RECRUIT' | 'STANDARD' | 'VETERAN' | 'ACE' | 'ELITE';
export type AIPersonality = 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED' | 'RISK_TAKER' | 'TECHNICAL';

export type CameraMode = 'CHASE_NEAR' | 'CHASE_FAR' | 'COCKPIT';
export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AIRaceConfig {
  trackId: TrackId;
  difficulty: AIDifficulty;
  laps: number;
  botCount: number;
  mode?: GameMode;
}

export type { EnergyBarrier } from './game/trackData';

export type ShipDecalType =
  | 'none'
  | 'racing_stripes'
  | 'hazard_chevrons'
  | 'vortex_wings'
  | 'apex_predator'
  | 'carbon_hex';

export type ThrusterFlameColor =
  | 'neon_cyan'
  | 'plasma_violet'
  | 'solar_gold'
  | 'emerald_hyper';

export type CockpitSkin =
  | 'cyber_stealth'
  | 'titanium_gold'
  | 'neon_matrix'
  | 'void_shadow';

// 9 Collectible Power-Ups
export type PowerUpType =
  | 'NITRO_BOOST'
  | 'ENERGY_SHIELD'
  | 'REPAIR_CORE'
  | 'MAGNET_BOOST'
  | 'EMP_PULSE'
  | 'TIME_WARP'
  | 'GRAVITY_BURST'
  | 'DECOY_SHIP'
  | 'TEMPORARY_SPEED_SURGE'
  | 'PHASE_SHIELD'   // backward-compatible alias
  | 'CREDIT_MAGNET'  // backward-compatible alias
  | 'HYPER_BOOST';   // backward-compatible alias

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  totalDuration: number;
}

// Advanced Damage System
export interface ShipDamageZones {
  frontHull: number;    // 0 = pristine, 100 = critical breach
  rearEngine: number;   // 0 = pristine, 100 = offline
  leftWing: number;     // 0 = pristine, 100 = damaged aero
  rightWing: number;    // 0 = pristine, 100 = damaged aero
  shieldCore: number;   // 100 = full shield, 0 = depleted
}

export type DamageZone = 'frontHull' | 'rearEngine' | 'leftWing' | 'rightWing' | 'shieldCore';
export type DamageMode = 'CASUAL' | 'SIMULATION' | 'REALISTIC' | 'HARDCORE';

export interface ShipUpgrades {
  engine: number; // 0 to 4 (adds to topSpeed)
  handling: number; // 0 to 4 (adds to handling)
  boost: number; // 0 to 4 (adds to boostPower & capacity)
  chassis: number; // 0 to 4 (adds to acceleration & armor)
  shieldDuration?: number; // 0 to 4 (extends Phase Shield)
  magnetRange?: number; // 0 to 4 (extends Credit Magnet pull radius)
  hyperBoostSpeed?: number; // 0 to 4 (increases Hyper-Boost surge speed)
}

export type UpgradeType = keyof ShipUpgrades;

export interface RunStats {
  distance: number;
  creditsEarned?: number;
  creditsCollected: number;
  maxSpeed?: number;
  topSpeed?: number;
  timeElapsed?: number;
  survivalTime?: number;
  hitCount?: number;
  obstaclesAvoided?: number;
  reason?: string;
  milestone?: string;
  isNewBestDistance?: boolean;
}

export type DynamicTrackEventType =
  | 'ASTEROID_SWARM'
  | 'GRAVITY_SHIFT'
  | 'TEMPORARY_SHORTCUT'
  | 'INVERSION_ZONE';

export interface DynamicTrackEvent {
  id: string;
  type: DynamicTrackEventType;
  title: string;
  description: string;
  active: boolean;
  remainingSec: number;
  sectorStartT: number;
  sectorEndT: number;
  severity?: 'low' | 'medium' | 'high';
  gravityMode?: 'LOW_G' | 'HIGH_G';
  shortcutTargetT?: number;
}

export interface ShipConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  topSpeed: number; // km/h representation
  acceleration: number;
  handling: number; // turning responsiveness
  boostPower: number;
  boostCapacity: number;
  creditPrice?: number;
  unlockLevel?: number;
}

export interface PlayerInput {
  throttle: number; // -1 to 1 (W/S or Up/Down)
  steer: number;    // -1 to 1 (A/D or Left/Right)
  boost: boolean;   // Space
  drift: boolean;   // Shift
  recover: boolean; // R
  fireBeam?: boolean; // E / Right Mouse Button / Mobile ⚡ button
  selectRouteDirection?: 'LEFT' | 'RIGHT' | 'CENTER' | 'SHORTCUT'; // Branching path selection
}

export type {
  BranchRouteDirection,
  BranchRouteConfig,
  JunctionZoneConfig,
  ActiveJunctionTelemetry,
  PlayerRouteProgress,
} from './game/junctionSystem';

// Asteroid Destruction Beam System Types
export type BeamType =
  | 'STANDARD'
  | 'PLASMA'
  | 'LASER'
  | 'VOID'
  | 'PULSE'
  | 'ARC'
  | 'PHOTON'
  | 'QUANTUM';

export type BeamCoreShape =
  | 'THIN'
  | 'STANDARD'
  | 'WIDE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'SPIRAL'
  | 'SEGMENTED'
  | 'PULSING';

export type BeamImpactPreset =
  | 'ENERGY_BURST'
  | 'PLASMA_EXPLOSION'
  | 'CRYSTAL_SHATTER'
  | 'VOID_IMPLOSION'
  | 'ELECTRIC_BURST'
  | 'FIREBALL'
  | 'QUANTUM_FRACTURE'
  | 'SHOCKWAVE';

export type BeamSoundPreset =
  | 'HIGH_ENERGY_PULSE'
  | 'HEAVY_PLASMA'
  | 'RESONANT_LASER'
  | 'VOID_SURGE'
  | 'ARC_DISCHARGE';

export type BeamColorPreset =
  | 'CYAN'
  | 'BLUE'
  | 'VIOLET'
  | 'MAGENTA'
  | 'WHITE'
  | 'RED'
  | 'GREEN'
  | 'GOLD'
  | 'CUSTOM';

export interface BeamCustomization {
  type: BeamType;
  coreShape: BeamCoreShape;
  coreColor: string;
  outerColor: string;
  particleColor: string;
  impactPreset: BeamImpactPreset;
  soundPreset: BeamSoundPreset;
  trailLength: number;     // 0.5 to 2.0
  trailWidth: number;      // 0.5 to 2.0
  particleDensity: number; // 0.5 to 2.0
  energyStreaks: boolean;
  outerGlow: number;       // 0.5 to 2.0
  coreBrightness: number;  // 0.5 to 2.0
  pulseSpeed: number;      // 0.5 to 2.0
  noiseMovement: boolean;
  shockwaveEnabled: boolean;
}

export interface BeamUpgrades {
  power: number;          // 0 to 5 (Damage multiplier)
  range: number;          // 0 to 5 (Max distance)
  energyCapacity: number; // 0 to 5 (Energy pool)
  rechargeRate: number;   // 0 to 5 (Energy recharge speed)
  fireRate: number;       // 0 to 5 (Damage frequency)
  cooling: number;        // 0 to 5 (Cooling speed / heat dissipation)
  impactForce: number;    // 0 to 5 (Debris dispersal force)
  targeting: number;      // 0 to 5 (Targeting cone & lock angle)
}

export type BeamStatus =
  | 'READY'
  | 'FIRING'
  | 'LOW_ENERGY'
  | 'DEPLETED'
  | 'RECHARGING'
  | 'OVERHEATED';

export interface TargetLockInfo {
  hasTarget: boolean;
  targetId?: number;
  targetType: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ARMORED' | 'ENERGY' | 'BARRIER';
  health: number;
  maxHealth: number;
  distance: number;
}

export interface BeamTelemetry {
  energy: number;
  maxEnergy: number;
  heat: number;
  isOverheated: boolean;
  status: BeamStatus;
  targetLock: TargetLockInfo | null;
  activeBeam: boolean;
  isFiring?: boolean;
  cooldownRemaining?: number;
  hasTargetLock?: boolean;
  targetHealth?: number;
  targetMaxHealth?: number;
  targetDistance?: number;
  targetType?: string;
  comboCount?: number;
  comboMultiplier?: number;
  comboTimeRemaining?: number;
}

export type AsteroidSizeCategory = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ARMORED' | 'ENERGY';

export interface ModeBeamConfig {
  beamEnabled: boolean;
  beamDamageMultiplier: number;
  beamEnergyMultiplier: number;
  beamCooldown: number;
  allowedTargets: ('ASTEROID' | 'DEBRIS' | 'BARRIER')[];
}

export interface PlayerRaceState {
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  speed: number;
  boost: number;
  isBoosting: boolean;
  isDrifting: boolean;
  lap: number;
  currentCheckpoint: number;
  progressDistance: number;
  finishTime?: number;
  rank?: number;
  currentRouteId?: string | null;
  junctionId?: string | null;
}

export interface PlayerInfo {
  id: string;
  name: string;
  shipId: string;
  color: string;
  secondaryColor?: string;
  thrusterColor?: ThrusterFlameColor;
  cockpitSkin?: CockpitSkin;
  decal?: ShipDecalType;
  upgrades?: ShipUpgrades;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  isSpectator?: boolean;
  team?: 'ALPHA' | 'OMEGA';
  ping: number;
  raceState?: PlayerRaceState;
}

export interface RoomState {
  id?: string;
  code: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  laps: number;
  trackId?: TrackId;
  countdown: number;
  raceStartTime: number;
  players: Record<string, PlayerInfo>;
  results: RaceResult[];
  settings?: CustomRoomSettings;
}

export interface RaceResult {
  playerId: string;
  name?: string;
  playerName?: string;
  shipId: string;
  rank: number;
  finishTime?: number; // milliseconds
  totalTime?: number;
  bestLapTime: number;
  completed?: boolean;
}

// Network message types
export type ClientMessageType =
  | 'JOIN_ROOM'
  | 'CREATE_ROOM'
  | 'QUICK_MATCH'
  | 'SET_READY'
  | 'SET_TRACK'
  | 'START_RACE'
  | 'UPDATE_SHIP'
  | 'PLAYER_UPDATE'
  | 'ADD_BOT'
  | 'RESTART_RACE'
  | 'LEAVE_ROOM'
  | 'USE_POWERUP'
  | 'DAMAGE_EVENT'
  | 'UPDATE_SETTINGS'
  | 'SET_TEAM'
  | 'SET_ROLE'
  | 'PING';

export interface ClientMessage {
  type: ClientMessageType;
  roomId?: string;
  name?: string;
  shipId?: string;
  color?: string;
  secondaryColor?: string;
  decal?: ShipDecalType;
  upgrades?: ShipUpgrades;
  trackId?: TrackId;
  laps?: number;
  isReady?: boolean;
  isSpectator?: boolean;
  team?: 'ALPHA' | 'OMEGA';
  mode?: MultiplayerMode;
  settings?: CustomRoomSettings;
  raceState?: PlayerRaceState;
  powerUpType?: PowerUpType;
  damageZone?: DamageZone;
  damageAmount?: number;
  timestamp?: number;
}

export type ServerMessageType =
  | 'CONNECTED'
  | 'ROOM_JOINED'
  | 'ROOM_UPDATED'
  | 'COUNTDOWN_TICK'
  | 'RACE_STARTED'
  | 'RACE_STATE_SYNC'
  | 'POWERUP_EVENT'
  | 'PLAYER_FINISHED'
  | 'RACE_FINISHED'
  | 'ERROR'
  | 'PONG';

export interface ServerMessage {
  type: ServerMessageType;
  playerId?: string;
  room?: RoomState;
  players?: Record<string, PlayerInfo>;
  countdown?: number;
  results?: RaceResult[];
  message?: string;
  powerUpType?: PowerUpType;
  targetPlayerId?: string;
  timestamp?: number;
}

// Multiplayer Mode Settings
export type MultiplayerMode = 'QUICK_MATCH' | 'PRIVATE' | 'DUEL_1V1' | 'COMPETITIVE' | 'CASUAL';

export interface CustomRoomSettings {
  mode: MultiplayerMode;
  trackId: TrackId;
  laps: number;
  aiBots: boolean;
  collisionsEnabled: boolean;
  powerUpsEnabled: boolean;
  damageMode: DamageMode;
}

// Player Progression & Missions
export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'DAILY' | 'WEEKLY' | 'ACHIEVEMENT';
  rewardCredits: number;
  rewardXP: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  icon?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
}

export interface PlayerProfile {
  callsign: string;
  avatarIcon: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  credits: number;
  faction: 'APEX_SYNDICATE' | 'VOID_VANGUARD' | 'QUANTUM_PULSE' | 'SOLAR_PHALANX';
  totalRaces: number;
  wins: number;
  podiums: number;
  cleanRaces: number;
  favoriteTrack: TrackId;
  bestTimes: Record<string, number>; // trackId -> time in ms
  survivalRecordSec: number;
  unlockedShips: string[];
  unlockedSkins: string[];
  unlockedDecals: string[];
  currentWinStreak: number;
  highestWinStreak: number;
  achievements: AchievementBadge[];
}

export interface MissionItem {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  progress: number;
  target: number;
  claimed: boolean;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  pilotName: string;
  shipName: string;
  trackId: TrackId;
  mode: GameMode;
  lapTime: number; // ms
  totalTime: number; // ms
  timestamp: number;
  isPlayer?: boolean;
}

export interface PlayerProgression {
  playerName: string;
  credits: number;
  level: number;
  xp: number;
  selectedShipId: string;
  primaryColor: string;
  secondaryColor: string;
  decal: ShipDecalType;
  thrusterColor: ThrusterFlameColor;
  cockpitSkin: CockpitSkin;
  upgrades: ShipUpgrades;
  beamCustomization?: BeamCustomization;
  beamUpgrades?: BeamUpgrades;
  unlockedShipIds: string[];
  dailyMissions: MissionItem[];
  achievements: AchievementItem[];
  leaderboards: LeaderboardEntry[];
  stats: {
    racesCompleted: number;
    racesWon: number;
    topSpeedReached: number;
    totalDriftSeconds: number;
    asteroidsAvoided: number;
    asteroidsDestroyed?: number;
    beamShotsFired?: number;
    maxAsteroidCombo?: number;
  };
}

export type FactionId = 'apex_syndicate' | 'void_vanguard' | 'quantum_pulse' | 'solar_phalanx';

export interface FactionInfo {
  id: FactionId;
  name: string;
  motto: string;
  lore: string;
  color: string;
  icon: string;
  bonusText: string;
  championPilot: string;
}

export interface StoryMission {
  id: string;
  chapter: number;
  title: string;
  location: string;
  trackId: TrackId;
  mode: GameMode;
  targetLaps: number;
  rivalPilot: string;
  rivalFaction: FactionId;
  briefing: string;
  objective: string;
  rewardCredits: number;
  rewardXP: number;
  unlocked: boolean;
  completed: boolean;
}

export type CollisionCategory = 'PLAYER' | 'AI_PLAYER' | 'REMOTE_PLAYER';

export interface PlayerCollisionConfig {
  baseImpactForce: number;
  maxImpactForce: number;
  knockbackMultiplier: number;
  rotationMultiplier: number;
  shieldDamageMultiplier: number;
  hullDamageMultiplier: number;
  crashThreshold: number;
  collisionCooldown: number;
  recoveryTime: number;
  boostMultiplier: number;
  maxKnockback: number;
  maxAngularVelocity: number;
}

export interface CollisionEventFeedback {
  id: string;
  type: 'IMPACT' | 'HEAVY_IMPACT' | 'RIVAL_CRASHED' | 'CRITICAL_CRASH';
  title: string;
  detail?: string;
  shieldDelta?: number;
  hullDelta?: number;
  impactForce: number;
  timestamp: number;
}

