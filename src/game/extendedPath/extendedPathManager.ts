import * as THREE from 'three';
import { GameMode, AIDifficulty, AIPersonality } from '../../types';
import {
  ExtendedPathConfig,
  PathSegment,
  PathNode,
  PathBranch,
  PathJunction,
  CheckpointNode,
  HazardZone,
  CinematicTrigger,
  EnvironmentZone,
  RespawnNode,
  FinishZone,
  ExtendedPathTelemetry,
  SectorInfo,
  PathSegmentType,
} from './extendedPathTypes';
import { getExtendedPathConfig } from './modePathConfigs';
import { CinematicTriggerSystem } from './cinematicTriggerSystem';
import { TrackStreamingManager } from './trackStreamingManager';
import { EnvironmentManager } from './environmentManager';

export class ExtendedPathManager {
  private scene: THREE.Scene;
  public activeConfig: ExtendedPathConfig;
  public curve: THREE.CatmullRomCurve3;

  public segments: PathSegment[] = [];
  public checkpoints: CheckpointNode[] = [];
  public respawnNodes: RespawnNode[] = [];
  public finishZone: FinishZone | null = null;
  public junctions: PathJunction[] = [];

  // Subsystems
  public cinematicSystem: CinematicTriggerSystem;
  public streamingManager: TrackStreamingManager;
  public envManager: EnvironmentManager;

  // Visual Groups
  public branchGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.branchGroup = new THREE.Group();
    this.branchGroup.name = 'path_branches_group';
    this.scene.add(this.branchGroup);

    this.cinematicSystem = new CinematicTriggerSystem();
    this.streamingManager = new TrackStreamingManager(scene);
    this.envManager = new EnvironmentManager(scene);

    // Initial fallback config
    this.activeConfig = getExtendedPathConfig('NEON_CIRCUIT');
    this.curve = this.buildCurve(this.activeConfig.controlPoints);
  }

  public setMode(mode: GameMode) {
    this.activeConfig = getExtendedPathConfig(mode);
    this.curve = this.buildCurve(this.activeConfig.controlPoints);

    this.buildSegments();
    this.buildCheckpoints();
    this.buildRespawnNodes();
    this.buildBranches();

    // Initialize subsystems
    this.cinematicSystem.initTriggers(this.activeConfig.cinematicTriggers);
    this.envManager.initEnvironment(this.activeConfig.environmentZones, this.curve);

    const isCollapsing = mode === 'COLLAPSING_TRACK';
    const themeColor = this.getThemeColorHex(mode);
    this.streamingManager.initSegments(this.segments, this.curve, themeColor, isCollapsing);
  }

  private buildCurve(points: [number, number, number][]): THREE.CatmullRomCurve3 {
    const vPoints = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vPoints, true, 'centripetal', 0.5);
  }

  private buildSegments() {
    this.segments = [];
    const numSegments = 18;
    const step = 1.0 / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const startT = i * step;
      const endT = (i + 1) * step;
      const midT = (startT + endT) * 0.5;

      const ptStart = this.curve.getPointAt(startT);
      const ptMid = this.curve.getPointAt(midT);
      const ptEnd = this.curve.getPointAt(endT);

      const tanStart = this.curve.getTangentAt(startT).normalize();
      const tanEnd = this.curve.getTangentAt(endT).normalize();
      const curvature = 1.0 - Math.max(0, tanStart.dot(tanEnd));
      const elevationDelta = ptEnd.y - ptStart.y;

      // Determine sector & environment
      let currentSector = this.activeConfig.sectors[0];
      for (const sec of this.activeConfig.sectors) {
        if (midT >= sec.startT && midT <= sec.endT) {
          currentSector = sec;
          break;
        }
      }

      // Determine segment type based on curvature & elevation
      let segType: PathSegmentType = 'HIGH_SPEED_STRAIGHT';
      if (Math.abs(elevationDelta) > 40) {
        segType = elevationDelta > 0 ? 'CLIMB' : 'DESCENT';
      } else if (curvature > 0.45) {
        segType = 'SHARP_CURVE';
      } else if (curvature > 0.15) {
        segType = 'GENTLE_CURVE';
      } else {
        segType = midT > 0.8 ? 'ACCELERATION_CORRIDOR' : 'OVERTAKING_HIGHWAY';
      }

      // Progressive difficulty modifier (early = low, late = climax)
      const difficultyFactor = midT < 0.3 ? 0.25 : midT < 0.7 ? 0.55 : 0.85;

      const segment: PathSegment = {
        id: `seg_${i}`,
        index: i,
        type: segType,
        environmentType: currentSector.environment,
        startT,
        endT,
        length: this.curve.getLength() * step,
        width: 22 - difficultyFactor * 4, // Narrower as track progresses
        elevationDelta,
        curvature,
        bankingAngle: curvature * 0.4,
        speedProfile: Math.round(currentSector.recommendedSpeed),
        hazardDensity: currentSector.hazardDensity * difficultyFactor,
        isCollapsing: this.activeConfig.modeId === 'COLLAPSING_TRACK',
        aiRacingMetadata: {
          idealLineOffset: curvature > 0.2 ? (tanStart.x > 0 ? -0.3 : 0.3) : 0,
          driftRecommended: curvature > 0.35,
          overtakeOpportunity: segType === 'OVERTAKING_HIGHWAY',
          boostPadNearby: i % 3 === 0,
        },
      };

      this.segments.push(segment);
    }
  }

  private buildCheckpoints() {
    this.checkpoints = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const pt = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);

      // Determine sector
      let sectorIdx = 1;
      let sectorName = 'SECTOR 1';
      for (const sec of this.activeConfig.sectors) {
        if (t >= sec.startT && t <= sec.endT) {
          sectorIdx = sec.index;
          sectorName = sec.name;
          break;
        }
      }

      this.checkpoints.push({
        id: i,
        name: i === 0 ? 'START / FINISH LINE' : `GATE ${i} [${sectorName}]`,
        t,
        position: pt,
        tangent: tan,
        normal,
        width: 26,
        isSectorBoundary: i % 3 === 0,
        sectorIndex: sectorIdx,
        sectorName,
      });
    }

    // Finish Zone
    const finishPt = this.curve.getPointAt(0);
    this.finishZone = {
      t: 0,
      position: finishPt,
      tangent: this.curve.getTangentAt(0).normalize(),
      normal: new THREE.Vector3(0, 1, 0),
      width: 32,
      stadiumName: this.activeConfig.locationName,
    };
  }

  private buildRespawnNodes() {
    this.respawnNodes = [];
    const count = 36; // Dense respawn safety grid

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const pt = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const bin = new THREE.Vector3().crossVectors(tan, up).normalize();
      const norm = new THREE.Vector3().crossVectors(bin, tan).normalize();

      this.respawnNodes.push({
        id: i,
        t,
        position: pt.clone().addScaledVector(norm, 1.8),
        tangent: tan,
        normal: norm,
        binormal: bin,
        safeLateral: 0,
      });
    }
  }

  private buildBranches() {
    while (this.branchGroup.children.length > 0) {
      const obj = this.branchGroup.children[0];
      this.branchGroup.remove(obj);
    }

    // Add branch shortcuts if defined, or generate default high-speed bypass
    const midT = 0.45;
    const branchStart = this.curve.getPointAt(midT);
    const branchEnd = this.curve.getPointAt(midT + 0.15);
    const tan = this.curve.getTangentAt(midT).normalize();
    const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    // Create branch visualization arch
    const archGeo = new THREE.TorusGeometry(8, 0.4, 8, 16, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const archMesh = new THREE.Mesh(archGeo, archMat);
    archMesh.position.copy(branchStart).addScaledVector(bin, -12);
    archMesh.rotation.y = Math.atan2(tan.x, tan.z);
    this.branchGroup.add(archMesh);
  }

  /**
   * Safe Respawn Lookup: Find nearest valid respawn node safely behind player progress
   */
  public getSafeRespawn(splineT: number): RespawnNode {
    if (this.respawnNodes.length === 0) {
      return {
        id: 0,
        t: 0,
        position: this.curve.getPointAt(0),
        tangent: new THREE.Vector3(0, 0, -1),
        normal: new THREE.Vector3(0, 1, 0),
        binormal: new THREE.Vector3(1, 0, 0),
        safeLateral: 0,
      };
    }

    // Find node immediately behind player
    let best = this.respawnNodes[0];
    for (const node of this.respawnNodes) {
      if (node.t <= splineT) {
        best = node;
      }
    }
    return best;
  }

  /**
   * AI Route Recommendation: Selects optimal branch choice based on AI personality & risk
   */
  public getRecommendedRoute(
    personality: AIPersonality,
    difficulty: AIDifficulty,
    hullPercent: number,
    boostEnergy: number
  ): 'MAIN' | 'SAFE_ROUTE' | 'HIGH_SPEED_ROUTE' | 'HIGH_RISK_SHORTCUT' {
    if (hullPercent < 35) return 'SAFE_ROUTE';
    if (personality === 'AGGRESSOR' || personality === 'SPEEDSTER') {
      return boostEnergy > 40 ? 'HIGH_RISK_SHORTCUT' : 'HIGH_SPEED_ROUTE';
    }
    if (personality === 'DEFENDER') return 'SAFE_ROUTE';
    return 'HIGH_SPEED_ROUTE';
  }

  /**
   * Update all path subsystems: streaming, environment, cinematics
   */
  public update(
    dt: number,
    playerSplineT: number,
    aiSplineTs: number[],
    shipPos: THREE.Vector3,
    shipQuat: THREE.Quaternion,
    shipSpeed: number,
    gameplayCamPos: THREE.Vector3,
    gameplayLookAt: THREE.Vector3,
    camera: THREE.PerspectiveCamera,
    isRacing: boolean
  ): boolean {
    // 1. Streaming Geometry update
    this.streamingManager.updateStreaming(playerSplineT, aiSplineTs, dt);

    // 2. Dynamic Environment lighting & fog
    this.envManager.update(dt, playerSplineT);

    // 3. Check for cinematic triggers
    this.cinematicSystem.checkTriggers(playerSplineT, isRacing);

    // 4. Update active cinematic camera
    const isCinematicActive = this.cinematicSystem.update(
      dt,
      shipPos,
      shipQuat,
      shipSpeed,
      gameplayCamPos,
      gameplayLookAt,
      camera
    );

    return isCinematicActive;
  }

  public getTelemetry(splineT: number, progressDistance: number): ExtendedPathTelemetry {
    let currentSector: SectorInfo = this.activeConfig.sectors[0];
    for (const sec of this.activeConfig.sectors) {
      if (splineT >= sec.startT && splineT <= sec.endT) {
        currentSector = sec;
        break;
      }
    }

    const span = Math.max(0.001, currentSector.endT - currentSector.startT);
    const sectorProgress = Math.max(0, Math.min(1.0, (splineT - currentSector.startT) / span));

    let activeHazardWarning: string | null = null;
    for (const h of this.activeConfig.hazards) {
      if (splineT >= h.startT && splineT <= h.endT) {
        activeHazardWarning = h.warningText;
        break;
      }
    }

    const cinState = this.cinematicSystem.getActiveState();

    return {
      currentSectorIndex: currentSector.index,
      currentSectorName: currentSector.name,
      currentSectorProgress: sectorProgress,
      totalProgressDistance: progressDistance,
      totalTrackKm: this.activeConfig.totalEquivalentKm,
      approachingBranch: null,
      activeCinematicTitle: cinState.isActive && cinState.trigger ? cinState.trigger.title : null,
      activeHazardWarning,
      isClimaxSector: splineT >= this.activeConfig.finalClimax.startT,
    };
  }

  private getThemeColorHex(mode: GameMode): number {
    switch (mode) {
      case 'SINGULARITY_RUN': return 0xa855f7;
      case 'NEON_CIRCUIT': return 0x00f0ff;
      case 'ASTEROID_RUN': return 0xf59e0b;
      case 'WORMHOLE_EXPRESS': return 0x3b82f6;
      case 'SOLAR_STORM': return 0xf97316;
      case 'GRAVITY_FREE': return 0x10b981;
      case 'PLASMA_STORM': return 0xd946ef;
      case 'SKYLINE_RUSH': return 0x14b8a6;
      case 'DEBRIS_SURVIVAL': return 0xa8a29e;
      case 'QUANTUM_TIME_TRIAL': return 0x06b6d4;
      case 'ENERGY_HEIST': return 0xf97316;
      case 'DRONE_ASSAULT': return 0xef4444;
      case 'COLLAPSING_TRACK': return 0xf59e0b;
      case 'RING_RUNNER': return 0x06b6d4;
      case 'HYPERSPACE_SPRINT': return 0x8b5cf6;
      case 'RIVAL_DUEL': return 0xdc2626;
      case 'RELAY_RACE': return 0x3b82f6;
      case 'SURVIVAL_ELIMINATION': return 0xef4444;
      case 'COSMIC_TREASURE_HUNT': return 0x10b981;
      case 'VOID_CHAMPIONSHIP': return 0xeab308;
      default: return 0x00f0ff;
    }
  }

  public dispose() {
    this.streamingManager.dispose();
    this.envManager.disposeProps();
    while (this.branchGroup.children.length > 0) {
      const obj = this.branchGroup.children[0];
      this.branchGroup.remove(obj);
    }
  }
}
