import * as THREE from 'three';
import { GameMode } from '../../types';
import { RoutePreviewTelemetry } from '../fullRouteCinematic/routeCinematicTypes';

export type IntroPhase =
  | 'STORY_OPENING'
  | 'WORLD_REVEAL'
  | 'FULL_ROUTE_FLYTHROUGH'
  | 'PLAYER_REVEAL'
  | 'TRAVEL_TO_GRID'
  | 'STARTING_GRID'
  | 'RACER_INTRO'
  | 'CAMERA_BLEND'
  | 'COUNTDOWN'
  | 'RACE_START'
  | 'GAMEPLAY_TRANSITION'
  | 'COMPLETE';

export type PlayerRevealType =
  | 'UNDERNEATH_FLYBY'
  | 'CIRCULAR_SWEEP'
  | 'HANGAR_LAUNCH'
  | 'TUNNEL_EXIT'
  | 'ORBITAL_DROP'
  | 'WORMHOLE_EMERGE'
  | 'ASTEROID_ESCAPE'
  | 'AFTERBURNER_IGNITE'
  | 'BEAM_TELEPORT'
  | 'CARRIER_CATAPULT';

export type StartingGridType =
  | 'STAGGERED_DUAL'
  | 'SIDE_BY_SIDE'
  | 'ARENA_RING'
  | 'ECHELON'
  | 'WEDGE'
  | 'CARRIER_FLIGHT_DECK'
  | 'HIGHWAY_LANES';

export type CountdownStyleType =
  | 'SINGULARITY_DISTORTION'
  | 'NEON_HOLOGRAM'
  | 'TACTICAL_HUD'
  | 'WORMHOLE_PULSE'
  | 'SOLAR_FLARE'
  | 'GRAVITY_FLOATING'
  | 'PLASMA_LIGHTNING'
  | 'SKYLINE_BILLBOARD'
  | 'DEBRIS_EMERGENCY'
  | 'QUANTUM_GATE'
  | 'COVERT_HEIST'
  | 'DRONE_TARGETING'
  | 'COLLAPSE_WARNING'
  | 'ORBITAL_RING'
  | 'WARP_STRETCH'
  | 'RIVAL_DUEL'
  | 'RELAY_PADDOCK'
  | 'SURVIVAL_ARENA'
  | 'ANCIENT_GLYPH'
  | 'CHAMPIONSHIP_STADIUM';

export interface StoryTransmission {
  id: string;
  sender: string;
  text: string;
  timeSec: number;
  type: 'MISSION' | 'WARNING' | 'RIVAL' | 'CONTROL' | 'ANOMALY';
  callsign?: string;
}

export interface StoryScene {
  id: string;
  name: string;
  durationSec: number;
  cameraStartOffset: [number, number, number];
  cameraEndOffset: [number, number, number];
  lookAtStartOffset: [number, number, number];
  lookAtEndOffset: [number, number, number];
  fovStart: number;
  fovEnd: number;
  transmissions: StoryTransmission[];
  eventAction?: (scene: THREE.Scene, t: number) => void;
}

export interface StorySequence {
  title: string;
  locationName: string;
  missionName: string;
  objectiveText: string;
  loreSnippet: string;
  scenes: StoryScene[];
}

export interface ModeIntroConfig {
  modeId: GameMode;
  variationName: string;
  locationName: string;
  missionName: string;
  objectiveText: string;
  storyIntro: StorySequence;
  introCamera: {
    startDistance: number;
    orbitHeight: number;
    fov: number;
    shake: number;
  };
  environmentReveal: {
    title: string;
    subtitle: string;
    landmarkType: string;
  };
  playerReveal: {
    type: PlayerRevealType;
    durationSec: number;
    thrusterIntensity: number;
    tagline: string;
  };
  startingLocation: {
    name: string;
    description: string;
    startGridT: number;
    landmarkMeshType: string;
  };
  gridFormation: {
    type: StartingGridType;
    rowSpacing: number;
    colSpacing: number;
    racerEntranceSpeed: number;
  };
  countdownStyle: CountdownStyleType;
  countdownEffects: {
    primaryColor: string;
    secondaryColor: string;
    soundType: string;
    glitchIntensity: number;
    sublabel: string;
  };
  launchAnimation: {
    fovPunch: number;
    boostDuration: number;
    gateReaction: 'RETRACT' | 'DISSIPATE' | 'OPEN' | 'FLASH';
    launchSpeed: number;
  };
  firstHazard: {
    name: string;
    warningText: string;
    leadTimeSec: number;
    color: string;
  };
  openingCinematic: {
    totalDurationSec: number;
    skipAvailableAtSec: number;
  };
}

export interface IntroHUDTelemetry {
  isActive: boolean;
  phase: IntroPhase;
  phaseTime: number;
  phaseDuration: number;
  overallTime: number;
  totalDuration: number;
  missionName: string;
  locationName: string;
  objectiveText: string;
  currentTransmission: StoryTransmission | null;
  countdownNumber: number | null; // 3, 2, 1, 0 (GO)
  countdownStyle: CountdownStyleType;
  countdownEffects: ModeIntroConfig['countdownEffects'];
  firstHazardWarning: {
    name: string;
    warningText: string;
    color: string;
  } | null;
  rivalName?: string;
  rivalShipId?: string;
  rivalPersonality?: string;
  canSkip: boolean;
  launchProgress: number; // 0 to 1 during GO launch
  routePreview?: RoutePreviewTelemetry | null;
  lightState?: 'OFF' | 'RED' | 'YELLOW' | 'RED_YELLOW' | 'GREEN' | 'GO';
  trafficLights?: {
    red: boolean;
    yellow: boolean;
    green: boolean;
  };
}
