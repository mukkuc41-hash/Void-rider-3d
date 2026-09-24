import * as THREE from 'three';
import { PathSegment } from './extendedPathTypes';

export type SegmentLODState = 'ACTIVE' | 'NEAR' | 'FAR' | 'UNLOADED';

interface SegmentMeshEntry {
  segment: PathSegment;
  lodState: SegmentLODState;
  activeGroup: THREE.Group;
  simplifiedMesh: THREE.Line | THREE.Mesh;
  collapseYOffset: number;
  isCollapsed: boolean;
}

export class TrackStreamingManager {
  private scene: THREE.Scene;
  private segmentEntries: SegmentMeshEntry[] = [];
  private rootGroup: THREE.Group;
  private isCollapsingMode: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'track_streaming_root';
    this.scene.add(this.rootGroup);
  }

  public initSegments(
    segments: PathSegment[],
    curve: THREE.Curve<THREE.Vector3>,
    themeColorHex: number,
    isCollapsingMode: boolean = false
  ) {
    this.dispose();
    this.isCollapsingMode = isCollapsingMode;

    const totalSegs = segments.length;
    for (let i = 0; i < totalSegs; i++) {
      const seg = segments[i];
      const entry = this.buildSegmentMesh(seg, curve, themeColorHex);
      this.segmentEntries.push(entry);
    }

    // Default: initialize first few segments active
    this.updateStreaming(0, []);
  }

  private buildSegmentMesh(
    seg: PathSegment,
    curve: THREE.Curve<THREE.Vector3>,
    colorHex: number
  ): SegmentMeshEntry {
    const activeGroup = new THREE.Group();
    activeGroup.name = `segment_active_${seg.id}`;

    // Sample points along this segment
    const samplesCount = 18;
    const pts: THREE.Vector3[] = [];
    const tangents: THREE.Vector3[] = [];
    const binormals: THREE.Vector3[] = [];

    for (let s = 0; s <= samplesCount; s++) {
      const segT = seg.startT + (s / samplesCount) * (seg.endT - seg.startT);
      const pt = curve.getPointAt(segT);
      const tan = curve.getTangentAt(segT).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const bin = new THREE.Vector3().crossVectors(tan, up).normalize();
      if (bin.lengthSq() < 0.001) bin.set(1, 0, 0);
      pts.push(pt);
      tangents.push(tan);
      binormals.push(bin);
    }

    // 1. High-Detail Road Ribbon Geometry
    const halfW = (seg.width || 22) * 0.5;
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let s = 0; s <= samplesCount; s++) {
      const center = pts[s];
      const bin = binormals[s];

      const left = center.clone().addScaledVector(bin, -halfW);
      const right = center.clone().addScaledVector(bin, halfW);

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const vProgress = s / samplesCount;
      uvs.push(0, vProgress * 4);
      uvs.push(1, vProgress * 4);
    }

    for (let s = 0; s < samplesCount; s++) {
      const row1 = s * 2;
      const row2 = (s + 1) * 2;
      indices.push(row1, row1 + 1, row2);
      indices.push(row1 + 1, row2 + 1, row2);
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    activeGroup.add(roadMesh);

    // 2. High-Detail Neon Guardrails
    const railMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
    });

    const leftRailPts: THREE.Vector3[] = [];
    const rightRailPts: THREE.Vector3[] = [];
    for (let s = 0; s <= samplesCount; s++) {
      leftRailPts.push(pts[s].clone().addScaledVector(binormals[s], -halfW).add(new THREE.Vector3(0, 0.9, 0)));
      rightRailPts.push(pts[s].clone().addScaledVector(binormals[s], halfW).add(new THREE.Vector3(0, 0.9, 0)));
    }

    const leftRailGeo = new THREE.BufferGeometry().setFromPoints(leftRailPts);
    const leftRail = new THREE.Line(leftRailGeo, railMat);
    activeGroup.add(leftRail);

    const rightRailGeo = new THREE.BufferGeometry().setFromPoints(rightRailPts);
    const rightRail = new THREE.Line(rightRailGeo, railMat);
    activeGroup.add(rightRail);

    // 3. Simplified Mesh for NEAR lod (just a center glow line)
    const simplifiedGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const simplifiedMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.4,
    });
    const simplifiedMesh = new THREE.Line(simplifiedGeo, simplifiedMat);
    simplifiedMesh.name = `segment_simplified_${seg.id}`;

    return {
      segment: seg,
      lodState: 'UNLOADED',
      activeGroup,
      simplifiedMesh,
      collapseYOffset: 0,
      isCollapsed: false,
    };
  }

  /**
   * Update streaming window around player position and AI positions
   */
  public updateStreaming(playerSplineT: number, aiSplineTs: number[], dt: number = 0.016) {
    const total = this.segmentEntries.length;
    if (total === 0) return;

    // Determine which segment player is on
    let currentIdx = 0;
    for (let i = 0; i < total; i++) {
      const seg = this.segmentEntries[i].segment;
      if (playerSplineT >= seg.startT && playerSplineT <= seg.endT) {
        currentIdx = i;
        break;
      }
    }

    // Streaming radius:
    // ACTIVE: currentIdx - 1 to currentIdx + 2
    // NEAR: currentIdx - 2 to currentIdx + 4
    // UNLOADED: everything else
    const activeRange = 2;
    const nearRange = 4;

    for (let i = 0; i < total; i++) {
      const entry = this.segmentEntries[i];
      let dist = Math.abs(i - currentIdx);
      if (dist > total / 2) dist = total - dist; // wrap around for loop tracks

      let targetLOD: SegmentLODState = 'UNLOADED';
      if (dist <= activeRange) {
        targetLOD = 'ACTIVE';
      } else if (dist <= nearRange) {
        targetLOD = 'NEAR';
      }

      // Check if any AI racer requires this segment active
      if (targetLOD !== 'ACTIVE') {
        for (const aiT of aiSplineTs) {
          const seg = entry.segment;
          if (aiT >= seg.startT && aiT <= seg.endT) {
            targetLOD = 'ACTIVE';
            break;
          }
        }
      }

      // Handle Mode 13 Collapsing Track
      if (this.isCollapsingMode) {
        // If segment is behind player by more than 1 segment, it collapses
        if (i < currentIdx - 1 && !entry.isCollapsed) {
          entry.isCollapsed = true;
        }

        if (entry.isCollapsed) {
          entry.collapseYOffset += dt * 45; // Plunge downward
          entry.activeGroup.position.y = -entry.collapseYOffset;
          entry.simplifiedMesh.position.y = -entry.collapseYOffset;

          // If fallen far enough, unload completely
          if (entry.collapseYOffset > 250) {
            targetLOD = 'UNLOADED';
          }
        }
      }

      this.applyLOD(entry, targetLOD);
    }
  }

  private applyLOD(entry: SegmentMeshEntry, newLOD: SegmentLODState) {
    if (entry.lodState === newLOD) return;

    // Remove old LOD from root
    if (entry.lodState === 'ACTIVE') {
      this.rootGroup.remove(entry.activeGroup);
    } else if (entry.lodState === 'NEAR') {
      this.rootGroup.remove(entry.simplifiedMesh);
    }

    // Add new LOD
    if (newLOD === 'ACTIVE') {
      this.rootGroup.add(entry.activeGroup);
    } else if (newLOD === 'NEAR') {
      this.rootGroup.add(entry.simplifiedMesh);
    }

    entry.lodState = newLOD;
  }

  public dispose() {
    this.segmentEntries.forEach(entry => {
      this.rootGroup.remove(entry.activeGroup);
      this.rootGroup.remove(entry.simplifiedMesh);
      entry.activeGroup.traverse(child => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
      entry.simplifiedMesh.geometry.dispose();
      if (entry.simplifiedMesh.material instanceof THREE.Material) {
        entry.simplifiedMesh.material.dispose();
      }
    });
    this.segmentEntries = [];
  }
}
