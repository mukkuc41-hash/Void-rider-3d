import { BlackHoleDangerState } from '../blackHoleCinematicManager';

export type BlackHoleSubmodeId =
  | 'SINGULARITY_DESCENT'
  | 'GRAVITY_SLINGSHOT'
  | 'BLACK_HOLE_STORM'
  | 'COLLAPSING_ORBIT'
  | 'BLACK_HOLE_TREASURE_HUNT'
  | 'BLACK_HOLE_WARZONE'
  | 'EVENT_HORIZON_RUN'
  | 'BLACK_HOLE_MAZE'
  | 'SINGULARITY_RIVAL'
  | 'FINAL_COLLAPSE';

export interface BlackHoleSectorConfig {
  sector: number;
  name: string;
  lengthMeters: number;
  checkpointCount: number;
  junctionCount: number;
  safeRoute: string;
  riskyRoute: string;
  hazards: string[];
  gravityMultiplier: number;
}

export interface Mode21BlackHoleConfig {
  modeNumber: 21;
  modeName: 'BLACK HOLE';
  parentMode: 'QUANTUM LAUNCH PRO';
  submodeId: BlackHoleSubmodeId;
  submodeNumber: number;
  displayName: string;
  objective: string;
  trackTheme: string;
  trackLengthMeters: number;
  minimumSectors: 6;
  sectors: BlackHoleSectorConfig[];
  dangerStates: BlackHoleDangerState[];
  blackHoleRadius: number;
  eventHorizonRadius: number;
  gravityStrength: number;
  aiIntensity: number;
  escapeRouteRequired: boolean;
  timeLimitSeconds?: number;
  finalFiveMinuteSequence?: boolean;
}

const sector = (
  n: number,
  name: string,
  gravity: number,
  hazards: string[],
): BlackHoleSectorConfig => ({
  sector: n,
  name,
  lengthMeters: 1800,
  checkpointCount: 4,
  junctionCount: n === 1 ? 1 : 2,
  safeRoute: `S${n}-SAFE`,
  riskyRoute: `S${n}-RISK`,
  hazards,
  gravityMultiplier: gravity,
});

const baseSectors = (names: string[], gravity = 1): BlackHoleSectorConfig[] =>
  names.slice(0, 6).map((name, index) =>
    sector(index + 1, name, gravity + index * 0.08, [
      'GRAVITY_WAVE',
      index % 2 === 0 ? 'VOID_DEBRIS' : 'TIDAL_GATE',
      index >= 4 ? 'EVENT_HORIZON_PULL' : 'DISTORTION_FIELD',
    ]),
  );

export const MODE21_BLACK_HOLE_CONFIGS: Record<
  BlackHoleSubmodeId,
  Mode21BlackHoleConfig
> = {
  SINGULARITY_DESCENT: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'SINGULARITY_DESCENT',
    submodeNumber: 1,
    displayName: '01 — SINGULARITY DESCENT',
    objective: 'Descend toward the event horizon, hit gravity gates, and escape through the lower wormhole.',
    trackTheme: 'Deep-space descent canyon',
    trackLengthMeters: 10800,
    minimumSectors: 6,
    sectors: baseSectors(['Descent Gate', 'Tidal Canyon', 'Photon Ring', 'Accretion Cut', 'Horizon Edge', 'Escape Rise'], 1.0),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 900,
    eventHorizonRadius: 520,
    gravityStrength: 1.2,
    aiIntensity: 1.05,
    escapeRouteRequired: true,
  },

  GRAVITY_SLINGSHOT: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'GRAVITY_SLINGSHOT',
    submodeNumber: 2,
    displayName: '02 — GRAVITY SLINGSHOT',
    objective: 'Build velocity around the singularity and launch through the escape corridor.',
    trackTheme: 'Orbital slingshot arena',
    trackLengthMeters: 11400,
    minimumSectors: 6,
    sectors: baseSectors(['Approach Arc', 'Orbit Line', 'Slingshot Apex', 'Tidal Boost', 'Photon Bend', 'Launch Corridor'], 1.15),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 980,
    eventHorizonRadius: 560,
    gravityStrength: 1.35,
    aiIntensity: 1.1,
    escapeRouteRequired: true,
  },

  BLACK_HOLE_STORM: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'BLACK_HOLE_STORM',
    submodeNumber: 3,
    displayName: '03 — BLACK-HOLE STORM',
    objective: 'Survive a storm of gravitational pulses while maintaining race position.',
    trackTheme: 'Accretion storm field',
    trackLengthMeters: 12000,
    minimumSectors: 6,
    sectors: baseSectors(['Storm Front', 'Magnetic Wake', 'Tidal Rain', 'Void Squall', 'Horizon Storm', 'Storm Break'], 1.25),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1050,
    eventHorizonRadius: 600,
    gravityStrength: 1.5,
    aiIntensity: 1.15,
    escapeRouteRequired: true,
  },

  COLLAPSING_ORBIT: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'COLLAPSING_ORBIT',
    submodeNumber: 4,
    displayName: '04 — COLLAPSING ORBIT',
    objective: 'Race while orbital lanes progressively collapse and reroute.',
    trackTheme: 'Disintegrating orbital ring',
    trackLengthMeters: 12600,
    minimumSectors: 6,
    sectors: baseSectors(['Outer Orbit', 'Broken Ring', 'Split Orbit', 'Collapse Gate', 'Inner Orbit', 'Last Arc'], 1.35),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1100,
    eventHorizonRadius: 620,
    gravityStrength: 1.6,
    aiIntensity: 1.2,
    escapeRouteRequired: true,
  },

  BLACK_HOLE_TREASURE_HUNT: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'BLACK_HOLE_TREASURE_HUNT',
    submodeNumber: 5,
    displayName: '05 — BLACK-HOLE TREASURE HUNT',
    objective: 'Collect quantum relics from unstable routes and reach extraction.',
    trackTheme: 'Relic vault around the singularity',
    trackLengthMeters: 13200,
    minimumSectors: 6,
    sectors: baseSectors(['Vault Approach', 'Relic Field', 'Hidden Orbit', 'Treasure Rift', 'Horizon Vault', 'Extraction Run'], 1.15),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1000,
    eventHorizonRadius: 570,
    gravityStrength: 1.45,
    aiIntensity: 1.08,
    escapeRouteRequired: true,
  },

  BLACK_HOLE_WARZONE: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'BLACK_HOLE_WARZONE',
    submodeNumber: 6,
    displayName: '06 — BLACK-HOLE WARZONE',
    objective: 'Race through a combat zone while avoiding drones, missiles, and gravity traps.',
    trackTheme: 'Singularity combat perimeter',
    trackLengthMeters: 13800,
    minimumSectors: 6,
    sectors: baseSectors(['Combat Entry', 'Drone Belt', 'Missile Wake', 'Gravity Minefield', 'Warzone Core', 'Extraction Front'], 1.3),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1150,
    eventHorizonRadius: 640,
    gravityStrength: 1.65,
    aiIntensity: 1.3,
    escapeRouteRequired: true,
  },

  EVENT_HORIZON_RUN: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'EVENT_HORIZON_RUN',
    submodeNumber: 7,
    displayName: '07 — EVENT HORIZON RUN',
    objective: 'Stay outside the event horizon and maintain maximum speed through the photon ring.',
    trackTheme: 'Photon-ring high-speed circuit',
    trackLengthMeters: 14400,
    minimumSectors: 6,
    sectors: baseSectors(['Photon Entry', 'Lensing Arc', 'Horizon Line', 'Photon Ring', 'Redshift Gate', 'Escape Beam'], 1.5),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1250,
    eventHorizonRadius: 680,
    gravityStrength: 1.8,
    aiIntensity: 1.25,
    escapeRouteRequired: true,
  },

  BLACK_HOLE_MAZE: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'BLACK_HOLE_MAZE',
    submodeNumber: 8,
    displayName: '08 — THE BLACK-HOLE MAZE',
    objective: 'Choose the correct route through shifting gravitational junctions.',
    trackTheme: 'Dynamic singularity maze',
    trackLengthMeters: 15000,
    minimumSectors: 6,
    sectors: baseSectors(['Maze Gate', 'False Horizon', 'Mirror Orbit', 'Gravity Junction', 'Lost Corridor', 'True Escape'], 1.4),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1180,
    eventHorizonRadius: 650,
    gravityStrength: 1.7,
    aiIntensity: 1.2,
    escapeRouteRequired: true,
  },

  SINGULARITY_RIVAL: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'SINGULARITY_RIVAL',
    submodeNumber: 9,
    displayName: '09 — SINGULARITY RIVAL',
    objective: 'Outrace an adaptive rival AI through the singularity route.',
    trackTheme: 'Adaptive rival duel circuit',
    trackLengthMeters: 15600,
    minimumSectors: 6,
    sectors: baseSectors(['Rival Start', 'Gravity Duel', 'Tidal Chase', 'Horizon Duel', 'Final Orbit', 'Rival Escape'], 1.55),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1300,
    eventHorizonRadius: 700,
    gravityStrength: 1.9,
    aiIntensity: 1.45,
    escapeRouteRequired: true,
  },

  FINAL_COLLAPSE: {
    modeNumber: 21,
    modeName: 'BLACK HOLE',
    parentMode: 'QUANTUM LAUNCH PRO',
    submodeId: 'FINAL_COLLAPSE',
    submodeNumber: 10,
    displayName: '10 — THE FINAL COLLAPSE',
    objective: 'Survive exactly five minutes, then reach the emergency evacuation tower and sealed safe zone before the final collapse.',
    trackTheme: 'Five-minute collapsing universe and emergency evacuation route',
    trackLengthMeters: 18000,
    minimumSectors: 6,
    sectors: baseSectors(['Countdown Sector', 'Tidal Sector', 'Collapse Sector', 'Planetary Drift', 'Evacuation Route', 'Tower Approach'], 1.65).map((s, i) => i === 5 ? { ...s, safeRoute: 'EMERGENCY-TOWER-BASEMENT', riskyRoute: 'COLLAPSE-FRONT' } : s),
    dangerStates: ['SAFE', 'WARNING', 'DANGER', 'CRITICAL', 'COLLAPSE'],
    blackHoleRadius: 1450,
    eventHorizonRadius: 760,
    gravityStrength: 2.0,
    aiIntensity: 1.35,
    escapeRouteRequired: true,
    timeLimitSeconds: 300,
    finalFiveMinuteSequence: true,
  },
};

export function getMode21BlackHoleConfig(
  submodeId: BlackHoleSubmodeId,
): Mode21BlackHoleConfig {
  return MODE21_BLACK_HOLE_CONFIGS[submodeId];
}

// Backward-compatible alias for older Mode 21 callers. Non-enumerable so the mode still exposes exactly 10 submodes.
Object.defineProperty(MODE21_BLACK_HOLE_CONFIGS, 'FINAL_SINGULARITY', {
  value: MODE21_BLACK_HOLE_CONFIGS.FINAL_COLLAPSE,
  enumerable: false,
});

export const MODE21_BLACK_HOLE_SUBMODES = Object.values(
  MODE21_BLACK_HOLE_CONFIGS,
);
