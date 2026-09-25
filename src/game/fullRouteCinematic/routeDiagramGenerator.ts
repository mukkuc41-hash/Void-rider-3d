import * as THREE from 'three';
import { CosmicTrack } from '../trackData';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';
import {
  RouteDiagramData,
  RouteDiagramMarker,
  RouteDiagramBranch,
} from './routeCinematicTypes';

export class RouteDiagramGenerator {
  public static generate(
    track: CosmicTrack,
    pathConfig: ExtendedPathConfig
  ): RouteDiagramData {
    // 1. Gather 3D sample points along actual track geometry
    const rawPoints: THREE.Vector3[] = [];
    if (track.curve) {
      const sampleCount = 80;
      for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        rawPoints.push(track.curve.getPointAt(t));
      }
    } else if (track.samples && track.samples.length > 0) {
      for (const s of track.samples) {
        rawPoints.push(s.point);
      }
    }

    // Helper to get point at t from curve
    const getTrackPointAt = (t: number): THREE.Vector3 => {
      if (track.curve) {
        return track.curve.getPointAt(Math.max(0, Math.min(1, t)));
      }
      return new THREE.Vector3();
    };

    // 2. Isometric projection
    const isoAngle = Math.PI / 6; // 30 deg isometric angle
    const cosA = Math.cos(isoAngle);
    const sinA = Math.sin(isoAngle);

    const projected: { x: number; y: number; raw: THREE.Vector3 }[] = rawPoints.map(p => {
      const px = p.x * cosA - p.z * sinA;
      const py = (p.x * sinA + p.z * cosA) * 0.45 - p.y * 0.35;
      return { x: px, y: py, raw: p };
    });

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of projected) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const rangeX = Math.max(1, maxX - minX);
    const rangeY = Math.max(1, maxY - minY);
    const maxRange = Math.max(rangeX, rangeY);

    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;

    // Project any 3D vector to [8, 92] canvas percentage
    const projectPoint = (p: THREE.Vector3): { x: number; y: number } => {
      const px = p.x * cosA - p.z * sinA;
      const py = (p.x * sinA + p.z * cosA) * 0.45 - p.y * 0.35;
      const normX = 50 + ((px - centerX) / maxRange) * 76;
      const normY = 50 + ((py - centerY) / maxRange) * 76;
      return {
        x: Math.round(normX * 10) / 10,
        y: Math.round(normY * 10) / 10,
      };
    };

    const normalizedPoints = rawPoints.map(p => projectPoint(p));

    // 3. Extract Markers: START, CHECKPOINTS, BRANCHES, HAZARDS, FINAL SECTOR, FINISH
    const markers: RouteDiagramMarker[] = [];

    // START
    const startPt = getTrackPointAt(0.0);
    const startProj = projectPoint(startPt);
    markers.push({
      id: 'marker_start',
      type: 'START',
      label: 'START',
      subtext: pathConfig.locationName,
      x: startProj.x,
      y: startProj.y,
      t: 0.0,
      color: '#00f0ff',
    });

    // CHECKPOINTS
    const checkpointTList = [0.25, 0.5, 0.75];
    checkpointTList.forEach((t, idx) => {
      const pt = getTrackPointAt(t);
      const proj = projectPoint(pt);
      const sector = pathConfig.sectors.find(s => t >= s.startT && t <= s.endT);
      markers.push({
        id: `marker_chk_${idx + 1}`,
        type: 'CHECKPOINT',
        label: `CHECKPOINT ${idx + 1}`,
        subtext: sector ? sector.name : `GATE ${idx + 1}`,
        x: proj.x,
        y: proj.y,
        t,
        color: '#39ff14',
      });
    });

    // BRANCHES
    if (pathConfig.branches && pathConfig.branches.length > 0) {
      pathConfig.branches.forEach((b, idx) => {
        const pt = getTrackPointAt(b.entryT);
        const proj = projectPoint(pt);
        markers.push({
          id: `marker_branch_${b.id || idx}`,
          type: 'BRANCH',
          label: 'BRANCH',
          subtext: b.name || `ROUTE ${idx + 1}`,
          x: proj.x,
          y: proj.y,
          t: b.entryT,
          color: '#ffaa00',
        });
      });
    }

    // HAZARDS
    if (pathConfig.hazards && pathConfig.hazards.length > 0) {
      pathConfig.hazards.forEach((h, idx) => {
        const midT = (h.startT + h.endT) * 0.5;
        const pt = getTrackPointAt(midT);
        const proj = projectPoint(pt);
        markers.push({
          id: `marker_hazard_${h.id || idx}`,
          type: 'HAZARD',
          label: 'HAZARDS',
          subtext: h.name || 'DANGER ZONE',
          x: proj.x,
          y: proj.y,
          t: midT,
          color: '#ff0055',
        });
      });
    }

    // FINAL SECTOR
    const finalSectorT = pathConfig.finalClimax?.startT || 0.82;
    const finalPt = getTrackPointAt(finalSectorT);
    const finalProj = projectPoint(finalPt);
    markers.push({
      id: 'marker_final_sector',
      type: 'FINAL_SECTOR',
      label: 'FINAL SECTOR',
      subtext: pathConfig.finalClimax?.climaxTitle || 'FINAL CHALLENGE',
      x: finalProj.x,
      y: finalProj.y,
      t: finalSectorT,
      color: '#b000ff',
    });

    // FINISH
    const finishT = 0.98;
    const finishPt = getTrackPointAt(finishT);
    const finishProj = projectPoint(finishPt);
    markers.push({
      id: 'marker_finish',
      type: 'FINISH',
      label: 'FINISH',
      subtext: 'PODIUM GATE',
      x: finishProj.x,
      y: finishProj.y,
      t: finishT,
      color: '#ffe600',
    });

    // 4. Branch sub-paths
    const branches: RouteDiagramBranch[] = [];
    if (pathConfig.branches && pathConfig.branches.length > 0) {
      for (const b of pathConfig.branches) {
        if (b.controlPoints && b.controlPoints.length > 1) {
          const branchPts = b.controlPoints.map(cp => {
            const v = new THREE.Vector3(cp[0], cp[1], cp[2]);
            return projectPoint(v);
          });
          branches.push({
            id: b.id,
            name: b.name,
            type: b.type,
            points: branchPts,
            color: b.hologramColor || '#ffaa00',
            riskLevel: b.riskLevel,
          });
        }
      }
    }

    return {
      points: normalizedPoints,
      markers,
      branches,
      cameraT: 0.0,
      currentSectorName: pathConfig.sectors[0]?.name || 'SECTOR 01',
      totalKm: pathConfig.totalEquivalentKm || 5.2,
    };
  }
}
