import * as THREE from 'three';
import { DynamicTrackEvent, TrackId, PowerUpType } from '../types';
import { TrackGraph, TrackManager, TrackGenerator } from './trackGraph';

export interface SamplePoint {
  t: number;
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
}

export interface CheckpointGate {
  id: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  width: number;
  t: number;
}

export interface BoostPad {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  t: number;
}

export interface CollectibleCredit {
  id: number;
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  t: number;
  laneOffset: number;
  collected: boolean;
  value: number;
  rotation?: number;
}

export interface PowerUpPod {
  id: number;
  type: PowerUpType;
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  t: number;
  laneOffset: number;
  collected: boolean;
  respawnTimer: number;
}

export interface Obstacle {
  id: number;
  position: THREE.Vector3;
  radius: number;
  rotationSpeed: THREE.Vector3;
  isDynamicSwarm?: boolean;
  basePosition?: THREE.Vector3;
  driftVelocity?: THREE.Vector3;
  currentRotation?: THREE.Vector3;
  // Asteroid health and destruction system
  type: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ARMORED' | 'ENERGY';
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  crackLevel: number; // 0 to 1
  respawnTimer: number;
  hitFlashTimer?: number;
}

export interface EnergyBarrier {
  id: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  binormal: THREE.Vector3;
  normal: THREE.Vector3;
  t: number;
  width: number;
  gapLane: 'left' | 'center' | 'right'; // Which lane has the safe passage opening
  flickerPhase: number;
  active?: boolean;
}

export interface TrackMeta {
  id: TrackId;
  name: string;
  subtitle: string;
  difficulty: 'STANDARD' | 'EXPERT';
  lengthKm: string;
  themeColor: string;
  dynamicEventsSummary: string[];
}

export const TRACKS_CATALOG: TrackMeta[] = [
  {
    id: 'neon_orbit',
    name: 'Neon Orbit',
    subtitle: 'Ringed Gas Giant & Orbital Spire',
    difficulty: 'STANDARD',
    lengthKm: '9.8 KM',
    themeColor: '#00f0ff',
    dynamicEventsSummary: [
      'Multi-level transit skyways across Orbital Planetary Rings',
      'Quantum Wormhole Shortcut bypasses S-Bend canyon',
      'Triple-junction route splits with subterranean high-speed tubes',
    ],
  },
  {
    id: 'asteroid_run',
    name: 'Asteroid Run',
    subtitle: 'Dense Hazard Belt & Ore Mines',
    difficulty: 'EXPERT',
    lengthKm: '11.2 KM',
    themeColor: '#ff9900',
    dynamicEventsSummary: [
      'Dense tumbling Asteroid Swarm across Deep Sector 2',
      'High-velocity debris fragments traversing mining canyon',
      'Emergency Shield Overdrive pick-ups before the gauntlet',
    ],
  },
  {
    id: 'void_rift',
    name: 'Void Rift',
    subtitle: 'Dimensional Abyss & Singularity',
    difficulty: 'EXPERT',
    lengthKm: '11.8 KM',
    themeColor: '#d000ff',
    dynamicEventsSummary: [
      'Crystalline Asteroid Barrage in Under-Deck Corridor',
      'Swirling Subspace Wormholes with gravitational warp',
      'Dimensional Inversion Flux reversing lateral controls',
    ],
  },
  {
    id: 'cosmic_ring',
    name: 'Cosmic Ring',
    subtitle: 'Pulsar Megastructure & Solar Arcs',
    difficulty: 'STANDARD',
    lengthKm: '12.2 KM',
    themeColor: '#00ffcc',
    dynamicEventsSummary: [
      'Supercharged Solar Accelerator Rings granting ultra-boost',
      'High-G Banked Megastructure curves testing drift limits',
      'Plasma Flux gates with dynamic energy charges',
    ],
  },
  {
    id: 'quantum_highway',
    name: 'Quantum Highway',
    subtitle: 'Hyper-Tunnel & Energy Laser Barriers',
    difficulty: 'EXPERT',
    lengthKm: '13.5 KM',
    themeColor: '#ff0055',
    dynamicEventsSummary: [
      'Pulsating Energy Laser Barriers crossing race lanes',
      'High-Frequency Hyper-Boost corridors',
      'Quantum Speed Gates with instantaneous slipstreams',
    ],
  },
  // Aliases for backward compatibility
  {
    id: 'circuit_alpha',
    name: 'Circuit Alpha (Neon Orbit)',
    subtitle: 'Void Valley & Ion Chasm',
    difficulty: 'STANDARD',
    lengthKm: '9.8 KM',
    themeColor: '#00f0ff',
    dynamicEventsSummary: [
      'Periodic Asteroid Storm in Sector 3',
      'Grav-Flux Anomaly: Zero-G Slipstream',
      'Quantum Wormhole Shortcut across S-Bend',
    ],
  },
  {
    id: 'nebula_rift',
    name: 'Nebula Rift (Void Rift)',
    subtitle: 'Orbital Megastructure & Abyss',
    difficulty: 'EXPERT',
    lengthKm: '11.8 KM',
    themeColor: '#d000ff',
    dynamicEventsSummary: [
      'Crystalline Asteroid Barrage in Under-Deck Corridor',
      'Gravitational Field Shifts altering drift',
      'Dimensional Rift Bridge skipping high-G corkscrew',
    ],
  },
];

export const TRACKS = TRACKS_CATALOG;

export interface TrackConfig {
  id: TrackId;
  name: string;
  subtitle: string;
  description: string;
  length: number;
  laps: number;
  themeColor: string;
}

export const TRACK_CONFIGS: Record<TrackId, TrackConfig> = {
  neon_orbit: {
    id: 'neon_orbit',
    name: 'Neon Orbit',
    subtitle: 'Ringed Gas Giant & Orbital Spire',
    description: 'Extended zero-G slipstream across planetary rings with high-speed banked apex turns and triple route forks.',
    length: 9800,
    laps: 3,
    themeColor: '#00f0ff',
  },
  circuit_alpha: {
    id: 'circuit_alpha',
    name: 'Circuit Alpha',
    subtitle: 'Void Valley & Ion Chasm',
    description: 'Championship proving ground with dynamic asteroid squalls and warp shortcuts.',
    length: 9800,
    laps: 3,
    themeColor: '#00f0ff',
  },
  asteroid_run: {
    id: 'asteroid_run',
    name: 'Asteroid Run',
    subtitle: 'Dense Hazard Belt & Ore Mines',
    description: 'Extended dangerous orbital minefield featuring tumbling boulders, kinetic hazards, and underground lava tubes.',
    length: 11200,
    laps: 3,
    themeColor: '#ff9900',
  },
  void_rift: {
    id: 'void_rift',
    name: 'Void Rift',
    subtitle: 'Dimensional Abyss & Singularity',
    description: 'Extended extreme anti-gravity corkscrew through dark matter anomalies and sub-space wormholes.',
    length: 11800,
    laps: 2,
    themeColor: '#d000ff',
  },
  nebula_rift: {
    id: 'nebula_rift',
    name: 'Nebula Rift',
    subtitle: 'Orbital Megastructure & Abyss',
    description: 'Extended deep space crystalline corridor with gravity shifts and inverted track segments.',
    length: 11800,
    laps: 2,
    themeColor: '#d000ff',
  },
  cosmic_ring: {
    id: 'cosmic_ring',
    name: 'Cosmic Ring',
    subtitle: 'Pulsar Megastructure & Solar Arcs',
    description: 'Extended gigantic orbital accelerator ring engineered for continuous supersonic velocities.',
    length: 12200,
    laps: 3,
    themeColor: '#00ffcc',
  },
  quantum_highway: {
    id: 'quantum_highway',
    name: 'Quantum Highway',
    subtitle: 'Hyper-Tunnel & Energy Laser Barriers',
    description: 'Extended high-frequency speed tunnels with pulsating energy gates and multi-lane split routes.',
    length: 13500,
    laps: 3,
    themeColor: '#ff0055',
  },
};

// Track 1 & Circuit Alpha: Extended Neon Orbit Control Points (9.8 KM)
const NEON_ORBIT_POINTS: [number, number, number][] = [
  [0, 0, 0],              // 00 Start / Finish Grid
  [0, 15, -280],          // 01 Gentle launch ascent
  [-80, 35, -580],        // 02 High-speed left drift entry
  [-220, 65, -880],       // 03 Climbing over orbital transit line
  [-440, 95, -1140],      // 04 High panoramic banking above neon city
  [-680, 80, -1260],      // 05 Megastructure apex turn
  [-920, 45, -1150],      // 06 Sweeping descent into outer skyway
  [-1050, 10, -920],      // 07 Outer rim straightaway entry
  [-1120, -25, -620],     // 08 Canyon dive between skyscraper spires
  [-1040, -60, -320],     // 09 Subterranean highway underpass
  [-880, -75, -60],       // 10 Deep canyon curve with glowing neon walls
  [-680, -45, 180],       // 11 Ascending out of underpass
  [-440, -10, 360],       // 12 Mid-circuit connector straight
  [-180, 25, 520],        // 13 Climbing toward upper orbital ring
  [80, 75, 680],          // 14 High orbital crest overlooking gas giant
  [360, 115, 780],        // 15 Stratospheric apex banked curve
  [640, 95, 680],         // 16 High-G descending right sweep
  [860, 60, 460],         // 17 Skybridge bypass straightaway
  [980, 20, 180],         // 18 Technical S-bend entry
  [1020, -15, -120],      // 19 Right-angle apex through laser towers
  [920, -45, -420],       // 20 Underpass tunnel entrance
  [740, -70, -720],       // 21 Warp tunnel depth
  [520, -40, -980],       // 22 Tunnel exit, steep banking climb
  [320, 5, -1180],        // 23 Elevated highway rejoin
  [140, 40, -940],        // 24 High-speed chicane section
  [60, 25, -620],         // 25 Pre-finish straight alignment
  [15, 8, -260],          // 26 Final stadium sprint straight
];

// Track 2: Extended Asteroid Run Control Points (11.2 KM)
const ASTEROID_RUN_POINTS: [number, number, number][] = [
  [0, 0, 0],              // 00 Starting Grid in dense rock belt
  [40, -25, -320],        // 01 Diving into mining canyon trench
  [180, -55, -640],       // 02 Heavy banking around iron megalith
  [380, -20, -960],       // 03 Climbing out of hazard crevice
  [520, 35, -1260],       // 04 High crest between dual rotating boulders
  [480, 80, -1580],       // 05 Apex panoramic pass over ore processing plant
  [280, 55, -1880],       // 06 Slalom chicane through dense debris field
  [40, 15, -2060],        // 07 Plunge into deep ore refinery tunnel
  [-240, -30, -2120],     // 08 Cavern interior sweeping turn
  [-520, -70, -1980],     // 09 Deep underground lava conduit
  [-780, -85, -1680],     // 10 Low cavern bend with tight rocky clearances
  [-960, -45, -1320],     // 11 Evasion sector with tumbling kinetic rocks
  [-1040, 10, -980],      // 12 Ascending mining elevator shaft
  [-980, 65, -640],       // 13 High ridge overlooking molten craters
  [-820, 95, -320],       // 14 Mountain apex panoramic straight
  [-580, 110, -60],       // 15 Upper crater rim banked curve
  [-320, 85, 180],        // 16 Fast descent toward extraction zone
  [-60, 50, 420],         // 17 Overpass above abandoned freighter wreckage
  [180, 20, 580],         // 18 Sweeping curve past automated refining cranes
  [420, -15, 620],        // 19 High-velocity straightaway
  [640, -45, 480],        // 20 Diving right hairpin
  [740, -30, 220],        // 21 Debris field bypass
  [680, 10, -80],         // 22 Re-entering main ore corridor
  [480, 40, -360],        // 23 Slalom evasion zone
  [280, 25, -540],        // 24 Final technical chicane
  [100, 10, -240],        // 25 Final sprint straight to starting grid
];

// Track 3 & Nebula Rift: Extended Void Rift Control Points (11.8 KM)
const VOID_RIFT_POINTS: [number, number, number][] = [
  [0, 15, 0],             // 00 Starting Grid above dark matter abyss
  [60, 45, -340],         // 01 Ascending mega launch ramp
  [220, 95, -680],        // 02 Stratospheric loop entry
  [420, 145, -980],       // 03 High apex overlooking glowing dimensional rift
  [580, 120, -1320],      // 04 Banked dive toward neon megastructure
  [540, 60, -1660],       // 05 Central spire fly-through portal
  [340, 0, -1940],        // 06 Diving beneath megastructure under-deck
  [60, -55, -2080],       // 07 Inverted under-deck corkscrew
  [-260, -95, -1980],     // 08 Zero-G abyss sector
  [-560, -110, -1720],    // 09 Lowest point of singularity gravitational well
  [-820, -75, -1360],     // 10 Ion storm corridor
  [-980, -25, -980],      // 11 Climbing hairpin through purple crystalline clouds
  [-1020, 35, -620],      // 12 Upper deck overpass straightaway
  [-920, 85, -260],       // 13 Skyway overlooking antimatter waterfalls
  [-720, 120, 80],        // 14 High banked panoramic curve
  [-460, 130, 380],       // 15 Quantum bridge approach
  [-180, 105, 580],       // 16 Descent toward dimensional vortex
  [120, 65, 660],         // 17 High-speed S-curves
  [380, 25, 580],         // 18 Megastructure outer ring bypass
  [580, -15, 360],        // 19 Lower transit chute dive
  [640, -45, 80],         // 20 Sub-space wormhole entry
  [540, -30, -240],       // 21 Wormhole exit catapult
  [360, 15, -480],        // 22 Fast chicane through energy pylons
  [160, 20, -320],        // 23 Final straightaway alignment
  [40, 15, -120],         // 24 Stadium finish straight
];

// Track 4: Extended Cosmic Ring Control Points (12.2 KM)
const COSMIC_RING_POINTS: [number, number, number][] = [
  [0, 0, 0],              // 00 Solar Station Grid
  [160, 25, -380],        // 01 Inner ring curve
  [420, 65, -720],        // 02 Sweeping high-speed solar arc
  [740, 105, -960],       // 03 Megastructure perimeter banked loop
  [1040, 120, -980],      // 04 Outer rim supersonic straightaway
  [1280, 95, -760],       // 05 Orbital accelerator entry portal
  [1380, 50, -420],       // 06 Solar flare corridor overpass
  [1320, 0, -80],         // 07 Plasma flux gauntlet dive
  [1120, -45, 260],       // 08 Lower magnetic conduit entrance
  [840, -75, 540],        // 09 Grav-well lower deck interior
  [520, -85, 720],        // 10 Deep heat sink underpass
  [180, -60, 780],        // 11 Cooling station sprint straight
  [-180, -25, 720],       // 12 Sharp left chicane climb
  [-480, 20, 540],        // 13 Ascending outer ring arch
  [-740, 65, 280],        // 14 High elevation hairpin overlooking solar corona
  [-920, 95, -40],        // 15 Upper observation gallery straight
  [-980, 115, -380],      // 16 Apex curve past solar collection sails
  [-880, 100, -720],      // 17 Diving back into accelerator ring
  [-660, 65, -980],       // 18 Secondary magnetic booster straight
  [-420, 25, -1140],      // 19 High-G descending S-bend
  [-180, -10, -1120],     // 20 Underpass crossing beneath main grid
  [60, -35, -960],        // 21 Deep subterranean canyon run
  [240, -20, -720],       // 22 Climbing out toward inner ring
  [280, 10, -440],        // 23 High-speed chicane alignment
  [120, 15, -200],        // 24 Final sprint to solar station
];

// Track 5: Extended Quantum Highway Control Points (13.5 KM)
const QUANTUM_HIGHWAY_POINTS: [number, number, number][] = [
  [0, 0, 0],              // 00 Highway grid launch pad
  [0, 10, -420],          // 01 Hyper-speed straight tunnel
  [-120, 35, -840],       // 02 Quick flick left past laser barrier pylons
  [140, 65, -1260],       // 03 Counter-flick right past quantum charging coil
  [380, 85, -1640],       // 04 Long sustained high-G banked curve
  [540, 60, -2020],       // 05 Hyper-boost gate entrance
  [480, 15, -2380],       // 06 Supersonic transit chute
  [240, -30, -2620],      // 07 Diving into under-city tunnel portal
  [-80, -65, -2680],      // 08 Subterranean speed tube
  [-380, -80, -2520],     // 09 Double energy barrier chicane
  [-680, -60, -2200],     // 10 Deep warp chasm tunnel
  [-920, -20, -1820],     // 11 Climbing accelerator straight
  [-1060, 30, -1420],     // 12 High-speed elevated highway split
  [-1080, 75, -1020],     // 13 Panoramic curve over quantum core
  [-960, 110, -640],      // 14 Upper deck overpass straightaway
  [-740, 125, -280],      // 15 Stratospheric apex banking
  [-460, 110, 60],        // 16 Descent toward quantum gate network
  [-180, 75, 340],        // 17 Hyper-lane straightaway
  [120, 35, 520],         // 18 Energy barrier chicane
  [380, -10, 560],        // 19 Lower deck underpass dive
  [580, -45, 420],        // 20 High-speed tunnel turn
  [680, -60, 160],        // 21 Subterranean sprint straight
  [640, -30, -140],       // 22 Climbing out into open air
  [480, 15, -420],        // 23 Technical S-bend past observation decks
  [280, 25, -640],        // 24 Final chicane alignment
  [120, 10, -320],        // 25 Final sprint straight to grid
];


export class CosmicTrack {
  public id: TrackId;
  public curve: THREE.CatmullRomCurve3;
  public totalLength: number;
  public width: number = 28;
  public checkpoints: CheckpointGate[] = [];
  public boostPads: BoostPad[] = [];
  public obstacles: Obstacle[] = [];
  public energyBarriers: EnergyBarrier[] = [];
  public samples: { t: number; point: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3 }[] = [];

  // Dynamic Events on this track
  public dynamicEvents: DynamicTrackEvent[] = [];
  public credits: CollectibleCredit[] = [];
  public powerUpPods: PowerUpPod[] = [];
  private eventTimer: number = 0;

  // Track Graph Architecture
  public trackGraph: TrackGraph;
  public trackManager: TrackManager;

  constructor(trackId: TrackId = 'neon_orbit') {
    this.id = trackId;

    let rawPoints: [number, number, number][] = NEON_ORBIT_POINTS;
    if (trackId === 'asteroid_run') {
      rawPoints = ASTEROID_RUN_POINTS;
    } else if (trackId === 'void_rift' || trackId === 'nebula_rift') {
      rawPoints = VOID_RIFT_POINTS;
    } else if (trackId === 'cosmic_ring') {
      rawPoints = COSMIC_RING_POINTS;
    } else if (trackId === 'quantum_highway') {
      rawPoints = QUANTUM_HIGHWAY_POINTS;
    } else {
      rawPoints = NEON_ORBIT_POINTS;
    }

    const vectors = rawPoints.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    this.curve = new THREE.CatmullRomCurve3(vectors, true, 'centripetal');
    this.totalLength = this.curve.getLength();

    // Generate explicit graph topology
    this.trackGraph = TrackGenerator.generateTrackGraph(trackId, rawPoints, 'CIRCUIT', 3);
    this.trackManager = new TrackManager(this.trackGraph);

    this.generatePrecomputedSamples(640);
    const cpCount =
      this.id === 'quantum_highway'
        ? 32
        : this.id === 'cosmic_ring'
        ? 30
        : this.id === 'asteroid_run'
        ? 28
        : this.id === 'void_rift' || this.id === 'nebula_rift'
        ? 28
        : 26;
    this.generateCheckpoints(cpCount);
    this.generateBoostPads();
    this.generateObstacles();
    this.generateEnergyBarriers();
    this.generateCredits();
    this.generatePowerUps();
    this.initDynamicEvents();
  }

  private generatePrecomputedSamples(divisions: number) {
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      
      // Dynamic banking normal
      let binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      if (binormal.lengthSq() < 0.01) {
        binormal.set(1, 0, 0);
      }
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      this.samples.push({ t, point, tangent, normal, binormal });
    }
  }

  private generateCheckpoints(count: number) {
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);

      this.checkpoints.push({
        id: i,
        position: point,
        tangent,
        normal,
        width: this.width,
        t,
      });
    }
  }

  private generateBoostPads() {
    let boostTs = [0.05, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52, 0.60, 0.68, 0.76, 0.84, 0.92];
    if (this.id === 'quantum_highway') {
      boostTs = [0.04, 0.11, 0.18, 0.25, 0.32, 0.39, 0.46, 0.53, 0.61, 0.68, 0.75, 0.82, 0.89, 0.95];
    } else if (this.id === 'asteroid_run') {
      boostTs = [0.06, 0.15, 0.24, 0.33, 0.42, 0.51, 0.61, 0.71, 0.80, 0.89];
    } else if (this.id === 'cosmic_ring') {
      boostTs = [0.05, 0.12, 0.20, 0.27, 0.35, 0.43, 0.51, 0.58, 0.66, 0.74, 0.82, 0.90];
    }

    for (const t of boostTs) {
      const pos = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const raisedPos = pos.clone().add(new THREE.Vector3(0, 0.3, 0));

      this.boostPads.push({
        position: raisedPos,
        direction: tangent,
        t,
      });
    }
  }

  private generateObstacles() {
    // Determine obstacle density based on track theme
    let obstacleCount = 28;
    let swarmCount = 14;
    if (this.id === 'asteroid_run') {
      obstacleCount = 48; // dense asteroid field
      swarmCount = 24;
    } else if (this.id === 'quantum_highway') {
      obstacleCount = 18;
      swarmCount = 8;
    }

    let obstacleIdCounter = 0;
    for (let i = 0; i < obstacleCount; i++) {
      const t = (i + 0.3) / obstacleCount;
      const sample = this.getSampleAt(t);
      const offsetSign = i % 2 === 0 ? 1 : -1;
      const offsetDist = this.id === 'asteroid_run' ? 8 + (i % 4) * 3.5 : 12 + (i % 3) * 4;
      const pos = sample.point.clone().add(sample.binormal.clone().multiplyScalar(offsetSign * offsetDist));
      pos.y += (Math.random() - 0.5) * 6;

      const radius = 2.4 + Math.random() * 3.6;
      let astType: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ARMORED' | 'ENERGY' = 'MEDIUM';
      let hp = 80;
      if (i % 7 === 0) {
        astType = 'ENERGY';
        hp = 90;
      } else if (i % 5 === 0) {
        astType = 'ARMORED';
        hp = 220;
      } else if (radius < 3.2) {
        astType = 'SMALL';
        hp = 40;
      } else if (radius > 4.6) {
        astType = 'LARGE';
        hp = 150;
      }

      this.obstacles.push({
        id: obstacleIdCounter++,
        position: pos,
        radius,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        type: astType,
        health: hp,
        maxHealth: hp,
        isDestroyed: false,
        crackLevel: 0,
        respawnTimer: 0,
      });
    }

    // Dynamic Swarm Asteroids that tumble into the track
    const swarmSectorT = this.id === 'asteroid_run' ? 0.35 : 0.55;
    for (let i = 0; i < swarmCount; i++) {
      const t = (swarmSectorT + i * 0.018) % 1.0;
      const sample = this.getSampleAt(t);
      const lateral = (Math.random() - 0.5) * 20;
      const basePos = sample.point.clone().add(sample.binormal.clone().multiplyScalar(lateral));
      basePos.y += 1.5 + (Math.random() - 0.5) * 4;

      const radius = 2.2 + Math.random() * 2.8;
      const astType: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ARMORED' | 'ENERGY' =
        i % 4 === 0 ? 'ENERGY' : radius < 3.0 ? 'SMALL' : 'MEDIUM';
      const hp = astType === 'ENERGY' ? 85 : astType === 'SMALL' ? 40 : 80;

      this.obstacles.push({
        id: obstacleIdCounter++,
        position: basePos.clone(),
        basePosition: basePos,
        radius,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04
        ),
        isDynamicSwarm: true,
        driftVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 6
        ),
        type: astType,
        health: hp,
        maxHealth: hp,
        isDestroyed: false,
        crackLevel: 0,
        respawnTimer: 0,
      });
    }
  }

  private generateEnergyBarriers() {
    this.energyBarriers = [];
    // Energy laser barriers across tracks, especially Quantum Highway & Cosmic Ring
    const barrierTs =
      this.id === 'quantum_highway'
        ? [0.08, 0.18, 0.28, 0.40, 0.52, 0.65, 0.78, 0.88]
        : this.id === 'cosmic_ring'
        ? [0.14, 0.28, 0.45, 0.62, 0.78, 0.90]
        : this.id === 'asteroid_run'
        ? [0.22, 0.48, 0.72]
        : [0.16, 0.36, 0.58, 0.80];

    const lanes: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

    barrierTs.forEach((t, idx) => {
      const sample = this.getSampleAt(t);
      this.energyBarriers.push({
        id: idx,
        position: sample.point.clone().add(sample.normal.clone().multiplyScalar(2)),
        tangent: sample.tangent.clone(),
        binormal: sample.binormal.clone(),
        normal: sample.normal.clone(),
        t,
        width: this.width,
        gapLane: lanes[idx % lanes.length],
        flickerPhase: idx * 1.2,
        active: true,
      });
    });
  }

  private generateCredits() {
    this.credits = [];
    const totalCredits = 128;
    const laneOffsets = [-6, -3, 0, 3, 6];

    for (let i = 0; i < totalCredits; i++) {
      const t = (i / totalCredits + 0.02) % 1.0;
      const sample = this.getSampleAt(t);
      const laneOffset = laneOffsets[i % laneOffsets.length];
      const pos = sample.point
        .clone()
        .add(sample.binormal.clone().multiplyScalar(laneOffset))
        .add(sample.normal.clone().multiplyScalar(1.6));

      this.credits.push({
        id: i,
        position: pos.clone(),
        basePosition: pos.clone(),
        t,
        laneOffset,
        collected: false,
        value: 15,
      });
    }
  }

  private generatePowerUps() {
    this.powerUpPods = [];
    const powerTypes: PowerUpType[] = [
      'NITRO_BOOST',
      'ENERGY_SHIELD',
      'REPAIR_CORE',
      'MAGNET_BOOST',
      'EMP_PULSE',
      'TIME_WARP',
      'GRAVITY_BURST',
      'DECOY_SHIP',
      'TEMPORARY_SPEED_SURGE',
    ];
    const podCount = 18;
    const laneOffsets = [-4.5, 0, 4.5];

    for (let i = 0; i < podCount; i++) {
      const t = ((i + 0.5) / podCount) % 1.0;
      const sample = this.getSampleAt(t);
      const type = powerTypes[i % powerTypes.length];
      const laneOffset = laneOffsets[i % laneOffsets.length];
      const pos = sample.point
        .clone()
        .add(sample.binormal.clone().multiplyScalar(laneOffset))
        .add(sample.normal.clone().multiplyScalar(1.8));

      this.powerUpPods.push({
        id: i,
        type,
        position: pos.clone(),
        basePosition: pos.clone(),
        t,
        laneOffset,
        collected: false,
        respawnTimer: 0,
      });
    }
  }

  private initDynamicEvents() {
    if (this.id === 'asteroid_run') {
      this.dynamicEvents = [
        {
          id: 'asteroid_belt_barrage',
          type: 'ASTEROID_SWARM',
          title: '  CRITICAL ASTEROID STORM',
          description: 'Massive tumbling asteroid cluster traversing Sector 2! Evasive maneuvers required.',
          active: true,
          remainingSec: 25,
          sectorStartT: 0.28,
          sectorEndT: 0.52,
          severity: 'high',
        },
        {
          id: 'asteroid_grav_compress',
          type: 'GRAVITY_SHIFT',
          title: '  GRAV-WELL LOCKDOWN',
          description: 'Mining tractor-beam field active! High downforce cornering grip enabled.',
          active: false,
          remainingSec: 20,
          sectorStartT: 0.65,
          sectorEndT: 0.82,
          severity: 'medium',
          gravityMode: 'HIGH_G',
        },
      ];
    } else if (this.id === 'quantum_highway') {
      this.dynamicEvents = [
        {
          id: 'quantum_laser_surge',
          type: 'INVERSION_ZONE',
          title: '  LASER BARRIER SURGE',
          description: 'High-voltage energy laser grid online! Align with illuminated safe lanes.',
          active: true,
          remainingSec: 22,
          sectorStartT: 0.15,
          sectorEndT: 0.40,
          severity: 'high',
        },
        {
          id: 'quantum_shortcut',
          type: 'TEMPORARY_SHORTCUT',
          title: '  HYPER-CONDUIT OVERDRIVE',
          description: 'Subspace warp conduit open at Gate 6! Enter for instantaneous straightaway transit.',
          active: true,
          remainingSec: 16,
          sectorStartT: 0.55,
          sectorEndT: 0.62,
          severity: 'low',
          shortcutTargetT: 0.78,
        },
      ];
    } else if (this.id === 'cosmic_ring') {
      this.dynamicEvents = [
        {
          id: 'ring_solar_boost',
          type: 'GRAVITY_SHIFT',
          title: '  SOLAR PULSAR SLIPSTREAM',
          description: 'Ultra-low friction coronal slipstream active! Top speeds dramatically increased.',
          active: true,
          remainingSec: 24,
          sectorStartT: 0.20,
          sectorEndT: 0.45,
          severity: 'low',
          gravityMode: 'LOW_G',
        },
        {
          id: 'ring_inversion',
          type: 'INVERSION_ZONE',
          title: '  CENTRIFUGAL INVERSION',
          description: 'Megastructure inversion active across the outer ring arc.',
          active: false,
          remainingSec: 18,
          sectorStartT: 0.70,
          sectorEndT: 0.88,
          severity: 'medium',
        },
      ];
    } else if (this.id === 'void_rift' || this.id === 'nebula_rift') {
      this.dynamicEvents = [
        {
          id: 'rift_shortcut',
          type: 'TEMPORARY_SHORTCUT',
          title: '  HYPER-JUMP WORMHOLE STABILIZED',
          description: 'Dimensional shortcut active in Megastructure Approach! Fly in to bypass the descent.',
          active: true,
          remainingSec: 16,
          sectorStartT: 0.10,
          sectorEndT: 0.15,
          severity: 'low',
          shortcutTargetT: 0.24,
        },
        {
          id: 'rift_gravity_shift',
          type: 'GRAVITY_SHIFT',
          title: '  GRAVITATIONAL SURGE ACTIVE',
          description: 'Heavy gravitational lockdown in Under-Deck sector. Maximum cornering grip engaged!',
          active: false,
          remainingSec: 20,
          sectorStartT: 0.32,
          sectorEndT: 0.49,
          severity: 'medium',
          gravityMode: 'HIGH_G',
        },
        {
          id: 'rift_asteroid_field',
          type: 'ASTEROID_SWARM',
          title: '  ION CRYSTAL ASTEROID STORM',
          description: 'Crystalline debris shower traversing the Abyss! Steer clear of tumbling hazards.',
          active: true,
          remainingSec: 22,
          sectorStartT: 0.67,
          sectorEndT: 0.84,
          severity: 'high',
        },
      ];
    } else {
      // Neon Orbit / Circuit Alpha
      this.dynamicEvents = [
        {
          id: 'alpha_gravity_flux',
          type: 'GRAVITY_SHIFT',
          title: '  GRAVITY FLUX DETECTED',
          description: 'Sector 2 entering Zero-G slipstream across planetary rings. Ultra-low drag!',
          active: true,
          remainingSec: 25,
          sectorStartT: 0.18,
          sectorEndT: 0.35,
          severity: 'medium',
          gravityMode: 'LOW_G',
        },
        {
          id: 'alpha_asteroid_swarm',
          type: 'ASTEROID_SWARM',
          title: '  METEOROID SWARM ALERT',
          description: 'Incoming micro-meteorite cluster traversing Sector 3! Maneuver to evade collisions.',
          active: false,
          remainingSec: 18,
          sectorStartT: 0.46,
          sectorEndT: 0.64,
          severity: 'high',
        },
        {
          id: 'alpha_shortcut',
          type: 'TEMPORARY_SHORTCUT',
          title: '  QUANTUM RIFT SHORTCUT OPEN',
          description: 'Subspace rift stabilized at Gate 8! Enter to warp through the outer hairpin.',
          active: true,
          remainingSec: 15,
          sectorStartT: 0.71,
          sectorEndT: 0.76,
          severity: 'low',
          shortcutTargetT: 0.85,
        },
      ];
    }
  }

  /**
   * Advances dynamic event timers and cycles states
   */
  public updateDynamicEvents(dt: number, totalElapsedSec: number) {
    this.eventTimer += dt;

    // Update power-up pods respawn timers
    for (const pod of this.powerUpPods) {
      if (pod.collected && pod.respawnTimer > 0) {
        pod.respawnTimer -= dt;
        if (pod.respawnTimer <= 0) {
          pod.collected = false;
        }
      }
    }

    for (const ev of this.dynamicEvents) {
      ev.remainingSec -= dt;
      if (ev.remainingSec <= 0) {
        // Toggle active status and reset duration cycle
        ev.active = !ev.active;
        if (ev.type === 'TEMPORARY_SHORTCUT') {
          ev.remainingSec = ev.active ? 15 : 22; // Active for 15s, closed for 22s
        } else if (ev.type === 'ASTEROID_SWARM') {
          ev.remainingSec = ev.active ? 18 : 24; // Swarm lasts 18s, breaks for 24s
        } else if (ev.type === 'GRAVITY_SHIFT') {
          ev.remainingSec = ev.active ? 20 : 25;
        }
      }
    }

    // Animate dynamic swarm asteroids
    for (const obs of this.obstacles) {
      if (obs.isDynamicSwarm && obs.basePosition && obs.driftVelocity) {
        const timeOffset = totalElapsedSec * 1.4;
        obs.position.x = obs.basePosition.x + Math.sin(timeOffset + obs.basePosition.y) * 12;
        obs.position.y = obs.basePosition.y + Math.cos(timeOffset * 0.8) * 4;
        obs.position.z = obs.basePosition.z + Math.cos(timeOffset + obs.basePosition.x) * 12;
      }
    }
  }

  /**
   * Returns active event affecting player at spline progress t
   */
  public getActiveEventAt(t: number): DynamicTrackEvent | null {
    const wrappedT = ((t % 1) + 1) % 1;
    for (const ev of this.dynamicEvents) {
      if (!ev.active) continue;
      if (ev.sectorStartT <= ev.sectorEndT) {
        if (wrappedT >= ev.sectorStartT && wrappedT <= ev.sectorEndT) return ev;
      } else {
        // Wraps around start line
        if (wrappedT >= ev.sectorStartT || wrappedT <= ev.sectorEndT) return ev;
      }
    }
    return null;
  }

  public getSampleAt(t: number): SamplePoint {
    if (!this.samples || this.samples.length === 0) {
      return {
        t: 0,
        point: new THREE.Vector3(0, 0, 0),
        tangent: new THREE.Vector3(0, 0, -1),
        normal: new THREE.Vector3(0, 1, 0),
        binormal: new THREE.Vector3(1, 0, 0),
      };
    }
    const safeT = isNaN(t) || !isFinite(t) ? 0 : t;
    const wrappedT = ((safeT % 1) + 1) % 1;
    const maxIdx = this.samples.length - 1;
    const rawIndex = Math.floor(wrappedT * maxIdx);
    const index = isNaN(rawIndex) ? 0 : Math.max(0, Math.min(maxIdx, rawIndex));
    return this.samples[index] || this.samples[0];
  }

  public findClosestProgress(position: THREE.Vector3): { t: number; distance: number; point: THREE.Vector3; lateralOffset: number } {
    if (!this.samples || this.samples.length === 0) {
      return {
        t: 0,
        distance: 0,
        point: new THREE.Vector3(0, 0, 0),
        lateralOffset: 0,
      };
    }
    const safePos = position && isFinite(position.x) ? position : new THREE.Vector3(0, 0, 0);
    let bestDistSq = Infinity;
    let bestT = 0;
    let bestPoint = this.samples[0].point;
    let bestBinormal = this.samples[0].binormal;
    const step = 4;
    let bestIdx = 0;

    for (let i = 0; i < this.samples.length; i += step) {
      const dSq = safePos.distanceToSquared(this.samples[i].point);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }

    const searchRadius = 6;
    const start = Math.max(0, bestIdx - searchRadius);
    const end = Math.min(this.samples.length - 1, bestIdx + searchRadius);

    for (let i = start; i <= end; i++) {
      const dSq = safePos.distanceToSquared(this.samples[i].point);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestT = this.samples[i].t;
        bestPoint = this.samples[i].point;
        bestBinormal = this.samples[i].binormal;
      }
    }

    const toPos = new THREE.Vector3().subVectors(safePos, bestPoint);
    const lateralOffset = toPos.dot(bestBinormal);

    return {
      t: bestT,
      distance: Math.sqrt(isFinite(bestDistSq) ? bestDistSq : 0),
      point: bestPoint,
      lateralOffset: isFinite(lateralOffset) ? lateralOffset : 0,
    };
  }
}

export const defaultTrack = new CosmicTrack('circuit_alpha');
export const nebulaTrack = new CosmicTrack('nebula_rift');
