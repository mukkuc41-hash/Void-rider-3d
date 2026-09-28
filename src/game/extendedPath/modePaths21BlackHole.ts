import * as THREE from 'three';
import { ExtendedPathConfig } from './extendedPathTypes';
import { BlackHoleSubmodeId } from '../blackHoleSubmodes';

/**
 * MODE 21 — BLACK HOLE / QUANTUM LAUNCH PRO
 *
 * Ten dedicated extended-route configurations. The existing ExtendedPath
 * system remains intact; these routes are consumed by the Mode 21 integration
 * layer and can be selected by submode without changing Modes 01–20.
 *
 * The environment is represented with the existing DEEP_SPACE type so this
 * file is compatible with the current ExtendedPath type definitions. The
 * black-hole visual layer is supplied by blackHoleSystem.ts and the Mode 21
 * cinematic layer.
 */

const cp = (x: number, y: number, z: number): [number, number, number] => [x, y, z];

const sector = (
  index: number,
  name: string,
  subtitle: string,
  startT: number,
  endT: number,
  hazardDensity: number,
  recommendedSpeed: number,
  description: string,
) => ({
  index,
  name,
  subtitle,
  startT,
  endT,
  environment: 'DEEP_SPACE' as const,
  hazardDensity,
  recommendedSpeed,
  description,
});

const environment = (startT: number, endT: number, theme: string, ambient: number, sun: number, particle = 1.5) => ({
  environment: 'DEEP_SPACE' as const,
  startT,
  endT,
  fogColor: 0x03030a,
  fogDensity: 0.00055,
  ambientColor: ambient,
  sunColor: sun,
  skyboxTheme: theme,
  particleSpeedMultiplier: particle,
});

const branch = (
  id: string,
  name: string,
  type: 'MAIN' | 'SAFE_ROUTE' | 'HIGH_SPEED_ROUTE' | 'HIGH_RISK_SHORTCUT',
  entryT: number,
  exitT: number,
  lengthMeters: number,
  speedBonusPercent: number,
  riskLevel: 'LOW' | 'MEDIUM' | 'EXTREME',
  rewardDescription: string,
  color: string,
  gatePosition: [number, number, number],
) => ({
  id,
  name,
  type,
  entryT,
  exitT,
  lengthMeters,
  curve: undefined as any,
  controlPoints: [
    [gatePosition[0], gatePosition[1], gatePosition[2]],
    [gatePosition[0] + 70, gatePosition[1] + 8, gatePosition[2] - 180],
    [gatePosition[0] - 40, gatePosition[1] - 4, gatePosition[2] - 360],
  ] as [number, number, number][],
  speedBonusPercent,
  riskLevel,
  rewardDescription,
  hologramColor: color,
  gatePosition: new THREE.Vector3(...gatePosition),
});

const cinematic = (
  id: string,
  title: string,
  subtitle: string,
  triggerT: number,
  durationSec: number,
  shotType: 'SHOT_01_LOW_REAR_CHASE' | 'SHOT_02_SIDE_FLYBY' | 'SHOT_03_WIDE_ENVIRONMENT_REVEAL' | 'SHOT_04_TOP_DOWN_REVEAL' | 'SHOT_05_FRONT_OBSTACLE_REVEAL' | 'SHOT_06_ORBITING_PLAYER' | 'SHOT_07_EXTREME_SPEED' | 'SHOT_08_REAR_DESTRUCTION' | 'SHOT_09_MASSIVE_SCALE_REVEAL' | 'SHOT_10_FINALE_CAMERA',
) => ({
  id,
  title,
  subtitle,
  triggerT,
  durationSec,
  shotType,
  fovDelta: 12,
  timeScale: 0.92,
  cameraOffset: [18, 8, 24] as [number, number, number],
  lookAtOffset: [0, 2, -20] as [number, number, number],
});

const hazard = (
  id: string,
  name: string,
  startT: number,
  endT: number,
  intensity: number,
  warningText: string,
  color: string,
  hazardType: 'ASTEROID_SWARM' | 'LASER_BARRIER' | 'SOLAR_FLARE' | 'COLLAPSE' | 'DRONE_MINES' | 'PLASMA_WALL' | 'GRAV_WELL' = 'GRAV_WELL',
) => ({ id, name, startT, endT, hazardType, intensity, warningText, color });

const route = (
  modeName: string,
  locationName: string,
  points: [number, number, number][],
  sectors: ReturnType<typeof sector>[],
  branches: ReturnType<typeof branch>[],
  cinematicTriggers: ReturnType<typeof cinematic>[],
  hazards: ReturnType<typeof hazard>[],
  finalTitle: string,
  finalStart = 0.84,
  totalKm = 12.4,
): ExtendedPathConfig => ({
  modeId: 'BLACK_HOLE' as any,
  modeName,
  locationName,
  totalEquivalentKm: totalKm,
  targetSplineLength: Math.round(totalKm * 820),
  controlPoints: points,
  sectors,
  branches,
  cinematicTriggers,
  environmentZones: [environment(0, 1, 'BLACK_HOLE_QUANTUM', 0x16002b, 0x7c3aed, 1.9)],
  hazards,
  finalClimax: {
    startT: finalStart,
    climaxTitle: finalTitle,
    hazardSurgeMultiplier: 1.65,
    cinematicShot: 'SHOT_09_MASSIVE_SCALE_REVEAL',
    musicIntensity: 1.0,
  },
});

const points = (seed: number): [number, number, number][] => [
  cp(0, 18, 0),
  cp(120 + seed, 48, -760),
  cp(420 - seed, 108, -1560),
  cp(820 + seed, 176, -2460),
  cp(1180, 126, -3420),
  cp(1260 - seed, 20, -4380),
  cp(920 + seed, -88, -5260),
  cp(260, -156, -5960),
  cp(-520 - seed, -116, -6120),
  cp(-1120, -12, -5580),
  cp(-1440 + seed, 96, -4580),
  cp(-1280, 178, -3480),
  cp(-760 - seed, 150, -2320),
  cp(-180, 82, -1180),
  cp(260 + seed, 32, -420),
  cp(0, 20, 120),
];

const makeStandardSectors = (names: string[], speeds: number[], hazards: number[]) => names.map((name, i) =>
  sector(i + 1, `SECTOR ${i + 1}: ${name}`, i === 0 ? 'QUANTUM LAUNCH' : i === 5 ? 'EMERGENCY ESCAPE' : 'BLACK-HOLE ROUTE', i / 6, (i + 1) / 6, hazards[i], speeds[i], `Dedicated Mode 21 sector ${i + 1} with gravity interaction, route choices and a fair recovery line.`),
);

const names = [
  'ORBITAL STAGING',
  'GRAVITY APPROACH',
  'ACCRETION CORRIDOR',
  'EVENT-HORIZON ORBIT',
  'SINGULARITY GAUNTLET',
  'EMERGENCY ESCAPE',
];

const speeds = [720, 760, 800, 680, 840, 940];
const densities = [0.30, 0.48, 0.62, 0.72, 0.86, 0.95];

export const BLACK_HOLE_SUBMODE_PATHS: Record<BlackHoleSubmodeId, ExtendedPathConfig> = {
  SINGULARITY_DESCENT: route(
    '21.01 — SINGULARITY DESCENT', 'QUANTUM LAUNCH PRO // DESCENT SECTOR', points(10), makeStandardSectors(names, speeds, densities),
    [branch('bh01_safe', 'OUTER SAFE SHELF', 'SAFE_ROUTE', 0.22, 0.38, 1550, -5, 'LOW', 'Lower gravity and reliable recovery line.', '#22d3ee', [80, 60, -1500]), branch('bh01_risk', 'INNER GRAVITY CUT', 'HIGH_RISK_SHORTCUT', 0.42, 0.61, 1280, 28, 'EXTREME', 'Shorter route with stronger gravitational pull.', '#c026d3', [600, 110, -3000])],
    [cinematic('bh01_reveal', 'SINGULARITY REVEAL', 'THE VOID HAS A CENTER', 0.16, 2.6, 'SHOT_03_WIDE_ENVIRONMENT_REVEAL'), cinematic('bh01_escape', 'ESCAPE VECTOR OPEN', 'BOOST AWAY FROM THE HORIZON', 0.86, 2.2, 'SHOT_07_EXTREME_SPEED')],
    [hazard('bh01_g1', 'OUTER GRAVITY SHELF', 0.18, 0.38, 0.55, 'GRAVITY FIELD RISING', '#7c3aed'), hazard('bh01_g2', 'ACCRETION DRAG', 0.42, 0.66, 0.78, 'ACCRETION DRAG // HOLD LINE', '#d946ef'), hazard('bh01_g3', 'HORIZON WARNING', 0.70, 0.92, 0.95, 'EVENT HORIZON // ESCAPE VECTOR', '#ff2bd6')],
    'DESCENT COMPLETE // ESCAPE THE SINGULARITY', 0.84, 12.2,
  ),
  GRAVITY_SLINGSHOT: route(
    '21.02 — GRAVITY SLINGSHOT', 'QUANTUM LAUNCH PRO // SLINGSHOT RANGE', points(24), makeStandardSectors(['APPROACH VECTOR', 'OUTER ORBIT', 'SLINGSHOT GATE', 'INNER ORBIT', 'EXTREME PASS', 'HIGH-SPEED ESCAPE'], [760, 800, 900, 860, 980, 1080], [0.25, 0.42, 0.62, 0.78, 0.9, 0.8]),
    [branch('bh02_outer', 'OUTER ORBIT LINE', 'SAFE_ROUTE', 0.20, 0.42, 1900, -8, 'LOW', 'Stable trajectory with less velocity gain.', '#38bdf8', [120, 60, -1500]), branch('bh02_slingshot', 'CLOSE-PASS VECTOR', 'HIGH_RISK_SHORTCUT', 0.36, 0.62, 1350, 42, 'EXTREME', 'Maximum gravity-assisted velocity.', '#a855f7', [500, 80, -2700])],
    [cinematic('bh02_target', 'TRAJECTORY LOCK', 'SLINGSHOT ANGLE CALCULATED', 0.24, 2.4, 'SHOT_06_ORBITING_PLAYER'), cinematic('bh02_burn', 'GRAVITY BURN', 'VELOCITY SURGE DETECTED', 0.56, 2.0, 'SHOT_07_EXTREME_SPEED')],
    [hazard('bh02_g1', 'APPROACH GRAVITY', 0.12, 0.28, 0.42, 'ALIGN TRAJECTORY', '#60a5fa'), hazard('bh02_g2', 'SLINGSHOT SHEAR', 0.34, 0.63, 0.9, 'CLOSE PASS // MAINTAIN TANGENT', '#a855f7'), hazard('bh02_g3', 'EXIT OVERSPEED', 0.68, 0.91, 0.72, 'VECTOR STABILIZATION REQUIRED', '#22d3ee')],
    'SLINGSHOT COMPLETE // ESCAPE VECTOR STABLE', 0.86, 13.0,
  ),
  BLACK_HOLE_STORM: route(
    '21.03 — BLACK-HOLE STORM', 'QUANTUM LAUNCH PRO // GRAVITY STORM', points(42), makeStandardSectors(['STORM ENTRY', 'DEBRIS CORRIDOR', 'PLASMA TUNNEL', 'GRAVITY-WAVE ZONE', 'ASTEROID FIELD', 'EMERGENCY ESCAPE'], [720, 700, 760, 820, 850, 930], [0.58, 0.78, 0.84, 0.95, 0.9, 0.88]),
    [branch('bh03_safe', 'SHEAR-SAFE CORRIDOR', 'SAFE_ROUTE', 0.30, 0.48, 1500, -4, 'LOW', 'Wider route with fewer gravity waves.', '#06b6d4', [300, 100, -2300]), branch('bh03_fast', 'STORM CORE CUT', 'HIGH_SPEED_ROUTE', 0.48, 0.70, 1180, 25, 'MEDIUM', 'Ride the storm edge for a speed bonus.', '#f59e0b', [700, 40, -3800])],
    [cinematic('bh03_storm', 'BLACK-HOLE STORM', 'GRAVITY WAVES INCOMING', 0.30, 2.8, 'SHOT_09_MASSIVE_SCALE_REVEAL'), cinematic('bh03_wave', 'WAVEFRONT', 'TIMING WINDOW OPEN', 0.58, 2.0, 'SHOT_05_FRONT_OBSTACLE_REVEAL')],
    [hazard('bh03_h1', 'DEBRIS STORM', 0.08, 0.30, 0.78, 'DEBRIS DENSITY INCREASING', '#f59e0b', 'ASTEROID_SWARM'), hazard('bh03_h2', 'GRAVITY WAVE', 0.34, 0.74, 1.0, 'GRAVITY WAVE // EVADE', '#c026d3'), hazard('bh03_h3', 'STORM CORE', 0.70, 0.95, 1.0, 'CRITICAL STORM // BOOST', '#fb7185', 'PLASMA_WALL')],
    'STORM SURVIVED // EXTRACTION VECTOR', 0.88, 12.8,
  ),
  COLLAPSING_ORBIT: route(
    '21.04 — COLLAPSING ORBIT', 'QUANTUM LAUNCH PRO // COLLAPSING ORBITAL RING', points(60), makeStandardSectors(['OUTER ORBIT', 'ORBITAL BRIDGE', 'BROKEN PLATFORM', 'COLLAPSING TUNNEL', 'EMERGENCY JUNCTION', 'FINAL ESCAPE'], [730, 760, 780, 820, 900, 970], [0.42, 0.58, 0.72, 0.9, 0.95, 1.0]),
    [branch('bh04_safe', 'REINFORCED BYPASS', 'SAFE_ROUTE', 0.28, 0.50, 1700, -7, 'LOW', 'Guaranteed stable surface while other lanes collapse.', '#22c55e', [240, 70, -2200]), branch('bh04_risk', 'COLLAPSING INNER LINE', 'HIGH_RISK_SHORTCUT', 0.46, 0.73, 1160, 35, 'EXTREME', 'Short route that becomes unavailable after collapse events.', '#ef4444', [650, 90, -3500])],
    [cinematic('bh04_break', 'ORBITAL FRACTURE', 'TRACK STRUCTURE FAILURE', 0.38, 2.4, 'SHOT_08_REAR_DESTRUCTION'), cinematic('bh04_route', 'EMERGENCY ROUTE', 'ONE SAFE PATH REMAINS', 0.68, 2.2, 'SHOT_04_TOP_DOWN_REVEAL')],
    [hazard('bh04_c1', 'BRIDGE FRACTURE', 0.20, 0.38, 0.7, 'TRACK INTEGRITY FALLING', '#f97316', 'COLLAPSE'), hazard('bh04_c2', 'TUNNEL COLLAPSE', 0.42, 0.72, 1.0, 'ROUTE COLLAPSE // REROUTE', '#ef4444', 'COLLAPSE'), hazard('bh04_c3', 'FINAL BREAK', 0.74, 0.94, 1.0, 'CRITICAL COLLAPSE // SAFE ROUTE', '#fb7185', 'COLLAPSE')],
    'ORBIT COLLAPSE SURVIVED // FINAL GATE', 0.87, 12.6,
  ),
  BLACK_HOLE_TREASURE_HUNT: route(
    '21.05 — BLACK-HOLE TREASURE HUNT', 'QUANTUM LAUNCH PRO // LOST ENERGY CORE', points(78), makeStandardSectors(['RESEARCH STATION', 'DEBRIS FIELD', 'EXPLORATION JUNCTION', 'GRAVITY CAVES', 'ANCIENT STRUCTURE', 'EXTRACTION ROUTE'], [700, 720, 760, 740, 800, 920], [0.35, 0.62, 0.68, 0.78, 0.88, 0.9]),
    [branch('bh05_scan', 'SCANNER SAFE LOOP', 'SAFE_ROUTE', 0.22, 0.46, 1650, -6, 'LOW', 'Longer route with more scanner beacons.', '#34d399', [120, 50, -1800]), branch('bh05_core', 'CORE GRAVITY CUT', 'HIGH_RISK_SHORTCUT', 0.48, 0.76, 1220, 32, 'EXTREME', 'Direct line to the energy core.', '#facc15', [700, 80, -3900])],
    [cinematic('bh05_signal', 'QUANTUM SIGNAL FOUND', 'ENERGY CORE LOCATION LOCKED', 0.30, 2.5, 'SHOT_03_WIDE_ENVIRONMENT_REVEAL'), cinematic('bh05_core', 'CORE ACTIVATED', 'SINGULARITY INSTABILITY RISING', 0.63, 2.4, 'SHOT_09_MASSIVE_SCALE_REVEAL')],
    [hazard('bh05_t1', 'RESEARCH DEBRIS', 0.18, 0.38, 0.55, 'SCANNER ACTIVE // DEBRIS AHEAD', '#22d3ee', 'ASTEROID_SWARM'), hazard('bh05_t2', 'GRAVITY TRAP', 0.44, 0.70, 0.82, 'GRAVITY TRAP // CHANGE LANE', '#8b5cf6'), hazard('bh05_t3', 'CORE INSTABILITY', 0.68, 0.94, 0.92, 'CORE UNSTABLE // EXTRACT NOW', '#facc15')],
    'CORE SECURED // EXTRACTION WINDOW OPEN', 0.86, 12.4,
  ),
  BLACK_HOLE_WARZONE: route(
    '21.06 — BLACK-HOLE WARZONE', 'QUANTUM LAUNCH PRO // ORBITAL BATTLEFIELD', points(96), makeStandardSectors(['MILITARY STATION', 'COMBAT CORRIDOR', 'GRAVITY BATTLEFIELD', 'ASTEROID COMBAT ZONE', 'ACCRETION ROUTE', 'ESCAPE CORRIDOR'], [740, 770, 800, 820, 880, 960], [0.5, 0.76, 0.88, 0.9, 0.94, 0.9]),
    [branch('bh06_defense', 'SHIELD WALL ROUTE', 'SAFE_ROUTE', 0.20, 0.44, 1720, -8, 'LOW', 'Reduced combat exposure and reliable shield recharge.', '#38bdf8', [160, 70, -1700]), branch('bh06_attack', 'FLEET BREAKER', 'HIGH_SPEED_ROUTE', 0.42, 0.72, 1200, 24, 'MEDIUM', 'High-speed route through the combat center.', '#f43f5e', [720, 90, -3300])],
    [cinematic('bh06_fleet', 'WARZONE CONTACT', 'COMBAT FLEET DETECTED', 0.22, 2.5, 'SHOT_09_MASSIVE_SCALE_REVEAL'), cinematic('bh06_collapse', 'BATTLEFIELD COLLAPSE', 'GRAVITY IS PULLING EVERYTHING IN', 0.73, 2.5, 'SHOT_08_REAR_DESTRUCTION')],
    [hazard('bh06_w1', 'DEFENSE DRONES', 0.12, 0.32, 0.65, 'HOSTILE DRONES // SHIELDS READY', '#ef4444', 'DRONE_MINES'), hazard('bh06_w2', 'MISSILE CORRIDOR', 0.34, 0.66, 0.9, 'MISSILE LOCKS // EVADE', '#fb7185', 'DRONE_MINES'), hazard('bh06_w3', 'GRAVITY BATTLEFIELD', 0.66, 0.94, 1.0, 'BATTLEFIELD COLLAPSING', '#a855f7', 'GRAV_WELL')],
    'WARZONE BREACH COMPLETE // ESCAPE CORRIDOR', 0.86, 12.9,
  ),
  EVENT_HORIZON_RUN: route(
    '21.07 — EVENT HORIZON RUN', 'QUANTUM LAUNCH PRO // HORIZON PRECISION COURSE', points(114), makeStandardSectors(['OUTER ORBIT', 'GRAVITY CORRIDOR', 'PRECISION ROUTE', 'INNER ORBIT', 'HORIZON EDGE', 'EMERGENCY ESCAPE'], [720, 740, 760, 780, 820, 950], [0.3, 0.52, 0.68, 0.82, 0.98, 0.92]),
    [branch('bh07_outer', 'OUTER SAFE SHELF', 'SAFE_ROUTE', 0.18, 0.46, 1900, -10, 'LOW', 'Maximum distance from the event horizon.', '#22d3ee', [80, 55, -1900]), branch('bh07_edge', 'HORIZON EDGE', 'HIGH_RISK_SHORTCUT', 0.44, 0.74, 1120, 30, 'EXTREME', 'Fastest line with minimal safe distance.', '#ec4899', [640, 70, -3500])],
    [cinematic('bh07_horizon', 'EVENT HORIZON', "DON'T CROSS THE LINE", 0.42, 2.4, 'SHOT_06_ORBITING_PLAYER'), cinematic('bh07_critical', 'CRITICAL RANGE', 'EMERGENCY BOOST AUTHORIZED', 0.76, 2.0, 'SHOT_01_LOW_REAR_CHASE')],
    [hazard('bh07_h1', 'HORIZON SHELF', 0.22, 0.42, 0.62, 'DISTANCE TO HORIZON FALLING', '#60a5fa'), hazard('bh07_h2', 'TIDAL FORCE', 0.44, 0.72, 0.92, 'TIDAL FORCE // PRECISION REQUIRED', '#c026d3'), hazard('bh07_h3', 'CRITICAL HORIZON', 0.70, 0.96, 1.0, 'CRITICAL // BOOST OUTWARD', '#ec4899')],
    'HORIZON CROSSED SAFELY // ESCAPE VECTOR', 0.88, 12.0,
  ),
  BLACK_HOLE_MAZE: route(
    '21.08 — THE BLACK-HOLE MAZE', 'QUANTUM LAUNCH PRO // GRAVITY LABYRINTH', points(132), makeStandardSectors(['MAZE ENTRANCE', 'OUTER BRANCHES', 'GRAVITY TRAPS', 'DEEP JUNCTIONS', 'HIDDEN ESCAPE ROUTE', 'EXIT'], [680, 700, 720, 760, 820, 940], [0.45, 0.62, 0.86, 0.92, 0.96, 0.9]),
    [branch('bh08_safe', 'STABLE MAZE LOOP', 'SAFE_ROUTE', 0.18, 0.42, 1750, -8, 'LOW', 'Long route that preserves a stable checkpoint chain.', '#34d399', [150, 60, -1500]), branch('bh08_short', 'SINGULARITY SHORTCUT', 'HIGH_RISK_SHORTCUT', 0.34, 0.66, 1050, 38, 'EXTREME', 'Fast hidden route with strong gravity.', '#d946ef', [600, 90, -3000]), branch('bh08_fast', 'OUTER WALL RUN', 'HIGH_SPEED_ROUTE', 0.62, 0.82, 1180, 18, 'MEDIUM', 'High-speed perimeter line.', '#38bdf8', [-450, 120, -5000])],
    [cinematic('bh08_maze', 'GRAVITY MAZE REVEAL', 'ROUTES SHIFTING AROUND YOU', 0.24, 2.7, 'SHOT_04_TOP_DOWN_REVEAL'), cinematic('bh08_exit', 'EXIT DISCOVERED', 'ONE ROUTE REMAINS STABLE', 0.78, 2.2, 'SHOT_07_EXTREME_SPEED')],
    [hazard('bh08_m1', 'FALSE ROUTE FIELD', 0.18, 0.36, 0.65, 'MULTIPLE ROUTES // SCAN MINIMAP', '#60a5fa'), hazard('bh08_m2', 'GRAVITY TRAPS', 0.34, 0.70, 0.95, 'GRAVITY TRAP // REROUTE', '#a855f7'), hazard('bh08_m3', 'MAZE COLLAPSE', 0.68, 0.94, 1.0, 'MAZE COLLAPSING // FIND EXIT', '#f43f5e', 'COLLAPSE')],
    'MAZE EXIT LOCKED // ESCAPE', 0.87, 12.7,
  ),
  SINGULARITY_RIVAL: route(
    '21.09 — SINGULARITY RIVAL', 'QUANTUM LAUNCH PRO // RIVAL ESCAPE VECTOR', points(150), makeStandardSectors(['WIDE OPENING', 'HIGH-SPEED SECTION', 'NARROW ORBIT', 'GRAVITY SLINGSHOT', 'COMBAT SECTION', 'FINAL ESCAPE'], [760, 820, 800, 900, 920, 1040], [0.32, 0.5, 0.74, 0.88, 0.94, 0.9]),
    [branch('bh09_safe', 'DEFENSIVE LINE', 'SAFE_ROUTE', 0.22, 0.46, 1700, -7, 'LOW', 'Stable route for defensive positioning.', '#22d3ee', [120, 70, -1700]), branch('bh09_attack', 'RIVAL CUT', 'HIGH_RISK_SHORTCUT', 0.44, 0.73, 1140, 34, 'EXTREME', 'Aggressive shortcut for an overtake opportunity.', '#ef4444', [680, 80, -3500])],
    [cinematic('bh09_rival', 'SINGULARITY RIVAL', 'ONE SHIP GETS OUT', 0.18, 2.5, 'SHOT_02_SIDE_FLYBY'), cinematic('bh09_final', 'FINAL ESCAPE RACE', 'RIVAL VECTOR LOCKED', 0.76, 2.3, 'SHOT_07_EXTREME_SPEED')],
    [hazard('bh09_r1', 'RIVAL COMBAT', 0.20, 0.42, 0.58, 'RIVAL IN RANGE', '#ef4444', 'DRONE_MINES'), hazard('bh09_r2', 'SLINGSHOT DUEL', 0.42, 0.70, 0.9, 'SLINGSHOT WINDOW // OVERTAKE', '#a855f7'), hazard('bh09_r3', 'FINAL GRAVITY GATE', 0.70, 0.95, 1.0, 'ESCAPE VECTOR // HOLD LEAD', '#f43f5e')],
    'RIVAL DEFEATED // ESCAPE VECTOR OPEN', 0.87, 12.8,
  ),
  FINAL_SINGULARITY: route(
    '21.10 — THE FINAL SINGULARITY', 'QUANTUM LAUNCH PRO // FIVE MINUTES TO THE END', points(168), makeStandardSectors(['FIVE-MINUTE RACE', 'SINGULARITY ACTIVATION', 'COLLAPSING TRACK', 'SPAGHETTIFICATION ZONE', 'PLANETARY COLLISION ZONE', 'EMERGENCY ROUTE'], [760, 790, 820, 860, 900, 980], [0.32, 0.68, 0.88, 0.94, 0.98, 1.0]),
    [branch('bh10_safe', 'EMERGENCY SAFE-ZONE ROUTE', 'SAFE_ROUTE', 0.64, 0.90, 2300, -5, 'LOW', 'Fair guaranteed escape route toward the evacuation tower.', '#22c55e', [180, 80, -5000]), branch('bh10_fast', 'COLLAPSING EXPRESS', 'HIGH_SPEED_ROUTE', 0.70, 0.91, 1450, 22, 'MEDIUM', 'Faster route that requires immediate commitment.', '#f59e0b', [650, 60, -5400])],
    [
      cinematic('bh10_zero', '00:00 — SINGULARITY ACTIVATION', 'THE END HAS BEGUN', 0.58, 3.2, 'SHOT_09_MASSIVE_SCALE_REVEAL'),
      cinematic('bh10_planet', 'PLANETARY COLLISION EVENT', 'DISTANT SYSTEMS ARE FALLING', 0.72, 3.0, 'SHOT_10_FINALE_CAMERA'),
      cinematic('bh10_tower', 'EVACUATION TOWER', 'BASEMENT SAFE-ZONE AHEAD', 0.90, 2.8, 'SHOT_03_WIDE_ENVIRONMENT_REVEAL'),
    ],
    [
      hazard('bh10_h1', 'COUNTDOWN PRESSURE', 0.00, 0.58, 0.42, '05:00 — MAINTAIN RACE SPEED', '#60a5fa'),
      hazard('bh10_h2', 'SINGULARITY ACTIVATION', 0.58, 0.70, 0.9, '00:00 — SINGULARITY ACTIVE', '#c026d3'),
      hazard('bh10_h3', 'TRACK COLLAPSE', 0.64, 0.84, 1.0, 'TRACK DISINTEGRATING // FOLLOW SAFE ROUTE', '#ef4444', 'COLLAPSE'),
      hazard('bh10_h4', 'PLANETARY DEBRIS', 0.72, 0.90, 1.0, 'COLLISION EVENT // EMERGENCY ROUTE', '#f97316', 'ASTEROID_SWARM'),
      hazard('bh10_h5', 'TOWER APPROACH', 0.88, 0.98, 0.85, 'EVACUATION TOWER // BASEMENT ENTRY', '#22c55e'),
    ],
    'YOU SURVIVED THE SINGULARITY', 0.90, 14.5,
  ),
};

export function getBlackHolePath(submode: BlackHoleSubmodeId): ExtendedPathConfig {
  return BLACK_HOLE_SUBMODE_PATHS[submode];
}

export const FINAL_SINGULARITY_COUNTDOWN_SECONDS = 300;
