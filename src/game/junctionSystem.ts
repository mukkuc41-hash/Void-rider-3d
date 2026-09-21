import * as THREE from 'three';
import { TrackId, AIDifficulty, AIPersonality } from '../types';
import { CosmicTrack, SamplePoint } from './trackData';
import {
  TrackGraph,
  TrackSegment,
  RouteAwareCheckpoint,
  TrackGraphValidationResult,
  validateTrackGraph as validateGraphUtil,
  TrackManager,
  TrackGenerator,
  RespawnManager,
} from './trackGraph';

export type {
  TrackSegment,
  RouteAwareCheckpoint,
  TrackGraphValidationResult,
};

export {
  TrackGraph,
  validateGraphUtil as validateTrackGraph,
  TrackManager,
  TrackGenerator,
  RespawnManager,
};

export type BranchRouteDirection = 'LEFT' | 'RIGHT' | 'CENTER' | 'SHORTCUT';

export interface BranchRouteConfig {
  id: string;
  name: string;
  direction: BranchRouteDirection;
  subtitle: string;
  detail: string;
  themeColor: string;
  isShortcut: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  hasBoostPads: boolean;
  boostPadFractions?: number[];
  hasObstacles: boolean;
  obstacleFractions?: number[];
  lengthMultiplier: number;
  width: number;
  lateralDivergence: number; // Max peak lateral offset from main track
  elevationOffset?: number; // Optional 3D flyover or dive
  requiredCheckpointIndices: number[]; // Checkpoints satisfied along this branch
  // Tactical telemetry and route-aware progress metadata
  entryJunctionId?: string;
  exitSegmentId?: string;
  requiredCheckpoints?: string[];
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  hasShortcut?: boolean;
  description?: string;
  boostPadCount?: number;
  obstacleCount?: number;
}

export interface JunctionZoneConfig {
  id: string;
  name: string;
  trackId: TrackId;
  approachT: number;      // Spline T where HUD prompt appears (~120m out)
  junctionStartT: number; // Spline T where road splits
  junctionEndT: number;   // Spline T where routes merge back
  routes: BranchRouteConfig[];
  defaultRouteId: string;
  bannerText: string;
}

export interface ActiveJunctionTelemetry {
  junctionId: string;
  junctionName: string;
  distanceToJunctionMeters: number;
  availableRoutes: BranchRouteConfig[];
  selectedRouteId: string | null;
  selectedRouteDirection: BranchRouteDirection | null;
  statusMessage: string | null;
  isInJunction: boolean;
  progressInRoute: number;
  bannerText: string;
  // Enhanced attributes for HUD & Mobile Controls
  isApproaching: boolean;
  distanceToJunction: number;
  name: string;
  timeRemainingSec: number;
  playerInBranch: boolean;
  branchProgress: number;
  status: 'APPROACHING' | 'COMMITMENT_ZONE' | 'ACTIVE' | 'PASSED';
  isLocked?: boolean;
}

export interface PlayerRouteProgress {
  isInBranch: boolean;
  activeJunctionId: string | null;
  activeRouteId: string | null;
  progress: number; // 0 to 1 along branch curve
  transitionBlend: number; // 0 to 1 smooth entry blend
  branchRouteInstance: BranchRouteInstance | null;
  entrySpeed: number;
  validatedCheckpointIndices: Set<number>;
}

export class BranchRouteInstance {
  public config: BranchRouteConfig;
  public curve: THREE.CatmullRomCurve3;
  public totalLength: number;
  public samples: SamplePoint[] = [];
  public meshGroup: THREE.Group = new THREE.Group();
  public boostPadPositions: THREE.Vector3[] = [];
  public obstaclePositions: THREE.Vector3[] = [];

  constructor(
    config: BranchRouteConfig,
    mainTrack: CosmicTrack,
    startT: number,
    endT: number
  ) {
    this.config = config;

    // Generate smooth 3D Catmull-Rom curve between startT and endT
    const controlPoints: THREE.Vector3[] = [];
    const numPoints = 8;
    const isWrapping = endT < startT;
    const effectiveEndT = isWrapping ? endT + 1.0 : endT;

    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;
      const rawT = startT + frac * (effectiveEndT - startT);
      const wrappedT = ((rawT % 1.0) + 1.0) % 1.0;
      const mainSample = mainTrack.getSampleAt(wrappedT);

      // Bell-curve arc for lateral divergence: 0 at start, peak in middle, 0 at end
      const arcFactor = Math.sin(frac * Math.PI);
      const lateralOff = config.lateralDivergence * arcFactor;
      const elevOff = (config.elevationOffset || 0) * arcFactor;

      const pt = mainSample.point
        .clone()
        .add(mainSample.binormal.clone().multiplyScalar(lateralOff))
        .add(mainSample.normal.clone().multiplyScalar(elevOff));

      controlPoints.push(pt);
    }

    this.curve = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal');
    this.totalLength = this.curve.getLength();

    // Precompute smooth samples
    const sampleCount = 90;
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();

      let binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      if (binormal.lengthSq() < 0.01) {
        binormal.set(1, 0, 0);
      }
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      this.samples.push({ t, point, tangent, normal, binormal });
    }

    // Generate boost pads if configured
    if (config.hasBoostPads && config.boostPadFractions) {
      config.boostPadFractions.forEach(f => {
        const pt = this.curve.getPointAt(f).add(new THREE.Vector3(0, 0.35, 0));
        this.boostPadPositions.push(pt);
      });
    }

    // Generate hazards if configured
    if (config.hasObstacles && config.obstacleFractions) {
      config.obstacleFractions.forEach(f => {
        const s = this.getSampleAt(f);
        const jitter = (Math.random() - 0.5) * (config.width * 0.4);
        const pt = s.point.clone().add(s.binormal.clone().multiplyScalar(jitter)).add(s.normal.clone().multiplyScalar(1.5));
        this.obstaclePositions.push(pt);
      });
    }

    this.buildGeometry();
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
    const clamped = Math.max(0, Math.min(1, safeT));
    const maxIdx = this.samples.length - 1;
    const rawIdx = Math.floor(clamped * maxIdx);
    const index = isNaN(rawIdx) ? 0 : Math.max(0, Math.min(maxIdx, rawIdx));
    return this.samples[index] || this.samples[0];
  }

  private buildGeometry() {
    const count = this.samples.length;
    const halfW = this.config.width / 2;
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Road surface mesh
    for (let i = 0; i < count; i++) {
      const s = this.samples[i];
      const left = s.point.clone().add(s.binormal.clone().multiplyScalar(-halfW));
      const right = s.point.clone().add(s.binormal.clone().multiplyScalar(halfW));

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const v = (i / (count - 1)) * 25;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < count - 1) {
        const r1 = i * 2;
        const r2 = (i + 1) * 2;
        indices.push(r1, r2, r1 + 1);
        indices.push(r1 + 1, r2, r2 + 1);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x090c18,
      roughness: 0.28,
      metalness: 0.85,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.meshGroup.add(roadMesh);

    // Glowing boundary edge rails in route theme color
    const leftPoints: THREE.Vector3[] = [];
    const rightPoints: THREE.Vector3[] = [];
    const centerPoints: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const s = this.samples[i];
      leftPoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(-halfW)).add(new THREE.Vector3(0, 0.45, 0))
      );
      rightPoints.push(
        s.point.clone().add(s.binormal.clone().multiplyScalar(halfW)).add(new THREE.Vector3(0, 0.45, 0))
      );
      centerPoints.push(
        s.point.clone().add(new THREE.Vector3(0, 0.12, 0))
      );
    }

    const themeHex = parseInt(this.config.themeColor.replace('#', '0x'), 16);
    const railMat = new THREE.MeshStandardMaterial({
      color: themeHex,
      emissive: themeHex,
      emissiveIntensity: 2.8,
      roughness: 0.15,
    });

    const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints);
    const centerCurve = new THREE.CatmullRomCurve3(centerPoints);

    const leftRail = new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 80, 0.32, 8, false), railMat);
    const rightRail = new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 80, 0.32, 8, false), railMat);

    // Central pulsing neon strip
    const centerRail = new THREE.Mesh(
      new THREE.TubeGeometry(centerCurve, 60, 0.14, 6, false),
      new THREE.MeshBasicMaterial({ color: themeHex })
    );

    this.meshGroup.add(leftRail, rightRail, centerRail);

    // Boost Pads on this branch
    if (this.boostPadPositions.length > 0) {
      const padGeo = new THREE.PlaneGeometry(halfW * 1.3, 5.5);
      padGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshBasicMaterial({
        color: themeHex,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      this.boostPadPositions.forEach(pos => {
        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.copy(pos);
        this.meshGroup.add(padMesh);

        // Chevron indicator mesh
        const chevronGeo = new THREE.ConeGeometry(1.2, 2.5, 4);
        chevronGeo.rotateX(-Math.PI / 2);
        const chevronMesh = new THREE.Mesh(chevronGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        chevronMesh.position.copy(pos).add(new THREE.Vector3(0, 0.1, 0));
        this.meshGroup.add(chevronMesh);
      });
    }
  }
}

export class JunctionZoneInstance {
  public config: JunctionZoneConfig;
  public routeInstances: Map<string, BranchRouteInstance> = new Map();
  public gantryGroup: THREE.Group = new THREE.Group();
  public holographicArrows: THREE.Group[] = [];
  public selectedRouteId: string | null = null;
  public entranceSample: SamplePoint;
  public exitSample: SamplePoint;

  constructor(config: JunctionZoneConfig, mainTrack: CosmicTrack) {
    this.config = config;
    this.entranceSample = mainTrack.getSampleAt(config.junctionStartT);
    this.exitSample = mainTrack.getSampleAt(config.junctionEndT);

    // Create Route Instances
    config.routes.forEach(routeCfg => {
      const inst = new BranchRouteInstance(
        routeCfg,
        mainTrack,
        config.junctionStartT,
        config.junctionEndT
      );
      this.routeInstances.set(routeCfg.id, inst);
    });

    this.buildGantryAndSignage(mainTrack);
  }

  private buildGantryAndSignage(mainTrack: CosmicTrack) {
    const s = this.entranceSample;
    const trackWidth = mainTrack.width;
    const halfW = trackWidth / 2;

    this.gantryGroup.position.copy(s.point);
    const rotMatrix = new THREE.Matrix4();
    rotMatrix.makeBasis(s.binormal, s.normal, s.tangent.clone().negate());
    this.gantryGroup.quaternion.setFromRotationMatrix(rotMatrix);

    // Left and Right Pylons
    const pylonGeo = new THREE.BoxGeometry(1.4, 12, 2.2);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x121528,
      metalness: 0.9,
      roughness: 0.25,
    });

    const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
    leftPylon.position.set(-halfW - 2.5, 6, 0);

    const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
    rightPylon.position.set(halfW + 2.5, 6, 0);

    // Overhead Gantry Crossbar
    const crossbarGeo = new THREE.BoxGeometry(trackWidth + 6.5, 1.8, 2.4);
    const crossbar = new THREE.Mesh(crossbarGeo, pylonMat);
    crossbar.position.set(0, 11, 0);

    // Holographic Signboard Banner
    const bannerGeo = new THREE.PlaneGeometry(trackWidth + 3.0, 3.2);
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 256;
    const ctx = bannerCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(5, 10, 25, 0.92)';
      ctx.fillRect(0, 0, 1024, 256);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 1004, 236);

      // Title & Marquee
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 42px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`<< JUNCTION: ${this.config.name.toUpperCase()} >>`, 512, 70);

      // Left vs Right Route Labels
      const leftRoute = this.config.routes.find(r => r.direction === 'LEFT');
      const rightRoute = this.config.routes.find(r => r.direction === 'RIGHT' || r.direction === 'SHORTCUT');

      ctx.fillStyle = leftRoute?.themeColor || '#00f0ff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`◀ [A] ${leftRoute?.name || 'LEFT PATH'}`, 40, 150);

      ctx.font = '24px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(leftRoute?.subtitle || '', 40, 195);

      ctx.fillStyle = rightRoute?.themeColor || '#ff00aa';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${rightRoute?.name || 'RIGHT PATH'} [D] ▶`, 984, 150);

      ctx.font = '24px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(rightRoute?.subtitle || '', 984, 195);
    }

    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    const bannerMat = new THREE.MeshBasicMaterial({
      map: bannerTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 11, -0.6);

    // Floating Holographic Directional Chevron Arrows
    this.config.routes.forEach(route => {
      const arrowGroup = new THREE.Group();
      const themeHex = parseInt(route.themeColor.replace('#', '0x'), 16);
      const isLeft = route.direction === 'LEFT';
      const lateralPos = isLeft ? -halfW * 0.55 : halfW * 0.55;

      const arrowMat = new THREE.MeshBasicMaterial({
        color: themeHex,
        transparent: true,
        opacity: 0.88,
      });

      // 3 nested holographic arrow chevrons
      for (let c = 0; c < 3; c++) {
        const chevGeo = new THREE.ConeGeometry(1.2, 2.4, 4);
        chevGeo.rotateZ(isLeft ? Math.PI / 2 : -Math.PI / 2);
        const chev = new THREE.Mesh(chevGeo, arrowMat);
        chev.position.set(0, 0, c * 3.5);
        chev.scale.set(1.4, 1.4, 1.4);
        arrowGroup.add(chev);
      }

      arrowGroup.position.set(lateralPos, 4.5, -4);
      arrowGroup.name = `arrow_${route.id}`;
      this.holographicArrows.push(arrowGroup);
      this.gantryGroup.add(arrowGroup);
    });

    // Central lane divider neon wedge barrier on the road surface
    const wedgeGeo = new THREE.ConeGeometry(1.8, 8, 3);
    wedgeGeo.rotateX(Math.PI / 2);
    const wedgeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const dividerWedge = new THREE.Mesh(wedgeGeo, wedgeMat);
    dividerWedge.position.set(0, 0.8, -4);

    this.gantryGroup.add(leftPylon, rightPylon, crossbar, bannerMesh, dividerWedge);
  }

  public updateAnimation(totalTimeSec: number, selectedRouteId: string | null) {
    this.selectedRouteId = selectedRouteId;

    this.holographicArrows.forEach(arrowGroup => {
      const isSelected = arrowGroup.name === `arrow_${selectedRouteId}`;
      const pulse = 1.0 + Math.sin(totalTimeSec * 8) * 0.2;
      const baseScale = isSelected ? 1.6 * pulse : 1.1 + Math.sin(totalTimeSec * 4) * 0.1;
      arrowGroup.scale.set(baseScale, baseScale, baseScale);

      // Float bobbing
      arrowGroup.position.y = 4.5 + Math.sin(totalTimeSec * 3 + arrowGroup.position.x) * 0.4;

      // Pulse brightness
      arrowGroup.traverse(child => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = isSelected ? 1.0 : 0.6 + Math.sin(totalTimeSec * 6) * 0.2;
        }
      });
    });
  }
}

// Track-Specific Junction Configurations
export const TRACK_JUNCTIONS_CONFIG: Record<TrackId, JunctionZoneConfig[]> = {
  circuit_alpha: [
    {
      id: 'alpha_junction_canyon',
      name: 'Orbital Split Canyon',
      trackId: 'circuit_alpha',
      approachT: 0.24,
      junctionStartT: 0.30,
      junctionEndT: 0.48,
      bannerText: 'ORBITAL CANYON DIVERGENCE',
      defaultRouteId: 'alpha_canyon_center',
      routes: [
        {
          id: 'alpha_canyon_left',
          name: 'CYAN BOOST FREEWAY',
          direction: 'LEFT',
          subtitle: 'Banked Ridge Slipstream',
          detail: 'Wide banked outer curve with continuous energy refill & safe cornering clearance.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.55, 0.82],
          hasObstacles: false,
          lengthMultiplier: 1.08,
          width: 15,
          lateralDivergence: -28,
          elevationOffset: 12,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'alpha_canyon_center',
          name: 'SOLAR EXPRESS HIGHWAY',
          direction: 'CENTER',
          subtitle: 'Direct Mainline (Max Speed)',
          detail: 'Direct mainline through canyon center with twin boost pads and zero divergence penalty.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'alpha_canyon_right',
          name: 'ION RIFT SHORTCUT',
          direction: 'SHORTCUT',
          subtitle: 'High-Risk Subterranean Dive (-16% Distance)',
          detail: 'Extreme hairpin descent cutting through the lower chasm. Demands tight drift precision.',
          themeColor: '#ff00aa',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.45],
          hasObstacles: true,
          obstacleFractions: [0.35, 0.70],
          lengthMultiplier: 0.84,
          width: 11,
          lateralDivergence: 26,
          elevationOffset: -18,
          requiredCheckpointIndices: [3, 4],
        },
      ],
    },
    {
      id: 'alpha_junction_spire',
      name: 'Warp Plaza Divergence',
      trackId: 'circuit_alpha',
      approachT: 0.62,
      junctionStartT: 0.68,
      junctionEndT: 0.84,
      bannerText: 'WARP PLAZA JUNCTION',
      defaultRouteId: 'alpha_spire_center',
      routes: [
        {
          id: 'alpha_spire_left',
          name: 'GRAV-SLIPSTREAM RIDGE',
          direction: 'LEFT',
          subtitle: 'Panoramic Zero-G Overlook',
          detail: 'High elevation scenic ridge overlooking planetary rings with low gravity handling.',
          themeColor: '#00ffcc',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.3, 0.7],
          hasObstacles: false,
          lengthMultiplier: 1.04,
          width: 14,
          lateralDivergence: -25,
          elevationOffset: 16,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'alpha_spire_center',
          name: 'WARP PLAZA DIRECT',
          direction: 'CENTER',
          subtitle: 'Central Elevated Artery',
          detail: 'Direct central elevated route crossing the plaza with balanced acceleration pads.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.60],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 6,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'alpha_spire_right',
          name: 'HYPER-CONDUIT TUNNEL',
          direction: 'RIGHT',
          subtitle: 'Speed Tunnel with Laser Barriers',
          detail: 'Enclosed speed tube with high velocity straightaways and energy pickups.',
          themeColor: '#ffaa00',
          isShortcut: false,
          riskLevel: 'MEDIUM',
          hasBoostPads: true,
          boostPadFractions: [0.2, 0.5, 0.8],
          hasObstacles: true,
          obstacleFractions: [0.4, 0.75],
          lengthMultiplier: 0.94,
          width: 12,
          lateralDivergence: 24,
          elevationOffset: -10,
          requiredCheckpointIndices: [8, 9],
        },
      ],
    },
  ],
  neon_orbit: [
    {
      id: 'neon_junction_canyon',
      name: 'Orbital Split Canyon',
      trackId: 'neon_orbit',
      approachT: 0.24,
      junctionStartT: 0.30,
      junctionEndT: 0.48,
      bannerText: 'ORBITAL CANYON DIVERGENCE',
      defaultRouteId: 'neon_canyon_center',
      routes: [
        {
          id: 'neon_canyon_left',
          name: 'CYAN BOOST FREEWAY',
          direction: 'LEFT',
          subtitle: 'Triple Boost Pad Slipstream',
          detail: 'Wide banked outer curve with continuous energy refill & safe cornering clearance.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.55, 0.82],
          hasObstacles: false,
          lengthMultiplier: 1.08,
          width: 15,
          lateralDivergence: -28,
          elevationOffset: 12,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'neon_canyon_center',
          name: 'NEON EXPRESSWAY SPINE',
          direction: 'CENTER',
          subtitle: 'High-Speed Center Lane',
          detail: 'Direct mainline through neon canyon with dual speed pads and maximum top velocity.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'neon_canyon_right',
          name: 'ION RIFT SHORTCUT',
          direction: 'SHORTCUT',
          subtitle: 'High-Risk Subterranean Dive (-16% Distance)',
          detail: 'Extreme hairpin descent cutting through the lower chasm. Demands tight drift precision.',
          themeColor: '#ff00aa',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.45],
          hasObstacles: true,
          obstacleFractions: [0.35, 0.70],
          lengthMultiplier: 0.84,
          width: 11,
          lateralDivergence: 26,
          elevationOffset: -18,
          requiredCheckpointIndices: [3, 4],
        },
      ],
    },
    {
      id: 'neon_junction_spire',
      name: 'Warp Plaza Divergence',
      trackId: 'neon_orbit',
      approachT: 0.62,
      junctionStartT: 0.68,
      junctionEndT: 0.84,
      bannerText: 'WARP PLAZA JUNCTION',
      defaultRouteId: 'neon_spire_center',
      routes: [
        {
          id: 'neon_spire_left',
          name: 'GRAV-SLIPSTREAM RIDGE',
          direction: 'LEFT',
          subtitle: 'Panoramic Zero-G Overlook',
          detail: 'High elevation scenic ridge overlooking planetary rings with low gravity handling.',
          themeColor: '#00ffcc',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.3, 0.7],
          hasObstacles: false,
          lengthMultiplier: 1.04,
          width: 14,
          lateralDivergence: -25,
          elevationOffset: 16,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'neon_spire_center',
          name: 'PLAZA MERIDIAN CORE',
          direction: 'CENTER',
          subtitle: 'Direct Center Speed Conduit',
          detail: 'Central plaza bypass with magnetic acceleration strips and zero-drag clearance.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.60],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 6,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'neon_spire_right',
          name: 'HYPER-CONDUIT TUNNEL',
          direction: 'RIGHT',
          subtitle: 'Speed Tunnel with Laser Barriers',
          detail: 'Enclosed speed tube with high velocity straightaways and energy pickups.',
          themeColor: '#ffaa00',
          isShortcut: false,
          riskLevel: 'MEDIUM',
          hasBoostPads: true,
          boostPadFractions: [0.2, 0.5, 0.8],
          hasObstacles: true,
          obstacleFractions: [0.4, 0.75],
          lengthMultiplier: 0.94,
          width: 12,
          lateralDivergence: 24,
          elevationOffset: -10,
          requiredCheckpointIndices: [8, 9],
        },
      ],
    },
  ],
  asteroid_run: [
    {
      id: 'asteroid_junction_ore',
      name: 'Ore Processor Fork',
      trackId: 'asteroid_run',
      approachT: 0.20,
      junctionStartT: 0.26,
      junctionEndT: 0.44,
      bannerText: 'MINING ZONE SEPARATION',
      defaultRouteId: 'asteroid_ore_center',
      routes: [
        {
          id: 'asteroid_ore_left',
          name: 'BOULDER CHUTE SHORTCUT',
          direction: 'LEFT',
          subtitle: 'Extreme Kinetic Hazard Alley (-18% Time)',
          detail: 'Cuts straight through drilling core. Dense tumbling boulders require active beam fire!',
          themeColor: '#ff3300',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.3, 0.65],
          hasObstacles: true,
          obstacleFractions: [0.25, 0.45, 0.7],
          lengthMultiplier: 0.82,
          width: 11,
          lateralDivergence: -26,
          elevationOffset: -14,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'asteroid_ore_center',
          name: 'CORE EXCAVATION HIGHWAY',
          direction: 'CENTER',
          subtitle: 'Shielded Industrial Central Conduit',
          detail: 'Reinforced central bridge bypassing mining machinery with continuous kinetic shields.',
          themeColor: '#00e5ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 15,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'asteroid_ore_right',
          name: 'MINING CRANEWAY',
          direction: 'RIGHT',
          subtitle: 'Shielded Industrial Highway',
          detail: 'Broad illuminated catwalk past ore freighters with repair cores and clear radar.',
          themeColor: '#ffaa00',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.35, 0.75],
          hasObstacles: false,
          lengthMultiplier: 1.05,
          width: 16,
          lateralDivergence: 25,
          elevationOffset: 10,
          requiredCheckpointIndices: [3, 4],
        },
      ],
    },
    {
      id: 'asteroid_junction_belt',
      name: 'Debris Field Divergence',
      trackId: 'asteroid_run',
      approachT: 0.60,
      junctionStartT: 0.66,
      junctionEndT: 0.82,
      bannerText: 'DEBRIS BELT FORK',
      defaultRouteId: 'asteroid_belt_center',
      routes: [
        {
          id: 'asteroid_belt_left',
          name: 'MAGNETIC TRACTOR CONDUIT',
          direction: 'LEFT',
          subtitle: 'Automated Magnetic Slipstream',
          detail: 'Tractor beam field stabilizes ship drift and accelerates speed by +25%.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.2, 0.5, 0.8],
          hasObstacles: false,
          lengthMultiplier: 1.02,
          width: 14,
          lateralDivergence: -24,
          elevationOffset: 8,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'asteroid_belt_center',
          name: 'DEBRIS VECTOR ARTERY',
          direction: 'CENTER',
          subtitle: 'Stabilized Center Flight Corridor',
          detail: 'Central magnetic lane through the asteroid ring with balanced boost pads and zero divergence.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'asteroid_belt_right',
          name: 'CAVERN CREVICE SHORTCUT',
          direction: 'SHORTCUT',
          subtitle: 'Crystalline Chasm (-14% Distance)',
          detail: 'Narrow cavern cleft filled with valuable ion credits and tight banking turns.',
          themeColor: '#d000ff',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.4],
          hasObstacles: true,
          obstacleFractions: [0.3, 0.6],
          lengthMultiplier: 0.86,
          width: 10.5,
          lateralDivergence: 22,
          elevationOffset: -12,
          requiredCheckpointIndices: [8, 9],
        },
      ],
    },
  ],
  void_rift: [
    {
      id: 'void_junction_singularity',
      name: 'Singularity Separation',
      trackId: 'void_rift',
      approachT: 0.22,
      junctionStartT: 0.28,
      junctionEndT: 0.46,
      bannerText: 'SINGULARITY SPLIT MATRIX',
      defaultRouteId: 'void_singularity_center',
      routes: [
        {
          id: 'void_singularity_left',
          name: 'DARK MATTER RUNWAY',
          direction: 'LEFT',
          subtitle: 'Inverted Grav-Loop Corridor',
          detail: 'Anti-gravity inversion rail providing superior centrifugal traction and boost pads.',
          themeColor: '#9d4edd',
          isShortcut: false,
          riskLevel: 'MEDIUM',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.6, 0.85],
          hasObstacles: false,
          lengthMultiplier: 1.05,
          width: 14,
          lateralDivergence: -28,
          elevationOffset: 20,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'void_singularity_center',
          name: 'GRAVITON BEAM MERIDIAN',
          direction: 'CENTER',
          subtitle: 'High-Velocity Central Axis',
          detail: 'Central anti-grav beam through singularity rift offering straight-line speed stability.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'void_singularity_right',
          name: 'WORMHOLE GRAV-SHORTCUT',
          direction: 'SHORTCUT',
          subtitle: 'Event Horizon Dive (-17% Time)',
          detail: 'Flirts with the dimensional singularity horizon. Highest risk, supersonic warp speeds.',
          themeColor: '#ff0055',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.5],
          hasObstacles: true,
          obstacleFractions: [0.35, 0.65],
          lengthMultiplier: 0.83,
          width: 11,
          lateralDivergence: 25,
          elevationOffset: -22,
          requiredCheckpointIndices: [3, 4],
        },
      ],
    },
    {
      id: 'void_junction_abyss',
      name: 'Abyss Elevation Junction',
      trackId: 'void_rift',
      approachT: 0.64,
      junctionStartT: 0.70,
      junctionEndT: 0.86,
      bannerText: 'ABYSS ELEVATION FORK',
      defaultRouteId: 'void_abyss_center',
      routes: [
        {
          id: 'void_abyss_left',
          name: 'CRYSTAL SPIRE CLIMB',
          direction: 'LEFT',
          subtitle: 'Technical S-Curve Spire',
          detail: 'Spiral corkscrew climbing around glowing dark energy spires.',
          themeColor: '#00e5ff',
          isShortcut: false,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.4, 0.8],
          hasObstacles: true,
          obstacleFractions: [0.3, 0.6],
          lengthMultiplier: 0.95,
          width: 12,
          lateralDivergence: -24,
          elevationOffset: 24,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'void_abyss_center',
          name: 'VOID RUNNER ARTERY',
          direction: 'CENTER',
          subtitle: 'Direct Chasm Skyway',
          detail: 'Direct highway straight over the abyss with balanced boost recharge stations.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 6,
          requiredCheckpointIndices: [8, 9],
        },
        {
          id: 'void_abyss_right',
          name: 'SUB-VOID GLIDEWAY',
          direction: 'RIGHT',
          subtitle: 'Wide Safe Glide Path',
          detail: 'Smooth stable highway bypassing the turbulence with continuous magnetic guidance.',
          themeColor: '#39ff14',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.3, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.04,
          width: 16,
          lateralDivergence: 26,
          elevationOffset: 6,
          requiredCheckpointIndices: [8, 9],
        },
      ],
    },
  ],
  nebula_rift: [
    {
      id: 'nebula_junction_warp',
      name: 'Nebula Stream Split',
      trackId: 'nebula_rift',
      approachT: 0.24,
      junctionStartT: 0.30,
      junctionEndT: 0.48,
      bannerText: 'NEBULA STREAM FORK',
      defaultRouteId: 'nebula_warp_center',
      routes: [
        {
          id: 'nebula_warp_left',
          name: 'ION NEBULA RUNWAY',
          direction: 'LEFT',
          subtitle: 'High-Density Plasma Slipstream',
          detail: 'Electric violet ion cloud providing hyper-boost energy replenishment.',
          themeColor: '#d000ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.55, 0.8],
          hasObstacles: false,
          lengthMultiplier: 1.06,
          width: 15,
          lateralDivergence: -26,
          elevationOffset: 12,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'nebula_warp_center',
          name: 'PLASMA HIGHWAY SPINE',
          direction: 'CENTER',
          subtitle: 'Direct Ion Center Expressway',
          detail: 'Center ionization corridor through glowing nebula with twin plasma boost rings.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'nebula_warp_right',
          name: 'MEGABRIDGE SHORTCUT',
          direction: 'SHORTCUT',
          subtitle: 'Broken Megastructure Chord (-15% Distance)',
          detail: 'Shattered orbital bridge requiring precision thruster alignment across gaps.',
          themeColor: '#ff0055',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.45],
          hasObstacles: true,
          obstacleFractions: [0.3, 0.7],
          lengthMultiplier: 0.85,
          width: 11,
          lateralDivergence: 24,
          elevationOffset: -14,
          requiredCheckpointIndices: [3, 4],
        },
      ],
    },
  ],
  cosmic_ring: [
    {
      id: 'ring_junction_solar',
      name: 'Solar Accelerator Split',
      trackId: 'cosmic_ring',
      approachT: 0.28,
      junctionStartT: 0.34,
      junctionEndT: 0.52,
      bannerText: 'SOLAR ACCELERATOR FORK',
      defaultRouteId: 'ring_solar_center',
      routes: [
        {
          id: 'ring_solar_left',
          name: 'INNER CORONA ACCELERATOR',
          direction: 'LEFT',
          subtitle: 'Supercharged Boost Corridor',
          detail: 'Short radius orbital cut with 4 successive hypersonic boost rings.',
          themeColor: '#ffaa00',
          isShortcut: false,
          riskLevel: 'MEDIUM',
          hasBoostPads: true,
          boostPadFractions: [0.15, 0.38, 0.62, 0.85],
          hasObstacles: false,
          lengthMultiplier: 0.88,
          width: 13,
          lateralDivergence: -28,
          elevationOffset: 8,
          requiredCheckpointIndices: [4, 5],
        },
        {
          id: 'ring_solar_center',
          name: 'SOLAR EQUATOR LINE',
          direction: 'CENTER',
          subtitle: 'Direct Central Orbital Path',
          detail: 'Equatorial orbital track offering maximum speed retention and balanced clearance.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.60],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [4, 5],
        },
        {
          id: 'ring_solar_right',
          name: 'OUTER MEGARING ARCS',
          direction: 'RIGHT',
          subtitle: 'High-G Banked Megastructure',
          detail: 'Enormous outer ring curve offering maximum drift points and wide clearance.',
          themeColor: '#00ffcc',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.3, 0.7],
          hasObstacles: false,
          lengthMultiplier: 1.10,
          width: 17,
          lateralDivergence: 28,
          elevationOffset: 12,
          requiredCheckpointIndices: [4, 5],
        },
      ],
    },
  ],
  quantum_highway: [
    {
      id: 'quantum_junction_matrix',
      name: 'Quantum Split Matrix',
      trackId: 'quantum_highway',
      approachT: 0.26,
      junctionStartT: 0.32,
      junctionEndT: 0.50,
      bannerText: 'QUANTUM MATRIX DIVERGENCE',
      defaultRouteId: 'quantum_matrix_center',
      routes: [
        {
          id: 'quantum_matrix_left',
          name: 'SUB-ETHER BYPASS',
          direction: 'LEFT',
          subtitle: 'Shielded Laser Gate Bypass',
          detail: 'Stable sub-ether highway that avoids heavy energy laser surges.',
          themeColor: '#00f0ff',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.25, 0.55, 0.85],
          hasObstacles: false,
          lengthMultiplier: 1.05,
          width: 15,
          lateralDivergence: -26,
          elevationOffset: 10,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'quantum_matrix_center',
          name: 'QUANTUM SPINE EXPRESS',
          direction: 'CENTER',
          subtitle: 'Zero-Dispersion Central Highway',
          detail: 'High-speed straightaway down the center of the quantum grid with dual warp pads.',
          themeColor: '#38bdf8',
          isShortcut: false,
          riskLevel: 'LOW',
          hasBoostPads: true,
          boostPadFractions: [0.30, 0.65],
          hasObstacles: false,
          lengthMultiplier: 1.00,
          width: 14,
          lateralDivergence: 0,
          elevationOffset: 4,
          requiredCheckpointIndices: [3, 4],
        },
        {
          id: 'quantum_matrix_right',
          name: 'TACHYON OVERDRIVE SHORTCUT',
          direction: 'SHORTCUT',
          subtitle: 'Instantaneous Warp Chord (-18% Time)',
          detail: 'Pulsing quantum tunnel. Cuts directly through the hyper-grid with supreme velocity.',
          themeColor: '#ff007f',
          isShortcut: true,
          riskLevel: 'HIGH',
          hasBoostPads: true,
          boostPadFractions: [0.3, 0.7],
          hasObstacles: true,
          obstacleFractions: [0.2, 0.5, 0.8],
          lengthMultiplier: 0.82,
          width: 11,
          lateralDivergence: 24,
          elevationOffset: -16,
          requiredCheckpointIndices: [3, 4],
        },
      ],
    },
  ],
};

// Junction Manager Architecture & Reusable Functions
export class JunctionManager {
  public junctions: Map<string, JunctionZoneInstance> = new Map();
  public junctionMeshGroup: THREE.Group = new THREE.Group();
  public currentTrackId: TrackId = 'circuit_alpha';
  public mainTrack: CosmicTrack;

  // Active state for local player
  public activeJunctionTelemetry: ActiveJunctionTelemetry | null = null;
  public playerRouteProgress: PlayerRouteProgress = {
    isInBranch: false,
    activeJunctionId: null,
    activeRouteId: null,
    progress: 0,
    transitionBlend: 0,
    branchRouteInstance: null,
    entrySpeed: 0,
    validatedCheckpointIndices: new Set<number>(),
  };

  // Feedback notification timer
  public feedbackMessage: string | null = null;
  public feedbackTimer: number = 0;

  // Route commitment and locking state
  public isSelectionLocked: boolean = false;
  public commitmentDistanceMeters: number = 110;

  // Loop prevention: tracks junctions completed on this lap and active cooldowns
  public completedJunctionsThisLap: Set<string> = new Set<string>();
  public junctionCooldowns: Map<string, number> = new Map<string, number>();

  public clearLapJunctions(): void {
    this.completedJunctionsThisLap.clear();
    this.junctionCooldowns.clear();
  }

  constructor(trackId: TrackId, mainTrack: CosmicTrack) {
    this.currentTrackId = trackId;
    this.mainTrack = mainTrack;
    this.initJunctions(trackId);
  }

  public initJunctions(trackId: TrackId) {
    this.junctions.clear();
    while (this.junctionMeshGroup.children.length > 0) {
      this.junctionMeshGroup.remove(this.junctionMeshGroup.children[0]);
    }

    const configs = TRACK_JUNCTIONS_CONFIG[trackId] || TRACK_JUNCTIONS_CONFIG.circuit_alpha;
    configs.forEach(cfg => {
      const jInst = new JunctionZoneInstance(cfg, this.mainTrack);
      this.junctions.set(cfg.id, jInst);

      // Add 3D models to scene
      this.junctionMeshGroup.add(jInst.gantryGroup);
      jInst.routeInstances.forEach(routeInst => {
        this.junctionMeshGroup.add(routeInst.meshGroup);
      });
    });
  }

  /**
   * 1. Junction Detection: detects if player is approaching or inside any junction
   */
  public detectNearbyJunction(splineT: number): {
    junction: JunctionZoneInstance;
    distanceM: number;
    isApproaching: boolean;
    isInJunction: boolean;
  } | null {
    const wrappedT = ((splineT % 1.0) + 1.0) % 1.0;
    const trackLen = this.mainTrack.totalLength || 4800;

    for (const [id, junction] of this.junctions.entries()) {
      // Loop Prevention: Skip this junction if already cleared on the current lap or on cooldown
      if (this.completedJunctionsThisLap.has(id)) {
        continue;
      }
      const cd = this.junctionCooldowns.get(id) || 0;
      if (cd > 0) {
        continue;
      }

      const cfg = junction.config;
      const startT = cfg.junctionStartT;
      const endT = cfg.junctionEndT;
      const approachT = cfg.approachT;

      // In-Junction Check: strict inequality < endT so reaching junctionEndT doesn't re-trigger
      let isInJunction = false;
      if (startT <= endT) {
        isInJunction = wrappedT >= startT && wrappedT < endT;
      } else {
        isInJunction = wrappedT >= startT || wrappedT < endT;
      }

      // Approach Check
      let isApproaching = false;
      let deltaTToStart = 0;

      if (approachT <= startT) {
        isApproaching = wrappedT >= approachT && wrappedT < startT;
        deltaTToStart = startT - wrappedT;
      } else {
        // Wraps over start line
        isApproaching = wrappedT >= approachT || wrappedT < startT;
        deltaTToStart = (startT - wrappedT + 1.0) % 1.0;
      }

      if (isApproaching || isInJunction) {
        const distanceM = Math.max(0, Math.round(deltaTToStart * trackLen));
        return {
          junction,
          distanceM,
          isApproaching,
          isInJunction,
        };
      }
    }

    return null;
  }

  /**
   * 2. Available Routes query
   */
  public getAvailableRoutes(junctionId: string): BranchRouteConfig[] {
    const junction = this.junctions.get(junctionId);
    return junction ? junction.config.routes : [];
  }

  /**
   * 3. Route Selection (supports either (routeId) or (junctionId, routeId))
   */
  public selectRoute(routeIdOrJunctionId: string, maybeRouteId?: string): boolean {
    // Only lock selection if already actively navigating a physical branch curve
    if (this.playerRouteProgress.isInBranch) {
      console.warn(`[JunctionManager] Route selection rejected: player already navigating branch.`);
      this.feedbackMessage = `ROUTE LOCKED: CURRENTLY NAVIGATING BRANCH`;
      this.feedbackTimer = 2.0;
      return false;
    }

    let jId = this.activeJunctionTelemetry?.junctionId;
    let rId = routeIdOrJunctionId;
    if (maybeRouteId) {
      jId = routeIdOrJunctionId;
      rId = maybeRouteId;
    }

    if (!jId) {
      // Find which junction has this routeId
      for (const [id, j] of this.junctions.entries()) {
        if (j.config.routes.some(r => r.id === rId)) {
          jId = id;
          break;
        }
      }
    }

    if (!jId) return false;
    const junction = this.junctions.get(jId);
    if (!junction) return false;

    const route = junction.config.routes.find(r => r.id === rId);
    if (!route) return false;

    junction.selectedRouteId = rId;
    this.playerRouteProgress.activeRouteId = rId;
    this.playerRouteProgress.activeJunctionId = jId;

    const dirLabel = route.direction === 'SHORTCUT' ? 'SHORTCUT (RIGHT)' : route.direction;
    this.feedbackMessage = `ROUTE SELECTED: ${dirLabel} — ${route.name}`;
    this.feedbackTimer = 2.5;

    if (this.activeJunctionTelemetry) {
      this.activeJunctionTelemetry.selectedRouteId = rId;
      this.activeJunctionTelemetry.selectedRouteDirection = route.direction;
    }

    return true;
  }

  /**
   * Commits the selected route when entering the commitment zone
   */
  public commitRoute(routeId?: string): boolean {
    const junction = this.junctions.get(this.playerRouteProgress.activeJunctionId || this.activeJunctionTelemetry?.junctionId || '');
    let targetRouteId = routeId;
    if (!targetRouteId) {
      targetRouteId = junction?.selectedRouteId || this.playerRouteProgress.activeRouteId || this.getDefaultRoute(junction).id;
    }

    this.isSelectionLocked = true;
    this.playerRouteProgress.activeRouteId = targetRouteId;
    if (junction) {
      junction.selectedRouteId = targetRouteId;
    }
    if (this.activeJunctionTelemetry) {
      this.activeJunctionTelemetry.isLocked = true;
      this.activeJunctionTelemetry.selectedRouteId = targetRouteId;
      this.activeJunctionTelemetry.status = 'COMMITMENT_ZONE';
    }
    return true;
  }

  public lockRouteSelection(): void {
    this.isSelectionLocked = true;
    if (this.activeJunctionTelemetry) {
      this.activeJunctionTelemetry.isLocked = true;
    }
  }

  public unlockRouteSelection(): void {
    this.isSelectionLocked = false;
    if (this.activeJunctionTelemetry) {
      this.activeJunctionTelemetry.isLocked = false;
    }
  }

  /**
   * Select route by direction: 'LEFT', 'RIGHT', 'CENTER', 'SHORTCUT'
   */
  public selectRouteByDirection(direction: BranchRouteDirection): boolean {
    let jId = this.activeJunctionTelemetry?.junctionId;
    let junction = jId ? this.junctions.get(jId) : null;
    
    // If not detected via telemetry, find first approaching or active junction
    if (!junction) {
      for (const [id, j] of this.junctions.entries()) {
        if (!this.completedJunctionsThisLap.has(id)) {
          jId = id;
          junction = j;
          break;
        }
      }
    }
    if (!junction || !jId) return false;

    // Find route matching direction or fallback
    let target = junction.config.routes.find(r => r.direction === direction);
    if (!target && direction === 'RIGHT') {
      target = junction.config.routes.find(r => r.direction === 'SHORTCUT');
    }
    if (!target && direction === 'SHORTCUT') {
      target = junction.config.routes.find(r => r.direction === 'RIGHT');
    }
    if (!target && direction === 'CENTER') {
      target = junction.config.routes.find(r => r.id.includes('center')) || junction.config.routes[1] || junction.config.routes[0];
    }
    if (!target && direction === 'LEFT') {
      target = junction.config.routes.find(r => r.id.includes('left')) || junction.config.routes[0];
    }

    if (target) {
      return this.selectRoute(jId, target.id);
    }
    return false;
  }

  /**
   * 4. Route Validation
   */
  public validateRoute(routeId: string, junctionId?: string): boolean {
    if (junctionId) {
      const junction = this.junctions.get(junctionId);
      return !!junction?.config.routes.some(r => r.id === routeId);
    }
    for (const j of this.junctions.values()) {
      if (j.config.routes.some(r => r.id === routeId)) return true;
    }
    return false;
  }

  /**
   * 5. Default Route retrieval
   */
  public getDefaultRoute(junctionOrId?: JunctionZoneInstance | string): BranchRouteConfig {
    let junction: JunctionZoneInstance | undefined;
    if (typeof junctionOrId === 'string') {
      junction = this.junctions.get(junctionOrId);
    } else if (junctionOrId) {
      junction = junctionOrId;
    } else if (this.activeJunctionTelemetry) {
      junction = this.junctions.get(this.activeJunctionTelemetry.junctionId);
    }

    if (!junction) {
      const firstJunction = Array.from(this.junctions.values())[0];
      if (firstJunction) return firstJunction.config.routes[0];
      return {
        id: 'default_route',
        name: 'MAIN HYPER-HIGHWAY',
        direction: 'CENTER',
        subtitle: 'Primary Cosmic Vector',
        detail: 'Standard regulation vector corridor.',
        themeColor: '#00f0ff',
        isShortcut: false,
        riskLevel: 'LOW',
        hasBoostPads: false,
        hasObstacles: false,
        lengthMultiplier: 1.0,
        width: 24,
        lateralDivergence: 0,
        requiredCheckpointIndices: [],
      };
    }

    const def = junction.config.routes.find(r => r.id === junction!.config.defaultRouteId);
    return def || junction.config.routes[0];
  }

  /**
   * 6. Smooth Transition to Route (supports (routeId, speed) or (junction, routeId, speed))
   */
  public transitionToRoute(
    junctionOrRouteId: JunctionZoneInstance | string,
    maybeRouteId?: string | number,
    maybeSpeed?: number
  ) {
    let junction: JunctionZoneInstance | undefined;
    let routeId: string = '';
    let currentSpeed: number = 30;

    if (typeof junctionOrRouteId === 'string') {
      routeId = junctionOrRouteId;
      if (typeof maybeRouteId === 'number') {
        currentSpeed = maybeRouteId;
      }
      for (const j of this.junctions.values()) {
        if (j.config.routes.some(r => r.id === routeId)) {
          junction = j;
          break;
        }
      }
    } else {
      junction = junctionOrRouteId;
      routeId = typeof maybeRouteId === 'string' ? maybeRouteId : '';
      currentSpeed = typeof maybeSpeed === 'number' ? maybeSpeed : 30;
    }

    if (!junction) return;
    const routeInst = junction.routeInstances.get(routeId);
    if (!routeInst) return;

    this.playerRouteProgress.isInBranch = true;
    this.playerRouteProgress.activeJunctionId = junction.config.id;
    this.playerRouteProgress.activeRouteId = routeId;
    this.playerRouteProgress.branchRouteInstance = routeInst;
    this.playerRouteProgress.progress = 0;
    this.playerRouteProgress.transitionBlend = 0;
    this.playerRouteProgress.entrySpeed = currentSpeed;
    this.playerRouteProgress.validatedCheckpointIndices = new Set<number>();
  }

  /**
   * 7. Update Route Progress & Checkpoint validation
   */
  public updateRouteProgress(
    dt: number,
    currentSpeed: number,
    onCheckpointValidated?: (cpIndices: number[]) => void
  ): {
    finishedBranch: boolean;
    sample: SamplePoint | null;
    lateralOffset: number;
    rejoinSplineT: number;
  } {
    const prp = this.playerRouteProgress;
    if (!prp.isInBranch || !prp.branchRouteInstance) {
      return { finishedBranch: false, sample: null, lateralOffset: 0, rejoinSplineT: 0 };
    }

    const routeInst = prp.branchRouteInstance;
    const junction = this.junctions.get(prp.activeJunctionId || '');

    // Advance progress along branch curve preserving real velocity
    const advance = (currentSpeed * dt) / routeInst.totalLength;
    prp.progress += advance;
    prp.transitionBlend = Math.min(1.0, prp.transitionBlend + dt * 2.5);

    // Incremental real-time checkpoint validation during branch travel
    if (routeInst.config.requiredCheckpointIndices && onCheckpointValidated) {
      const cps = routeInst.config.requiredCheckpointIndices;
      const count = cps.length;
      cps.forEach((cpIdx, idx) => {
        const threshold = (idx + 1) / (count + 1);
        if (prp.progress >= threshold && !prp.validatedCheckpointIndices.has(cpIdx)) {
          prp.validatedCheckpointIndices.add(cpIdx);
          onCheckpointValidated([cpIdx]);
        }
      });
    }

    // If reached end of branch
    if (prp.progress >= 1.0) {
      prp.isInBranch = false;
      const jId = prp.activeJunctionId;
      const routeName = routeInst.config.name;

      // Safe advance past the junction exit to prevent looping
      const exitAdvance = 0.015;
      const rejoinT = junction ? ((junction.config.junctionEndT + exitAdvance) % 1.0) : 0.5;

      // Mark this junction as completed for the current lap to prevent infinite loops
      if (jId) {
        this.completedJunctionsThisLap.add(jId);
        this.junctionCooldowns.set(jId, 15.0);
      }

      // Validate any remaining checkpoints for this branch route
      if (routeInst.config.requiredCheckpointIndices && onCheckpointValidated) {
        const remaining = routeInst.config.requiredCheckpointIndices.filter(
          idx => !prp.validatedCheckpointIndices.has(idx)
        );
        if (remaining.length > 0) {
          remaining.forEach(idx => prp.validatedCheckpointIndices.add(idx));
          onCheckpointValidated(remaining);
        }
      }

      this.feedbackMessage = `ROUTE COMPLETED: ${routeName} // MERGED TO MAIN LANE`;
      this.feedbackTimer = 3.0;

      prp.activeJunctionId = null;
      prp.activeRouteId = null;
      prp.branchRouteInstance = null;
      prp.progress = 0;
      prp.validatedCheckpointIndices.clear();
      this.isSelectionLocked = false;
      this.activeJunctionTelemetry = null;

      return { finishedBranch: true, sample: null, lateralOffset: 0, rejoinSplineT: rejoinT };
    }

    const branchSample = routeInst.getSampleAt(prp.progress);
    return {
      finishedBranch: false,
      sample: branchSample,
      lateralOffset: 0,
      rejoinSplineT: 0,
    };
  }

  /**
   * Main per-frame update loop
   */
  public update(dt: number, totalTimeSec: number, splineT: number, currentSpeed: number): ActiveJunctionTelemetry | null {
    if (this.feedbackTimer > 0) {
      this.feedbackTimer = Math.max(0, this.feedbackTimer - dt);
      if (this.feedbackTimer === 0) this.feedbackMessage = null;
    }

    // Decrement junction cooldowns
    for (const [jId, cd] of this.junctionCooldowns.entries()) {
      if (cd > 0) {
        const nextCd = Math.max(0, cd - dt);
        if (nextCd === 0) {
          this.junctionCooldowns.delete(jId);
        } else {
          this.junctionCooldowns.set(jId, nextCd);
        }
      }
    }

    // Detect nearby junction
    const detected = this.detectNearbyJunction(splineT);

    if (detected) {
      const { junction, distanceM, isApproaching, isInJunction } = detected;
      const isCommitmentZone = isApproaching && distanceM <= this.commitmentDistanceMeters;

      // Auto-commit default route if player reached commitment zone without selecting
      if (isCommitmentZone || isInJunction) {
        if (!this.isSelectionLocked) {
          const autoRouteId = junction.selectedRouteId || this.playerRouteProgress.activeRouteId || this.getDefaultRoute(junction).id;
          this.commitRoute(autoRouteId);
        }
      } else if (isApproaching && distanceM > this.commitmentDistanceMeters) {
        // Still approaching before commitment zone: player can freely switch routes
        this.isSelectionLocked = false;
      }

      const selectedId = junction.selectedRouteId || this.playerRouteProgress.activeRouteId;
      const selectedRoute = junction.config.routes.find(r => r.id === selectedId);

      // If entered junction boundary and hasn't started branch transition yet
      if (isInJunction && !this.playerRouteProgress.isInBranch) {
        const finalRouteId = selectedId || this.getDefaultRoute(junction).id;
        this.transitionToRoute(junction, finalRouteId, currentSpeed);
      }

      junction.updateAnimation(totalTimeSec, selectedId);

      const decisionSpeed = Math.max(20, currentSpeed);
      const timeRemainingSec = Math.max(0.1, distanceM / decisionSpeed);

      const status: 'APPROACHING' | 'COMMITMENT_ZONE' | 'ACTIVE' | 'PASSED' = 
        this.playerRouteProgress.isInBranch ? 'ACTIVE' :
        (isInJunction ? 'ACTIVE' :
        (isCommitmentZone ? 'COMMITMENT_ZONE' :
        (isApproaching ? 'APPROACHING' : 'PASSED')));

      this.activeJunctionTelemetry = {
        junctionId: junction.config.id,
        junctionName: junction.config.name,
        name: junction.config.name,
        distanceToJunctionMeters: distanceM,
        distanceToJunction: distanceM,
        availableRoutes: junction.config.routes,
        selectedRouteId: selectedId,
        selectedRouteDirection: selectedRoute ? selectedRoute.direction : null,
        statusMessage: this.feedbackMessage,
        isInJunction: isInJunction || this.playerRouteProgress.isInBranch,
        progressInRoute: this.playerRouteProgress.progress,
        bannerText: junction.config.bannerText,
        isApproaching,
        timeRemainingSec,
        playerInBranch: this.playerRouteProgress.isInBranch,
        branchProgress: this.playerRouteProgress.progress,
        status,
        isLocked: this.isSelectionLocked || this.playerRouteProgress.isInBranch,
      };
    } else {
      this.activeJunctionTelemetry = null;
      this.isSelectionLocked = false;
    }

    return this.activeJunctionTelemetry;
  }

  /**
   * AI Route Selection Strategy based on Personality and Condition
   */
  public getAIRouteChoice(
    junction: JunctionZoneInstance,
    personality: AIPersonality,
    difficulty: AIDifficulty,
    speedKmH: number,
    shieldPercent: number
  ): string {
    const routes = junction.config.routes;
    const shortcut = routes.find(r => r.isShortcut || r.direction === 'SHORTCUT');
    const safeRoute = routes.find(r => r.riskLevel === 'LOW') || routes[0];
    const techRoute = routes.find(r => r.riskLevel === 'MEDIUM') || routes[1] || routes[0];

    // Aggressive & Risk Takers love shortcuts (85% probability)
    if (personality === 'AGGRESSIVE' || personality === 'RISK_TAKER') {
      if (shortcut && (shieldPercent > 35 || difficulty === 'ELITE' || difficulty === 'ACE')) {
        return Math.random() < 0.85 ? shortcut.id : safeRoute.id;
      }
    }

    // Defensive racers strictly prefer safer, wider routes
    if (personality === 'DEFENSIVE') {
      return Math.random() < 0.90 ? safeRoute.id : (shortcut ? shortcut.id : safeRoute.id);
    }

    // Technical racers choose high-speed boost or technical curves
    if (personality === 'TECHNICAL') {
      return Math.random() < 0.75 ? techRoute.id : safeRoute.id;
    }

    // Balanced racers evaluate based on current speed & health
    if (shieldPercent < 50) {
      return safeRoute.id;
    }
    return Math.random() < 0.55 ? (shortcut ? shortcut.id : techRoute.id) : safeRoute.id;
  }

  /**
   * Track Graph & Segment Helper Queries
   */
  public getCurrentSegment(): TrackSegment | null {
    if (this.mainTrack?.trackManager) {
      return this.mainTrack.trackManager.getCurrentSegment();
    }
    return null;
  }

  public getCurrentRoute(): string {
    if (this.mainTrack?.trackManager) {
      return this.mainTrack.trackManager.getCurrentRoute();
    }
    return this.playerRouteProgress.activeRouteId || 'main_route';
  }

  public getNextSegment(): TrackSegment | null {
    if (this.mainTrack?.trackManager) {
      return this.mainTrack.trackManager.getNextSegment();
    }
    return null;
  }

  public getTrackProgress(): number {
    if (this.mainTrack?.trackManager) {
      return this.mainTrack.trackManager.getTrackProgress();
    }
    return this.mainTrack ? (this.playerRouteProgress.progress || 0) : 0;
  }

  public validateTrackGraph(): TrackGraphValidationResult {
    if (this.mainTrack?.trackGraph) {
      return validateGraphUtil(this.mainTrack.trackGraph);
    }
    return { isValid: true, errors: [], warnings: [] };
  }

  public validateCheckpointOrder(checkpoints: RouteAwareCheckpoint[]): boolean {
    for (let i = 0; i < checkpoints.length - 1; i++) {
      if (checkpoints[i].sequenceIndex >= checkpoints[i + 1].sequenceIndex) {
        return false;
      }
    }
    return true;
  }

  public isValidFinishCrossing(hasPassedRequiredCheckpoints: boolean, isForward: boolean, isCooldowned: boolean): boolean {
    return hasPassedRequiredCheckpoints && isForward && !isCooldowned;
  }
}

// Reusable Architecture Utilities for RouteManager, CheckpointManager, and LapManager
export const RouteManager = {
  detectNearbyJunction: (manager: JunctionManager, splineT: number) => manager.detectNearbyJunction(splineT),
  getAvailableRoutes: (manager: JunctionManager, junctionId: string) => manager.getAvailableRoutes(junctionId),
  selectRoute: (manager: JunctionManager, routeId: string, junctionId?: string) => manager.selectRoute(routeId, junctionId),
  validateRoute: (manager: JunctionManager, routeId: string, junctionId?: string) => manager.validateRoute(routeId, junctionId),
  getDefaultRoute: (manager: JunctionManager, junction?: JunctionZoneInstance | string) => manager.getDefaultRoute(junction),
  transitionToRoute: (manager: JunctionManager, routeId: string, speed?: number) => manager.transitionToRoute(routeId, speed),
  updateRouteProgress: (manager: JunctionManager, dt: number, speed: number, onCp?: (cp: number[]) => void) =>
    manager.updateRouteProgress(dt, speed, onCp),
};

export class CheckpointManager {
  public static validateBranchCheckpoints(
    requiredIndices: number[],
    currentPassedSet: Set<number>,
    nextCheckpointIdx: number,
    totalCheckpoints: number
  ): { validated: number[]; nextIdx: number } {
    const validated: number[] = [];
    let updatedNext = nextCheckpointIdx;
    for (const cpIdx of requiredIndices) {
      currentPassedSet.add(cpIdx);
      validated.push(cpIdx);
      if (updatedNext === cpIdx) {
        updatedNext = (updatedNext + 1) % totalCheckpoints;
      }
    }
    return { validated, nextIdx: updatedNext };
  }
}

export class LapManager {
  public static validateLapCompletion(
    passedCheckpoints: Set<number>,
    totalCheckpoints: number,
    minCoverageFraction: number = 0.75
  ): boolean {
    if (totalCheckpoints <= 0) return true;
    return (passedCheckpoints.size / totalCheckpoints) >= minCoverageFraction;
  }
}
