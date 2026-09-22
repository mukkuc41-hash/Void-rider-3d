import * as THREE from 'three';
import {
  MinimapMode,
  MinimapMarker,
  MinimapBranchPoint,
  MinimapTelemetry,
} from '../types';
import { CheckpointGate } from './trackData';

export interface MinimapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
}

export class MinimapManager {
  public mode: MinimapMode = 'PLAYER_FACING';
  public zoom: number = 1.0;
  public isExpanded: boolean = false;

  // Cached Track 2D Points
  private cachedTrackPoints: { x: number; z: number }[] = [];
  private cachedBranches: MinimapBranchPoint[] = [];
  private cachedCheckpoints: { id: number; x: number; z: number }[] = [];
  private cachedFinishLine: { x: number; z: number } = { x: 0, z: 0 };
  private trackBounds: MinimapBounds = {
    minX: -500,
    maxX: 500,
    minZ: -500,
    maxZ: 500,
    width: 1000,
    depth: 1000,
    centerX: 0,
    centerZ: 0,
  };

  private sectorName: string = 'SECTOR ALPHA';

  constructor() {}

  // ==========================================
  // INITIALIZE / CACHE TRACK GEOMETRY
  // ==========================================
  public initTrack(
    trackCurve: THREE.CatmullRomCurve3,
    checkpoints: CheckpointGate[],
    sectorName: string = 'SECTOR ALPHA'
  ) {
    this.sectorName = sectorName;
    this.cachedTrackPoints = [];
    this.cachedCheckpoints = [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    // Sample 120 points along the true 3D track curve for smooth minimap rendering
    const sampleCount = 120;
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const pt = trackCurve.getPointAt(t % 1.0);
      this.cachedTrackPoints.push({ x: pt.x, z: pt.z });

      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
    }

    // Cache checkpoints
    checkpoints.forEach((cp, idx) => {
      this.cachedCheckpoints.push({
        id: idx + 1,
        x: cp.position.x,
        z: cp.position.z,
      });
    });

    // Finish line is at t = 0 / 1.0
    const finishPt = trackCurve.getPointAt(0);
    this.cachedFinishLine = { x: finishPt.x, z: finishPt.z };

    // Bounds with padding
    const pad = 40;
    minX -= pad;
    maxX += pad;
    minZ -= pad;
    maxZ += pad;

    this.trackBounds = {
      minX,
      maxX,
      minZ,
      maxZ,
      width: Math.max(10, maxX - minX),
      depth: Math.max(10, maxZ - minZ),
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
    };
  }

  // ==========================================
  // UPDATE BRANCHES (JUNCTIONS / SHORTCUTS)
  // ==========================================
  public updateBranches(branches: MinimapBranchPoint[]) {
    this.cachedBranches = branches;
  }

  // ==========================================
  // INTERACTIVE CONTROLS
  // ==========================================
  public toggleMode(): MinimapMode {
    this.mode = this.mode === 'PLAYER_FACING' ? 'NORTH_UP' : 'PLAYER_FACING';
    return this.mode;
  }

  public setMode(mode: MinimapMode) {
    this.mode = mode;
  }

  public zoomIn() {
    this.zoom = Math.min(2.5, +(this.zoom + 0.25).toFixed(2));
  }

  public zoomOut() {
    this.zoom = Math.max(0.6, +(this.zoom - 0.25).toFixed(2));
  }

  public resetZoom() {
    this.zoom = 1.0;
  }

  public toggleExpanded(): boolean {
    this.isExpanded = !this.isExpanded;
    return this.isExpanded;
  }

  public setExpanded(expanded: boolean) {
    this.isExpanded = expanded;
  }

  // ==========================================
  // TELEMETRY AGGREGATOR
  // ==========================================
  public getTelemetry(
    playerPos: THREE.Vector3,
    playerQuat: THREE.Quaternion,
    aiRacers: {
      id: string;
      name: string;
      position: THREE.Vector3;
      quaternion: THREE.Quaternion;
      color: string;
      rank?: number;
      isDestroyed: boolean;
      isTeammate?: boolean;
    }[],
    targetLockId?: string | null,
    activeJunctionName?: string,
    activeRouteDirection?: string
  ): MinimapTelemetry {
    // Calculate player heading (yaw angle)
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(playerQuat);
    // Heading in radians where 0 is +Z, PI/2 is +X
    const playerHeading = Math.atan2(forward.x, forward.z);

    const markers: MinimapMarker[] = [];

    // 1. Player Marker
    markers.push({
      id: 'player',
      type: 'PLAYER',
      x: playerPos.x,
      z: playerPos.z,
      heading: playerHeading,
      label: 'YOU',
      color: '#ffffff',
    });

    // 2. AI Opponent & Teammate Markers
    for (const ai of aiRacers) {
      if (ai.isDestroyed) continue;

      const aiForward = new THREE.Vector3(0, 0, 1).applyQuaternion(ai.quaternion);
      const aiHeading = Math.atan2(aiForward.x, aiForward.z);
      const isTarget = targetLockId === ai.id;

      markers.push({
        id: ai.id,
        type: isTarget ? 'TARGET' : ai.isTeammate ? 'TEAMMATE' : 'AI',
        x: ai.position.x,
        z: ai.position.z,
        heading: aiHeading,
        label: ai.name,
        color: isTarget ? '#ff0055' : ai.isTeammate ? '#39ff14' : ai.color || '#ff00aa',
        rank: ai.rank,
        isLockedTarget: isTarget,
      });
    }

    return {
      mode: this.mode,
      zoom: this.zoom,
      isExpanded: this.isExpanded,
      playerPos: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
      playerHeading,
      trackPoints: this.cachedTrackPoints,
      branches: this.cachedBranches,
      checkpoints: this.cachedCheckpoints,
      finishLine: this.cachedFinishLine,
      markers,
      activeJunctionName,
      activeRouteDirection,
      sectorName: this.sectorName,
      bounds: {
        minX: this.trackBounds.minX,
        maxX: this.trackBounds.maxX,
        minZ: this.trackBounds.minZ,
        maxZ: this.trackBounds.maxZ,
      },
    };
  }
}
