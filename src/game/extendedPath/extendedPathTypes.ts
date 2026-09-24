import * as THREE from 'three';
import { GameMode, AIDifficulty, AIPersonality, PowerUpType } from '../../types';

export type PathSegmentType =
  // Straights
  | 'HIGH_SPEED_STRAIGHT'
  | 'ACCELERATION_CORRIDOR'
  | 'OVERTAKING_HIGHWAY'
  // Curves
  | 'GENTLE_CURVE'
  | 'SHARP_CURVE'
  | 'S_CURVE'
  | 'SPIRAL'
  | 'BANKING_CURVE'
  | 'VERTICAL_CURVE'
  // Vertical
  | 'CLIMB'
  | 'DESCENT'
  | 'LAUNCH_RAMP'
  | 'ZERO_G_TRANSITION'
  | 'INVERTED_SECTION'
  // Technical
  | 'NARROW_ASTEROID_CORRIDOR'
  | 'ROTATING_OBSTACLE_CORRIDOR'
  | 'ENERGY_GATE_MAZE'
  | 'DEBRIS_TUNNEL'
  // Open Space
  | 'OPEN_SPACE'
  | 'PLANETARY_ORBIT'
  | 'STATION_EXTERIOR'
  | 'NEBULA_REGION'
  // Tunnels
  | 'STATION_TUNNEL'
  | 'WORMHOLE_TUNNEL'
  | 'ENERGY_TUNNEL'
  | 'COLLAPSING_TUNNEL';

export type EnvironmentType =
  | 'DEEP_SPACE'
  | 'NEON_CITY'
  | 'ASTEROID_FIELD'
  | 'WORMHOLE'
  | 'SOLAR_CORONA'
  | 'ZERO_GRAVITY'
  | 'PLASMA_STORM'
  | 'SKYLINE_HIGHWAY'
  | 'DEBRIS_FIELD'
  | 'QUANTUM_GRID'
  | 'ENERGY_REACTOR'
  | 'BATTLEFIELD'
  | 'CRUMBLING_RUINS'
  | 'PLANETARY_RING'
  | 'HYPERSPACE_VOID'
  | 'DUEL_ARENA'
  | 'RELAY_EXCHANGE'
  | 'ELIMINATION_GAUNTLET'
  | 'TREASURE_VAULT'
  | 'CHAMPIONSHIP_STADIUM';

export type CinematicShotType =
  | 'SHOT_01_LOW_REAR_CHASE'
  | 'SHOT_02_SIDE_FLYBY'
  | 'SHOT_03_WIDE_ENVIRONMENT_REVEAL'
  | 'SHOT_04_TOP_DOWN_REVEAL'
  | 'SHOT_05_FRONT_OBSTACLE_REVEAL'
  | 'SHOT_06_ORBITING_PLAYER'
  | 'SHOT_07_EXTREME_SPEED'
  | 'SHOT_08_REAR_DESTRUCTION'
  | 'SHOT_09_MASSIVE_SCALE_REVEAL'
  | 'SHOT_10_FINALE_CAMERA';

export type BranchRouteType =
  | 'MAIN'
  | 'SAFE_ROUTE'
  | 'HIGH_SPEED_ROUTE'
  | 'HIGH_RISK_SHORTCUT';

export interface SectorInfo {
  index: number;
  name: string;
  subtitle: string;
  startT: number;
  endT: number;
  environment: EnvironmentType;
  hazardDensity: number;
  recommendedSpeed: number;
  description: string;
}

export interface PathNode {
  index: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  width: number;
  elevation: number;
  curvature: number;
  t: number;
  segmentId: string;
}

export interface PathSegment {
  id: string;
  index: number;
  type: PathSegmentType;
  environmentType: EnvironmentType;
  startT: number;
  endT: number;
  length: number;
  width: number;
  elevationDelta: number;
  curvature: number;
  bankingAngle: number;
  speedProfile: number; // Max recommended speed km/h
  hazardDensity: number; // 0 to 1
  isCollapsing?: boolean;
  collapseTimer?: number;
  isCollapsed?: boolean;
  checkpointId?: number;
  cinematicTriggerId?: string;
  aiRacingMetadata: {
    idealLineOffset: number; // -1 to +1 lateral
    brakingMarkerT?: number;
    driftRecommended?: boolean;
    overtakeOpportunity?: boolean;
    boostPadNearby?: boolean;
  };
}

export interface PathBranch {
  id: string;
  name: string;
  type: BranchRouteType;
  entryT: number;
  exitT: number;
  lengthMeters: number;
  curve: THREE.Curve<THREE.Vector3>;
  controlPoints: [number, number, number][];
  speedBonusPercent: number; // e.g. 20 for high-speed
  riskLevel: 'LOW' | 'MEDIUM' | 'EXTREME';
  rewardDescription: string;
  hologramColor: string;
  gatePosition: THREE.Vector3;
}

export interface PathJunction {
  id: string;
  name: string;
  entryT: number;
  exitT: number;
  branches: PathBranch[];
  signboardText: string;
}

export interface CheckpointNode {
  id: number;
  name: string;
  t: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  width: number;
  isSectorBoundary: boolean;
  sectorIndex: number;
  sectorName: string;
}

export interface HazardZone {
  id: string;
  name: string;
  startT: number;
  endT: number;
  hazardType: 'ASTEROID_SWARM' | 'LASER_BARRIER' | 'SOLAR_FLARE' | 'COLLAPSE' | 'DRONE_MINES' | 'PLASMA_WALL' | 'GRAV_WELL';
  intensity: number;
  warningText: string;
  color: string;
}

export interface CinematicTrigger {
  id: string;
  title: string;
  subtitle: string;
  triggerT: number;
  durationSec: number;
  shotType: CinematicShotType;
  fovDelta: number; // e.g. +15 or -10
  timeScale: number; // e.g. 1.0 (normal) or 0.85 (slight cinematic slow)
  cameraOffset: [number, number, number];
  lookAtOffset: [number, number, number];
  soundFx?: string;
  lightingShift?: {
    ambientColorHex: number;
    sunIntensity: number;
  };
  hasTriggered?: boolean;
}

export interface EnvironmentZone {
  environment: EnvironmentType;
  startT: number;
  endT: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  sunColor: number;
  skyboxTheme: string;
  particleSpeedMultiplier: number;
}

export interface RespawnNode {
  id: number;
  t: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  safeLateral: number;
}

export interface FinishZone {
  t: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  width: number;
  stadiumName: string;
}

export interface ExtendedPathConfig {
  modeId: GameMode;
  modeName: string;
  locationName: string;
  totalEquivalentKm: number;
  targetSplineLength: number;
  controlPoints: [number, number, number][];
  sectors: SectorInfo[];
  branches: PathBranch[];
  cinematicTriggers: CinematicTrigger[];
  environmentZones: EnvironmentZone[];
  hazards: HazardZone[];
  finalClimax: {
    startT: number;
    climaxTitle: string;
    hazardSurgeMultiplier: number;
    cinematicShot: CinematicShotType;
    musicIntensity: number;
  };
}

export interface ActiveCinematicState {
  isActive: boolean;
  trigger: CinematicTrigger | null;
  elapsedSec: number;
  totalDurationSec: number;
  currentShot: CinematicShotType;
  cameraPos: THREE.Vector3;
  cameraLookAt: THREE.Vector3;
  cameraFov: number;
  letterboxProgress: number; // 0 to 1
  bannerOpacity: number;
}

export interface ExtendedPathTelemetry {
  currentSectorIndex: number;
  currentSectorName: string;
  currentSectorProgress: number;
  totalProgressDistance: number;
  totalTrackKm: number;
  approachingBranch: PathBranch | null;
  activeCinematicTitle: string | null;
  activeHazardWarning: string | null;
  isClimaxSector: boolean;
}
