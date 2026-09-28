/**
 * MODE 21 — BLACK HOLE
 * Quantum Launch Pro submode definitions.
 *
 * This file is intentionally data-only: it does not replace the existing
 * GameMode system. It can be imported by Mode 21 integration code and by
 * the mode-selection UI.
 */

export const BLACK_HOLE_MODE_ID = 'BLACK_HOLE' as const;

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

export type BlackHoleDangerState =
  | 'SAFE'
  | 'WARNING'
  | 'DANGER'
  | 'CRITICAL'
  | 'COLLAPSE';

export interface BlackHoleSubmodeConfig {
  id: BlackHoleSubmodeId;
  number: number;
  name: string;
  subtitle: string;
  objective: string;
  environment: string;
  pathSectors: string[];
  hazards: string[];
  mechanics: string[];
  cinematicEvents: string[];
  aiBehavior: string[];
  escapeSequence: string;
  dangerProfile: {
    gravityStrength: number;
    eventHorizonRadius: number;
    tidalForce: number;
    distortionStrength: number;
    captureStrength: number;
  };
  finalMode?: boolean;
  timeLimitSeconds?: number;
}

export const BLACK_HOLE_SUBMODES: readonly BlackHoleSubmodeConfig[] = [
  {
    id: 'SINGULARITY_DESCENT',
    number: 1,
    name: 'Singularity Descent',
    subtitle: 'THE FALL',
    objective: 'Descend toward the singularity, collect checkpoints, then escape the gravitational field.',
    environment: 'Orbital station, asteroid field, spiral gravity route, accretion-disk tunnel and event-horizon approach.',
    pathSectors: [
      'Orbital Station Departure',
      'Asteroid Field',
      'Spiral Gravity Route',
      'Accretion Disk Tunnel',
      'Event Horizon Approach',
      'Emergency Escape Route',
    ],
    hazards: ['Gravity wells', 'Asteroid debris', 'Track distortion', 'Event-horizon warning zones'],
    mechanics: ['Progressive gravity', 'Gravity warnings', 'Boost escape', 'Checkpoint recovery'],
    cinematicEvents: ['Black-hole reveal', 'Gravity anomaly', 'Accretion-disk surge', 'Escape reveal'],
    aiBehavior: ['Normal racing', 'Gravity avoidance', 'Emergency route selection'],
    escapeSequence: 'Reach the emergency escape gate before the gravity field becomes critical.',
    dangerProfile: { gravityStrength: 1.0, eventHorizonRadius: 140, tidalForce: 0.8, distortionStrength: 0.55, captureStrength: 0.7 },
  },
  {
    id: 'GRAVITY_SLINGSHOT',
    number: 2,
    name: 'Gravity Slingshot',
    subtitle: 'STEAL SPEED FROM THE VOID',
    objective: 'Use a controlled close pass around the black hole to gain velocity and reach the escape corridor.',
    environment: 'Multi-vector orbital approach with inner and outer gravity lanes.',
    pathSectors: ['Approach Vector', 'Outer Orbit', 'Slingshot Gate', 'Inner Orbit', 'Extreme Gravity Pass', 'High-Speed Escape'],
    hazards: ['Incorrect approach angle', 'Gravity capture', 'Debris', 'Over-speed exit'],
    mechanics: ['Trajectory scoring', 'Gravity acceleration', 'Slingshot multiplier', 'Boost chaining'],
    cinematicEvents: ['Trajectory preview', 'Closest-pass camera', 'Velocity surge'],
    aiBehavior: ['Choose slingshot angles', 'Risk/reward shortcuts', 'Boost after slingshot'],
    escapeSequence: 'Exit the gravitational pass through the high-speed escape corridor.',
    dangerProfile: { gravityStrength: 1.35, eventHorizonRadius: 135, tidalForce: 1.0, distortionStrength: 0.7, captureStrength: 0.9 },
  },
  {
    id: 'BLACK_HOLE_STORM',
    number: 3,
    name: 'Black-Hole Storm',
    subtitle: 'THE SKY IS FALLING',
    objective: 'Survive a gravitational storm while maintaining enough speed to reach extraction.',
    environment: 'Debris storm, plasma corridor, gravity-wave field and emergency extraction route.',
    pathSectors: ['Storm Entry', 'Debris Corridor', 'Plasma Tunnel', 'Gravity-Wave Zone', 'Asteroid Field', 'Emergency Escape'],
    hazards: ['Gravity waves', 'Plasma bursts', 'Fast debris', 'Asteroid clusters'],
    mechanics: ['Wave timing', 'Shield management', 'Hazard avoidance', 'Speed preservation'],
    cinematicEvents: ['Storm arrival', 'Gravity wave pass', 'Distant debris collapse'],
    aiBehavior: ['Defensive routing', 'Shield timing', 'Dynamic obstacle avoidance'],
    escapeSequence: 'Cross the extraction gate after the final gravity wave passes.',
    dangerProfile: { gravityStrength: 1.15, eventHorizonRadius: 150, tidalForce: 1.25, distortionStrength: 0.8, captureStrength: 0.75 },
  },
  {
    id: 'COLLAPSING_ORBIT',
    number: 4,
    name: 'Collapsing Orbit',
    subtitle: 'THE TRACK IS DISAPPEARING',
    objective: 'Race through a dynamically collapsing route while keeping one valid escape path active.',
    environment: 'Orbital bridges, platforms, tunnels and branching track sectors around a black hole.',
    pathSectors: ['Outer Orbit', 'Orbital Bridge', 'Broken Platform', 'Collapsing Tunnel', 'Emergency Junction', 'Final Escape'],
    hazards: ['Collapsing track', 'Falling structures', 'Gravity pull', 'Blocked routes'],
    mechanics: ['Dynamic path removal', 'Route updates', 'Emergency rerouting', 'Minimap state changes'],
    cinematicEvents: ['Track fracture', 'Bridge collapse', 'Route collapse sequence'],
    aiBehavior: ['Recalculate routes', 'Avoid destroyed sectors', 'Use emergency shortcuts'],
    escapeSequence: 'Follow the active route after each collapse and cross the final escape gate.',
    dangerProfile: { gravityStrength: 1.2, eventHorizonRadius: 145, tidalForce: 1.35, distortionStrength: 0.9, captureStrength: 0.85 },
  },
  {
    id: 'BLACK_HOLE_TREASURE_HUNT',
    number: 5,
    name: 'Black-Hole Treasure Hunt',
    subtitle: 'THE LAST SIGNAL',
    objective: 'Locate the quantum energy core and extract it from a dangerous region near the black hole.',
    environment: 'Destroyed research station, debris field, ancient orbital structure and energy-core chamber.',
    pathSectors: ['Research Station', 'Debris Field', 'Three-Way Exploration', 'Gravity Caves', 'Ancient Structure', 'Extraction Route'],
    hazards: ['Hidden debris', 'Gravity traps', 'False routes', 'Instability pulses'],
    mechanics: ['Scanner', 'Signal strength', 'Risk/reward routes', 'Extraction timer'],
    cinematicEvents: ['Signal discovery', 'Core activation', 'Singularity instability'],
    aiBehavior: ['Search routes', 'Compete for objectives', 'Choose riskier shortcuts'],
    escapeSequence: 'Carry the energy core to the extraction gate without entering the critical gravity zone.',
    dangerProfile: { gravityStrength: 1.1, eventHorizonRadius: 150, tidalForce: 1.1, distortionStrength: 0.65, captureStrength: 0.8 },
  },
  {
    id: 'BLACK_HOLE_WARZONE',
    number: 6,
    name: 'Black-Hole Warzone',
    subtitle: 'RACE OR DESTROY',
    objective: 'Race through a combat zone while surviving enemy fire and black-hole hazards.',
    environment: 'Military station, combat corridor, orbital battlefield, asteroid combat zone and escape corridor.',
    pathSectors: ['Military Station', 'Combat Corridor', 'Gravity Battlefield', 'Asteroid Combat Zone', 'Accretion Route', 'Escape Corridor'],
    hazards: ['Combat drones', 'Missiles', 'Turrets', 'Debris', 'Gravity wells'],
    mechanics: ['Weapons', 'Shields', 'Combat racing', 'Enemy blocking'],
    cinematicEvents: ['Fleet battle', 'Distant ship capture', 'Battlefield collapse'],
    aiBehavior: ['Aggressive blocking', 'Missile attacks', 'Shield use', 'Gravity-route tactics'],
    escapeSequence: 'Reach the escape corridor while the battlefield collapses inward.',
    dangerProfile: { gravityStrength: 1.25, eventHorizonRadius: 145, tidalForce: 1.15, distortionStrength: 0.75, captureStrength: 0.95 },
  },
  {
    id: 'EVENT_HORIZON_RUN',
    number: 7,
    name: 'Event Horizon Run',
    subtitle: "DON'T CROSS THE LINE",
    objective: 'Complete the route while maintaining a safe distance from the event horizon.',
    environment: 'Precision orbital route with inner and outer gravity lanes.',
    pathSectors: ['Outer Orbit', 'Gravity Corridor', 'Precision Route', 'Inner Orbit', 'Emergency Escape'],
    hazards: ['Event horizon', 'Increasing gravity', 'Space distortion', 'Tidal-force zones'],
    mechanics: ['Distance telemetry', 'Danger states', 'Precision steering', 'Emergency boost'],
    cinematicEvents: ['Horizon reveal', 'Critical approach warning', 'Horizon expansion'],
    aiBehavior: ['Distance management', 'Conservative routing', 'Emergency recovery'],
    escapeSequence: 'Cross the safe-zone gate before the event horizon reaches critical range.',
    dangerProfile: { gravityStrength: 1.3, eventHorizonRadius: 140, tidalForce: 1.45, distortionStrength: 1.0, captureStrength: 1.0 },
  },
  {
    id: 'BLACK_HOLE_MAZE',
    number: 8,
    name: 'The Black-Hole Maze',
    subtitle: 'NO WAY BACK',
    objective: 'Navigate branching gravitational routes and discover the active exit.',
    environment: 'Large branching gravitational maze with safe, risky and collapsing routes.',
    pathSectors: ['Maze Entrance', 'Outer Branches', 'Gravity Traps', 'Deep Junctions', 'Hidden Escape Route', 'Exit'],
    hazards: ['False routes', 'Gravity traps', 'Collapsing branches', 'Dead ends'],
    mechanics: ['Progressive minimap discovery', 'Junction decisions', 'Route memory', 'Emergency rerouting'],
    cinematicEvents: ['Maze reveal', 'Route collapse', 'Exit discovery'],
    aiBehavior: ['Route exploration', 'Route memory', 'Dynamic rerouting'],
    escapeSequence: 'Discover the active exit and escape before the maze collapses.',
    dangerProfile: { gravityStrength: 1.2, eventHorizonRadius: 150, tidalForce: 1.3, distortionStrength: 0.95, captureStrength: 0.9 },
  },
  {
    id: 'SINGULARITY_RIVAL',
    number: 9,
    name: 'Singularity Rival',
    subtitle: 'ONE SHIP GETS OUT',
    objective: 'Outrace a rival spacecraft through a dangerous gravity course and reach the escape vector first.',
    environment: 'High-speed orbital route, combat section, gravity slingshot and final escape vector.',
    pathSectors: ['Wide Opening', 'High-Speed Section', 'Narrow Orbit', 'Gravity Slingshot', 'Combat Section', 'Final Escape'],
    hazards: ['Rival attacks', 'Missiles', 'Blocking', 'Gravity capture zones'],
    mechanics: ['Rival AI', 'Overtaking', 'Combat', 'Slingshot racing'],
    cinematicEvents: ['Rival reveal', 'Two-ship approach', 'Final escape race'],
    aiBehavior: ['Aggressive overtaking', 'Blocking', 'Missile use', 'Shortcut selection'],
    escapeSequence: 'Reach the final escape vector ahead of the rival.',
    dangerProfile: { gravityStrength: 1.3, eventHorizonRadius: 140, tidalForce: 1.35, distortionStrength: 0.9, captureStrength: 1.0 },
  },
  {
    id: 'FINAL_COLLAPSE',
    number: 10,
    name: 'THE FINAL COLLAPSE',
    subtitle: '5 MINUTES UNTIL THE VOID',
    objective: 'Race for five minutes, survive the singularity collapse, and reach the sealed emergency safe zone.',
    environment: 'Massive planetary system, orbital highways, stations, asteroid fields and an emergency evacuation tower.',
    pathSectors: ['Five-Minute Race', 'Singularity Activation', 'Collapsing Track', 'Spaghettification Zone', 'Planetary Collision Zone', 'Emergency Route', 'Tower Entrance', 'Tower Basement', 'Safe Zone'],
    hazards: ['Track collapse', 'Gravity waves', 'Tidal distortion', 'Planetary debris', 'Closing doors', 'Critical gravity zones'],
    mechanics: ['Five-minute countdown', 'Dynamic track destruction', 'Emergency route', 'Safe-zone navigation', 'Tower evacuation'],
    cinematicEvents: ['00:00 singularity activation', 'Track collapse', 'Distant planetary collision', 'Tower sealing', 'Final singularity collapse'],
    aiBehavior: ['Normal race behavior', 'Emergency route selection', 'Boost escape', 'Safe-zone navigation'],
    escapeSequence: 'Enter the emergency tower basement and reach the sealed safe zone before the final collapse.',
    dangerProfile: { gravityStrength: 1.55, eventHorizonRadius: 130, tidalForce: 1.7, distortionStrength: 1.25, captureStrength: 1.2 },
    finalMode: true,
    timeLimitSeconds: 300,
  },
];

export function getBlackHoleSubmode(id: BlackHoleSubmodeId): BlackHoleSubmodeConfig {
  const config = BLACK_HOLE_SUBMODES.find((submode) => submode.id === id);
  if (!config) throw new Error(`Unknown Mode 21 Black Hole submode: ${id}`);
  return config;
}

export function getBlackHoleSubmodeByNumber(number: number): BlackHoleSubmodeConfig {
  const config = BLACK_HOLE_SUBMODES.find((submode) => submode.number === number);
  if (!config) throw new Error(`Unknown Mode 21 Black Hole submode number: ${number}`);
  return config;
}

export function getBlackHoleDangerState(distanceToHorizon: number, horizonRadius: number): BlackHoleDangerState {
  const ratio = distanceToHorizon / Math.max(1, horizonRadius);
  if (ratio > 3.0) return 'SAFE';
  if (ratio > 2.0) return 'WARNING';
  if (ratio > 1.35) return 'DANGER';
  if (ratio > 1.0) return 'CRITICAL';
  return 'COLLAPSE';
}

export const FINAL_COLLAPSE_DURATION_SECONDS = 300;

// Backward-compatible alias for existing Mode 21 integration code.
export const FINAL_SINGULARITY_DURATION_SECONDS = FINAL_COLLAPSE_DURATION_SECONDS;
