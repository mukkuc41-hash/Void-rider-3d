import * as THREE from 'three';
import { DynamicTrackEvent, TrackId, PowerUpType } from '../types';

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
    lengthKm: '4.8 KM',
    themeColor: '#00f0ff',
    dynamicEventsSummary: [
      'Zero-G Slipstream across Orbital Planetary Rings',
      'Quantum Wormhole Shortcut bypasses S-Bend canyon',
      'Gravitational Field Shifts altering drift and handling',
    ],
  },
  {
    id: 'asteroid_run',
    name: 'Asteroid Run',
    subtitle: 'Dense Hazard Belt & Ore Mines',
    difficulty: 'EXPERT',
    lengthKm: '5.1 KM',
    themeColor: '#ff9900',
    dynamicEventsSummary: [
      'Dense tumbling Asteroid Swarm across Sector 2',
      'High-velocity debris fragments traversing mining canyon',
      'Emergency Shield Overdrive pick-ups before the gauntlet',
    ],
  },
  {
    id: 'void_rift',
    name: 'Void Rift',
    subtitle: 'Dimensional Abyss & Singularity',
    difficulty: 'EXPERT',
    lengthKm: '5.4 KM',
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
    lengthKm: '5.0 KM',
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
    lengthKm: '4.5 KM',
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
    lengthKm: '4.8 KM',
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
    lengthKm: '5.4 KM',
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
    description: 'Zero-G slipstream across planetary rings with high-speed banked apex turns.',
    length: 4800,
    laps: 3,
    themeColor: '#00f0ff',
  },
  circuit_alpha: {
    id: 'circuit_alpha',
    name: 'Circuit Alpha',
    subtitle: 'Void Valley & Ion Chasm',
    description: 'Championship proving ground with dynamic asteroid squalls and warp shortcuts.',
    length: 4800,
    laps: 3,
    themeColor: '#00f0ff',
  },
  asteroid_run: {
    id: 'asteroid_run',
    name: 'Asteroid Run',
    subtitle: 'Dense Hazard Belt & Ore Mines',
    description: 'Dangerous orbital minefield featuring tumbling boulders, kinetic hazards, and tight tunnels.',
    length: 5100,
    laps: 3,
    themeColor: '#ff9900',
  },
  void_rift: {
    id: 'void_rift',
    name: 'Void Rift',
    subtitle: 'Dimensional Abyss & Singularity',
    description: 'Extreme anti-gravity corkscrew through dark matter anomalies and sub-space wormholes.',
    length: 5400,
    laps: 2,
    themeColor: '#d000ff',
  },
  nebula_rift: {
    id: 'nebula_rift',
    name: 'Nebula Rift',
    subtitle: 'Orbital Megastructure & Abyss',
    description: 'Deep space crystalline corridor with gravity shifts and inverted track segments.',
    length: 5400,
    laps: 2,
    themeColor: '#d000ff',
  },
  cosmic_ring: {
    id: 'cosmic_ring',
    name: 'Cosmic Ring',
    subtitle: 'Pulsar Megastructure & Solar Arcs',
    description: 'Gigantic orbital accelerator ring engineered for continuous supersonic velocities.',
    length: 5000,
    laps: 3,
    themeColor: '#00ffcc',
  },
  quantum_highway: {
    id: 'quantum_highway',
    name: 'Quantum Highway',
    subtitle: 'Hyper-Tunnel & Energy Laser Barriers',
    description: 'High-frequency speed tunnels with pulsating energy gates and multi-lane split routes.',
    length: 4500,
    laps: 3,
    themeColor: '#ff0055',
  },
};

// Track 1 & Circuit Alpha: Neon Orbit Control Points
const NEON_ORBIT_POINTS: [number, number, number][] = [
  [0, 0, 0],            // Start / Finish Line
  [0, 15, -280],        // First gentle hill
  [-140, 45, -580],     // Sweeping left turn, climbing
  [-360, 75, -820],     // High elevation curve above planet rings
  [-550, 50, -650],     // Banked descent
  [-650, -15, -380],    // Deep dive into canyon valley
  [-500, -45, -80],     // Low sweeping curve
  [-280, -5, 180],      // Climbing back up
  [-60, 45, 400],       // Orbital crest
  [220, 85, 540],       // High apex loop overlooking the gas giant
  [480, 65, 380],       // Banked right downward turn
  [640, 15, 120],       // Fast straightaway canyon
  [580, -25, -220],     // Underpass tunnel entry
  [420, -55, -540],     // Warp tunnel depth
  [260, -25, -740],     // Tunnel exit, sharp climb
  [130, 20, -480],      // High speed S-bend
  [45, 8, -160],        // Approach to finish straight
];

// Track 2: Asteroid Run Control Points
const ASTEROID_RUN_POINTS: [number, number, number][] = [
  [0, 0, 0],            // Starting Grid in dense rock belt
  [30, -20, -260],      // Diving into mining canyon
  [180, -40, -520],     // Sharp right banking around giant asteroid
  [320, 10, -780],      // Climbing out of hazard trench
  [260, 65, -1040],     // High crest between two floating boulders
  [70, 40, -1250],      // Slalom chicane through debris field
  [-150, -10, -1180],   // Rapid plunge into ore processor tunnel
  [-380, -50, -920],    // Low cavern bend with tight clearances
  [-520, -10, -640],    // Evasion sector with tumbling asteroids
  [-440, 45, -340],     // Climbing hairpin turn
  [-260, 80, -80],      // High ridge straightaway
  [-70, 95, 240],       // Apex panoramic jump
  [140, 60, 460],       // High speed descent
  [280, 20, 320],       // Sweeping curve past mining station
  [180, -10, 110],      // Final chicane
];

// Track 3 & Nebula Rift: Void Rift Control Points
const VOID_RIFT_POINTS: [number, number, number][] = [
  [0, 15, 0],             // Starting Grid above Nebula
  [40, 35, -280],         // Ascending launch ramp
  [160, 75, -580],        // Mega loop entry
  [280, 130, -820],       // Stratospheric apex
  [200, 90, -1080],       // Diving into Neon Megastructure
  [0, 20, -1220],         // Central spire fly-through
  [-240, -45, -1080],     // Inverted Under-deck corkscrew
  [-420, -80, -820],      // Zero-G Abyss sector
  [-520, -30, -480],      // Ion Storm corridor
  [-420, 30, -180],       // Climbing hairpin
  [-280, 70, 120],        // Upper deck overpass
  [-100, 85, 420],        // High banked panoramic bend
  [120, 55, 540],         // Descent towards nebula falls
  [300, 10, 380],         // Quantum bridge entry
  [240, -20, 140],        // Sweeping S-curves
  [100, 5, 40],           // Final chicane to line
];

// Track 4: Cosmic Ring Control Points
const COSMIC_RING_POINTS: [number, number, number][] = [
  [0, 0, 0],            // Solar station start
  [120, 20, -320],      // Inner ring curve
  [340, 50, -600],      // Sweeping high-speed solar arc
  [580, 80, -780],      // Megastructure perimeter banked loop
  [740, 90, -500],      // Outer rim straightaway
  [760, 60, -180],      // Orbital accelerator entry
  [620, 20, 160],       // Solar flare fly-through
  [380, -15, 420],      // Banked descent into interior conduit
  [110, -35, 520],      // Grav-well lower deck
  [-180, -20, 440],     // Sharp left chicane
  [-420, 15, 220],      // Ascending outer ring arch
  [-580, 55, -80],      // High elevation hairpin
  [-540, 75, -420],     // Upper observation gallery
  [-360, 60, -680],     // Diving back to inner track
  [-140, 25, -400],     // Approach to starting line
];

// Track 5: Quantum Highway Control Points
const QUANTUM_HIGHWAY_POINTS: [number, number, number][] = [
  [0, 0, 0],            // Highway grid launch pad
  [0, 5, -340],         // Hyper-speed straight tunnel
  [-80, 25, -680],      // Quick flick left with energy barrier
  [110, 45, -1020],     // Counter-flick right past laser pylon
  [260, 60, -1350],     // Long sustained banked curve
  [200, 30, -1680],     // Hyper-boost gate entrance
  [-40, 10, -1820],     // Under-city tunnel portal
  [-280, -20, -1620],   // Rapid dive with double barriers
  [-450, -35, -1250],   // Deep warp chasm
  [-410, 15, -860],     // Climbing accelerator straight
  [-220, 55, -520],     // S-bend chicane with alternating lanes
  [-60, 40, -220],      // Final sprint corridor
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

    this.generatePrecomputedSamples(420);
    this.generateCheckpoints(12);
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
    let boostTs = [0.08, 0.22, 0.38, 0.54, 0.71, 0.88];
    if (this.id === 'quantum_highway') {
      boostTs = [0.05, 0.18, 0.32, 0.48, 0.62, 0.76, 0.90];
    } else if (this.id === 'asteroid_run') {
      boostTs = [0.10, 0.25, 0.45, 0.65, 0.85];
    } else if (this.id === 'cosmic_ring') {
      boostTs = [0.07, 0.21, 0.36, 0.50, 0.64, 0.78, 0.92];
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
    let obstacleCount = 12;
    let swarmCount = 8;
    if (this.id === 'asteroid_run') {
      obstacleCount = 24; // dense asteroid field
      swarmCount = 16;
    } else if (this.id === 'quantum_highway') {
      obstacleCount = 8;
      swarmCount = 4;
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
    const barrierTs = this.id === 'quantum_highway'
      ? [0.15, 0.30, 0.45, 0.60, 0.75, 0.88]
      : this.id === 'cosmic_ring'
      ? [0.25, 0.55, 0.82]
      : [0.33, 0.72];

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
    const totalCredits = 72;
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
