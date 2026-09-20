import * as THREE from 'three';
import { CosmicTrack, defaultTrack, EnergyBarrier } from './trackData';
import {
  createShipMesh,
  getShipConfig,
  getEffectiveShipStats,
  THRUSTER_FLAME_CONFIGS,
  COCKPIT_SKIN_CONFIGS,
} from './ships';
import { sound } from './audio';
import { networkClient } from '../network/client';
import {
  ActivePowerUp,
  DynamicTrackEvent,
  PlayerInfo,
  PlayerInput,
  PlayerRaceState,
  PowerUpType,
  RunStats,
  ShipDecalType,
  ShipUpgrades,
  ThrusterFlameColor,
  CockpitSkin,
  TrackId,
  AIDifficulty,
  AIPersonality,
  CameraMode,
  GraphicsQuality,
  AIRaceConfig,
  ShipDamageZones,
  DamageMode,
  BeamCustomization,
  BeamUpgrades,
  BeamTelemetry,
} from '../types';
import { BeamSystem, DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from './beamSystem';
import { Obstacle, SamplePoint } from './trackData';
import {
  JunctionManager,
  ActiveJunctionTelemetry,
  BranchRouteConfig,
  BranchRouteDirection,
  PlayerRouteProgress,
} from './junctionSystem';
import {
  PlayerCollisionSystem,
  PLAYER_COLLISION_CONFIG,
  PlayerCollisionConfig,
  CollisionParticipant,
  CollisionEventFeedback,
} from './collisionSystem';

export interface LocalAIRacer {
  id: string;
  name: string;
  shipId: string;
  color: string;
  secondaryColor: string;
  group: THREE.Group;
  nameplateSprite: THREE.Sprite;
  thrusters: THREE.Mesh[];
  progressDistance: number;
  currentLap: number;
  t: number;
  speed: number;
  targetSpeed: number;
  currentLateral: number;
  targetLateral: number;
  lateralSpeed: number;
  isBoosting: boolean;
  boostCooldown: number;
  boostDuration: number;
  difficulty: AIDifficulty;
  personality: AIPersonality;
  rank: number;
  isDestroyed?: boolean;
  respawnTimer?: number;
  activeRouteId?: string | null;
  activeJunctionId?: string | null;
  branchProgress?: number;
  shield?: number;
  hull?: number;
  mass?: number;
  radius?: number;
  collisionCooldown?: number;
  recoveryTimer?: number;
  angularVelocity?: number;
  angularDisplacement?: number;
  invulnerableTimer?: number;
}

export interface GameEngineCallbacks {
  onSpeedUpdate: (speedKmH: number) => void;
  onBoostUpdate: (boostPercent: number) => void;
  onLapUpdate: (currentLap: number, totalLaps: number) => void;
  onCheckpointUpdate: (current: number, total: number) => void;
  onRankUpdate: (rank: number, totalPlayers: number) => void;
  onRaceFinish: (finalTime: number) => void;
  onTrackEventUpdate?: (event: DynamicTrackEvent | null) => void;
  onHazardHit?: (hazardName: string) => void;
  onShortcutUsed?: (shortcutName: string) => void;
  onPowerUpCollected?: (type: PowerUpType) => void;
  onPowerUpsUpdate?: (powerups: ActivePowerUp[]) => void;
  onCreditCollected?: (totalSessionCredits: number, added: number) => void;
  onHullUpdate?: (hullPercent: number) => void;
  onDistanceUpdate?: (distanceMeters: number) => void;
  onMilestoneReached?: (milestone: string) => void;
  onGameOver?: (stats: RunStats) => void;
  onWrongWayUpdate?: (isWrongWay: boolean) => void;
  onShipDestroyed?: (reason: string, respawnSec: number) => void;
  onShipRespawned?: () => void;
  onLapTimesUpdate?: (currentLapMs: number, bestLapMs: number) => void;
  onCameraModeChange?: (mode: CameraMode) => void;
  onDamageZonesUpdate?: (zones: ShipDamageZones) => void;
  onSpectatorTargetChange?: (pilotName: string) => void;
  onBeamTelemetry?: (telemetry: BeamTelemetry) => void;
  onAsteroidDestroyed?: (obstacle: Obstacle, points: number, credits: number) => void;
  onJunctionTelemetry?: (telemetry: ActiveJunctionTelemetry | null) => void;
  onRouteSelected?: (routeName: string, direction: BranchRouteDirection) => void;
  onCollisionFeedback?: (feedback: CollisionEventFeedback) => void;
  onEngineReady?: () => void;
}

// Preallocated math objects for zero-allocation GC-free render loop
const _shipRotMatrix = new THREE.Matrix4();
const _shipNegTangent = new THREE.Vector3();
const _shipPos = new THREE.Vector3();
const _shipOffsetBinormal = new THREE.Vector3();
const _shipOffsetNormal = new THREE.Vector3();
const _botRotMatrix = new THREE.Matrix4();
const _botNegTangent = new THREE.Vector3();
const _botPos = new THREE.Vector3();
const _botOffsetBinormal = new THREE.Vector3();
const _botOffsetNormal = new THREE.Vector3();

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number = 0;
  private isContextLost: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  // Dedicated Player-to-Player & AI Spacecraft Collision System
  public collisionSystem: PlayerCollisionSystem;
  private collisionFovPunch: number = 0;
  private playerCollisionAngularVelocity: number = 0;
  private playerCollisionAngularDisplacement: number = 0;
  private playerCollisionRecoveryTimer: number = 0;

  // Branching Path & Junction Switching System
  public junctionManager: JunctionManager;

  // Asteroid Destruction Beam System
  public beamSystem: BeamSystem;
  public localBeamCustomization: BeamCustomization = { ...DEFAULT_BEAM_CUSTOMIZATION };
  public localBeamUpgrades: BeamUpgrades = { ...DEFAULT_BEAM_UPGRADES };

  public trackId: TrackId = 'circuit_alpha';
  public track: CosmicTrack = new CosmicTrack('circuit_alpha');

  // Visual Assets
  private trackMeshGroup: THREE.Group = new THREE.Group();
  private checkpointMeshes: THREE.Group[] = [];
  private boostPadMeshes: THREE.Mesh[] = [];

  // Instanced Obstacle Pooling
  private asteroidInstancedMesh: THREE.InstancedMesh | null = null;
  private asteroidPoolSize: number = 64;
  private dummyObj: THREE.Object3D = new THREE.Object3D();

  private shortcutPortalGroup: THREE.Group | null = null;
  private starParticles: THREE.Points | null = null;
  private speedParticles: THREE.Points | null = null;

  // Celestial Deep-Space Environment
  private giantPlanetMesh: THREE.Mesh | null = null;
  private planetRingsMesh: THREE.Mesh | null = null;
  private wormholeAccretionGroup: THREE.Group | null = null;
  private spaceStationGroup: THREE.Group | null = null;
  private energyBarrierMeshes: THREE.Group[] = [];

  // Local AI Competitor Grid
  public localAIRacers: LocalAIRacer[] = [];
  public isAIRaceActive: boolean = false;
  public aiDifficulty: AIDifficulty = 'ACE';

  // Collectibles & Power-Ups
  private creditsInstancedMesh: THREE.InstancedMesh | null = null;
  private creditsDummy: THREE.Object3D = new THREE.Object3D();
  private powerUpPodGroups: THREE.Group[] = [];
  private shieldMeshGroup: THREE.Group | null = null;

  // Dual Thruster Particle Trails
  private thrusterTrailsPoints: THREE.Points | null = null;
  private thrusterParticles: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private thrusterPositionsArray: Float32Array | null = null;
  private thrusterColorsArray: Float32Array | null = null;

  // Collision Shatter / Explosion Sparks
  private collisionSparksPoints: THREE.Points | null = null;
  private collisionSparks: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; color: THREE.Color }[] = [];
  private sparkPositionsArray: Float32Array | null = null;
  private sparkColorsArray: Float32Array | null = null;

  // Local Player Customization & Upgrades
  public localShipId: string = 'apex_phantom';
  public localColor: string = '#00f0ff';
  public localSecondaryColor: string = '#ff00e5';
  public localDecal: ShipDecalType = 'none';
  public localThrusterColor: ThrusterFlameColor = 'neon_cyan';
  public localCockpitSkin: CockpitSkin = 'cyber_stealth';
  public localUpgrades: ShipUpgrades = {
    engine: 0,
    handling: 0,
    boost: 0,
    chassis: 0,
    shieldDuration: 0,
    magnetRange: 0,
    hyperBoostSpeed: 0,
  };
  private playerShipGroup: THREE.Group | null = null;
  private playerThrusters: THREE.Mesh[] = [];

  // Local Physics & Movement
  public input: PlayerInput = { throttle: 0, steer: 0, boost: false, drift: false, recover: false };
  private splineT: number = 0;
  private lateralOffset: number = 0;
  private currentSpeed: number = 0;
  private boostEnergy: number = 100;
  private isBoosting: boolean = false;
  private isDrifting: boolean = false;
  private shipRoll: number = 0;
  private cameraRoll: number = 0;

  private currentLap: number = 1;
  private totalLaps: number = 2;
  private nextCheckpointIdx: number = 0;
  private hasFinished: boolean = false;
  private raceStartTime: number = 0;
  private totalDistanceTraveled: number = 0;
  public isRacing: boolean = false;
  public isPaused: boolean = false;
  private totalTimeElapsed: number = 0;

  // Destruction & Respawn System
  public isDestroyed: boolean = false;
  private respawnTimer: number = 0;
  private invulnerableTimer: number = 0;
  private latestValidCheckpoint: { idx: number; t: number; pos: THREE.Vector3 } = { idx: 0, t: 0, pos: new THREE.Vector3() };
  private checkpointsPassedThisLap: Set<number> = new Set();

  // Wrong-Way Navigation Detection
  public isWrongWay: boolean = false;
  private wrongWayTimer: number = 0;

  // Drift Charge & Mini-Turbo Mechanics
  private driftChargeTime: number = 0;

  // Camera System Modes & Settings
  public cameraMode: CameraMode = 'CHASE_NEAR';
  public cameraShakeEnabled: boolean = true;

  // Lap Timing Telemetry
  private lapStartTime: number = 0;
  private currentLapTime: number = 0;
  private bestLapTime: number = 0;

  // Run Progression, Economy & Health
  public sessionCredits: number = 0;
  public hullHealth: number = 100;
  private hitCount: number = 0;
  private maxSpeedReached: number = 0;
  private reachedMilestones: Set<number> = new Set();

  // Active Power-Ups State
  private phaseShieldTimer: number = 0;
  private phaseShieldTotal: number = 6.0;
  private creditMagnetTimer: number = 0;
  private creditMagnetTotal: number = 8.0;
  private hyperBoostTimer: number = 0;
  private hyperBoostTotal: number = 4.5;
  private nitroBoostTimer: number = 0;
  private nitroBoostTotal: number = 3.5;
  private empPulseTimer: number = 0;
  private timeWarpTimer: number = 0;
  private gravityBurstTimer: number = 0;
  private decoyTimer: number = 0;
  private speedSurgeTimer: number = 0;
  private activePowerUpsList: ActivePowerUp[] = [];

  // Advanced Damage System
  public damageZones: ShipDamageZones = {
    frontHull: 0,
    rearEngine: 0,
    leftWing: 0,
    rightWing: 0,
    shieldCore: 100,
  };
  public damageMode: DamageMode = 'CASUAL';
  public collisionsEnabled: boolean = true;
  public powerUpsEnabled: boolean = true;
  public isSpectator: boolean = false;
  public spectatorTargetIndex: number = 0;
  public spectatorTargetName: string = '';

  // Decoy & EMP Visual Objects
  private decoyGroup: THREE.Group | null = null;
  private empWaveMesh: THREE.Mesh | null = null;

  // Dynamic Events tracking
  private lastActiveEventId: string | null = null;
  private collisionCooldown: number = 0;

  // Remote players meshes
  private remoteShips: Map<
    string,
    { group: THREE.Group; targetPos: THREE.Vector3; targetQuat: THREE.Quaternion; thrusters: THREE.Mesh[] }
  > = new Map();

  // Camera Shake & FX
  private cameraShake: number = 0;
  private targetFov: number = 65;

  // Callbacks
  private callbacks: GameEngineCallbacks;
  private clock: THREE.Clock;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Safe initial dimensions
    const initialWidth = Math.max(1, this.container.clientWidth || window.innerWidth || 1280);
    const initialHeight = Math.max(1, this.container.clientHeight || window.innerHeight || 720);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050510, 0.0012);
    this.camera = new THREE.PerspectiveCamera(
      65,
      initialWidth / initialHeight,
      0.5,
      4000
    );
    this.camera.position.set(0, 15, 30);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(initialWidth, initialHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // Fluid canvas styling ensuring full viewport coverage
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.container.appendChild(this.renderer.domElement);

    // WebGL Context Safety Handlers
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.isContextLost = true;
      console.warn('[VOID-RIDER Engine] WebGL Context Lost. Pausing render loop safely.');
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false;
      console.log('[VOID-RIDER Engine] WebGL Context Restored. Resuming render loop.');
    }, false);

    // Build World
    this.initLighting();
    this.initSkyboxAndStars();
    this.initCelestialBodies();
    this.initSpeedParticles();
    this.initThrusterParticles();
    this.initCollisionSparkParticles();
    this.buildTrackGeometry();
    this.buildCheckpoints();
    this.buildBoostPads();
    this.buildEnergyBarriers();
    this.buildAsteroidField();
    this.buildShortcutPortal();
    this.buildCreditsField();
    this.buildPowerUpPods();

    // Initialize Branching Path & Junction Switching System
    this.junctionManager = new JunctionManager(this.trackId, this.track);
    this.scene.add(this.junctionManager.junctionMeshGroup);

    // Initialize Asteroid Destruction Beam System
    this.beamSystem = new BeamSystem(
      this.localBeamCustomization,
      this.localBeamUpgrades,
      'STANDARD'
    );
    this.scene.add(this.beamSystem.containerGroup);

    // Initialize Dedicated Player-to-Player & AI Spacecraft Collision System
    this.collisionSystem = new PlayerCollisionSystem(this.scene);
    this.collisionSystem.onCollisionFeedback = feedback => {
      this.callbacks.onCollisionFeedback?.(feedback);
    };
    this.collisionSystem.onCameraShakeRequest = intensity => {
      if (this.cameraShakeEnabled) {
        this.cameraShake = Math.max(this.cameraShake, intensity);
      }
    };
    this.collisionSystem.onCameraFovPunch = degrees => {
      this.collisionFovPunch = Math.max(this.collisionFovPunch, degrees);
    };
    this.collisionSystem.onSoundTrigger = sndType => {
      if (sndType === 'HEAVY_IMPACT') {
        sound.playHeavyImpact();
      } else if (sndType === 'SHIELD_IMPACT') {
        sound.playShieldImpact();
      } else if (sndType === 'SCRAPE') {
        sound.playScrapeSparks();
      } else {
        sound.playCollision();
      }
    };

    // Prewarm Shaders & Compile Scene Ahead of Time for Stutter-Free Start
    try {
      this.renderer.compile(this.scene, this.camera);
    } catch (_) {}

    // Resize Handlers (Window & ResizeObserver)
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }

    // Start Render Loop
    this.clock = new THREE.Clock();
    this.loop();

    // Notify ready
    requestAnimationFrame(() => {
      this.callbacks.onEngineReady?.();
    });
  }

  private initLighting() {
    const ambientLight = new THREE.AmbientLight(0x1a1a3a, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x88bbff, 2.0);
    dirLight.position.set(100, 300, 200);
    this.scene.add(dirLight);

    const purpleLight = new THREE.DirectionalLight(0xcc22ff, 1.5);
    purpleLight.position.set(-200, -100, -300);
    this.scene.add(purpleLight);
  }

  private initSkyboxAndStars() {
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#00f0ff'),
      new THREE.Color('#d000ff'),
      new THREE.Color('#ffaa00'),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 1200 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    this.starParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starParticles);
  }

  private initCelestialBodies() {
    const planetGeo = new THREE.SphereGeometry(340, 48, 48);
    const planetCanvas = document.createElement('canvas');
    planetCanvas.width = 512;
    planetCanvas.height = 256;
    const pCtx = planetCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, '#041026');
      grad.addColorStop(0.15, '#0b284c');
      grad.addColorStop(0.3, '#00d0ff');
      grad.addColorStop(0.45, '#1e0c4a');
      grad.addColorStop(0.65, '#c026d3');
      grad.addColorStop(0.82, '#181438');
      grad.addColorStop(1.0, '#070a16');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 512, 256);

      pCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      pCtx.fillRect(0, 50, 512, 16);
      pCtx.fillRect(0, 115, 512, 26);
      pCtx.fillRect(0, 175, 512, 12);
      pCtx.fillStyle = 'rgba(0, 240, 255, 0.22)';
      pCtx.fillRect(0, 135, 512, 10);
    }
    const planetTex = new THREE.CanvasTexture(planetCanvas);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x002244,
      emissiveIntensity: 0.4,
    });
    this.giantPlanetMesh = new THREE.Mesh(planetGeo, planetMat);
    this.giantPlanetMesh.position.set(140, 360, -1700);
    this.scene.add(this.giantPlanetMesh);

    const ringGeo = new THREE.RingGeometry(400, 720, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.planetRingsMesh = new THREE.Mesh(ringGeo, ringMat);
    this.planetRingsMesh.position.copy(this.giantPlanetMesh.position);
    this.planetRingsMesh.rotation.x = Math.PI / 2 + 0.38;
    this.planetRingsMesh.rotation.y = 0.22;
    this.scene.add(this.planetRingsMesh);

    this.wormholeAccretionGroup = new THREE.Group();
    const torusOuter = new THREE.Mesh(
      new THREE.TorusGeometry(85, 4.0, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xcc00ff, wireframe: true, transparent: true, opacity: 0.9 })
    );
    const torusInner = new THREE.Mesh(
      new THREE.TorusGeometry(120, 2.5, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.8 })
    );
    const accretionDiskGeo = new THREE.RingGeometry(35, 105, 48);
    const accretionDiskMat = new THREE.MeshBasicMaterial({
      color: 0xbf00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const accretionDisk = new THREE.Mesh(accretionDiskGeo, accretionDiskMat);
    accretionDisk.name = 'accretion_disk';
    const coreSphere = new THREE.Mesh(
      new THREE.SphereGeometry(38, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x01010a })
    );
    this.wormholeAccretionGroup.add(torusOuter, torusInner, accretionDisk, coreSphere);
    this.wormholeAccretionGroup.position.set(520, 320, -1200);
    this.scene.add(this.wormholeAccretionGroup);

    this.spaceStationGroup = new THREE.Group();
    const spireGeo = new THREE.CylinderGeometry(6, 12, 220, 24);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    this.spaceStationGroup.add(spire);

    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2;
      const colGeo = new THREE.CylinderGeometry(0.6, 0.6, 210, 8);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 3.0,
      });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(Math.cos(angle) * 7.5, 0, Math.sin(angle) * 7.5);
      this.spaceStationGroup.add(col);
    }

    const ringRadii = [28, 42, 22];
    const ringHeights = [-40, 15, 65];
    ringRadii.forEach((r, idx) => {
      const deckGeo = new THREE.TorusGeometry(r, 2.5, 12, 36);
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00b4d8,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.rotation.x = Math.PI / 2;
      deck.position.y = ringHeights[idx];
      this.spaceStationGroup?.add(deck);

      for (let s = 0; s < 4; s++) {
        const a = (s * Math.PI) / 2;
        const spokeGeo = new THREE.CylinderGeometry(0.8, 0.8, r, 8);
        const spokeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const spoke = new THREE.Mesh(spokeGeo, spokeMat);
        spoke.rotation.z = Math.PI / 2;
        spoke.rotation.y = a;
        spoke.position.set((Math.cos(a) * r) / 2, ringHeights[idx], (Math.sin(a) * r) / 2);
        this.spaceStationGroup?.add(spoke);
      }
    });

    const beaconGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 4.0,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 115;
    this.spaceStationGroup.add(beacon);

    this.spaceStationGroup.position.set(220, 110, -640);
    this.spaceStationGroup.scale.set(1.4, 1.4, 1.4);
    this.scene.add(this.spaceStationGroup);
  }

  private updateCelestialBodies(dt: number) {
    if (this.giantPlanetMesh) {
      this.giantPlanetMesh.rotation.y += 0.0004;
    }
    if (this.planetRingsMesh) {
      this.planetRingsMesh.rotation.z += 0.0006;
    }
    if (this.wormholeAccretionGroup) {
      this.wormholeAccretionGroup.children[0].rotation.z += 0.015;
      this.wormholeAccretionGroup.children[1].rotation.z -= 0.009;
      if (this.wormholeAccretionGroup.children[2]) {
        this.wormholeAccretionGroup.children[2].rotation.z += 0.02;
      }
      const s = 1.0 + Math.sin(Date.now() * 0.002) * 0.05;
      this.wormholeAccretionGroup.children[3]?.scale.set(s, s, s);
    }
    if (this.spaceStationGroup) {
      this.spaceStationGroup.rotation.y += 0.0018;
    }
  }

  private initSpeedParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 60;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 1.2,
      transparent: true,
      opacity: 0.5,
    });
    this.speedParticles = new THREE.Points(geo, mat);
    this.scene.add(this.speedParticles);
  }

  private initThrusterParticles() {
    const maxParticles = 120;
    this.thrusterParticles = [];
    this.thrusterPositionsArray = new Float32Array(maxParticles * 3);
    this.thrusterColorsArray = new Float32Array(maxParticles * 3);

    for (let i = 0; i < maxParticles; i++) {
      this.thrusterParticles.push({
        pos: new THREE.Vector3(0, -9999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.45,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.thrusterPositionsArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.thrusterColorsArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.thrusterTrailsPoints = new THREE.Points(geo, mat);
    this.scene.add(this.thrusterTrailsPoints);
  }

  private initCollisionSparkParticles() {
    const maxSparks = 100;
    this.collisionSparks = [];
    this.sparkPositionsArray = new Float32Array(maxSparks * 3);
    this.sparkColorsArray = new Float32Array(maxSparks * 3);

    for (let i = 0; i < maxSparks; i++) {
      this.collisionSparks.push({
        pos: new THREE.Vector3(0, -9999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.8,
        color: new THREE.Color(0xff0055),
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositionsArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.sparkColorsArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.collisionSparksPoints = new THREE.Points(geo, mat);
    this.scene.add(this.collisionSparksPoints);
  }

  public triggerCollisionBurst(pos: THREE.Vector3, colorHex: number | string = 0xff0055, count: number = 32) {
    if (!this.sparkPositionsArray) return;
    const burstColor = new THREE.Color(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.collisionSparks.length && spawned < count; i++) {
      const spark = this.collisionSparks[i];
      if (spark.life <= 0) {
        spark.pos.copy(pos);
        spark.color.copy(burstColor);
        spark.maxLife = 0.4 + Math.random() * 0.45;
        spark.life = spark.maxLife;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 14 + Math.random() * 22;
        spark.vel.set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        spawned++;
      }
    }
  }

  private buildTrackGeometry() {
    const samples = this.track.samples;
    const count = samples.length;
    const halfW = this.track.width / 2;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      const left = s.point.clone().add(s.binormal.clone().multiplyScalar(-halfW));
      const right = s.point.clone().add(s.binormal.clone().multiplyScalar(halfW));

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const v = (i / (count - 1)) * 40;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < count - 1) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row2, row1 + 1);
        indices.push(row1 + 1, row2, row2 + 1);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: this.trackId === 'nebula_rift' ? 0x080c1e : 0x0a0c16,
      roughness: 0.25,
      metalness: 0.8,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.trackMeshGroup.add(roadMesh);

    const leftRailPoints: THREE.Vector3[] = [];
    const rightRailPoints: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      leftRailPoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(-halfW)).add(new THREE.Vector3(0, 0.4, 0))
      );
      rightRailPoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(halfW)).add(new THREE.Vector3(0, 0.4, 0))
      );
    }

    const leftRailCurve = new THREE.CatmullRomCurve3(leftRailPoints, true);
    const rightRailCurve = new THREE.CatmullRomCurve3(rightRailPoints, true);

    const railGeoLeft = new THREE.TubeGeometry(leftRailCurve, 320, 0.35, 8, true);
    const railGeoRight = new THREE.TubeGeometry(rightRailCurve, 320, 0.35, 8, true);

    const railMat = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });

    const railLeftMesh = new THREE.Mesh(railGeoLeft, railMat);
    const railRightMesh = new THREE.Mesh(railGeoRight, railMat);
    this.trackMeshGroup.add(railLeftMesh, railRightMesh);

    const leftLanePoints: THREE.Vector3[] = [];
    const rightLanePoints: THREE.Vector3[] = [];
    const centerPoints: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const s = samples[i];
      centerPoints.push(s.point.clone().add(new THREE.Vector3(0, 0.08, 0)));
      leftLanePoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(-4.6)).add(new THREE.Vector3(0, 0.08, 0))
      );
      rightLanePoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(4.6)).add(new THREE.Vector3(0, 0.08, 0))
      );
    }

    const centerCurve = new THREE.CatmullRomCurve3(centerPoints, true);
    const centerRail = new THREE.Mesh(
      new THREE.TubeGeometry(centerCurve, 260, 0.18, 6, true),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );

    const leftLaneCurve = new THREE.CatmullRomCurve3(leftLanePoints, true);
    const rightLaneCurve = new THREE.CatmullRomCurve3(rightLanePoints, true);

    const laneMarkerMat = new THREE.MeshStandardMaterial({
      color: 0xff00aa,
      emissive: 0xff00aa,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    const leftLaneRail = new THREE.Mesh(
      new THREE.TubeGeometry(leftLaneCurve, 260, 0.14, 6, true),
      laneMarkerMat
    );
    const rightLaneRail = new THREE.Mesh(
      new THREE.TubeGeometry(rightLaneCurve, 260, 0.14, 6, true),
      laneMarkerMat
    );

    this.trackMeshGroup.add(centerRail, leftLaneRail, rightLaneRail);
    this.scene.add(this.trackMeshGroup);
  }

  private buildCheckpoints() {
    this.checkpointMeshes = [];
    const gates = this.track.checkpoints;

    gates.forEach((gate, idx) => {
      const group = new THREE.Group();
      group.position.copy(gate.position);
      group.lookAt(gate.position.clone().add(gate.tangent));

      const archRadius = gate.width / 2 + 1;
      const archGeo = new THREE.TorusGeometry(archRadius, 0.6, 12, 28, Math.PI);
      const isFinish = idx === 0;

      const archMat = new THREE.MeshStandardMaterial({
        color: isFinish ? 0xffea00 : 0x00f0ff,
        emissive: isFinish ? 0xffea00 : 0x00f0ff,
        emissiveIntensity: 2.4,
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.rotation.z = Math.PI;
      group.add(arch);

      const curtainGeo = new THREE.PlaneGeometry(gate.width, archRadius);
      const curtainMat = new THREE.MeshBasicMaterial({
        color: isFinish ? 0xffea00 : 0x00a8ff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const curtain = new THREE.Mesh(curtainGeo, curtainMat);
      curtain.position.y = archRadius / 2;
      group.add(curtain);

      const textCanvas = document.createElement('canvas');
      textCanvas.width = 384;
      textCanvas.height = 96;
      const tCtx = textCanvas.getContext('2d');
      if (tCtx) {
        tCtx.clearRect(0, 0, 384, 96);
        tCtx.fillStyle = isFinish ? '#ffea00' : '#00f0ff';
        tCtx.shadowColor = isFinish ? '#ffea00' : '#00f0ff';
        tCtx.shadowBlur = 18;
        tCtx.font = '900 44px "Orbitron", sans-serif';
        tCtx.textAlign = 'center';
        tCtx.fillText(isFinish ? 'FINISH' : 'CHECKPOINT', 192, 60);
      }
      const textTex = new THREE.CanvasTexture(textCanvas);
      textTex.minFilter = THREE.LinearFilter;
      const textMat = new THREE.SpriteMaterial({
        map: textTex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
      const textSprite = new THREE.Sprite(textMat);
      textSprite.scale.set(11, 2.75, 1);
      textSprite.position.set(gate.width / 2 + 5.5, archRadius * 0.85, 0);
      group.add(textSprite);

      this.scene.add(group);
      this.checkpointMeshes.push(group);
    });
  }

  private buildBoostPads() {
    this.boostPadMeshes = [];
    const pads = this.track.boostPads;
    pads.forEach(pad => {
      const padGroup = new THREE.Group();
      padGroup.position.copy(pad.position);
      padGroup.lookAt(pad.position.clone().add(pad.direction));

      const padGeo = new THREE.PlaneGeometry(12, 8);
      padGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        emissive: 0xff5500,
        emissiveIntensity: 2.5,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(padGeo, padMat);
      padGroup.add(mesh);
      this.scene.add(padGroup);
      this.boostPadMeshes.push(mesh);
    });
  }

  private buildEnergyBarriers() {
    this.energyBarrierMeshes.forEach(g => this.scene.remove(g));
    this.energyBarrierMeshes = [];

    const barriers = this.track.energyBarriers || [];
    for (const b of barriers) {
      const group = new THREE.Group();
      group.position.copy(b.position);

      const rotMatrix = new THREE.Matrix4();
      rotMatrix.makeBasis(b.binormal, b.normal, b.tangent.clone().negate());
      group.quaternion.setFromRotationMatrix(rotMatrix);

      const pylonGeo = new THREE.CylinderGeometry(0.7, 1.1, 10, 8);
      const pylonMat = new THREE.MeshStandardMaterial({
        color: 0x1e1e2f,
        metalness: 0.9,
        roughness: 0.2,
      });
      const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
      leftPylon.position.set(-b.width / 2, 5, 0);
      const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
      rightPylon.position.set(b.width / 2, 5, 0);

      const ringGeo = new THREE.TorusGeometry(1.2, 0.25, 8, 20);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.8,
      });
      const leftRing = new THREE.Mesh(ringGeo, ringMat);
      leftRing.rotation.x = Math.PI / 2;
      leftRing.position.set(-b.width / 2, 7, 0);
      const rightRing = leftRing.clone();
      rightRing.position.set(b.width / 2, 7, 0);
      group.add(leftPylon, rightPylon, leftRing, rightRing);

      const beamGeo = new THREE.BoxGeometry(6.2, 5.5, 0.2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });

      if (b.gapLane !== 'left') {
        const leftBeam = new THREE.Mesh(beamGeo, beamMat.clone());
        leftBeam.name = 'barrier_laser';
        leftBeam.position.set(-6.5, 3.2, 0);
        group.add(leftBeam);
      }
      if (b.gapLane !== 'center') {
        const centerBeam = new THREE.Mesh(beamGeo, beamMat.clone());
        centerBeam.name = 'barrier_laser';
        centerBeam.position.set(0, 3.2, 0);
        group.add(centerBeam);
      }
      if (b.gapLane !== 'right') {
        const rightBeam = new THREE.Mesh(beamGeo, beamMat.clone());
        rightBeam.name = 'barrier_laser';
        rightBeam.position.set(6.5, 3.2, 0);
        group.add(rightBeam);
      }

      const gapX = b.gapLane === 'left' ? -6.5 : b.gapLane === 'right' ? 6.5 : 0;
      const arrowGeo = new THREE.ConeGeometry(1.2, 2.2, 4);
      const arrowMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        wireframe: true,
      });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.name = 'safe_lane_arrow';
      arrow.rotation.x = Math.PI;
      arrow.position.set(gapX, 7.5, 0);
      group.add(arrow);

      this.scene.add(group);
      this.energyBarrierMeshes.push(group);
    }
  }

  private updateEnergyBarriers(dt: number) {
    const time = Date.now() * 0.005;
    this.energyBarrierMeshes.forEach(group => {
      const arrow = group.getObjectByName('safe_lane_arrow');
      if (arrow) {
        arrow.rotation.y += 0.04;
        arrow.position.y = 7.5 + Math.sin(time) * 0.4;
      }
      group.children.forEach(child => {
        if (child.name === 'barrier_laser' && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.55 + Math.sin(time * 2 + child.position.x) * 0.15;
        }
      });
    });
  }

  private buildAsteroidField() {
    if (this.asteroidInstancedMesh) {
      this.scene.remove(this.asteroidInstancedMesh);
      this.asteroidInstancedMesh.geometry.dispose();
      if (Array.isArray(this.asteroidInstancedMesh.material)) {
        this.asteroidInstancedMesh.material.forEach(m => m.dispose());
      } else {
        this.asteroidInstancedMesh.material.dispose();
      }
      this.asteroidInstancedMesh = null;
    }

    const asteroids = this.track.obstacles;
    this.asteroidPoolSize = Math.max(asteroids.length + 16, 64);

    const baseGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const posAttr = baseGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const factor = 1 + (Math.sin(vx * 2) + Math.cos(vy * 2)) * 0.14;
      posAttr.setXYZ(i, vx * factor, vy * factor, vz * factor);
    }
    baseGeo.computeVertexNormals();

    const instancedMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.2,
    });

    this.asteroidInstancedMesh = new THREE.InstancedMesh(
      baseGeo,
      instancedMat,
      this.asteroidPoolSize
    );
    this.asteroidInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const normalColor = new THREE.Color(0x606578);
    const dynamicSwarmColor = new THREE.Color(0xff0055);
    const goldOreColor = new THREE.Color(0xd49b42);

    for (let i = 0; i < this.asteroidPoolSize; i++) {
      if (i < asteroids.length) {
        const ast = asteroids[i];
        ast.currentRotation = ast.currentRotation || new THREE.Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        this.dummyObj.position.copy(ast.position);
        this.dummyObj.rotation.set(
          ast.currentRotation.x,
          ast.currentRotation.y,
          ast.currentRotation.z
        );
        this.dummyObj.scale.setScalar(ast.radius);
        this.dummyObj.updateMatrix();
        this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);

        if (ast.isDynamicSwarm) {
          this.asteroidInstancedMesh.setColorAt(i, dynamicSwarmColor);
        } else if (i % 3 === 0) {
          this.asteroidInstancedMesh.setColorAt(i, goldOreColor);
        } else {
          this.asteroidInstancedMesh.setColorAt(i, normalColor);
        }
      } else {
        this.dummyObj.position.set(0, -9999, 0);
        this.dummyObj.scale.set(0, 0, 0);
        this.dummyObj.updateMatrix();
        this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
      }
    }

    this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.asteroidInstancedMesh.instanceColor) {
      this.asteroidInstancedMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.asteroidInstancedMesh);
  }

  private buildShortcutPortal() {
    if (this.shortcutPortalGroup) {
      this.scene.remove(this.shortcutPortalGroup);
      this.shortcutPortalGroup = null;
    }

    const shortcutEvent = this.track.dynamicEvents.find(e => e.type === 'TEMPORARY_SHORTCUT');
    if (!shortcutEvent) return;

    const sample = this.track.getSampleAt(shortcutEvent.sectorStartT);
    const group = new THREE.Group();
    group.position.copy(sample.point).add(sample.normal.clone().multiplyScalar(4));
    group.lookAt(sample.point.clone().add(sample.tangent));

    const ringGeo = new THREE.TorusGeometry(12, 1.2, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'portal_ring';
    group.add(ring);

    const discGeo = new THREE.CircleGeometry(11, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xd000ff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.name = 'portal_disc';
    group.add(disc);

    this.shortcutPortalGroup = group;
    this.scene.add(this.shortcutPortalGroup);
  }

  private buildCreditsField() {
    if (this.creditsInstancedMesh) {
      this.scene.remove(this.creditsInstancedMesh);
      this.creditsInstancedMesh.geometry.dispose();
      if (Array.isArray(this.creditsInstancedMesh.material)) {
        this.creditsInstancedMesh.material.forEach(m => m.dispose());
      } else {
        this.creditsInstancedMesh.material.dispose();
      }
      this.creditsInstancedMesh = null;
    }

    const credits = this.track.credits;
    if (!credits || credits.length === 0) return;

    const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffaa00,
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.85,
    });

    this.creditsInstancedMesh = new THREE.InstancedMesh(
      crystalGeo,
      crystalMat,
      credits.length
    );
    this.creditsInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < credits.length; i++) {
      const c = credits[i];
      c.collected = false;
      c.position.copy(c.basePosition);
      this.creditsDummy.position.copy(c.position);
      this.creditsDummy.rotation.set(0, (i * 0.4) % (Math.PI * 2), 0);
      this.creditsDummy.scale.setScalar(1.0);
      this.creditsDummy.updateMatrix();
      this.creditsInstancedMesh.setMatrixAt(i, this.creditsDummy.matrix);
    }
    this.creditsInstancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.creditsInstancedMesh);
  }

  private buildPowerUpPods() {
    this.powerUpPodGroups.forEach(g => this.scene.remove(g));
    this.powerUpPodGroups = [];

    const pods = this.track.powerUpPods;
    if (!pods || pods.length === 0) return;

    const getPowerUpPodStyle = (type: PowerUpType): { colorHex: number; coreGeo: THREE.BufferGeometry } => {
      switch (type) {
        case 'NITRO_BOOST':
          return { colorHex: 0xff5500, coreGeo: new THREE.ConeGeometry(0.7, 1.4, 4) };
        case 'ENERGY_SHIELD':
        case 'PHASE_SHIELD':
          return { colorHex: 0x00f0ff, coreGeo: new THREE.IcosahedronGeometry(0.85, 1) };
        case 'REPAIR_CORE':
          return { colorHex: 0x39ff14, coreGeo: new THREE.OctahedronGeometry(0.8, 0) };
        case 'MAGNET_BOOST':
        case 'CREDIT_MAGNET':
          return { colorHex: 0xd000ff, coreGeo: new THREE.TorusGeometry(0.75, 0.3, 12, 24) };
        case 'EMP_PULSE':
          return { colorHex: 0x00e5ff, coreGeo: new THREE.CylinderGeometry(0.8, 0.8, 0.25, 8) };
        case 'TIME_WARP':
          return { colorHex: 0x9d4edd, coreGeo: new THREE.DodecahedronGeometry(0.8, 0) };
        case 'GRAVITY_BURST':
          return { colorHex: 0xffcc00, coreGeo: new THREE.BoxGeometry(0.9, 0.9, 0.9) };
        case 'DECOY_SHIP':
          return { colorHex: 0xff007f, coreGeo: new THREE.TetrahedronGeometry(0.9, 0) };
        case 'TEMPORARY_SPEED_SURGE':
        case 'HYPER_BOOST':
        default:
          return { colorHex: 0xff0055, coreGeo: new THREE.ConeGeometry(0.75, 1.4, 4) };
      }
    };

    pods.forEach(pod => {
      const podGroup = new THREE.Group();
      podGroup.position.copy(pod.position);

      const { colorHex, coreGeo } = getPowerUpPodStyle(pod.type);

      const ringGeo = new THREE.TorusGeometry(1.6, 0.12, 12, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 2.8,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'halo_ring';
      podGroup.add(ring);

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: colorHex,
        emissiveIntensity: 3.2,
        roughness: 0.1,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.name = 'core_icon';
      podGroup.add(core);

      const capsuleGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.2, 16);
      const capsuleMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.25,
        wireframe: true,
      });
      const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
      capsule.name = 'capsule_shield';
      podGroup.add(capsule);

      this.scene.add(podGroup);
      this.powerUpPodGroups.push(podGroup);
    });
  }

  private buildShieldMesh() {
    if (!this.playerShipGroup) return;
    if (this.shieldMeshGroup) {
      this.playerShipGroup.remove(this.shieldMeshGroup);
      this.shieldMeshGroup = null;
    }

    const group = new THREE.Group();
    group.name = 'phase_shield_group';

    const outerGeo = new THREE.IcosahedronGeometry(3.6, 2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.6,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    const innerGeo = new THREE.IcosahedronGeometry(3.45, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x00a8ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    group.visible = false;
    this.shieldMeshGroup = group;
    this.playerShipGroup.add(group);
  }

  public setTrack(trackId: TrackId) {
    if (this.trackId === trackId && this.track) return;
    this.trackId = trackId;

    this.scene.remove(this.trackMeshGroup);
    this.trackMeshGroup = new THREE.Group();

    this.checkpointMeshes.forEach(m => this.scene.remove(m));
    this.checkpointMeshes = [];

    this.boostPadMeshes.forEach(m => {
      if (m.parent) this.scene.remove(m.parent);
      else this.scene.remove(m);
    });
    this.boostPadMeshes = [];

    if (this.asteroidInstancedMesh) {
      this.scene.remove(this.asteroidInstancedMesh);
      this.asteroidInstancedMesh.geometry.dispose();
      if (Array.isArray(this.asteroidInstancedMesh.material)) {
        this.asteroidInstancedMesh.material.forEach(m => m.dispose());
      } else {
        this.asteroidInstancedMesh.material.dispose();
      }
      this.asteroidInstancedMesh = null;
    }

    if (this.shortcutPortalGroup) {
      this.scene.remove(this.shortcutPortalGroup);
      this.shortcutPortalGroup = null;
    }

    if (this.creditsInstancedMesh) {
      this.scene.remove(this.creditsInstancedMesh);
      this.creditsInstancedMesh.geometry.dispose();
      this.creditsInstancedMesh = null;
    }

    this.powerUpPodGroups.forEach(g => this.scene.remove(g));
    this.powerUpPodGroups = [];

    this.track = new CosmicTrack(trackId);
    this.buildTrackGeometry();
    this.buildCheckpoints();
    this.buildBoostPads();
    this.buildEnergyBarriers();
    this.buildAsteroidField();
    this.buildShortcutPortal();
    this.buildCreditsField();
    this.buildPowerUpPods();
    if (this.junctionManager) {
      this.junctionManager.mainTrack = this.track;
      this.junctionManager.initJunctions(trackId);
    }
    this.resetToStart();
  }

  public setPlayerShip(
    shipId: string,
    colorHex: string,
    secondaryColorHex?: string,
    decal: ShipDecalType = 'none',
    upgrades?: ShipUpgrades,
    thrusterColor?: ThrusterFlameColor,
    cockpitSkin?: CockpitSkin
  ) {
    this.localShipId = shipId;
    this.localColor = colorHex;
    this.localSecondaryColor = secondaryColorHex || '#ff00e5';
    this.localDecal = decal;
    if (upgrades) this.localUpgrades = upgrades;
    if (thrusterColor) this.localThrusterColor = thrusterColor;
    if (cockpitSkin) this.localCockpitSkin = cockpitSkin;

    if (this.playerShipGroup) {
      this.scene.remove(this.playerShipGroup);
      this.playerShipGroup = null;
    }

    const flameCfg = THRUSTER_FLAME_CONFIGS.find(t => t.id === this.localThrusterColor);
    const thrusterHex = flameCfg ? flameCfg.hex : this.localColor;

    this.playerShipGroup = createShipMesh(
      shipId,
      this.localColor,
      this.localSecondaryColor,
      this.localDecal,
      thrusterHex,
      this.localCockpitSkin
    );

    this.buildShieldMesh();
    this.scene.add(this.playerShipGroup);

    this.playerThrusters = [];
    this.playerShipGroup.traverse(child => {
      if (child.name === 'thruster_flame' && child instanceof THREE.Mesh) {
        this.playerThrusters.push(child);
      }
    });

    this.resetToStart();
  }

  public resetToStart() {
    this.splineT = 0;
    this.lateralOffset = 0;
    this.currentSpeed = 0;
    this.boostEnergy = 100;
    this.currentLap = 1;
    this.nextCheckpointIdx = 1;
    this.hasFinished = false;
    this.totalDistanceTraveled = 0;
    this.totalTimeElapsed = 0;
    this.isDestroyed = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.checkpointsPassedThisLap.clear();
    this.latestValidCheckpoint = {
      idx: 0,
      t: 0,
      pos: this.track.checkpoints[0]?.position.clone() || new THREE.Vector3(),
    };
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.driftChargeTime = 0;
    this.lapStartTime = Date.now();
    this.currentLapTime = 0;
    this.bestLapTime = 0;

    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }
    this.updateShipTransform(0);
    this.snapCameraToShip();
  }

  public snapCameraToShip() {
    if (!this.playerShipGroup || !this.track) return;
    const sample = this.track.getSampleAt(this.splineT);
    const behindDistance = 14;
    const heightOffset = 5.2;
    const targetCamPos = this.playerShipGroup.position
      .clone()
      .add(sample.tangent.clone().multiplyScalar(-behindDistance))
      .add(sample.normal.clone().multiplyScalar(heightOffset));
    const lookTarget = this.playerShipGroup.position
      .clone()
      .add(sample.tangent.clone().multiplyScalar(25));
    this.camera.position.copy(targetCamPos);
    this.camera.lookAt(lookTarget);
  }

  public startRace() {
    this.isRacing = true;
    this.hasFinished = false;
    this.raceStartTime = Date.now();
    this.lapStartTime = Date.now();
    this.currentLap = 1;
    this.nextCheckpointIdx = 1;
    this.boostEnergy = 100;
    this.totalTimeElapsed = 0;
    this.isDestroyed = false;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.checkpointsPassedThisLap.clear();
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.driftChargeTime = 0;

    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }

    sound.startEngine();
    sound.startCosmicMusic();
  }

  public stopRace() {
    this.isRacing = false;
    this.isAIRaceActive = false;
    this.clearAIRacers();
    this.isWrongWay = false;
    sound.stopEngine();
    sound.stopCosmicMusic();
  }

  private updatePhysics(dt: number) {
    if (!this.playerShipGroup) return;

    if (this.isDestroyed) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawnPlayerShip();
      }
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
      if (this.playerShipGroup) {
        this.playerShipGroup.visible = Math.floor(Date.now() / 80) % 2 === 0;
      }
    } else if (this.playerShipGroup && !this.playerShipGroup.visible) {
      this.playerShipGroup.visible = true;
    }

    if (this.isRacing && !this.hasFinished) {
      this.currentLapTime = Date.now() - this.lapStartTime;
      this.callbacks.onLapTimesUpdate?.(this.currentLapTime, this.bestLapTime);
    }

    this.totalTimeElapsed += dt;
    if (this.collisionCooldown > 0) {
      this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    }

    this.track.updateDynamicEvents(dt, this.totalTimeElapsed);
    const activeEvent = this.track.getActiveEventAt(this.splineT);

    if (activeEvent?.id !== this.lastActiveEventId) {
      this.lastActiveEventId = activeEvent?.id || null;
      this.callbacks.onTrackEventUpdate?.(activeEvent);
      if (activeEvent) {
        if (activeEvent.type === 'ASTEROID_SWARM') {
          sound.playAlarmAlert();
        } else if (activeEvent.type === 'GRAVITY_SHIFT') {
          sound.playGravityShift(activeEvent.gravityMode === 'LOW_G');
        } else if (activeEvent.type === 'TEMPORARY_SHORTCUT') {
          sound.playAlarmAlert();
        }
      }
    }

    const baseConfig = getShipConfig(this.localShipId);
    const shipConfig = getEffectiveShipStats(baseConfig, this.localUpgrades);

    let gravitySpeedBonus = 0;
    let gravityDriftFactor = 1.0;
    if (activeEvent?.type === 'GRAVITY_SHIFT') {
      if (activeEvent.gravityMode === 'LOW_G') {
        gravitySpeedBonus = 25;
        gravityDriftFactor = 1.7;
      } else if (activeEvent.gravityMode === 'HIGH_G') {
        gravityDriftFactor = 0.5;
      }
    }

    const maxNormalSpeed = (shipConfig.topSpeed + gravitySpeedBonus) / 3.6;
    const hyperBoostSurge =
      this.hyperBoostTimer > 0
        ? 35 + (this.localUpgrades.hyperBoostSpeed || 0) * 8
        : 0;
    const maxBoostSpeed =
      (maxNormalSpeed + hyperBoostSurge) * (1.35 + shipConfig.boostPower / 250);

    const accelRate = (shipConfig.acceleration / 100) * 48;
    const brakeRate = 50;
    const dragRate = activeEvent?.gravityMode === 'LOW_G' ? 6 : 12;

    if (
      (this.input.boost || this.hyperBoostTimer > 0) &&
      (this.boostEnergy > 2 || this.hyperBoostTimer > 0) &&
      this.isRacing
    ) {
      this.isBoosting = true;
      if (this.hyperBoostTimer <= 0) {
        const drainRate = 32 * (100 / shipConfig.boostCapacity);
        this.boostEnergy = Math.max(0, this.boostEnergy - drainRate * dt);
      }
    } else {
      this.isBoosting = false;
      const rechargeRate = 13 * (shipConfig.boostCapacity / 100);
      this.boostEnergy = Math.min(100, this.boostEnergy + rechargeRate * dt);
    }
    this.callbacks.onBoostUpdate(this.boostEnergy);

    const targetMaxSpeed = this.isBoosting ? maxBoostSpeed : maxNormalSpeed;

    if (this.isRacing) {
      if (this.input.throttle > 0 || this.hyperBoostTimer > 0) {
        const throttleMult = this.hyperBoostTimer > 0 ? 2.2 : this.isBoosting ? 1.8 : 1.0;
        this.currentSpeed = Math.min(
          targetMaxSpeed,
          this.currentSpeed + accelRate * dt * throttleMult
        );
      } else if (this.input.throttle < 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - brakeRate * dt);
      } else {
        this.currentSpeed = Math.max(0, this.currentSpeed - dragRate * dt);
      }
    } else {
      this.currentSpeed = Math.max(0, this.currentSpeed - dragRate * 2 * dt);
    }

    const isInverted = activeEvent?.type === 'INVERSION_ZONE';
    const effectiveSteer = isInverted ? -this.input.steer : this.input.steer;
    const wasDrifting = this.isDrifting;
    this.isDrifting =
      (this.input.drift || activeEvent?.gravityMode === 'LOW_G') && this.currentSpeed > 18;

    if (this.isDrifting && Math.abs(effectiveSteer) > 0.12) {
      this.driftChargeTime += dt;
      if (Math.random() < 0.35) {
        const sparkColor =
          this.driftChargeTime >= 1.5 ? 0xff00e5 : this.driftChargeTime >= 0.7 ? 0x00f0ff : 0x0088ff;
        this.triggerCollisionBurst(this.playerShipGroup.position, sparkColor, 2);
      }
    } else {
      if (wasDrifting && !this.input.drift && this.driftChargeTime > 0.6) {
        if (this.driftChargeTime >= 1.5) {
          this.currentSpeed = Math.min(targetMaxSpeed * 1.35, this.currentSpeed + 28);
          this.boostEnergy = Math.min(100, this.boostEnergy + 25);
          sound.playDriftMiniTurbo();
          if (this.cameraShakeEnabled) this.cameraShake = 0.45;
          this.callbacks.onHazardHit?.('SUPER MINI-TURBO RELEASED!');
        } else {
          this.currentSpeed = Math.min(targetMaxSpeed * 1.18, this.currentSpeed + 16);
          this.boostEnergy = Math.min(100, this.boostEnergy + 12);
          sound.playDriftMiniTurbo();
          this.callbacks.onHazardHit?.('MINI-TURBO RELEASED!');
        }
      }
      this.driftChargeTime = 0;
    }

    const handlingFactor =
      (shipConfig.handling / 100) * (this.isDrifting ? 1.6 * gravityDriftFactor : 1.0);
    const steerSpeed = 24 * handlingFactor;
    if (effectiveSteer !== 0 && this.currentSpeed > 5) {
      this.lateralOffset += effectiveSteer * steerSpeed * dt * (this.currentSpeed / maxNormalSpeed);
    }

    if (this.hyperBoostTimer > 0) {
      this.lateralOffset = THREE.MathUtils.lerp(this.lateralOffset, 0, 4.0 * dt);
    }

    // Lane Guidance: smoothly bias ship lateral position toward chosen route as junction approaches
    const juncTelem = this.junctionManager.activeJunctionTelemetry;
    if (
      juncTelem &&
      juncTelem.isApproaching &&
      juncTelem.selectedRouteDirection &&
      !this.junctionManager.playerRouteProgress.isInBranch
    ) {
      let targetLane = 0;
      if (juncTelem.selectedRouteDirection === 'LEFT') {
        targetLane = -this.track.width * 0.28;
      } else if (
        juncTelem.selectedRouteDirection === 'RIGHT' ||
        juncTelem.selectedRouteDirection === 'SHORTCUT'
      ) {
        targetLane = this.track.width * 0.28;
      }
      // If player is not actively steering hard in opposite direction, smoothly assist lane placement
      if (Math.abs(effectiveSteer) < 0.3) {
        this.lateralOffset = THREE.MathUtils.lerp(this.lateralOffset, targetLane, dt * 2.2);
      }
    }

    const prpState = this.junctionManager.playerRouteProgress;
    const currentTrackWidth =
      prpState.isInBranch && prpState.branchRouteInstance
        ? prpState.branchRouteInstance.config.width
        : this.track.width;
    const maxHalfW = currentTrackWidth / 2 - 1.8;

    if (Math.abs(this.lateralOffset) > maxHalfW) {
      this.lateralOffset = Math.sign(this.lateralOffset) * maxHalfW;
      this.currentSpeed = Math.max(10, this.currentSpeed * 0.75);
      if (this.cameraShakeEnabled) this.cameraShake = 0.5;
      sound.playCollision();
    }

    // Branch Obstacle Collision Check
    if (this.collisionCooldown <= 0 && this.isRacing && prpState.isInBranch && prpState.branchRouteInstance) {
      const shipPos = this.playerShipGroup.position;
      for (const obsPos of prpState.branchRouteInstance.obstaclePositions) {
        if (shipPos.distanceTo(obsPos) < 4.2) {
          if (this.phaseShieldTimer > 0) {
            sound.playShieldDeflect();
            if (this.cameraShakeEnabled) this.cameraShake = 0.35;
            this.triggerCollisionBurst(shipPos, 0x00f0ff, 28);
            this.collisionCooldown = 0.5;
            this.callbacks.onHazardHit?.('PHASE SHIELD DEFLECTED ASTEROID!');
          } else {
            sound.playAsteroidHit();
            if (this.cameraShakeEnabled) this.cameraShake = 0.85;
            this.currentSpeed = Math.max(12, this.currentSpeed * 0.5);
            this.lateralOffset += this.lateralOffset >= 0 ? 3 : -3;
            this.collisionCooldown = 1.2;
            this.hullHealth = Math.max(0, this.hullHealth - 20);
            this.hitCount++;
            this.triggerCollisionBurst(shipPos, 0xff0055, 32);
            this.callbacks.onHullUpdate?.(this.hullHealth);
            this.callbacks.onHazardHit?.('BRANCH ASTEROID IMPACT');
            if (this.hullHealth <= 0) {
              this.destroyPlayerShip('HULL CRITICALLY BREACHED');
              return;
            }
          }
          break;
        }
      }
    }

    if (this.collisionCooldown <= 0 && this.isRacing) {
      const shipPos = this.playerShipGroup.position;
      for (const obs of this.track.obstacles) {
        if (obs.isDestroyed || obs.health <= 0) continue;
        if (shipPos.distanceTo(obs.position) < obs.radius + 1.8) {
          if (this.phaseShieldTimer > 0) {
            sound.playShieldDeflect();
            if (this.cameraShakeEnabled) this.cameraShake = 0.35;
            this.triggerCollisionBurst(shipPos, 0x00f0ff, 28);
            this.collisionCooldown = 0.5;
            this.callbacks.onHazardHit?.('PHASE SHIELD DEFLECTED ASTEROID!');
          } else {
            sound.playAsteroidHit();
            if (this.cameraShakeEnabled) this.cameraShake = 0.85;
            this.currentSpeed = Math.max(12, this.currentSpeed * 0.45);
            this.lateralOffset += this.lateralOffset >= 0 ? 5 : -5;
            this.collisionCooldown = 1.2;
            this.hullHealth = Math.max(0, this.hullHealth - 25);
            this.hitCount++;
            this.triggerCollisionBurst(shipPos, 0xff0055, 36);
            this.callbacks.onHullUpdate?.(this.hullHealth);
            this.callbacks.onHazardHit?.('ASTEROID SWARM IMPACT');
            if (this.hullHealth <= 0) {
              this.destroyPlayerShip('HULL CRITICALLY BREACHED');
              return;
            }
          }
          break;
        }
      }
    }

    if (this.collisionCooldown <= 0 && this.isRacing && this.track.energyBarriers) {
      const shipPos = this.playerShipGroup.position;
      for (const barrier of this.track.energyBarriers) {
        if (!barrier.active) continue;
        const dist = shipPos.distanceTo(barrier.position);
        if (dist < 6.5) {
          const playerLane = this.lateralOffset < -2.2 ? 'left' : this.lateralOffset > 2.2 ? 'right' : 'center';
          if (playerLane !== barrier.gapLane) {
            if (this.phaseShieldTimer > 0) {
              sound.playShieldDeflect();
              if (this.cameraShakeEnabled) this.cameraShake = 0.4;
              this.triggerCollisionBurst(shipPos, 0x00f0ff, 28);
              this.collisionCooldown = 0.6;
              this.callbacks.onHazardHit?.('PHASE SHIELD ABSORBED LASER BARRIER');
            } else {
              sound.playCollision();
              if (this.cameraShakeEnabled) this.cameraShake = 0.85;
              this.currentSpeed = Math.max(12, this.currentSpeed * 0.45);
              this.collisionCooldown = 1.2;
              this.hullHealth = Math.max(0, this.hullHealth - 20);
              this.hitCount++;
              this.triggerCollisionBurst(shipPos, 0x00f0ff, 36);
              this.callbacks.onHullUpdate?.(this.hullHealth);
              this.callbacks.onHazardHit?.('ENERGY BARRIER BREACHED');
              if (this.hullHealth <= 0) {
                this.destroyPlayerShip('HULL OVERCHARGED & CRITICALLY BREACHED');
                return;
              }
            }
            break;
          }
        }
      }
    }

    // Dedicated Player-to-Player & AI Spacecraft Collision System
    if (this.collisionsEnabled && this.playerShipGroup && !this.isSpectator) {
      const pSample = this.track.getSampleAt(this.splineT);
      const forwardDir = pSample.tangent.clone().negate();
      const pSpeedMps = this.currentSpeed;
      const pVel = forwardDir.clone().multiplyScalar(pSpeedMps);

      const pCfg = getShipConfig(this.localShipId);
      const pMass =
        pCfg.id === 'vortex_nemesis'
          ? 1.45
          : pCfg.id === 'apex_phantom'
          ? 0.95
          : pCfg.id === 'solaris_stinger'
          ? 0.85
          : 1.15;

      const playerParticipant: CollisionParticipant = {
        id: 'player',
        category: 'PLAYER',
        name: 'Player',
        position: this.playerShipGroup.position,
        velocity: pVel,
        speed: pSpeedMps,
        direction: forwardDir,
        radius: 2.6,
        mass: pMass,
        shield: this.phaseShieldTimer > 0 ? 100 : this.damageZones.shieldCore,
        hull: this.hullHealth,
        isBoosting: this.isBoosting,
        collisionCooldown: this.collisionCooldown,
        recoveryTimer: this.playerCollisionRecoveryTimer,
        angularVelocity: this.playerCollisionAngularVelocity,
        angularDisplacement: this.playerCollisionAngularDisplacement,
        lateralOffset: this.lateralOffset,
        splineT: this.splineT,
        invulnerableTimer: this.invulnerableTimer,
        isDestroyed: this.isDestroyed,
        meshGroup: this.playerShipGroup,
        applyDamage: (shieldLoss, hullLoss, impactForce) => {
          if (shieldLoss > 0) {
            this.damageZones.shieldCore = Math.max(0, this.damageZones.shieldCore - shieldLoss);
          }
          if (hullLoss > 0) {
            this.hullHealth = Math.max(0, this.hullHealth - hullLoss);
            this.callbacks.onHullUpdate?.(this.hullHealth);
            const zone = Math.random() > 0.5 ? 'leftWing' : 'rightWing';
            this.applyZoneDamage(zone, hullLoss);
          }
          this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
        },
        onCrash: reason => {
          this.destroyPlayerShip(reason);
        },
      };

      this.collisionSystem.registerParticipant(playerParticipant);

      // Register / update AI Participants
      for (const ai of this.localAIRacers) {
        if (!ai.group) continue;
        const aiSample = this.track.getSampleAt(ai.t);
        const aiDir = aiSample.tangent.clone().negate();
        const aiVel = aiDir.clone().multiplyScalar(ai.speed);
        const aiMass =
          ai.shipId === 'vortex_nemesis'
            ? 1.4
            : ai.shipId === 'apex_phantom'
            ? 0.95
            : ai.shipId === 'solaris_stinger'
            ? 0.85
            : 1.1;

        const aiParticipant: CollisionParticipant = {
          id: ai.id,
          category: 'AI_PLAYER',
          name: ai.name,
          position: ai.group.position,
          velocity: aiVel,
          speed: ai.speed,
          direction: aiDir,
          radius: 2.5,
          mass: aiMass,
          shield: ai.shield ?? 100,
          hull: ai.hull ?? 100,
          isBoosting: ai.isBoosting,
          collisionCooldown: ai.collisionCooldown ?? 0,
          recoveryTimer: ai.recoveryTimer ?? 0,
          angularVelocity: ai.angularVelocity ?? 0,
          angularDisplacement: ai.angularDisplacement ?? 0,
          lateralOffset: ai.currentLateral,
          splineT: ai.t,
          invulnerableTimer: ai.invulnerableTimer ?? 0,
          isDestroyed: !!ai.isDestroyed,
          meshGroup: ai.group,
          applyDamage: (shieldLoss, hullLoss) => {
            ai.shield = Math.max(0, (ai.shield ?? 100) - shieldLoss);
            ai.hull = Math.max(0, (ai.hull ?? 100) - hullLoss);
          },
          onCrash: () => {
            ai.isDestroyed = true;
            ai.respawnTimer = 2.0;
            ai.group.visible = false;
            this.triggerCollisionBurst(ai.group.position, 0xff0055, 40);
          },
        };

        this.collisionSystem.registerParticipant(aiParticipant);
      }

      // Register / update Remote Multiplayer Ships
      for (const [pid, remote] of this.remoteShips.entries()) {
        if (!remote.group) continue;
        const remotePos = remote.group.position;
        const remoteDir = new THREE.Vector3(0, 0, -1).applyQuaternion(remote.group.quaternion);
        this.collisionSystem.registerParticipant({
          id: pid,
          category: 'REMOTE_PLAYER',
          name: `Racer_${pid.slice(0, 4)}`,
          position: remotePos,
          velocity: remoteDir.clone().multiplyScalar(40),
          speed: 40,
          direction: remoteDir,
          radius: 2.5,
          mass: 1.1,
          shield: 100,
          hull: 100,
          isBoosting: false,
          collisionCooldown: 0,
          recoveryTimer: 0,
          angularVelocity: 0,
          angularDisplacement: 0,
          lateralOffset: 0,
          splineT: this.splineT,
          invulnerableTimer: 0,
          isDestroyed: false,
          meshGroup: remote.group,
        });
      }

      // Run dedicated collision evaluation & resolution
      this.collisionSystem.update(dt);

      // Read back state from player participant
      const updatedPlayer = this.collisionSystem.getParticipant('player');
      if (updatedPlayer) {
        this.lateralOffset = updatedPlayer.lateralOffset;
        this.currentSpeed = updatedPlayer.speed;
        this.collisionCooldown = updatedPlayer.collisionCooldown;
        this.playerCollisionAngularVelocity = updatedPlayer.angularVelocity;
        this.playerCollisionAngularDisplacement = updatedPlayer.angularDisplacement;
        this.playerCollisionRecoveryTimer = updatedPlayer.recoveryTimer;
      }

      // Read back state to AI participants
      for (const ai of this.localAIRacers) {
        const updatedAI = this.collisionSystem.getParticipant(ai.id);
        if (updatedAI) {
          ai.currentLateral = updatedAI.lateralOffset;
          ai.speed = updatedAI.speed;
          ai.collisionCooldown = updatedAI.collisionCooldown;
          ai.angularVelocity = updatedAI.angularVelocity;
          ai.angularDisplacement = updatedAI.angularDisplacement;
          ai.recoveryTimer = updatedAI.recoveryTimer;
          ai.shield = updatedAI.shield;
          ai.hull = updatedAI.hull;
        }
      }
    }

    if (activeEvent?.type === 'TEMPORARY_SHORTCUT' && activeEvent.shortcutTargetT && this.isRacing) {
      const shortcutGateSample = this.track.getSampleAt(activeEvent.sectorStartT);
      const shipPos = this.playerShipGroup.position;
      if (shipPos.distanceTo(shortcutGateSample.point) < 11.0) {
        sound.playWormholeWarp();
        this.splineT = activeEvent.shortcutTargetT;
        this.currentSpeed = Math.min(130, this.currentSpeed + 35);
        this.cameraShake = 0.6;
        this.callbacks.onShortcutUsed?.(activeEvent.title);
      }
    }

    if (this.input.selectRouteDirection) {
      const success = this.junctionManager.selectRouteByDirection(this.input.selectRouteDirection);
      if (success) {
        sound.playRouteSelected();
        const selRoute = this.junctionManager.activeJunctionTelemetry?.availableRoutes.find(
          r => r.id === this.junctionManager.playerRouteProgress.activeRouteId
        );
        if (selRoute) {
          this.callbacks.onRouteSelected?.(selRoute.name, selRoute.direction);
        }
      }
      this.input.selectRouteDirection = undefined;
    }

    if (this.input.recover) {
      this.lateralOffset = 0;
      this.currentSpeed = 20;
      this.input.recover = false;
    }

    if (this.junctionManager.playerRouteProgress.isInBranch) {
      const branchUpdate = this.junctionManager.updateRouteProgress(dt, this.currentSpeed, (cpIndices) => {
        cpIndices.forEach(cpIdx => {
          this.checkpointsPassedThisLap.add(cpIdx);
          if (this.nextCheckpointIdx === cpIdx) {
            this.nextCheckpointIdx = (this.nextCheckpointIdx + 1) % this.track.checkpoints.length;
            this.callbacks.onCheckpointUpdate(this.nextCheckpointIdx, this.track.checkpoints.length);
            sound.playCheckpoint();
          }
        });
      });

      if (branchUpdate.finishedBranch) {
        this.splineT = branchUpdate.rejoinSplineT;
        this.callbacks.onShortcutUsed?.(this.junctionManager.feedbackMessage || 'ROUTE COMPLETED');
        sound.playCheckpoint();
      } else {
        const junc = this.junctionManager.junctions.get(this.junctionManager.playerRouteProgress.activeJunctionId || '');
        if (junc) {
          const startT = junc.config.junctionStartT;
          const endT = junc.config.junctionEndT;
          const effEndT = endT < startT ? endT + 1.0 : endT;
          const interpT = startT + this.junctionManager.playerRouteProgress.progress * (effEndT - startT);
          this.splineT = ((interpT % 1.0) + 1.0) % 1.0;
        }
      }
    } else {
      const progressAdvance = (this.currentSpeed * dt) / this.track.totalLength;
      this.splineT = (this.splineT + progressAdvance) % 1.0;
    }

    this.totalDistanceTraveled += this.currentSpeed * dt;

    const distM = Math.floor(this.totalDistanceTraveled);
    this.callbacks.onDistanceUpdate?.(distM);

    const milestones = [
      { dist: 250, label: '250m - Sublight Barrier Broken!' },
      { dist: 500, label: '500m - Warp Threshold Passed!' },
      { dist: 1000, label: '1000m - Cosmic Frontier Reached!' },
      { dist: 2000, label: '2000m - Deep Void Master!' },
      { dist: 3500, label: '3500m - Dimensional Ascendant!' },
      { dist: 5000, label: '5000m - Void Legend!' },
    ];
    for (const m of milestones) {
      if (distM >= m.dist && !this.reachedMilestones.has(m.dist)) {
        this.reachedMilestones.add(m.dist);
        this.sessionCredits += 100;
        this.callbacks.onCreditCollected?.(this.sessionCredits, 100);
        this.callbacks.onMilestoneReached?.(m.label);
        sound.playFinish();
        break;
      }
    }

    this.updateShipTransform(dt);

    const sampleAfter = this.track.getSampleAt(this.splineT);
    const shipHeading = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerShipGroup.quaternion);
    const forwardAlignment = shipHeading.dot(sampleAfter.tangent);
    if (forwardAlignment < -0.35 && (this.currentSpeed > 5 || this.input.throttle !== 0)) {
      this.wrongWayTimer += dt;
      if (this.wrongWayTimer > 0.4 && !this.isWrongWay) {
        this.isWrongWay = true;
        sound.playWrongWayAlert();
        this.callbacks.onWrongWayUpdate?.(true);
      }
    } else {
      this.wrongWayTimer = 0;
      if (this.isWrongWay) {
        this.isWrongWay = false;
        this.callbacks.onWrongWayUpdate?.(false);
      }
    }

    this.checkTrackTriggers();

    const speedNorm = this.currentSpeed / maxNormalSpeed;
    sound.updateEngine(speedNorm, this.isBoosting);

    const speedKmH = Math.round(this.currentSpeed * 3.6);
    if (speedKmH > this.maxSpeedReached) {
      this.maxSpeedReached = speedKmH;
    }
    this.callbacks.onSpeedUpdate(speedKmH);

    if (this.isRacing) {
      const pos = this.playerShipGroup.position;
      const quat = this.playerShipGroup.quaternion;
      const raceState: PlayerRaceState = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        qx: quat.x,
        qy: quat.y,
        qz: quat.z,
        qw: quat.w,
        speed: speedKmH,
        boost: Math.round(this.boostEnergy),
        isBoosting: this.isBoosting,
        isDrifting: this.isDrifting,
        lap: this.currentLap,
        currentCheckpoint: this.nextCheckpointIdx,
        progressDistance: this.totalDistanceTraveled,
        currentRouteId: this.junctionManager.playerRouteProgress.activeRouteId,
        junctionId: this.junctionManager.playerRouteProgress.activeJunctionId,
      };
      networkClient.sendPlayerUpdate(raceState);
    }
  }

  private updateShipTransform(dt: number) {
    if (!this.playerShipGroup) return;

    let sample: SamplePoint;
    const hoverHeight = 1.6 + Math.sin(Date.now() * 0.006) * 0.15;
    const prp = this.junctionManager.playerRouteProgress;

    if (prp.isInBranch && prp.branchRouteInstance) {
      const branchSample = prp.branchRouteInstance.getSampleAt(prp.progress);
      if (prp.transitionBlend < 1.0) {
        const mainSample = this.track.getSampleAt(this.splineT);
        const tBlend = prp.transitionBlend;
        const blendedPoint = mainSample.point.clone().lerp(branchSample.point, tBlend);
        const blendedTangent = mainSample.tangent.clone().lerp(branchSample.tangent, tBlend).normalize();
        const blendedNormal = mainSample.normal.clone().lerp(branchSample.normal, tBlend).normalize();
        const blendedBinormal = mainSample.binormal.clone().lerp(branchSample.binormal, tBlend).normalize();
        sample = { t: prp.progress, point: blendedPoint, tangent: blendedTangent, normal: blendedNormal, binormal: blendedBinormal };
      } else {
        sample = branchSample;
      }
    } else {
      sample = this.track.getSampleAt(this.splineT);
    }

    _shipOffsetBinormal.copy(sample.binormal).multiplyScalar(this.lateralOffset);
    _shipOffsetNormal.copy(sample.normal).multiplyScalar(hoverHeight);
    _shipPos.copy(sample.point).add(_shipOffsetBinormal).add(_shipOffsetNormal);

    if (isFinite(_shipPos.x) && isFinite(_shipPos.y) && isFinite(_shipPos.z)) {
      this.playerShipGroup.position.copy(_shipPos);
    }

    const targetRoll = -this.input.steer * (this.isDrifting ? 0.75 : 0.45);
    this.shipRoll = THREE.MathUtils.lerp(this.shipRoll, targetRoll, 0.12);

    _shipNegTangent.copy(sample.tangent).negate();
    if (sample.binormal.lengthSq() > 0.001 && sample.normal.lengthSq() > 0.001 && _shipNegTangent.lengthSq() > 0.001) {
      _shipRotMatrix.makeBasis(sample.binormal, sample.normal, _shipNegTangent);
      this.playerShipGroup.quaternion.setFromRotationMatrix(_shipRotMatrix);
    }

    this.playerShipGroup.rotateZ(this.shipRoll);
    if (Math.abs(this.playerCollisionAngularDisplacement) > 0.001) {
      this.playerShipGroup.rotateY(this.playerCollisionAngularDisplacement);
    }

    const flameScale = 0.8 + this.currentSpeed / 40 + (this.isBoosting ? 1.6 : 0);
    this.playerThrusters.forEach(flame => {
      flame.scale.set(1 + (this.isBoosting ? 0.6 : 0), flameScale, 1 + (this.isBoosting ? 0.6 : 0));
    });
  }

  private checkTrackTriggers() {
    if (!this.playerShipGroup || !this.isRacing || this.hasFinished) return;
    const shipPos = this.playerShipGroup.position;

    // Check main track boost pads
    for (const pad of this.track.boostPads) {
      if (shipPos.distanceTo(pad.position) < 8.0) {
        const shipConfig = getEffectiveShipStats(
          getShipConfig(this.localShipId),
          this.localUpgrades
        );
        this.currentSpeed = Math.min((shipConfig.topSpeed / 3.6) * 1.55, this.currentSpeed + 25);
        this.boostEnergy = Math.min(100, this.boostEnergy + 20);
        this.cameraShake = 0.4;
        sound.playBoostPad();
        break;
      }
    }

    // Check branch route boost pads
    const prp = this.junctionManager.playerRouteProgress;
    if (prp.isInBranch && prp.branchRouteInstance) {
      for (const padPos of prp.branchRouteInstance.boostPadPositions) {
        if (shipPos.distanceTo(padPos) < 7.5) {
          const shipConfig = getEffectiveShipStats(
            getShipConfig(this.localShipId),
            this.localUpgrades
          );
          this.currentSpeed = Math.min((shipConfig.topSpeed / 3.6) * 1.6, this.currentSpeed + 28);
          this.boostEnergy = Math.min(100, this.boostEnergy + 25);
          this.cameraShake = 0.45;
          sound.playBoostPad();
          break;
        }
      }
    }

    const nextGate = this.track.checkpoints[this.nextCheckpointIdx];
    if (nextGate) {
      const dist = shipPos.distanceTo(nextGate.position);
      if (dist < nextGate.width) {
        sound.playCheckpoint();
        this.latestValidCheckpoint = {
          idx: this.nextCheckpointIdx,
          t: nextGate.t,
          pos: nextGate.position.clone(),
        };
        this.checkpointsPassedThisLap.add(this.nextCheckpointIdx);
        this.nextCheckpointIdx = (this.nextCheckpointIdx + 1) % this.track.checkpoints.length;
        this.callbacks.onCheckpointUpdate(this.nextCheckpointIdx, this.track.checkpoints.length);

        if (this.nextCheckpointIdx === 1) {
          const now = Date.now();
          if (this.lapStartTime > 0) {
            const lapDuration = now - this.lapStartTime;
            if (this.bestLapTime === 0 || lapDuration < this.bestLapTime) {
              this.bestLapTime = lapDuration;
            }
          }
          this.lapStartTime = now;
          this.checkpointsPassedThisLap.clear();

          if (this.currentLap >= this.totalLaps) {
            this.hasFinished = true;
            this.currentLap = this.totalLaps + 1;
            const finalTime = Date.now() - this.raceStartTime;
            sound.playFinish();
            this.callbacks.onRaceFinish(finalTime);
          } else {
            this.currentLap++;
            this.callbacks.onLapUpdate(this.currentLap, this.totalLaps);
          }
        }
      }
    }
  }

  public syncRemotePlayers(players: Record<string, PlayerInfo>, localId: string) {
    const activeRemoteIds = new Set<string>();

    for (const [pid, player] of Object.entries(players)) {
      if (pid === localId) {
        if (player.raceState?.rank) {
          this.callbacks.onRankUpdate(player.raceState.rank, Object.keys(players).length);
        }
        continue;
      }

      activeRemoteIds.add(pid);
      let remote = this.remoteShips.get(pid);

      if (!remote) {
        const shipGroup = createShipMesh(
          player.shipId || 'apex_phantom',
          player.color || '#ff0055',
          player.secondaryColor || '#00f0ff',
          player.decal || 'none'
        );
        this.scene.add(shipGroup);

        const thrusters: THREE.Mesh[] = [];
        shipGroup.traverse(child => {
          if (child.name === 'thruster_flame' && child instanceof THREE.Mesh) {
            thrusters.push(child);
          }
        });

        remote = {
          group: shipGroup,
          targetPos: new THREE.Vector3(0, 0, 0),
          targetQuat: new THREE.Quaternion(),
          thrusters,
        };
        this.remoteShips.set(pid, remote);
      }

      if (player.raceState) {
        const isFirstPlacement = remote.targetPos.lengthSq() === 0;
        if (player.isBot) {
          let sample: SamplePoint;
          if (player.raceState.currentRouteId && player.raceState.junctionId) {
            const junc = this.junctionManager.junctions.get(player.raceState.junctionId);
            const routeInst = junc?.routeInstances.get(player.raceState.currentRouteId);
            if (routeInst) {
              const bProg = Math.min(1.0, (player.raceState.progressDistance % routeInst.totalLength) / routeInst.totalLength);
              sample = routeInst.getSampleAt(bProg);
            } else {
              const trackLen = this.track.totalLength || 4600;
              const botT = ((player.raceState.progressDistance % trackLen) / trackLen);
              sample = this.track.getSampleAt(botT);
            }
          } else {
            const trackLen = this.track.totalLength || 4600;
            const botT = ((player.raceState.progressDistance % trackLen) / trackLen);
            sample = this.track.getSampleAt(botT);
          }

          let hash = 0;
          for (let i = 0; i < pid.length; i++) hash = (hash << 5) - hash + pid.charCodeAt(i);
          const lateral = ((Math.abs(hash) % 7) - 3) * 2.4;

          const botPos = sample.point
            .clone()
            .add(sample.binormal.clone().multiplyScalar(lateral))
            .add(sample.normal.clone().multiplyScalar(1.6));

          remote.targetPos.copy(botPos);
          const rotMatrix = new THREE.Matrix4();
          rotMatrix.makeBasis(sample.binormal, sample.normal, sample.tangent);
          remote.targetQuat.setFromRotationMatrix(rotMatrix);
        } else {
          remote.targetPos.set(player.raceState.x, player.raceState.y, player.raceState.z);
          remote.targetQuat.set(
            player.raceState.qx || 0,
            player.raceState.qy || 0,
            player.raceState.qz || 0,
            player.raceState.qw || 1
          );
        }

        if (isFirstPlacement) {
          remote.group.position.copy(remote.targetPos);
          remote.group.quaternion.copy(remote.targetQuat);
        }

        const isBoosting = !!player.raceState.isBoosting;
        const flameScale = 0.8 + (player.raceState.speed || 0) / 120 + (isBoosting ? 1.4 : 0);
        remote.thrusters.forEach(fl => fl.scale.set(1, flameScale, 1));
      }
    }

    for (const [id, remote] of this.remoteShips.entries()) {
      if (!activeRemoteIds.has(id)) {
        this.scene.remove(remote.group);
        this.remoteShips.delete(id);
      }
    }
  }

  private updateRemotePlayersInterpolation(dt: number) {
    const lerpRate = Math.min(1.0, 15 * dt);
    for (const remote of this.remoteShips.values()) {
      remote.group.position.lerp(remote.targetPos, lerpRate);
      remote.group.quaternion.slerp(remote.targetQuat, lerpRate);
    }
  }

  private updateCamera(dt: number) {
    if (this.isSpectator) {
      if (this.playerShipGroup) {
        this.playerShipGroup.visible = false;
      }

      // Collect all active observed racers (remote ships + AI bots)
      const targets: { name: string; position: THREE.Vector3; quaternion: THREE.Quaternion }[] = [];
      for (const [rId, remote] of this.remoteShips.entries()) {
        if (remote.group) {
          targets.push({
            name: `PILOT ${rId.substring(0, 4).toUpperCase()}`,
            position: remote.group.position,
            quaternion: remote.group.quaternion,
          });
        }
      }
      for (const ai of this.localAIRacers) {
        if (ai.group && !ai.isDestroyed) {
          targets.push({
            name: ai.name,
            position: ai.group.position,
            quaternion: ai.group.quaternion,
          });
        }
      }

      if (targets.length > 0) {
        const target = targets[this.spectatorTargetIndex % targets.length];
        if (this.spectatorTargetName !== target.name) {
          this.spectatorTargetName = target.name;
          this.callbacks.onSpectatorTargetChange?.(target.name);
        }

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(target.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(target.quaternion);
        const targetCamPos = target.position
          .clone()
          .add(forward.clone().multiplyScalar(-18))
          .add(up.clone().multiplyScalar(6.5));
        const lookTarget = target.position.clone().add(forward.clone().multiplyScalar(20));

        this.camera.position.lerp(targetCamPos, 0.2);
        this.camera.lookAt(lookTarget);
      } else {
        const sample = this.track.getSampleAt((Date.now() * 0.00005) % 1.0);
        this.camera.position.lerp(sample.point.clone().add(new THREE.Vector3(0, 30, 40)), 0.05);
        this.camera.lookAt(sample.point);
      }
      return;
    }

    if (!this.playerShipGroup) return;

    const sample = this.track.getSampleAt(this.splineT);
    let targetCamPos: THREE.Vector3;
    let lookTarget: THREE.Vector3;

    if (this.cameraMode === 'COCKPIT') {
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(2.0))
        .add(sample.normal.clone().multiplyScalar(1.2));
      lookTarget = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(40));
    } else if (this.cameraMode === 'CHASE_FAR') {
      const behindDistance = 20 + (this.isBoosting ? 5 : 0);
      const heightOffset = 6.8;
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(-behindDistance))
        .add(sample.normal.clone().multiplyScalar(heightOffset));
      lookTarget = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(28));
    } else {
      const behindDistance = 14 + (this.isBoosting ? 4 : 0);
      const heightOffset = 5.2;
      targetCamPos = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(-behindDistance))
        .add(sample.normal.clone().multiplyScalar(heightOffset));
      lookTarget = this.playerShipGroup.position
        .clone()
        .add(sample.tangent.clone().multiplyScalar(25));
    }

    if (this.cameraShakeEnabled && this.cameraShake > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.cameraShake * 1.5;
      targetCamPos.y += (Math.random() - 0.5) * this.cameraShake * 1.5;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
    }

    const lerpRate = this.cameraMode === 'COCKPIT' ? 0.35 : 0.15;
    this.camera.position.lerp(targetCamPos, lerpRate);
    this.camera.lookAt(lookTarget);

    const targetCamRoll = -this.input.steer * (this.isDrifting ? 0.22 : 0.14);
    this.cameraRoll = THREE.MathUtils.lerp(this.cameraRoll, targetCamRoll, 0.12);
    this.camera.rotateZ(this.cameraRoll);

    const desiredFov = (this.isBoosting ? 82 : this.cameraMode === 'COCKPIT' ? 74 : 65) + this.collisionFovPunch;
    this.collisionFovPunch = Math.max(0, this.collisionFovPunch - dt * 22);
    this.targetFov = THREE.MathUtils.lerp(this.targetFov, desiredFov, 0.16);
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = this.targetFov;
      this.camera.updateProjectionMatrix();
    }
  }

  private updateSpeedParticles() {
    if (!this.speedParticles || !this.playerShipGroup) return;
    this.speedParticles.position.copy(this.playerShipGroup.position);
    this.speedParticles.visible = this.currentSpeed > 30;
  }

  private updateAsteroids(dt: number) {
    if (this.asteroidInstancedMesh) {
      const obstacles = this.track.obstacles;
      const count = Math.min(obstacles.length, this.asteroidPoolSize);
      const shipPos = this.playerShipGroup ? this.playerShipGroup.position : null;

      for (let i = 0; i < count; i++) {
        const ast = obstacles[i];
        if (!ast) continue;

        // Destroyed Asteroids: hidden from rendering & collisions
        if (ast.isDestroyed || ast.health <= 0) {
          if (ast.respawnTimer !== undefined && ast.respawnTimer > 0) {
            ast.respawnTimer -= dt;
            if (ast.respawnTimer <= 0 && (!shipPos || shipPos.distanceTo(ast.position) > 40)) {
              ast.isDestroyed = false;
              ast.health = ast.maxHealth;
            }
          }
          this.dummyObj.position.set(0, -9999, 0);
          this.dummyObj.scale.set(0, 0, 0);
          this.dummyObj.updateMatrix();
          this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
          continue;
        }

        if (!ast.currentRotation) ast.currentRotation = new THREE.Vector3();
        ast.currentRotation.x += ast.rotationSpeed.x;
        ast.currentRotation.y += ast.rotationSpeed.y;
        ast.currentRotation.z += ast.rotationSpeed.z;

        if (ast.isDynamicSwarm && ast.basePosition && ast.driftVelocity) {
          const time = this.totalTimeElapsed * 1.4 + i;
          ast.position.x = ast.basePosition.x + Math.sin(time) * ast.driftVelocity.x;
          ast.position.y = ast.basePosition.y + Math.cos(time * 0.8) * ast.driftVelocity.y;
          ast.position.z = ast.basePosition.z + Math.sin(time * 1.1) * ast.driftVelocity.z;
        }

        // Damage crack or flash feedback
        let displayRadius = ast.radius;
        if (ast.hitFlashTimer && ast.hitFlashTimer > 0) {
          ast.hitFlashTimer = Math.max(0, ast.hitFlashTimer - dt);
          displayRadius *= 1.08 + Math.sin(this.totalTimeElapsed * 40) * 0.05;
        }

        this.dummyObj.position.copy(ast.position);
        this.dummyObj.rotation.set(
          ast.currentRotation.x,
          ast.currentRotation.y,
          ast.currentRotation.z
        );
        this.dummyObj.scale.setScalar(displayRadius);
        this.dummyObj.updateMatrix();
        this.asteroidInstancedMesh.setMatrixAt(i, this.dummyObj.matrix);
      }
      this.asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.shortcutPortalGroup) {
      const shortcutEv = this.track.dynamicEvents.find(e => e.type === 'TEMPORARY_SHORTCUT');
      if (shortcutEv) {
        this.shortcutPortalGroup.visible = shortcutEv.active;
        if (shortcutEv.active) {
          const ring = this.shortcutPortalGroup.getObjectByName('portal_ring');
          const disc = this.shortcutPortalGroup.getObjectByName('portal_disc');
          if (ring) ring.rotation.z += 0.04;
          if (disc) {
            disc.rotation.z -= 0.02;
            const pulse = 0.85 + Math.sin(this.totalTimeElapsed * 6) * 0.15;
            disc.scale.set(pulse, pulse, pulse);
          }
        }
      }
    }
  }

  private updatePowerUps(dt: number) {
    if (!this.isRacing) return;
    let updated = false;

    if (this.phaseShieldTimer > 0) {
      this.phaseShieldTimer = Math.max(0, this.phaseShieldTimer - dt);
      updated = true;
    }
    if (this.shieldMeshGroup) {
      this.shieldMeshGroup.visible = this.phaseShieldTimer > 0;
      if (this.shieldMeshGroup.visible) {
        this.shieldMeshGroup.rotation.y += 0.03;
        this.shieldMeshGroup.rotation.x += 0.015;
      }
    }

    if (this.creditMagnetTimer > 0) {
      this.creditMagnetTimer = Math.max(0, this.creditMagnetTimer - dt);
      updated = true;
    }

    if (this.hyperBoostTimer > 0) {
      this.hyperBoostTimer = Math.max(0, this.hyperBoostTimer - dt);
      updated = true;
    }

    if (this.nitroBoostTimer > 0) {
      this.nitroBoostTimer = Math.max(0, this.nitroBoostTimer - dt);
      updated = true;
    }

    if (this.empPulseTimer > 0) {
      this.empPulseTimer = Math.max(0, this.empPulseTimer - dt);
      updated = true;
    }

    if (this.timeWarpTimer > 0) {
      this.timeWarpTimer = Math.max(0, this.timeWarpTimer - dt);
      updated = true;
    }

    if (this.gravityBurstTimer > 0) {
      this.gravityBurstTimer = Math.max(0, this.gravityBurstTimer - dt);
      updated = true;
    }

    if (this.decoyTimer > 0) {
      this.decoyTimer = Math.max(0, this.decoyTimer - dt);
      updated = true;
    }

    if (this.speedSurgeTimer > 0) {
      this.speedSurgeTimer = Math.max(0, this.speedSurgeTimer - dt);
      updated = true;
    }

    const list: ActivePowerUp[] = [];
    if (this.phaseShieldTimer > 0) {
      list.push({
        type: 'ENERGY_SHIELD',
        remainingTime: Math.round(this.phaseShieldTimer * 10) / 10,
        totalDuration: this.phaseShieldTotal,
      });
    }
    if (this.creditMagnetTimer > 0) {
      list.push({
        type: 'MAGNET_BOOST',
        remainingTime: Math.round(this.creditMagnetTimer * 10) / 10,
        totalDuration: this.creditMagnetTotal,
      });
    }
    if (this.nitroBoostTimer > 0) {
      list.push({
        type: 'NITRO_BOOST',
        remainingTime: Math.round(this.nitroBoostTimer * 10) / 10,
        totalDuration: this.nitroBoostTotal,
      });
    }
    if (this.empPulseTimer > 0) {
      list.push({
        type: 'EMP_PULSE',
        remainingTime: Math.round(this.empPulseTimer * 10) / 10,
        totalDuration: 4.0,
      });
    }
    if (this.timeWarpTimer > 0) {
      list.push({
        type: 'TIME_WARP',
        remainingTime: Math.round(this.timeWarpTimer * 10) / 10,
        totalDuration: 4.5,
      });
    }
    if (this.gravityBurstTimer > 0) {
      list.push({
        type: 'GRAVITY_BURST',
        remainingTime: Math.round(this.gravityBurstTimer * 10) / 10,
        totalDuration: 6.0,
      });
    }
    if (this.decoyTimer > 0) {
      list.push({
        type: 'DECOY_SHIP',
        remainingTime: Math.round(this.decoyTimer * 10) / 10,
        totalDuration: 6.0,
      });
    }
    if (this.speedSurgeTimer > 0 || this.hyperBoostTimer > 0) {
      list.push({
        type: 'TEMPORARY_SPEED_SURGE',
        remainingTime: Math.round(Math.max(this.speedSurgeTimer, this.hyperBoostTimer) * 10) / 10,
        totalDuration: 5.0,
      });
    }

    if (updated || list.length !== this.activePowerUpsList.length) {
      this.activePowerUpsList = list;
      this.callbacks.onPowerUpsUpdate?.(list);
    }
  }

  private updateCredits(dt: number) {
    if (!this.creditsInstancedMesh || !this.playerShipGroup) return;
    const credits = this.track.credits;
    if (!credits || credits.length === 0) return;

    const shipPos = this.playerShipGroup.position;
    const magnetActive = this.creditMagnetTimer > 0;
    const magnetRadius = magnetActive
      ? 28 + (this.localUpgrades.magnetRange || 0) * 8
      : 3.2;

    let needsUpdate = false;
    for (let i = 0; i < credits.length; i++) {
      const c = credits[i];
      if (c.collected) continue;

      c.rotation = (c.rotation || 0) + dt * 2.5;
      const dist = shipPos.distanceTo(c.position);

      if (magnetActive && dist < magnetRadius && dist > 1.0) {
        const pullDir = shipPos.clone().sub(c.position).normalize();
        const pullSpeed = (1 - dist / magnetRadius) * 45 + 15;
        c.position.add(pullDir.multiplyScalar(pullSpeed * dt));
        needsUpdate = true;
      }

      if (dist < 3.2) {
        c.collected = true;
        this.sessionCredits += c.value;
        sound.playCreditPickup();
        this.triggerCollisionBurst(c.position, 0xffea00, 16);
        this.callbacks.onCreditCollected?.(this.sessionCredits, c.value);

        this.creditsDummy.position.set(0, -9999, 0);
        this.creditsDummy.scale.set(0, 0, 0);
        this.creditsDummy.updateMatrix();
        this.creditsInstancedMesh.setMatrixAt(i, this.creditsDummy.matrix);
        needsUpdate = true;
        continue;
      }

      this.creditsDummy.position.copy(c.position);
      this.creditsDummy.rotation.set(0.4, c.rotation, 0);
      this.creditsDummy.scale.setScalar(1.0);
      this.creditsDummy.updateMatrix();
      this.creditsInstancedMesh.setMatrixAt(i, this.creditsDummy.matrix);
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.creditsInstancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private updatePowerUpPods(dt: number) {
    if (!this.playerShipGroup || this.powerUpPodGroups.length === 0) return;
    if (!this.powerUpsEnabled) {
      this.powerUpPodGroups.forEach(g => {
        if (g) g.visible = false;
      });
      return;
    }
    const pods = this.track.powerUpPods;
    const shipPos = this.playerShipGroup.position;

    pods.forEach((pod, idx) => {
      const group = this.powerUpPodGroups[idx];
      if (!group) return;

      group.visible = !pod.collected;
      if (!pod.collected) {
        const halo = group.getObjectByName('halo_ring');
        const core = group.getObjectByName('core_icon');
        const capsule = group.getObjectByName('capsule_shield');

        if (halo) halo.rotation.y += 0.04;
        if (core) {
          core.rotation.y += 0.05;
          core.rotation.x += 0.02;
        }
        if (capsule) capsule.rotation.z += 0.02;

        group.position.y = pod.position.y + Math.sin(this.totalTimeElapsed * 4 + idx) * 0.4;

        if (this.isRacing && shipPos.distanceTo(group.position) < 4.5) {
          pod.collected = true;
          this.activatePowerUp(pod.type);
          this.callbacks.onPowerUpCollected?.(pod.type);
          const burstColor =
            pod.type === 'NITRO_BOOST'
              ? 0xff5500
              : pod.type === 'ENERGY_SHIELD' || pod.type === 'PHASE_SHIELD'
              ? 0x00f0ff
              : pod.type === 'REPAIR_CORE'
              ? 0x39ff14
              : pod.type === 'MAGNET_BOOST' || pod.type === 'CREDIT_MAGNET'
              ? 0xd000ff
              : pod.type === 'EMP_PULSE'
              ? 0x00e5ff
              : pod.type === 'TIME_WARP'
              ? 0x9d4edd
              : pod.type === 'GRAVITY_BURST'
              ? 0xffcc00
              : pod.type === 'DECOY_SHIP'
              ? 0xff007f
              : 0xff0055;
          this.triggerCollisionBurst(group.position, burstColor, 28);
        }
      }
    });
  }

  public activatePowerUp(type: PowerUpType) {
    if (type === 'NITRO_BOOST') {
      this.nitroBoostTotal = 3.5;
      this.nitroBoostTimer = this.nitroBoostTotal;
      const shipConfig = getEffectiveShipStats(getShipConfig(this.localShipId), this.localUpgrades);
      this.currentSpeed = Math.min((shipConfig.topSpeed / 3.6) * 1.5, this.currentSpeed + 28);
      this.boostEnergy = Math.min(100, this.boostEnergy + 35);
      if (this.cameraShakeEnabled) this.cameraShake = 0.55;
      sound.playNitroBoost();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xff5500, 32);
      }
    } else if (type === 'ENERGY_SHIELD' || type === 'PHASE_SHIELD') {
      this.phaseShieldTotal = 7.0 + (this.localUpgrades.shieldDuration || 0) * 1.5;
      this.phaseShieldTimer = this.phaseShieldTotal;
      this.damageZones.shieldCore = 100;
      this.callbacks.onDamageZonesUpdate?.(this.damageZones);
      sound.playShieldActivate();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x00f0ff, 28);
      }
    } else if (type === 'REPAIR_CORE') {
      this.hullHealth = Math.min(100, this.hullHealth + 50);
      this.damageZones = {
        frontHull: Math.max(0, this.damageZones.frontHull - 60),
        rearEngine: Math.max(0, this.damageZones.rearEngine - 60),
        leftWing: Math.max(0, this.damageZones.leftWing - 60),
        rightWing: Math.max(0, this.damageZones.rightWing - 60),
        shieldCore: 100,
      };
      this.callbacks.onHullUpdate?.(this.hullHealth);
      this.callbacks.onDamageZonesUpdate?.(this.damageZones);
      sound.playRepairCore();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x39ff14, 30);
      }
    } else if (type === 'MAGNET_BOOST' || type === 'CREDIT_MAGNET') {
      this.creditMagnetTotal = 9.0 + (this.localUpgrades.magnetRange || 0) * 1.5;
      this.creditMagnetTimer = this.creditMagnetTotal;
      sound.playMagnetPulse();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xd000ff, 26);
      }
    } else if (type === 'EMP_PULSE') {
      this.empPulseTimer = 4.0;
      sound.playEMPPulse();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x00e5ff, 48);
        const myPos = this.playerShipGroup.position;
        for (const ai of this.localAIRacers) {
          if (ai.group.position.distanceTo(myPos) < 38) {
            ai.speed = Math.max(15, ai.speed * 0.55);
            this.triggerCollisionBurst(ai.group.position, 0x00e5ff, 20);
          }
        }
      }
    } else if (type === 'TIME_WARP') {
      this.timeWarpTimer = 4.5;
      sound.playTimeWarp();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0x9d4edd, 36);
      }
    } else if (type === 'GRAVITY_BURST') {
      this.gravityBurstTimer = 6.0;
      sound.playGravityBurst();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xffcc00, 32);
      }
    } else if (type === 'DECOY_SHIP') {
      this.decoyTimer = 6.0;
      sound.playDecoySpawn();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xff007f, 36);
      }
    } else if (type === 'TEMPORARY_SPEED_SURGE' || type === 'HYPER_BOOST') {
      this.speedSurgeTimer = 5.0;
      this.hyperBoostTotal = 5.0;
      this.hyperBoostTimer = this.hyperBoostTotal;
      this.currentSpeed = Math.min(138, this.currentSpeed + 38);
      if (this.cameraShakeEnabled) this.cameraShake = 0.6;
      sound.playHyperBoost();
      if (this.playerShipGroup) {
        this.triggerCollisionBurst(this.playerShipGroup.position, 0xff0055, 36);
      }
    }
  }

  public applyZoneDamage(zone: keyof ShipDamageZones, amount: number) {
    if (this.invulnerableTimer > 0 || this.isDestroyed || this.isSpectator) return;

    if (this.phaseShieldTimer > 0) {
      sound.playShieldDeflect();
      return;
    }

    let remaining = amount;
    if (this.damageZones.shieldCore > 0) {
      const absorbed = Math.min(this.damageZones.shieldCore, remaining);
      this.damageZones.shieldCore = Math.max(0, this.damageZones.shieldCore - absorbed);
      remaining -= absorbed;
      sound.playShieldHit();
    }

    if (remaining > 0) {
      if (zone === 'shieldCore') {
        this.damageZones.shieldCore = Math.max(0, this.damageZones.shieldCore - remaining);
      } else {
        this.damageZones[zone] = Math.min(100, this.damageZones[zone] + remaining);
      }

      const avgDamage = (
        this.damageZones.frontHull * 0.35 +
        this.damageZones.rearEngine * 0.25 +
        this.damageZones.leftWing * 0.20 +
        this.damageZones.rightWing * 0.20
      );
      this.hullHealth = Math.max(0, Math.round(100 - avgDamage));
      this.callbacks.onHullUpdate?.(this.hullHealth);

      if (this.damageZones.frontHull >= 100 || this.hullHealth <= 0) {
        this.destroyPlayerShip('CRITICAL COMPONENT DAMAGE BREACH');
        return;
      }
    }

    this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
  }

  public cycleSpectatorTarget() {
    this.spectatorTargetIndex++;
  }

  private updateThrusterParticles(dt: number) {
    if (
      !this.thrusterPositionsArray ||
      !this.thrusterColorsArray ||
      !this.thrusterTrailsPoints ||
      !this.playerShipGroup
    )
      return;

    const sample = this.track.getSampleAt(this.splineT);
    const flameCfg = THRUSTER_FLAME_CONFIGS.find(t => t.id === this.localThrusterColor);
    const flameColor = new THREE.Color(flameCfg ? flameCfg.hex : 0x00f0ff);

    if (this.currentSpeed > 5 && this.isRacing) {
      const leftNozzle = this.playerShipGroup.position
        .clone()
        .add(sample.binormal.clone().multiplyScalar(-1.2))
        .add(sample.tangent.clone().multiplyScalar(-2.8));
      const rightNozzle = this.playerShipGroup.position
        .clone()
        .add(sample.binormal.clone().multiplyScalar(1.2))
        .add(sample.tangent.clone().multiplyScalar(-2.8));

      const nozzles = [leftNozzle, rightNozzle];
      for (let n = 0; n < nozzles.length; n++) {
        for (let i = 0; i < this.thrusterParticles.length; i++) {
          const p = this.thrusterParticles[i];
          if (p.life <= 0) {
            p.pos.copy(nozzles[n]);
            p.maxLife = 0.3 + (this.isBoosting ? 0.25 : 0.15);
            p.life = p.maxLife;

            const backward = sample.tangent.clone().negate().multiplyScalar(this.currentSpeed * 0.4 + 10);
            backward.add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
              )
            );
            p.vel.copy(backward);
            break;
          }
        }
      }
    }

    for (let i = 0; i < this.thrusterParticles.length; i++) {
      const p = this.thrusterParticles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.add(p.vel.clone().multiplyScalar(dt));
        const alpha = Math.max(0, p.life / p.maxLife);
        this.thrusterPositionsArray[i * 3] = p.pos.x;
        this.thrusterPositionsArray[i * 3 + 1] = p.pos.y;
        this.thrusterPositionsArray[i * 3 + 2] = p.pos.z;
        this.thrusterColorsArray[i * 3] = flameColor.r * alpha;
        this.thrusterColorsArray[i * 3 + 1] = flameColor.g * alpha;
        this.thrusterColorsArray[i * 3 + 2] = flameColor.b * alpha;
      } else {
        this.thrusterPositionsArray[i * 3 + 1] = -9999;
      }
    }
    this.thrusterTrailsPoints.geometry.attributes.position.needsUpdate = true;
    this.thrusterTrailsPoints.geometry.attributes.color.needsUpdate = true;
  }

  private updateCollisionSparks(dt: number) {
    if (
      !this.sparkPositionsArray ||
      !this.sparkColorsArray ||
      !this.collisionSparksPoints
    )
      return;

    for (let i = 0; i < this.collisionSparks.length; i++) {
      const s = this.collisionSparks[i];
      if (s.life > 0) {
        s.life -= dt;
        s.pos.add(s.vel.clone().multiplyScalar(dt));
        s.vel.y -= 9.8 * dt * 0.6;
        const alpha = Math.max(0, s.life / s.maxLife);
        this.sparkPositionsArray[i * 3] = s.pos.x;
        this.sparkPositionsArray[i * 3 + 1] = s.pos.y;
        this.sparkPositionsArray[i * 3 + 2] = s.pos.z;
        this.sparkColorsArray[i * 3] = s.color.r * alpha;
        this.sparkColorsArray[i * 3 + 1] = s.color.g * alpha;
        this.sparkColorsArray[i * 3 + 2] = s.color.b * alpha;
      } else {
        this.sparkPositionsArray[i * 3 + 1] = -9999;
      }
    }
    this.collisionSparksPoints.geometry.attributes.position.needsUpdate = true;
    this.collisionSparksPoints.geometry.attributes.color.needsUpdate = true;
  }

  public destroyPlayerShip(reason: string = 'HULL BREACHED') {
    if (this.invulnerableTimer > 0 || this.isDestroyed) return;
    this.isDestroyed = true;
    this.respawnTimer = 1.8;
    this.currentSpeed = 0;
    this.isBoosting = false;
    this.isDrifting = false;
    this.driftChargeTime = 0;
    this.playerCollisionAngularVelocity = 0;
    this.playerCollisionAngularDisplacement = 0;
    this.playerCollisionRecoveryTimer = 0;
    sound.playExplosion();

    const shipPos = this.playerShipGroup?.position || new THREE.Vector3();
    this.triggerCollisionBurst(shipPos, 0xff0055, 60);
    this.triggerCollisionBurst(shipPos, 0x00f0ff, 30);

    if (this.cameraShakeEnabled) {
      this.cameraShake = 1.3;
    }
    if (this.playerShipGroup) {
      this.playerShipGroup.visible = false;
    }

    this.callbacks.onShipDestroyed?.(reason, 1.8);
    this.callbacks.onSpeedUpdate(0);
  }

  public respawnPlayerShip() {
    this.isDestroyed = false;
    this.respawnTimer = 0;
    this.splineT = this.latestValidCheckpoint.t;
    this.lateralOffset = 0;
    this.currentSpeed = 16;
    this.hullHealth = 100;
    this.invulnerableTimer = 2.5;
    this.shipRoll = 0;
    this.playerCollisionAngularVelocity = 0;
    this.playerCollisionAngularDisplacement = 0;
    this.playerCollisionRecoveryTimer = 0;
    this.collisionCooldown = 1.5;
    this.cameraShake = 0;
    this.collisionFovPunch = 0;

    if (this.playerShipGroup) {
      this.playerShipGroup.visible = true;
    }
    sound.playRespawn();

    const safePos = this.playerShipGroup?.position || new THREE.Vector3();
    this.triggerCollisionBurst(safePos, 0x00f0ff, 40);

    this.callbacks.onShipRespawned?.();
    this.callbacks.onHullUpdate?.(100);
    this.damageZones.shieldCore = 100;
    this.callbacks.onDamageZonesUpdate?.({ ...this.damageZones });
    this.callbacks.onWrongWayUpdate?.(false);
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
  }

  public toggleCameraMode(): CameraMode {
    if (this.cameraMode === 'CHASE_NEAR') {
      this.cameraMode = 'CHASE_FAR';
    } else if (this.cameraMode === 'CHASE_FAR') {
      this.cameraMode = 'COCKPIT';
    } else {
      this.cameraMode = 'CHASE_NEAR';
    }
    this.callbacks.onCameraModeChange?.(this.cameraMode);
    return this.cameraMode;
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    this.callbacks.onCameraModeChange?.(this.cameraMode);
  }

  public setCameraShakeEnabled(enabled: boolean) {
    this.cameraShakeEnabled = enabled;
  }

  public graphicsQuality: GraphicsQuality = 'HIGH';
  public setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
    const pixelRatio =
      quality === 'LOW'
        ? 1.0
        : quality === 'MEDIUM'
        ? Math.min(window.devicePixelRatio, 1.25)
        : Math.min(window.devicePixelRatio, 2.0);
    this.renderer.setPixelRatio(pixelRatio);
    if (this.container) {
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
  }

  public getGraphicsQuality(): GraphicsQuality {
    return this.graphicsQuality;
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public triggerGameOver(reason: string = 'HULL BREACHED') {
    this.isRacing = false;
    sound.stopEngine();
    sound.playGameOver();

    const stats: RunStats = {
      distance: Math.floor(this.totalDistanceTraveled),
      creditsCollected: this.sessionCredits,
      topSpeed: this.maxSpeedReached,
      survivalTime: Math.floor((Date.now() - this.raceStartTime) / 1000),
      obstaclesAvoided: Math.max(0, Math.floor(this.totalDistanceTraveled / 40) - this.hitCount),
      reason,
    };
    this.callbacks.onGameOver?.(stats);
  }

  public restartGame() {
    this.sessionCredits = 0;
    this.hullHealth = 100;
    this.hitCount = 0;
    this.maxSpeedReached = 0;
    this.reachedMilestones.clear();
    this.phaseShieldTimer = 0;
    this.creditMagnetTimer = 0;
    this.hyperBoostTimer = 0;
    this.activePowerUpsList = [];

    this.callbacks.onHullUpdate?.(100);
    this.callbacks.onPowerUpsUpdate?.([]);
    this.callbacks.onDistanceUpdate?.(0);

    this.buildCreditsField();
    this.buildPowerUpPods();
    this.resetToStart();
    this.startRace();
  }

  public pauseGame() {
    this.isPaused = true;
    sound.stopEngine();
  }

  public resumeGame() {
    this.isPaused = false;
    if (this.isRacing) {
      sound.startEngine();
    }
  }

  public startAIRace(config: AIRaceConfig) {
    this.totalLaps = config.laps || 2;
    this.setTrack(config.trackId);
    this.initAIRacers(config);
    this.startRace();
  }

  public clearAIRacers() {
    this.localAIRacers.forEach(ai => {
      if (this.collisionSystem) {
        this.collisionSystem.unregisterParticipant(ai.id);
      }
      this.scene.remove(ai.group);
      ai.group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        } else if (child instanceof THREE.Sprite) {
          child.geometry?.dispose();
          if (child.material) {
            child.material.map?.dispose();
            child.material.dispose();
          }
        }
      });
    });
    this.localAIRacers = [];
    this.isAIRaceActive = false;
  }

  public initAIRacers(config: AIRaceConfig) {
    this.clearAIRacers();
    this.isAIRaceActive = true;
    this.aiDifficulty = config.difficulty;

    const botRoster: {
      name: string;
      shipId: string;
      color: string;
      secondary: string;
      baseSpeed: number;
      personality: AIPersonality;
    }[] = [
      { name: 'Zer0', shipId: 'apex_phantom', color: '#00f0ff', secondary: '#ff0055', baseSpeed: 295, personality: 'AGGRESSIVE' },
      { name: 'Nova', shipId: 'vortex_nemesis', color: '#ff00aa', secondary: '#00f0ff', baseSpeed: 288, personality: 'RISK_TAKER' },
      { name: 'Viper', shipId: 'solaris_stinger', color: '#ffaa00', secondary: '#ffff00', baseSpeed: 280, personality: 'TECHNICAL' },
      { name: 'Aegis', shipId: 'void_valkyrie', color: '#9900ff', secondary: '#00ffea', baseSpeed: 275, personality: 'DEFENSIVE' },
      { name: 'Titan-X', shipId: 'apex_phantom', color: '#39ff14', secondary: '#ffffff', baseSpeed: 270, personality: 'BALANCED' },
    ];

    const count = Math.min(config.botCount || 5, botRoster.length);
    const speedMult =
      config.difficulty === 'RECRUIT'
        ? 0.74
        : config.difficulty === 'STANDARD'
        ? 0.90
        : config.difficulty === 'ACE'
        ? 1.05
        : 1.18; // ELITE

    const lateralSpeed =
      config.difficulty === 'RECRUIT'
        ? 2.8
        : config.difficulty === 'STANDARD'
        ? 4.2
        : config.difficulty === 'ACE'
        ? 5.5
        : 6.8; // ELITE

    for (let i = 0; i < count; i++) {
      const p = botRoster[i];
      const shipGroup = createShipMesh(p.shipId, p.color, p.secondary);
      this.scene.add(shipGroup);

      const thrusters: THREE.Mesh[] = [];
      shipGroup.traverse(child => {
        if (child.name === 'thruster_flame' && child instanceof THREE.Mesh) {
          thrusters.push(child);
        }
      });

      const startGridT = (1.0 - 0.007 * (i + 1) + 1.0) % 1.0;
      const initialLaneX = ((i % 3) - 1) * 5.5;
      const rankNum = i + 2;
      const rankStr = rankNum === 1 ? '1ST' : rankNum === 2 ? '2ND' : rankNum === 3 ? '3RD' : `${rankNum}TH`;
      const nameplate = this.createNameplateSprite(p.name, rankStr, p.color, p.personality);
      shipGroup.add(nameplate);

      const aiMass =
        p.shipId === 'vortex_nemesis'
          ? 1.4
          : p.shipId === 'apex_phantom'
          ? 0.95
          : p.shipId === 'solaris_stinger'
          ? 0.85
          : 1.1;

      this.localAIRacers.push({
        id: `local_ai_${i}`,
        name: p.name,
        shipId: p.shipId,
        color: p.color,
        secondaryColor: p.secondary,
        group: shipGroup,
        nameplateSprite: nameplate,
        thrusters,
        progressDistance: startGridT * this.track.totalLength,
        currentLap: 1,
        t: startGridT,
        speed: p.baseSpeed * speedMult * (0.8 + Math.random() * 0.25),
        targetSpeed: p.baseSpeed * speedMult,
        currentLateral: initialLaneX,
        targetLateral: initialLaneX,
        lateralSpeed,
        isBoosting: false,
        boostCooldown: 3 + Math.random() * 6,
        boostDuration: 0,
        difficulty: config.difficulty,
        personality: p.personality,
        isDestroyed: false,
        respawnTimer: 0,
        rank: rankNum,
        shield: 100,
        hull: 100,
        mass: aiMass,
        radius: 2.5,
        invulnerableTimer: 0,
        collisionCooldown: 0,
        recoveryTimer: 0,
        angularVelocity: 0,
        angularDisplacement: 0,
      });
    }
  }

  private createNameplateSprite(
    name: string,
    rankStr: string,
    colorHex: string,
    personality?: AIPersonality
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.drawNameplateCanvas(ctx, name, rankStr, colorHex, personality);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.2, 2.08, 1);
    sprite.position.set(0, 3.5, 0);
    sprite.userData = { canvas, ctx, texture, name, rankStr, colorHex, personality };
    return sprite;
  }

  private drawNameplateCanvas(
    ctx: CanvasRenderingContext2D,
    name: string,
    rankStr: string,
    colorHex: string,
    personality?: AIPersonality
  ) {
    ctx.clearRect(0, 0, 200, 130);

    ctx.fillStyle = 'rgba(10, 15, 30, 0.90)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 184, 114, 16);
    ctx.fill();
    ctx.stroke();

    const pillW = 90;
    const pillH = 30;
    const pillX = (200 - pillW) / 2;
    const pillY = 16;
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 15);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankStr, 100, pillY + pillH / 2);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 22px "Orbitron", sans-serif';
    ctx.fillText(name, 100, 76);

    if (personality) {
      ctx.fillStyle = colorHex;
      ctx.font = '700 11px "Rajdhani", sans-serif';
      ctx.fillText(`[ ${personality} ]`, 100, 102);
    }
  }

  private updateNameplateRank(sprite: THREE.Sprite, newRankStr: string) {
    const data = sprite.userData;
    if (!data || data.rankStr === newRankStr) return;
    data.rankStr = newRankStr;
    if (data.ctx) {
      this.drawNameplateCanvas(data.ctx, data.name, newRankStr, data.colorHex, data.personality);
      data.texture.needsUpdate = true;
    }
  }

  private updateAIRacers(dt: number) {
    if (!this.isAIRaceActive || this.localAIRacers.length === 0) return;
    const trackLen = this.track.totalLength || 4600;
    const time = Date.now() * 0.003;

    for (let i = 0; i < this.localAIRacers.length; i++) {
      const ai = this.localAIRacers[i];

      if (ai.isDestroyed) {
        ai.respawnTimer = (ai.respawnTimer || 0) - dt;
        if (ai.respawnTimer <= 0) {
          ai.isDestroyed = false;
          ai.group.visible = true;
          ai.targetLateral = 0;
          ai.currentLateral = 0;
          ai.shield = 100;
          ai.hull = 100;
          ai.invulnerableTimer = 2.5;
          ai.speed = 20;
          ai.angularVelocity = 0;
          ai.angularDisplacement = 0;
          this.triggerCollisionBurst(ai.group.position, 0x00f0ff, 25);
        }
        continue;
      }

      if (ai.invulnerableTimer && ai.invulnerableTimer > 0) {
        ai.invulnerableTimer = Math.max(0, ai.invulnerableTimer - dt);
        ai.group.visible = Math.floor(Date.now() / 80) % 2 === 0;
      } else if (!ai.group.visible) {
        ai.group.visible = true;
      }

      if (ai.isBoosting) {
        ai.boostDuration -= dt;
        if (ai.boostDuration <= 0) {
          ai.isBoosting = false;
          const baseCool =
            ai.personality === 'RISK_TAKER'
              ? 2.5
              : ai.personality === 'AGGRESSIVE'
              ? 3.5
              : ai.difficulty === 'ELITE'
              ? 3.8
              : 6.0;
          ai.boostCooldown = baseCool + Math.random() * 3.5;
        }
      } else {
        ai.boostCooldown -= dt;
        if (ai.boostCooldown <= 0 && this.isRacing) {
          ai.isBoosting = true;
          ai.boostDuration = ai.personality === 'RISK_TAKER' ? 2.8 : 2.2;
        }
      }

      const boostBonus = ai.isBoosting ? 85 : 0;
      const desiredSpeed = (ai.targetSpeed + boostBonus) / 3.6;
      ai.speed = THREE.MathUtils.lerp(ai.speed, desiredSpeed, 2.5 * dt);

      const lookAheadDist = ai.personality === 'TECHNICAL' ? 0.035 : 0.02;
      const lookAheadT = (ai.t + lookAheadDist) % 1.0;
      const lookAheadSample = this.track.getSampleAt(lookAheadT);

      let barrierEvaded = false;
      if (this.track.energyBarriers) {
        for (const b of this.track.energyBarriers) {
          const deltaT = (b.t - ai.t + 1.0) % 1.0;
          if (deltaT > 0 && deltaT < 0.03) {
            ai.targetLateral = b.gapLane === 'left' ? -6.0 : b.gapLane === 'right' ? 6.0 : 0.0;
            barrierEvaded = true;
            break;
          }
        }
      }

      if (!barrierEvaded) {
        if (ai.personality === 'AGGRESSIVE' && this.playerShipGroup) {
          const distToPlayerSpline = (this.splineT - ai.t + 1.0) % 1.0;
          if (distToPlayerSpline < 0.05 && distToPlayerSpline > 0) {
            ai.targetLateral = THREE.MathUtils.lerp(ai.targetLateral, this.lateralOffset, 0.4);
          }
        } else if (ai.personality === 'DEFENSIVE') {
          if (Math.abs(ai.currentLateral - this.lateralOffset) < 3.0) {
            ai.targetLateral = this.lateralOffset > 0 ? -6.0 : 6.0;
          }
        } else if (ai.personality === 'RISK_TAKER') {
          ai.targetLateral = Math.sin(time * 0.8 + i) * 6.5;
        }

        if (ai.difficulty === 'ACE' || ai.difficulty === 'ELITE' || ai.personality === 'TECHNICAL') {
          for (const obs of this.track.obstacles) {
            if (lookAheadSample.point.distanceTo(obs.position) < obs.radius + 6.0) {
              const safeLanes = [-6.0, 0.0, 6.0].filter(l => Math.abs(l - ai.currentLateral) > 2.5);
              if (safeLanes.length > 0) {
                ai.targetLateral = safeLanes[Math.floor(Math.random() * safeLanes.length)];
              }
              break;
            }
          }
        }
      }

      ai.currentLateral = THREE.MathUtils.lerp(ai.currentLateral, ai.targetLateral, ai.lateralSpeed * dt);

      for (const obs of this.track.obstacles) {
        if (ai.group.position.distanceTo(obs.position) < obs.radius + 1.2) {
          ai.isDestroyed = true;
          ai.respawnTimer = 1.6;
          ai.group.visible = false;
          this.triggerCollisionBurst(ai.group.position, 0xff0055, 30);
          break;
        }
      }

      if (ai.isDestroyed) continue;

      // AI Junction Evaluation & Branch Progression
      const nearbyJunc = this.junctionManager.detectNearbyJunction(ai.t);
      if (nearbyJunc && !ai.activeRouteId) {
        ai.activeJunctionId = nearbyJunc.junction.config.id;
        ai.activeRouteId = this.junctionManager.getAIRouteChoice(
          nearbyJunc.junction,
          ai.personality,
          ai.difficulty,
          ai.speed * 3.6,
          100
        );
        ai.branchProgress = 0;
      }

      let sample: SamplePoint;
      if (ai.activeRouteId && ai.activeJunctionId) {
        const junc = this.junctionManager.junctions.get(ai.activeJunctionId);
        const routeInst = junc?.routeInstances.get(ai.activeRouteId);
        if (routeInst && junc) {
          ai.branchProgress = (ai.branchProgress || 0) + (ai.speed * dt) / routeInst.totalLength;
          if (ai.branchProgress >= 1.0) {
            ai.t = junc.config.junctionEndT;
            ai.activeRouteId = null;
            ai.activeJunctionId = null;
            ai.branchProgress = 0;
            sample = this.track.getSampleAt(ai.t);
          } else {
            sample = routeInst.getSampleAt(ai.branchProgress);
            const startT = junc.config.junctionStartT;
            const endT = junc.config.junctionEndT;
            const effEndT = endT < startT ? endT + 1.0 : endT;
            const interpT = startT + ai.branchProgress * (effEndT - startT);
            ai.t = ((interpT % 1.0) + 1.0) % 1.0;
          }
        } else {
          sample = this.track.getSampleAt(ai.t);
        }
      } else {
        const advanceMeters = ai.speed * dt;
        ai.progressDistance += advanceMeters;
        const prevT = ai.t;
        ai.t = (ai.progressDistance % trackLen) / trackLen;
        if (prevT > 0.85 && ai.t < 0.15) {
          ai.currentLap++;
        }
        sample = this.track.getSampleAt(ai.t);
      }

      const hoverH = 1.5 + Math.sin(time + i) * 0.12;
      _botOffsetBinormal.copy(sample.binormal).multiplyScalar(ai.currentLateral);
      _botOffsetNormal.copy(sample.normal).multiplyScalar(hoverH);
      _botPos.copy(sample.point).add(_botOffsetBinormal).add(_botOffsetNormal);

      if (isFinite(_botPos.x) && isFinite(_botPos.y) && isFinite(_botPos.z)) {
        ai.group.position.copy(_botPos);
      }

      _botNegTangent.copy(sample.tangent).negate();
      if (sample.binormal.lengthSq() > 0.001 && sample.normal.lengthSq() > 0.001 && _botNegTangent.lengthSq() > 0.001) {
        _botRotMatrix.makeBasis(sample.binormal, sample.normal, _botNegTangent);
        ai.group.quaternion.setFromRotationMatrix(_botRotMatrix);
      }

      const lateralVel = (ai.targetLateral - ai.currentLateral);
      const bankRoll = -Math.sign(lateralVel) * Math.min(0.45, Math.abs(lateralVel) * 0.1);
      ai.group.rotateZ(bankRoll);
      if (ai.angularDisplacement && Math.abs(ai.angularDisplacement) > 0.001) {
        ai.group.rotateY(ai.angularDisplacement);
      }

      const flameScale = 0.8 + (ai.speed * 3.6) / 120 + (ai.isBoosting ? 1.5 : 0);
      ai.thrusters.forEach(fl => fl.scale.set(1 + (ai.isBoosting ? 0.5 : 0), flameScale, 1 + (ai.isBoosting ? 0.5 : 0)));
    }

    const allRacers = [
      {
        id: 'player',
        name: 'Player',
        score: (this.currentLap - 1) * 100000 + this.splineT * 10000,
        isPlayer: true,
        ai: null as LocalAIRacer | null,
      },
      ...this.localAIRacers.map(ai => ({
        id: ai.id,
        name: ai.name,
        score: (ai.currentLap - 1) * 100000 + ai.t * 10000,
        isPlayer: false,
        ai,
      })),
    ];

    allRacers.sort((a, b) => b.score - a.score);
    for (let r = 0; r < allRacers.length; r++) {
      const racer = allRacers[r];
      const rankNum = r + 1;
      const rankStr = rankNum === 1 ? '1ST' : rankNum === 2 ? '2ND' : rankNum === 3 ? '3RD' : `${rankNum}TH`;
      if (racer.isPlayer) {
        this.callbacks.onRankUpdate(rankNum, allRacers.length);
      } else if (racer.ai) {
        racer.ai.rank = rankNum;
        this.updateNameplateRank(racer.ai.nameplateSprite, rankStr);
      }
    }
  }

  public togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private loop = () => {
    this.animFrameId = requestAnimationFrame(this.loop);
    if (this.isContextLost) return;

    try {
      const rawDt = this.clock.getDelta();
      const dt = isNaN(rawDt) || !isFinite(rawDt) ? 0.016 : Math.min(Math.max(0, rawDt), 0.1);

      if (!this.isPaused) {
        this.updatePhysics(dt);
        this.updateAIRacers(dt);
        this.updatePowerUps(dt);
        this.updateCredits(dt);
        this.updatePowerUpPods(dt);
        this.updateEnergyBarriers(dt);
        this.updateCelestialBodies(dt);
        this.updateThrusterParticles(dt);
        this.updateCollisionSparks(dt);
        this.updateRemotePlayersInterpolation(dt);
        this.updateCamera(dt);
        this.updateSpeedParticles();
        this.updateAsteroids(dt);
        this.updateBeamSystem(dt);
        this.updateJunctions(dt);
      }

      if (this.container) {
        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;
        if (cw > 0 && ch > 0) {
          const currentAspect = cw / ch;
          if (!isFinite(this.camera.aspect) || this.camera.aspect <= 0 || Math.abs(this.camera.aspect - currentAspect) > 0.005) {
            this.camera.aspect = currentAspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(cw, ch, false);
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
    } catch (frameErr) {
      console.warn('[VOID-RIDER Engine] Transient frame anomaly caught and safely recovered:', frameErr);
    }
  };

  private updateJunctions(dt: number) {
    if (!this.junctionManager) return;
    const telemetry = this.junctionManager.update(
      dt,
      this.totalTimeElapsed,
      this.splineT,
      this.currentSpeed
    );
    this.callbacks.onJunctionTelemetry?.(telemetry);
  }

  private updateBeamSystem(dt: number) {
    if (!this.beamSystem || !this.playerShipGroup) return;

    // Weapon emitter world position
    const emitter = this.playerShipGroup.getObjectByName('weapon_emitter');
    const emitterPos = new THREE.Vector3();
    if (emitter) {
      emitter.getWorldPosition(emitterPos);
    } else {
      emitterPos.copy(this.playerShipGroup.position);
    }

    // Ship forward vector (pointing along -Z in ship local space)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerShipGroup.quaternion);

    // Update target locking cone detection
    this.beamSystem.updateTargeting(emitterPos, forward, this.track.obstacles);

    // Check if beam is firing (Desktop E / RMB or Mobile ⚡ button)
    if (this.input.fireBeam && this.isRacing && !this.isDestroyed) {
      this.beamSystem.fireBeam(
        emitterPos,
        forward,
        dt,
        (obstacle, points, credits) => {
          this.sessionCredits += credits;
          this.callbacks.onCreditCollected?.(this.sessionCredits, credits);
          this.callbacks.onHazardHit?.(
            `ASTEROID DESTROYED +${credits} VC // +${points} PTS`
          );
          this.callbacks.onAsteroidDestroyed?.(obstacle, points, credits);
        }
      );
    } else {
      this.beamSystem.ceaseFire();
    }

    // Update beam internal physics, cooling, fragments, shockwaves
    this.beamSystem.update(dt);

    // Dynamic recoil impulse and screen shake
    if (this.beamSystem.screenShakeIntensity > 0 && this.cameraShakeEnabled) {
      this.cameraShake = Math.max(this.cameraShake, this.beamSystem.screenShakeIntensity);
    }

    // Push beam telemetry to HUD
    this.callbacks.onBeamTelemetry?.(this.beamSystem.getTelemetry());
  }

  public setBeamCustomization(customization: BeamCustomization) {
    this.localBeamCustomization = { ...customization };
    this.beamSystem?.updateCustomization(customization);
  }

  public setBeamUpgrades(upgrades: BeamUpgrades) {
    this.localBeamUpgrades = { ...upgrades };
    this.beamSystem?.updateUpgrades(upgrades);
  }

  public setBeamInput(firing: boolean) {
    this.input.fireBeam = firing;
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth || 1280;
    const h = this.container.clientHeight || window.innerHeight || 720;
    if (w <= 0 || h <= 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.stopRace();
    if (this.beamSystem) {
      this.beamSystem.dispose();
      this.scene.remove(this.beamSystem.containerGroup);
    }
    if (this.collisionSystem) {
      this.collisionSystem.dispose();
    }
    if (this.asteroidInstancedMesh) {
      this.scene.remove(this.asteroidInstancedMesh);
      this.asteroidInstancedMesh.geometry.dispose();
      this.asteroidInstancedMesh = null;
    }
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  public setCollisionConfig(config: Partial<PlayerCollisionConfig>) {
    if (this.collisionSystem) {
      this.collisionSystem.config = { ...this.collisionSystem.config, ...config };
    }
  }

  public getCollisionConfig(): PlayerCollisionConfig {
    return this.collisionSystem ? { ...this.collisionSystem.config } : { ...PLAYER_COLLISION_CONFIG };
  }
}
