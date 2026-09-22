import { GameMode } from '../types';

export interface GameModeConfig {
  id: string;
  name: string;
  environment: string;
  objective: string;
  hazards: string[];
  mechanics: string[];
  winCondition: string;
  lossCondition: string;
  scoring: string;
  allowedSystems: string[];
}

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  SINGULARITY_RUN: {
    id: 'SINGULARITY_RUN',
    name: '01 — Singularity Run',
    environment: 'Massive central black hole, accretion disk, event horizon, distorted starfield, gravity tunnels, collapsing orbital structures',
    objective: 'Race through dangerous gravitational field, use gravity slingshots to gain speed, and escape before singularity consumes the route',
    hazards: ['Gravity wells', 'Event-horizon zones', 'Space distortion', 'Falling debris', 'Collapsing routes'],
    mechanics: ['GravityField', 'EventHorizon', 'GravitySlingshot', 'SingularityTimer', 'GravitationalTrackDistortion'],
    winCondition: 'Reach the final escape gate before the timer expires',
    lossCondition: 'Fall into the event horizon, crash beyond recovery, or run out of time',
    scoring: 'Slingshot distance, escape speed, remaining time, survival bonus',
    allowedSystems: [
      'BlackHoleManager',
      'GravityFieldManager',
      'EventHorizonManager',
      'GravityWaveManager',
      'SlingshotManager',
      'GravityZoneManager',
      'GravityShieldManager',
      'AccretionDiskManager',
      'BlackHoleHazardManager',
      'BlackHoleRespawnManager',
      'UniversalPlayerSystem',
      'CollisionSystem',
      'AudioSystem',
    ],
  },

  NEON_CIRCUIT: {
    id: 'NEON_CIRCUIT',
    name: '02 — Neon Circuit',
    environment: 'Futuristic neon megacity, holographic buildings, floating highways, energy towers, neon checkpoints',
    objective: 'Competitive multi-lap racing, overtake AI opponents, use boost zones and drift corners, select alternate routes at junctions',
    hazards: ['Moving traffic', 'Laser gates', 'Energy barriers', 'Sharp technical corners'],
    mechanics: ['Laps', 'Position ranking', 'Drifting', 'Boost pads', 'Branching routes'],
    winCondition: 'Finish the required laps in target podium position (1st–3rd)',
    lossCondition: 'Fail the time limit or finish below required position',
    scoring: 'Final position, lap times, drift duration, clean overtakes',
    allowedSystems: [
      'UniversalPlayerSystem',
      'LapManager',
      'CheckpointManager',
      'BoostManager',
      'DriftManager',
      'TrafficAI',
      'JunctionSystem',
      'CollisionSystem',
    ],
  },

  ASTEROID_RUN: {
    id: 'ASTEROID_RUN',
    name: '03 — Asteroid Run',
    environment: 'Dense asteroid belt, broken moons, mining stations, space cargo platforms',
    objective: 'Race through moving asteroids, destroy selected asteroids using the beam, avoid or destroy obstacles strategically, reach checkpoints without losing all hull',
    hazards: ['Rotating asteroids', 'Fast-moving debris', 'Asteroid clusters', 'Narrow passages'],
    mechanics: ['Asteroid health', 'Beam energy and overheating', 'Target reticle', 'Destruction effects', 'Collision damage'],
    winCondition: 'Reach the finish line while completing required checkpoint progress',
    lossCondition: 'Hull reaches zero or race timer expires',
    scoring: 'Asteroids destroyed, accuracy, near-misses, combo multiplier',
    allowedSystems: [
      'UniversalPlayerSystem',
      'BeamSystem',
      'AsteroidManager',
      'CollisionManager',
      'DamageManager',
      'RespawnManager',
    ],
  },

  WORMHOLE_EXPRESS: {
    id: 'WORMHOLE_EXPRESS',
    name: '04 — Wormhole Express',
    environment: 'Interconnected wormholes, space tunnels, blue and violet dimensional portals, floating fragments of space',
    objective: 'Travel between wormhole gates, select correct portal route, maintain speed through dimensional tunnels, avoid unstable portal exits',
    hazards: ['Unstable wormholes', 'Portal turbulence', 'Dimensional debris', 'Wrong-route penalties'],
    mechanics: ['Wormhole entry and exit', 'Portal cooldown', 'Route validation', 'Momentum preservation'],
    winCondition: 'Pass through required wormholes and reach destination',
    lossCondition: 'Enter invalid portals repeatedly, crash, or exceed time limit',
    scoring: 'Wormhole jump accuracy, warp speed maintained, route efficiency',
    allowedSystems: [
      'UniversalPlayerSystem',
      'WormholeManager',
      'PortalRouter',
      'MomentumPreserver',
      'CollisionSystem',
    ],
  },

  SOLAR_STORM: {
    id: 'SOLAR_STORM',
    name: '05 — Solar Storm',
    environment: 'Giant star, solar flares, orange plasma clouds, magnetic storm zones, burning planetary fragments',
    objective: 'Race while managing spacecraft heat, avoid solar flare paths, enter cooling zones, use boost carefully to prevent overheating',
    hazards: ['Solar flares', 'Plasma bursts', 'Heat waves', 'Magnetic interference'],
    mechanics: ['Heat meter', 'Cooling zones', 'Overheat slowdown', 'Solar flare warnings'],
    winCondition: 'Finish the race while keeping the spacecraft operational',
    lossCondition: 'Overheat repeatedly, lose hull integrity, or run out of time',
    scoring: 'Thermal efficiency, time in cooling zones, speed maintained',
    allowedSystems: [
      'UniversalPlayerSystem',
      'ThermalSystem',
      'CoolingZoneManager',
      'SolarHazardManager',
      'CollisionSystem',
    ],
  },

  GRAVITY_FREE: {
    id: 'GRAVITY_FREE',
    name: '06 — Gravity Free',
    environment: 'Zero-gravity space arena, floating track pieces, space stations, rotating platforms',
    objective: 'Race through low-gravity areas, control drifting momentum, use directional movement and braking, navigate floating checkpoints',
    hazards: ['Rotating platforms', 'Floating debris', 'Momentum traps', 'Open-space boundaries'],
    mechanics: ['Reduced-gravity physics', 'Momentum control', 'Controlled braking', 'Orientation stabilization'],
    winCondition: 'Pass all checkpoints and reach finish gate',
    lossCondition: 'Leave valid play area, crash repeatedly, or fail timer',
    scoring: 'Stunt difficulty, rotation count, speed, landing quality, combo multiplier',
    allowedSystems: [
      'UniversalPlayerSystem',
      'ZeroGPhysics',
      'StuntManager',
      'ComboSystem',
      'CollisionSystem',
    ],
  },

  PLASMA_STORM: {
    id: 'PLASMA_STORM',
    name: '07 — Plasma Storm',
    environment: 'Purple and blue plasma clouds, lightning-filled space, energy storms, plasma research stations',
    objective: 'Race through continuously changing plasma waves, find safe gaps, time boosts between electrical hazards, use defensive movement',
    hazards: ['Plasma walls', 'Lightning strikes', 'Energy waves', 'Electrical fields'],
    mechanics: ['Dynamic storm patterns', 'Warning indicators', 'Shield drain', 'Hazard cooldowns'],
    winCondition: 'Reach finish before storm reaches maximum intensity',
    lossCondition: 'Lose all shield and hull health or miss time limit',
    scoring: 'Distance ahead of storm wall, plasma shields collected, survival time',
    allowedSystems: [
      'UniversalPlayerSystem',
      'PlasmaStormManager',
      'ShieldDrainSystem',
      'HazardWarningSystem',
      'CollisionSystem',
    ],
  },

  SKYLINE_RUSH: {
    id: 'SKYLINE_RUSH',
    name: '08 — Skyline Rush',
    environment: 'Massive futuristic orbital city, vertical skyscrapers, suspended roads, holographic billboards, flying vehicles',
    objective: 'High-speed urban space racing, navigate vertical and horizontal track sections, avoid traffic, use shortcuts',
    hazards: ['Flying traffic', 'Building barriers', 'Laser checkpoints', 'Sudden route changes'],
    mechanics: ['Vertical track segments', 'Traffic AI', 'Shortcut routes', 'Near-miss scoring'],
    winCondition: 'Complete route and reach finish gate',
    lossCondition: 'Crash beyond recovery or fail race timer',
    scoring: 'Top speed, near-miss passes with traffic, urban shortcuts discovered',
    allowedSystems: [
      'UniversalPlayerSystem',
      'UrbanTrafficAI',
      'VerticalSegmentSystem',
      'ShortcutManager',
      'CollisionSystem',
    ],
  },

  DEBRIS_SURVIVAL: {
    id: 'DEBRIS_SURVIVAL',
    name: '09 — Debris Survival',
    environment: 'Destroyed orbital station, warzone debris field, damaged satellites, exploding spacecraft',
    objective: 'Survive for a fixed duration, avoid continuously spawning debris, collect repair and shield items, maintain movement within survival arena',
    hazards: ['Falling debris', 'Explosions', 'Rotating wreckage', 'Shockwaves', 'Damaged satellites'],
    mechanics: ['Survival timer', 'Spawn director', 'Increasing difficulty', 'Repair pickups', 'Damage tracking'],
    winCondition: 'Survive until timer ends',
    lossCondition: 'Hull reaches zero or player leaves arena',
    scoring: 'Survival seconds, debris destroyed, close near-misses, repair pickups collected',
    allowedSystems: [
      'UniversalPlayerSystem',
      'DebrisSpawnDirector',
      'RepairPickupManager',
      'DamageTracker',
      'CollisionSystem',
    ],
  },

  QUANTUM_TIME_TRIAL: {
    id: 'QUANTUM_TIME_TRIAL',
    name: '10 — Quantum Time Trial',
    environment: 'Quantum testing facility, glowing time gates, digital space tracks, ghost trails',
    objective: 'Race against personal best or ghost racer, pass time gates in correct order, improve lap and sector times, avoid penalties',
    hazards: ['Time distortion zones', 'Moving gates', 'Precision barriers', 'Route timing traps'],
    mechanics: ['Ghost replay', 'Sector timing', 'Medal system', 'Personal best tracking', 'Time penalties'],
    winCondition: 'Complete track within target time (Gold: 45.0s, Silver: 52.0s, Bronze: 60.0s)',
    lossCondition: 'Fail time requirement or miss required checkpoints',
    scoring: 'Final split time, gate precision, medal tier earned',
    allowedSystems: [
      'UniversalPlayerSystem',
      'GhostReplaySystem',
      'SectorTimer',
      'PrecisionGateManager',
      'MedalSystem',
    ],
  },

  ENERGY_HEIST: {
    id: 'ENERGY_HEIST',
    name: '11 — Energy Heist',
    environment: 'Energy refinery, orbital power station, security platforms, neon energy containers',
    objective: 'Collect energy cores from multiple locations, transport energy to extraction gate, balance speed with cargo safety, avoid security systems',
    hazards: ['Security drones', 'Laser grids', 'Energy pulses', 'Locked gates'],
    mechanics: ['Energy collection', 'Cargo capacity', 'Extraction zones', 'Security alert level', 'Delivery scoring'],
    winCondition: 'Collect and successfully deliver required energy cores',
    lossCondition: 'Lose all cargo, trigger maximum security, or run out of time',
    scoring: 'Cores secured, cargo integrity, delivery time bonus',
    allowedSystems: [
      'UniversalPlayerSystem',
      'CargoManager',
      'SecurityGridSystem',
      'ExtractionManager',
      'CollisionSystem',
    ],
  },

  DRONE_ASSAULT: {
    id: 'DRONE_ASSAULT',
    name: '12 — Drone Assault',
    environment: 'Hostile defense sector, military space station, turret platforms, combat arenas',
    objective: 'Race while fighting hostile drones, destroy required targets, avoid incoming projectiles, reach extraction point',
    hazards: ['Combat drones', 'Turrets', 'Missiles', 'Energy cannons'],
    mechanics: ['Enemy health', 'Target lock', 'Projectile collision', 'Damage and shield systems', 'Enemy spawn waves'],
    winCondition: 'Complete required objectives and reach extraction',
    lossCondition: 'Hull reaches zero or fail mission timer',
    scoring: 'Drones eliminated, target lock accuracy, waves cleared',
    allowedSystems: [
      'UniversalPlayerSystem',
      'CombatDroneManager',
      'TurretSystem',
      'BeamSystem',
      'DamageSystem',
    ],
  },

  COLLAPSING_TRACK: {
    id: 'COLLAPSING_TRACK',
    name: '13 — Collapsing Track',
    environment: 'Disintegrating orbital highway, falling platforms, exploding bridges, collapsing space structures',
    objective: 'Race before track disappears, react to collapsing sections, choose safe and fast routes, maintain forward momentum',
    hazards: ['Falling track pieces', 'Explosive sections', 'Collapsing bridges', 'Blocked checkpoints'],
    mechanics: ['Track collapse timeline', 'Safe route detection', 'Dynamic route replacement', 'Respawn safety validation'],
    winCondition: 'Reach finish before track collapses',
    lossCondition: 'Fall into destroyed track sections or fail time limit',
    scoring: 'Distance ahead of collapse front, jump precision, route safety',
    allowedSystems: [
      'UniversalPlayerSystem',
      'TrackCollapseDirector',
      'SafeRouteValidator',
      'DynamicRespawnSystem',
      'CollisionSystem',
    ],
  },

  RING_RUNNER: {
    id: 'RING_RUNNER',
    name: '14 — Ring Runner',
    environment: 'Giant orbital rings, planetary orbit, circular energy tunnels, floating ring structures',
    objective: 'Pass through rings in sequence, maintain speed and accuracy, perform controlled aerial movement, collect optional bonus rings',
    hazards: ['Rotating rings', 'Narrow energy tunnels', 'Moving ring obstacles', 'Missing-ring penalties'],
    mechanics: ['Ring sequence validation', 'Accuracy score', 'Combo multiplier', 'Optional bonus routes'],
    winCondition: 'Pass through required number of rings and finish',
    lossCondition: 'Miss too many rings or run out of time',
    scoring: 'Rings threaded, combo streak, center-aperture bonus',
    allowedSystems: [
      'UniversalPlayerSystem',
      'OrbitalRingManager',
      'RingAccuracyValidator',
      'ComboSystem',
      'CollisionSystem',
    ],
  },

  HYPERSPACE_SPRINT: {
    id: 'HYPERSPACE_SPRINT',
    name: '15 — Hyperspace Sprint',
    environment: 'Hyperspace tunnel, streaking stars, high-speed energy lanes, dimensional gates',
    objective: 'Extremely fast short-distance racing, switch lanes rapidly, time boosts and braking, avoid high-speed barriers',
    hazards: ['Energy walls', 'Lane blockers', 'Hyperspace turbulence', 'Sudden gates'],
    mechanics: ['High-speed physics', 'Lane switching', 'Reaction warnings', 'Boost management', 'Short race timer'],
    winCondition: 'Reach destination in fastest possible time',
    lossCondition: 'Crash too many times or fail time limit',
    scoring: 'Peak velocity, lane switch reaction time, completion time',
    allowedSystems: [
      'UniversalPlayerSystem',
      'HyperspacePhysics',
      'RapidLaneSwitcher',
      'TunnelVisuals',
      'CollisionSystem',
    ],
  },

  RIVAL_DUEL: {
    id: 'RIVAL_DUEL',
    name: '16 — Rival Duel',
    environment: 'Closed competitive arena, neon combat track, spectator platforms, energy barriers',
    objective: 'One-on-one race against rival "Zer0", overtake, defend, drift, boost, collide strategically without unfair advantages, reach finish ahead of rival',
    hazards: ['Arena barriers', 'Moving obstacles', 'Boost traps', 'Energy gates'],
    mechanics: ['Player versus AI collision', 'Rival behavior', 'Defensive driving', 'Position tracking', 'Collision recovery'],
    winCondition: 'Finish ahead of the rival',
    lossCondition: 'Rival finishes first, or player cannot complete route',
    scoring: 'Distance ahead of rival, overtake maneuvers, defensive blocks',
    allowedSystems: [
      'UniversalPlayerSystem',
      'RivalAIController',
      'SlipstreamTracker',
      'CompetitiveCollision',
      'LapManager',
    ],
  },

  RELAY_RACE: {
    id: 'RELAY_RACE',
    name: '17 — Relay Race',
    environment: 'Multiple connected space sectors, relay stations, orbital checkpoints, team communication hubs',
    objective: 'Complete multiple race stages, transfer relay between spacecraft or team members, manage different spacecraft abilities, coordinate team progression',
    hazards: ['Sector-specific hazards', 'Moving barriers', 'Energy storms', 'Enemy traffic'],
    mechanics: ['Relay handoff', 'Team progression', 'Stage timing', 'Player and AI team members', 'Team scoring'],
    winCondition: 'Complete all relay stages within target time',
    lossCondition: 'Too many crashes, failed handoffs, or time expiration',
    scoring: 'Leg split times, smooth vehicle handoff bonus, team overall efficiency',
    allowedSystems: [
      'UniversalPlayerSystem',
      'RelayHandoffManager',
      'MultiVehicleSpecialtyManager',
      'TeamProgressionSystem',
    ],
  },

  SURVIVAL_ELIMINATION: {
    id: 'SURVIVAL_ELIMINATION',
    name: '18 — Survival Elimination',
    environment: 'Closed survival arena, multiple space lanes, hazard generators, expanding danger zone',
    objective: 'Race and survive against multiple opponents, last active racer or qualifying racers continue, eliminate opponents through valid gameplay events, avoid shrinking arena',
    hazards: ['Energy barriers', 'Debris', 'Arena boundaries', 'Moving hazards'],
    mechanics: ['Elimination rounds', 'Survival ranking', 'Respawn rules', 'Damage and collision systems', 'Increasing hazard intensity'],
    winCondition: 'Remain active until round ends or qualify through elimination stages',
    lossCondition: 'Be eliminated or leave valid arena',
    scoring: 'Elimination rounds survived, finishing rank, damage dealt',
    allowedSystems: [
      'UniversalPlayerSystem',
      'EliminationTimerSystem',
      'SurvivalRankTracker',
      'DangerZoneManager',
      'CollisionSystem',
    ],
  },

  COSMIC_TREASURE_HUNT: {
    id: 'COSMIC_TREASURE_HUNT',
    name: '19 — Cosmic Treasure Hunt',
    environment: 'Ancient alien ruins, hidden space temples, floating planets, energy vaults, cosmic relic structures',
    objective: 'Locate and collect hidden treasures, choose between safe and dangerous routes, return collected treasures to extraction zone, discover optional secret areas',
    hazards: ['Guardian drones', 'Trap gates', 'Energy mines', 'Collapsing ruins', 'False routes'],
    mechanics: ['Treasure spawning', 'Inventory capacity', 'Extraction zones', 'Optional objectives', 'Route discovery'],
    winCondition: 'Collect required treasures and successfully extract',
    lossCondition: 'Lose all hull health, fail timer, or lose required cargo',
    scoring: 'Relics recovered, secret chambers opened, radar tracking accuracy',
    allowedSystems: [
      'UniversalPlayerSystem',
      'RelicRadarScanner',
      'AncientRuinsManager',
      'ExtractionManager',
      'CollisionSystem',
    ],
  },

  VOID_CHAMPIONSHIP: {
    id: 'VOID_CHAMPIONSHIP',
    name: '20 — Void Championship',
    environment: 'Professional championship circuit with multiple connected environments (Stage 1 Neon Circuit -> Stage 2 Asteroid Run -> Stage 3 Solar Storm -> Stage 4 Collapsing Track -> Stage 5 Rival Duel -> Stage 6 Hyperspace Sprint)',
    objective: 'Multi-stage championship, points awarded according to finishing position, different spacecraft and driving strategies, persistent damage and standings, final ceremony',
    hazards: ['Sector-specific hazards according to stage'],
    mechanics: ['Stage progression', 'Championship points', 'Leaderboard', 'AI rival standings', 'Results summary', 'Final championship ceremony', 'Save and resume progress'],
    winCondition: 'Complete all championship stages and earn the required championship points',
    lossCondition: 'Fail to qualify in required stages or lose championship',
    scoring: 'Championship points (25, 18, 15, 12, 10, 8), cumulative time, stunt and damage bonuses',
    allowedSystems: [
      'UniversalPlayerSystem',
      'TournamentOrchestrator',
      'StageProgressionManager',
      'PointsLeaderboardSystem',
      'CeremonyManager',
    ],
  },

  // Aliases
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard Grand Prix',
    environment: 'Standard Cosmic Circuit',
    objective: 'Complete race laps in 1st place',
    hazards: ['Track borders', 'AI collisions'],
    mechanics: ['Laps', 'Speed', 'Boost'],
    winCondition: 'Finish 1st',
    lossCondition: 'Finish last or time out',
    scoring: 'Finishing rank and time',
    allowedSystems: ['UniversalPlayerSystem', 'LapManager', 'CollisionSystem'],
  },
  GRAND_PRIX: {
    id: 'GRAND_PRIX',
    name: 'Grand Prix',
    environment: 'Grand Prix Circuit',
    objective: 'Complete 3 laps and take victory',
    hazards: ['Traffic', 'AI competitors'],
    mechanics: ['Laps', 'Drift', 'Boost'],
    winCondition: 'Finish 1st',
    lossCondition: 'Finish below 3rd',
    scoring: 'Championship points',
    allowedSystems: ['UniversalPlayerSystem', 'LapManager', 'CollisionSystem'],
  },
  TIME_TRIAL: {
    id: 'TIME_TRIAL',
    name: 'Time Trial',
    environment: 'Solo Quantum Track',
    objective: 'Set fastest single-lap split',
    hazards: ['Time limit'],
    mechanics: ['Lap timing', 'Precision line'],
    winCondition: 'Beat target time',
    lossCondition: 'Exceed time limit',
    scoring: 'Fastest lap time',
    allowedSystems: ['UniversalPlayerSystem', 'SectorTimer'],
  },
  SURVIVAL: {
    id: 'SURVIVAL',
    name: 'Survival',
    environment: 'Hazard Sector',
    objective: 'Survive continuously spawning hazards',
    hazards: ['Mines', 'Debris'],
    mechanics: ['Hull management', 'Survival clock'],
    winCondition: 'Survive round',
    lossCondition: 'Hull reaches zero',
    scoring: 'Seconds survived',
    allowedSystems: ['UniversalPlayerSystem', 'DamageTracker'],
  },
  ELIMINATION: {
    id: 'ELIMINATION',
    name: 'Elimination',
    environment: 'Arena Circuit',
    objective: 'Outlast competitors as slowest is eliminated',
    hazards: ['Elimination cannon'],
    mechanics: ['Knockout clock'],
    winCondition: 'Last racer alive',
    lossCondition: 'Eliminated in last place',
    scoring: 'Rounds survived',
    allowedSystems: ['UniversalPlayerSystem', 'EliminationTimerSystem'],
  },
  ELIMINATOR: {
    id: 'ELIMINATOR',
    name: 'Eliminator',
    environment: 'Arena Circuit',
    objective: 'Stay out of last place',
    hazards: ['Elimination cannon'],
    mechanics: ['Knockout clock'],
    winCondition: 'Last racer alive',
    lossCondition: 'Eliminated in last place',
    scoring: 'Rounds survived',
    allowedSystems: ['UniversalPlayerSystem', 'EliminationTimerSystem'],
  },
  ENDURANCE: {
    id: 'ENDURANCE',
    name: 'Endurance',
    environment: 'Extended Circuit',
    objective: 'Complete extended lap series',
    hazards: ['Fatigue', 'Wear'],
    mechanics: ['Long-duration laps'],
    winCondition: 'Finish all endurance laps',
    lossCondition: 'Fail time limit',
    scoring: 'Consistency',
    allowedSystems: ['UniversalPlayerSystem', 'LapManager'],
  },
  DUEL: {
    id: 'DUEL',
    name: '1v1 Duel',
    environment: 'Combat Arena',
    objective: 'Defeat opponent head-to-head',
    hazards: ['Rival ship'],
    mechanics: ['Position duel'],
    winCondition: 'Finish ahead of rival',
    lossCondition: 'Rival finishes ahead',
    scoring: 'Margin of victory',
    allowedSystems: ['UniversalPlayerSystem', 'RivalAIController'],
  },
  CHALLENGE: {
    id: 'CHALLENGE',
    name: 'Challenge Protocol',
    environment: 'Special Trial Arena',
    objective: 'Complete special mission constraints',
    hazards: ['Trial constraints'],
    mechanics: ['Mission tracking'],
    winCondition: 'Satisfy all constraints',
    lossCondition: 'Violate constraint',
    scoring: 'Precision score',
    allowedSystems: ['UniversalPlayerSystem'],
  },
  FREE_RIDE: {
    id: 'FREE_RIDE',
    name: 'Free Ride',
    environment: 'Open Space Waypoint',
    objective: 'Explore track freely without time pressure',
    hazards: [],
    mechanics: ['Free flight', 'Practice'],
    winCondition: 'Endless practice',
    lossCondition: 'None',
    scoring: 'Total distance',
    allowedSystems: ['UniversalPlayerSystem'],
  },
};

/**
 * Mode-Specific Validator
 * Ensures only authorized mechanics, hazards, and systems operate in each mode.
 * Strictly enforces that black-hole systems are ONLY permitted in Mode 01 (SINGULARITY_RUN).
 */
export class ModeValidator {
  public static isBlackHoleAllowed(mode: GameMode): boolean {
    return mode === 'SINGULARITY_RUN';
  }

  public static isSystemAllowed(mode: GameMode, systemName: string): boolean {
    const config = GAME_MODE_CONFIGS[mode];
    if (!config) return true;
    // Black hole systems are exclusively restricted to SINGULARITY_RUN
    if (systemName.toLowerCase().includes('blackhole') || systemName.toLowerCase().includes('singularity')) {
      return mode === 'SINGULARITY_RUN';
    }
    return config.allowedSystems.includes(systemName);
  }

  public static validateCheckpointProgression(
    currentGateIndex: number,
    totalGates: number,
    previousGateIndex: number
  ): boolean {
    // Prevent skipping gates: gate must be next in sequence or wrap from end to 0
    if (currentGateIndex === 0 && previousGateIndex === totalGates - 1) {
      return true; // Valid lap wrap
    }
    return currentGateIndex === previousGateIndex + 1;
  }

  public static isSafeRespawnLocation(splineT: number, hazardZones: { minT: number; maxT: number }[]): boolean {
    for (const zone of hazardZones) {
      if (splineT >= zone.minT && splineT <= zone.maxT) {
        return false;
      }
    }
    return true;
  }
}
