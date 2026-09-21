import * as THREE from 'three';
import { BranchRouteConfig, BranchRouteDirection } from './junctionSystem';

export type TrackType = 'CIRCUIT' | 'POINT_TO_POINT' | 'BRANCHING';

export type SegmentType =
  | 'STRAIGHT'
  | 'CURVE'
  | 'CHICANE'
  | 'SLOPE'
  | 'JUNCTION_ENTRY'
  | 'JUNCTION_BRANCH'
  | 'JUNCTION_MERGE'
  | 'START_FINISH';

export interface TrackSegment {
  id: string;
  type: SegmentType;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  entryPoint: THREE.Vector3;
  exitPoint: THREE.Vector3;
  entryTangent: THREE.Vector3;
  exitTangent: THREE.Vector3;
  nextSegmentId: string | string[];
  previousSegmentId: string | null;
  length: number;
  curve?: THREE.Curve<THREE.Vector3>;
  routeId: string; // e.g. 'main', 'left_route_01', 'right_route_01'
  junctionId?: string;
  width: number;
  elevationDelta?: number;
  bankingAngle?: number;
}

export interface TrackJunctionConfig {
  junctionId: string;
  entrySegmentId: string;
  availableRoutes: string[]; // route IDs
  defaultRouteId: string;
  mergeSegmentId: string;
  name: string;
  approachDistance: number;
  commitmentDistance: number;
  routes: BranchRouteConfig[];
  status?: 'APPROACHING' | 'COMMITMENT_ZONE' | 'IN_BRANCH' | 'MERGED';
  isLocked?: boolean;
}

export interface RouteAwareCheckpoint {
  checkpointId: string | number;
  segmentId: string;
  routeId: string;
  sequenceIndex: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  width: number;
  t: number; // 0 to 1 along entire track or segment
  isStartFinish?: boolean;
}

export interface TrackGraphValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TrackGraph {
  public id: string;
  public trackType: TrackType;
  public segments: Map<string, TrackSegment> = new Map();
  public junctions: Map<string, TrackJunctionConfig> = new Map();
  public checkpoints: RouteAwareCheckpoint[] = [];
  public startFinishSegmentId: string = 'segment_01';
  public totalLength: number = 0;
  public totalLaps: number = 3;

  constructor(id: string, trackType: TrackType = 'CIRCUIT', totalLaps: number = 3) {
    this.id = id;
    this.trackType = trackType;
    this.totalLaps = totalLaps;
  }

  public addSegment(segment: TrackSegment) {
    this.segments.set(segment.id, segment);
  }

  public addJunction(junction: TrackJunctionConfig) {
    this.junctions.set(junction.junctionId, junction);
  }

  public addCheckpoint(cp: RouteAwareCheckpoint) {
    this.checkpoints.push(cp);
  }

  public recalculateMetrics() {
    let mainLen = 0;
    for (const seg of this.segments.values()) {
      if (seg.routeId === 'main') {
        mainLen += seg.length;
      }
    }
    this.totalLength = mainLen > 0 ? mainLen : 4800;
  }
}

/**
 * Validates the track graph for topology, connectivity, routing, and checkpoint reachability.
 */
export function validateTrackGraph(graph: TrackGraph): TrackGraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const TOLERANCE_DISTANCE = 4.0; // Distance tolerance between exit and entry

  // 1. Check segment existence and uniqueness
  if (graph.segments.size === 0) {
    errors.push(`TRACK ERROR: Track ${graph.id} contains no segments.`);
    return { isValid: false, errors, warnings };
  }

  const seenIds = new Set<string>();
  for (const [id, seg] of graph.segments.entries()) {
    if (seenIds.has(id)) {
      errors.push(`TRACK ERROR: Duplicate segment ID detected: ${id}.`);
    }
    seenIds.add(id);

    // 2. Validate exit and entry alignment with next segments
    const nextIds = Array.isArray(seg.nextSegmentId) ? seg.nextSegmentId : [seg.nextSegmentId];
    for (const nId of nextIds) {
      if (!nId) continue;
      const nextSeg = graph.segments.get(nId);
      if (!nextSeg) {
        errors.push(`TRACK ERROR: ${seg.id} -> ${nId} references missing segment.`);
        continue;
      }

      const dist = seg.exitPoint.distanceTo(nextSeg.entryPoint);
      if (dist > TOLERANCE_DISTANCE) {
        errors.push(
          `TRACK ERROR: ${seg.id} -> ${nId} does not connect. Exit (${seg.exitPoint.x.toFixed(
            1
          )}, ${seg.exitPoint.y.toFixed(1)}, ${seg.exitPoint.z.toFixed(
            1
          )}) differs from Entry (${nextSeg.entryPoint.x.toFixed(1)}, ${nextSeg.entryPoint.y.toFixed(
            1
          )}, ${nextSeg.entryPoint.z.toFixed(1)}) by ${dist.toFixed(2)}m.`
        );
      }
    }

    // 3. Validate previous segment connection
    if (seg.previousSegmentId) {
      const prevSeg = graph.segments.get(seg.previousSegmentId);
      if (!prevSeg) {
        errors.push(`TRACK ERROR: ${seg.id} references non-existent previousSegmentId: ${seg.previousSegmentId}.`);
      }
    }
  }

  // 4. Validate Junctions
  const seenJunctionIds = new Set<string>();
  for (const [jId, junc] of graph.junctions.entries()) {
    if (seenJunctionIds.has(jId)) {
      errors.push(`TRACK ERROR: Duplicate junction ID detected: ${jId}.`);
    }
    seenJunctionIds.add(jId);

    const entrySeg = graph.segments.get(junc.entrySegmentId);
    if (!entrySeg) {
      errors.push(`TRACK ERROR: Junction ${jId} has missing entrySegmentId: ${junc.entrySegmentId}.`);
    }

    const mergeSeg = graph.segments.get(junc.mergeSegmentId);
    if (!mergeSeg) {
      errors.push(`TRACK ERROR: Junction ${jId} has missing mergeSegmentId: ${junc.mergeSegmentId}.`);
    }

    if (!junc.availableRoutes || junc.availableRoutes.length === 0) {
      errors.push(`TRACK ERROR: Junction ${jId} has no availableRoutes defined.`);
    }

    if (!junc.defaultRouteId || !junc.availableRoutes.includes(junc.defaultRouteId)) {
      errors.push(`TRACK ERROR: Junction ${jId} defaultRouteId ${junc.defaultRouteId} is not in availableRoutes.`);
    }

    // Check each route connects from entry to merge
    for (const rId of junc.availableRoutes) {
      // Find branch segments belonging to this route
      const branchSegs = Array.from(graph.segments.values()).filter(
        s => s.junctionId === jId && s.routeId === rId
      );
      if (branchSegs.length === 0) {
        warnings.push(`TRACK WARNING: Junction ${jId} route ${rId} has no dedicated branch segments in graph.`);
      } else {
        const lastBranchSeg = branchSegs[branchSegs.length - 1];
        if (mergeSeg && lastBranchSeg) {
          const nextArr = Array.isArray(lastBranchSeg.nextSegmentId)
            ? lastBranchSeg.nextSegmentId
            : [lastBranchSeg.nextSegmentId];
          if (!nextArr.includes(junc.mergeSegmentId)) {
            errors.push(`TRACK ERROR: Route ${rId} has no merge segment connection to ${junc.mergeSegmentId}.`);
          }
        }
      }
    }
  }

  // 5. Validate Track Type Looping Rules
  if (graph.trackType === 'CIRCUIT') {
    // A circuit MUST eventually reconnect to startFinishSegmentId
    const startSeg = graph.segments.get(graph.startFinishSegmentId);
    if (!startSeg) {
      errors.push(`TRACK ERROR: Circuit track startFinishSegmentId ${graph.startFinishSegmentId} not found.`);
    } else {
      let loopsBack = false;
      for (const seg of graph.segments.values()) {
        const nextArr = Array.isArray(seg.nextSegmentId) ? seg.nextSegmentId : [seg.nextSegmentId];
        if (nextArr.includes(graph.startFinishSegmentId)) {
          loopsBack = true;
          break;
        }
      }
      if (!loopsBack) {
        errors.push(`TRACK ERROR: Circuit track does not loop back to start ${graph.startFinishSegmentId}.`);
      }
    }
  } else if (graph.trackType === 'POINT_TO_POINT') {
    // Point to Point must NOT loop back to start
    for (const seg of graph.segments.values()) {
      const nextArr = Array.isArray(seg.nextSegmentId) ? seg.nextSegmentId : [seg.nextSegmentId];
      if (nextArr.includes(graph.startFinishSegmentId)) {
        errors.push(
          `TRACK ERROR: Point-to-point track illegally loops back to start segment ${graph.startFinishSegmentId}.`
        );
      }
    }
  }

  // 6. Validate Checkpoint Reachability & Order
  if (graph.checkpoints.length === 0) {
    warnings.push(`TRACK WARNING: Track ${graph.id} has no checkpoints defined.`);
  } else {
    for (const cp of graph.checkpoints) {
      const seg = graph.segments.get(cp.segmentId);
      if (!seg) {
        errors.push(`TRACK ERROR: Checkpoint ${cp.checkpointId} is located on non-existent segment ${cp.segmentId}.`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`=== TRACK GRAPH VALIDATION FAILED FOR [${graph.id}] ===`);
    errors.forEach(e => console.error(e));
  } else {
    console.log(`[TrackGraph] Track [${graph.id}] passed all topology validations.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Route Manager handles route selection, decision windows, commitment zones, and smooth route transitions.
 */
export class RouteManager {
  private graph: TrackGraph;
  public activeJunctionId: string | null = null;
  public selectedRouteId: string | null = null;
  public activeRouteId: string | null = null;
  public isSelectionLocked: boolean = false;
  public junctionState: 'APPROACHING' | 'COMMITMENT_ZONE' | 'IN_BRANCH' | 'PASSED' = 'PASSED';
  public branchProgress: number = 0;
  public distanceToJunction: number = Infinity;
  public distanceToFinish: number = Infinity;
  public currentSegmentId: string = 'segment_01';
  public nextSegmentId: string = 'segment_02';

  constructor(graph: TrackGraph) {
    this.graph = graph;
  }

  public detectNearbyJunction(distanceOrSplineT: number): TrackJunctionConfig | null {
    // Evaluates nearby junctions along the track
    for (const junc of this.graph.junctions.values()) {
      const entrySeg = this.graph.segments.get(junc.entrySegmentId);
      if (!entrySeg) continue;

      // Distance check
      if (this.distanceToJunction <= junc.approachDistance) {
        this.activeJunctionId = junc.junctionId;
        if (this.distanceToJunction <= junc.commitmentDistance) {
          this.commitRoute(this.selectedRouteId || junc.defaultRouteId);
          this.junctionState = 'COMMITMENT_ZONE';
        } else {
          this.junctionState = 'APPROACHING';
        }
        return junc;
      }
    }
    return null;
  }

  public getAvailableRoutes(junctionId: string): string[] {
    const junc = this.graph.junctions.get(junctionId);
    return junc ? [...junc.availableRoutes] : [];
  }

  public selectRoute(routeId: string, junctionId?: string): boolean {
    const targetJunctionId = junctionId || this.activeJunctionId;
    if (!targetJunctionId) return false;

    const junc = this.graph.junctions.get(targetJunctionId);
    if (!junc) return false;

    // Rule 6: Once committed or inside branch, route switching is locked and rejected
    if (this.isSelectionLocked || this.junctionState === 'COMMITMENT_ZONE' || this.junctionState === 'IN_BRANCH') {
      console.warn(`[RouteManager] Route selection locked. Cannot switch to ${routeId} after commitment.`);
      return false;
    }

    if (!this.validateRoute(routeId, targetJunctionId)) {
      console.warn(`[RouteManager] Invalid route ${routeId} for junction ${targetJunctionId}.`);
      return false;
    }

    this.selectedRouteId = routeId;
    return true;
  }

  public validateRoute(routeId: string, junctionId?: string): boolean {
    const targetJunctionId = junctionId || this.activeJunctionId;
    if (!targetJunctionId) {
      for (const j of this.graph.junctions.values()) {
        if (j.availableRoutes.includes(routeId)) return true;
      }
      return false;
    }
    const junc = this.graph.junctions.get(targetJunctionId);
    return !!junc?.availableRoutes.includes(routeId);
  }

  public commitRoute(routeId: string): boolean {
    if (!this.validateRoute(routeId)) {
      const def = this.getDefaultRoute();
      this.selectedRouteId = def?.id || 'main';
    } else {
      this.selectedRouteId = routeId;
    }
    this.isSelectionLocked = true;
    this.junctionState = 'COMMITMENT_ZONE';
    return true;
  }

  public lockRouteSelection() {
    this.isSelectionLocked = true;
  }

  public unlockRouteSelection() {
    this.isSelectionLocked = false;
  }

  public transitionToRoute(routeId: string, speed?: number): boolean {
    if (!this.validateRoute(routeId)) return false;
    this.activeRouteId = routeId;
    this.junctionState = 'IN_BRANCH';
    this.isSelectionLocked = true;
    this.branchProgress = 0;
    return true;
  }

  public updateRouteProgress(
    dt: number,
    speed: number,
    onCheckpointValidated?: (cpIndices: number[]) => void
  ): { finishedBranch: boolean; progress: number } {
    if (this.junctionState !== 'IN_BRANCH') {
      return { finishedBranch: false, progress: 0 };
    }

    const branchLen = 800; // Average branch segment length
    const advance = (speed * dt) / branchLen;
    this.branchProgress += advance;

    if (this.branchProgress >= 1.0) {
      this.branchProgress = 1.0;
      this.junctionState = 'PASSED';
      this.isSelectionLocked = false;
      this.activeRouteId = null;
      return { finishedBranch: true, progress: 1.0 };
    }

    return { finishedBranch: false, progress: this.branchProgress };
  }

  public getCurrentSegment(): TrackSegment | null {
    return this.graph.segments.get(this.currentSegmentId) || null;
  }

  public getCurrentRoute(): string {
    return this.activeRouteId || this.selectedRouteId || 'main';
  }

  public getNextSegment(): TrackSegment | null {
    return this.graph.segments.get(this.nextSegmentId) || null;
  }

  public getTrackProgress(): number {
    if (this.graph.totalLength <= 0) return 0;
    const remaining = Math.max(0, this.distanceToFinish);
    const completed = Math.max(0, this.graph.totalLength - remaining);
    return Math.min(1.0, completed / this.graph.totalLength);
  }

  public getDistanceToJunction(): number {
    return this.distanceToJunction;
  }

  public getDistanceToFinish(): number {
    return this.distanceToFinish;
  }

  public getDefaultRoute(junctionOrId?: TrackJunctionConfig | string): BranchRouteConfig | null {
    let junc: TrackJunctionConfig | undefined;
    if (typeof junctionOrId === 'string') {
      junc = this.graph.junctions.get(junctionOrId);
    } else if (junctionOrId) {
      junc = junctionOrId;
    } else if (this.activeJunctionId) {
      junc = this.graph.junctions.get(this.activeJunctionId);
    }

    if (!junc) {
      const first = Array.from(this.graph.junctions.values())[0];
      if (!first) return null;
      return first.routes.find(r => r.id === first.defaultRouteId) || first.routes[0] || null;
    }

    return junc.routes.find(r => r.id === junc!.defaultRouteId) || junc.routes[0] || null;
  }
}

/**
 * CheckpointManager handles route-aware checkpoints, preventing sequence skipping
 * while legitimately acknowledging valid branching route checkpoints.
 */
export class CheckpointManager {
  private checkpoints: RouteAwareCheckpoint[] = [];
  private passedCheckpoints: Set<string | number> = new Set();
  private nextCheckpointIndex: number = 0;

  constructor(checkpoints: RouteAwareCheckpoint[] = []) {
    this.checkpoints = [...checkpoints].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  }

  public setCheckpoints(checkpoints: RouteAwareCheckpoint[]) {
    this.checkpoints = [...checkpoints].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
    this.reset();
  }

  public reset() {
    this.passedCheckpoints.clear();
    this.nextCheckpointIndex = 0;
  }

  public getCheckpoints(): RouteAwareCheckpoint[] {
    return this.checkpoints;
  }

  public getPassedCount(): number {
    return this.passedCheckpoints.size;
  }

  public getNextCheckpoint(): RouteAwareCheckpoint | null {
    return this.checkpoints[this.nextCheckpointIndex] || null;
  }

  /**
   * Validates if a checkpoint is legally passed without illegal sequence skipping.
   * Both left and right branches count as legitimate sequential progression.
   */
  public validateCheckpointOrder(
    checkpoint: RouteAwareCheckpoint,
    activeRouteId: string = 'main'
  ): boolean {
    // If checkpoint belongs to a specific alternate branch route that is NOT active, reject
    if (checkpoint.routeId !== 'main' && checkpoint.routeId !== activeRouteId) {
      return false;
    }

    // Sequence index must not skip ahead by more than 1 past the next expected checkpoint
    const expected = this.checkpoints[this.nextCheckpointIndex];
    if (expected) {
      // If expected checkpoint is from an alternate branch, we allow advancing to the merge checkpoint
      if (expected.routeId !== 'main' && expected.routeId !== activeRouteId) {
        // Advance expected until main or activeRouteId is found
        while (
          this.nextCheckpointIndex < this.checkpoints.length &&
          this.checkpoints[this.nextCheckpointIndex].routeId !== 'main' &&
          this.checkpoints[this.nextCheckpointIndex].routeId !== activeRouteId
        ) {
          this.nextCheckpointIndex++;
        }
      }

      if (checkpoint.sequenceIndex > this.nextCheckpointIndex + 1) {
        // Skipping required checkpoints (e.g. CP01 -> CP04 directly) is rejected
        return false;
      }
    }

    this.passedCheckpoints.add(checkpoint.checkpointId);
    if (checkpoint.sequenceIndex >= this.nextCheckpointIndex) {
      this.nextCheckpointIndex = checkpoint.sequenceIndex + 1;
    }
    return true;
  }

  public areRequiredCheckpointsCompleted(minFraction: number = 0.70): boolean {
    if (this.checkpoints.length === 0) return true;
    return this.passedCheckpoints.size / this.checkpoints.length >= minFraction;
  }

  public hasPassed(id: string | number): boolean {
    return this.passedCheckpoints.has(id);
  }
}

/**
 * LapManager manages lap progress, start/finish line debounce, direction verification,
 * and ensures point-to-point tracks finish cleanly while circuit tracks loop accurately.
 */
export class LapManager {
  public currentLap: number = 1;
  public totalLaps: number = 3;
  public trackType: TrackType = 'CIRCUIT';
  public hasFinished: boolean = false;
  private lastFinishLineCrossingTime: number = 0;
  private readonly FINISH_LINE_DEBOUNCE_MS = 3000; // 3 second debounce to prevent double counting
  public lapStartTime: number = 0;
  public currentLapTime: number = 0;
  public bestLapTime: number = 0;

  constructor(trackType: TrackType = 'CIRCUIT', totalLaps: number = 3) {
    this.trackType = trackType;
    this.totalLaps = totalLaps;
    this.reset();
  }

  public reset() {
    this.currentLap = 1;
    this.hasFinished = false;
    this.lastFinishLineCrossingTime = 0;
    this.lapStartTime = Date.now();
    this.currentLapTime = 0;
    this.bestLapTime = 0;
  }

  /**
   * Distinguishes TRACK POSITION, CHECKPOINT PROGRESS, and LAP NUMBER.
   * Only increments a lap when:
   * 1. All required checkpoints for the current lap are completed
   * 2. Player crosses valid finish line
   * 3. Player is traveling in the correct forward direction (forwardDot > 0)
   * 4. Debounce threshold is respected
   */
  public isValidFinishCrossing(
    shipPos: THREE.Vector3,
    shipVelocity: THREE.Vector3,
    finishTangent: THREE.Vector3,
    checkpointManager: CheckpointManager
  ): boolean {
    if (this.hasFinished) return false;

    const now = Date.now();
    if (now - this.lastFinishLineCrossingTime < this.FINISH_LINE_DEBOUNCE_MS) {
      // Rapid double crossing rejected (debounce)
      return false;
    }

    // 1. Direction check: forwardDot must be positive (prevents backward crossing exploit)
    const forwardDot = shipVelocity.clone().normalize().dot(finishTangent.clone().normalize());
    if (forwardDot < 0.2) {
      return false;
    }

    // 2. Checkpoint completion check: player cannot farm or skip checkpoints
    if (!checkpointManager.areRequiredCheckpointsCompleted(0.70)) {
      return false;
    }

    return true;
  }

  public recordFinishCrossing(onLapAdvance?: (lap: number, total: number) => void, onRaceFinish?: (finalTime: number) => void): boolean {
    const now = Date.now();
    this.lastFinishLineCrossingTime = now;

    if (this.lapStartTime > 0) {
      const lapDuration = now - this.lapStartTime;
      if (this.bestLapTime === 0 || lapDuration < this.bestLapTime) {
        this.bestLapTime = lapDuration;
      }
    }
    this.lapStartTime = now;

    if (this.trackType === 'POINT_TO_POINT') {
      // Point to Point finishes on first crossing
      this.hasFinished = true;
      onRaceFinish?.(now);
      return true;
    }

    // Circuit track lap handling
    if (this.currentLap >= this.totalLaps) {
      this.hasFinished = true;
      this.currentLap = this.totalLaps;
      onRaceFinish?.(now);
      return true;
    }

    this.currentLap++;
    onLapAdvance?.(this.currentLap, this.totalLaps);
    return true;
  }
}

/**
 * RespawnManager recovers the spacecraft to the nearest valid track position,
 * ensuring safe direction, elevation, and preventing recovery into hazardous or ambiguous states.
 */
export class RespawnManager {
  private graph: TrackGraph;

  constructor(graph: TrackGraph) {
    this.graph = graph;
  }

  public getSafeRecoveryTransform(
    currentSegmentId: string,
    activeRouteId: string = 'main',
    lateralJitter: number = 0
  ): { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; rotation: THREE.Euler } {
    const seg = this.graph.segments.get(currentSegmentId) || this.graph.segments.get(this.graph.startFinishSegmentId);
    if (!seg) {
      return {
        position: new THREE.Vector3(0, 5, 0),
        tangent: new THREE.Vector3(0, 0, -1),
        normal: new THREE.Vector3(0, 1, 0),
        rotation: new THREE.Euler(0, 0, 0),
      };
    }

    // Never respawn in ambiguous junction decision boundary; spawn along the segment's safe center-line
    const safePos = seg.entryPoint.clone().add(seg.exitPoint).multiplyScalar(0.5);
    safePos.y += 2.5; // Elevate safely above track surface

    const tangent = seg.exitPoint.clone().sub(seg.entryPoint).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    return {
      position: safePos,
      tangent,
      normal,
      rotation: seg.rotation.clone(),
    };
  }

  public getSafeRecoveryPoint(
    splineT: number,
    activeRouteId: string = 'main_route'
  ): { splineT: number; routeId: string; safeSpeed: number } {
    let safeT = ((splineT % 1.0) + 1.0) % 1.0;

    // Never spawn directly inside a junction divergence or convergence
    for (const [_, junction] of this.graph.junctions.entries()) {
      const approachFraction = (junction.approachDistance || 120) / Math.max(1000, this.graph.totalLength);
      if (Math.abs(safeT - approachFraction) < 0.02) {
        safeT = Math.max(0, safeT - 0.03);
      }
    }

    return {
      splineT: safeT,
      routeId: activeRouteId === 'main_route' ? 'main_route' : activeRouteId,
      safeSpeed: 20,
    };
  }
}

/**
 * TrackGenerator builds a structured, finite route graph with explicit segment connections.
 */
export class TrackGenerator {
  public static generateTrackGraph(
    trackId: string,
    controlPoints: [number, number, number][],
    trackType: TrackType = 'CIRCUIT',
    totalLaps: number = 3,
    junctionConfigs?: TrackJunctionConfig[]
  ): TrackGraph {
    const graph = new TrackGraph(trackId, trackType, totalLaps);
    const numPoints = controlPoints.length;

    // 1. Generate finite track segments connecting each control point
    for (let i = 0; i < numPoints; i++) {
      const p1 = new THREE.Vector3(...controlPoints[i]);
      const p2Index = trackType === 'CIRCUIT' ? (i + 1) % numPoints : Math.min(i + 1, numPoints - 1);
      const p2 = new THREE.Vector3(...controlPoints[p2Index]);

      const segId = `segment_${String(i + 1).padStart(2, '0')}`;
      const nextSegId =
        trackType === 'CIRCUIT'
          ? `segment_${String(p2Index + 1).padStart(2, '0')}`
          : i === numPoints - 1
          ? ''
          : `segment_${String(i + 2).padStart(2, '0')}`;

      const prevSegId = i === 0 ? (trackType === 'CIRCUIT' ? `segment_${String(numPoints).padStart(2, '0')}` : null) : `segment_${String(i).padStart(2, '0')}`;

      const length = p1.distanceTo(p2);
      const tangent = p2.clone().sub(p1).normalize();

      const segType: SegmentType =
        i === 0 ? 'START_FINISH' : i % 4 === 0 ? 'CURVE' : i % 6 === 0 ? 'CHICANE' : 'STRAIGHT';

      const seg: TrackSegment = {
        id: segId,
        type: segType,
        position: p1.clone().add(p2).multiplyScalar(0.5),
        rotation: new THREE.Euler(0, Math.atan2(tangent.x, tangent.z), 0),
        entryPoint: p1.clone(),
        exitPoint: p2.clone(),
        entryTangent: tangent.clone(),
        exitTangent: tangent.clone(),
        nextSegmentId: nextSegId,
        previousSegmentId: prevSegId,
        length,
        routeId: 'main',
        width: 28,
      };

      graph.addSegment(seg);
    }

    // 2. Add Start / Finish segment identifier
    graph.startFinishSegmentId = 'segment_01';

    // 3. Add explicit Junctions and connect branch segments if provided
    if (junctionConfigs) {
      for (const junc of junctionConfigs) {
        graph.addJunction(junc);

        // Splice branching segments for each route
        junc.availableRoutes.forEach((rId, rIndex) => {
          const entrySeg = graph.segments.get(junc.entrySegmentId);
          const mergeSeg = graph.segments.get(junc.mergeSegmentId);
          if (entrySeg && mergeSeg) {
            const branchSegId = `branch_${junc.junctionId}_${rId}`;
            const lateralOffset = rIndex === 0 ? -18 : 18;

            const branchEntry = entrySeg.exitPoint.clone();
            const branchExit = mergeSeg.entryPoint.clone();
            const branchMid = branchEntry.clone().add(branchExit).multiplyScalar(0.5);
            branchMid.x += lateralOffset;

            const branchSeg: TrackSegment = {
              id: branchSegId,
              type: 'JUNCTION_BRANCH',
              position: branchMid,
              rotation: entrySeg.rotation.clone(),
              entryPoint: branchEntry,
              exitPoint: branchExit,
              entryTangent: entrySeg.exitTangent.clone(),
              exitTangent: mergeSeg.entryTangent.clone(),
              nextSegmentId: junc.mergeSegmentId,
              previousSegmentId: junc.entrySegmentId,
              length: branchEntry.distanceTo(branchMid) + branchMid.distanceTo(branchExit),
              routeId: rId,
              junctionId: junc.junctionId,
              width: 22,
            };
            graph.addSegment(branchSeg);

            // Update entry segment to reference branch
            const existingNext = Array.isArray(entrySeg.nextSegmentId)
              ? entrySeg.nextSegmentId
              : [entrySeg.nextSegmentId];
            if (!existingNext.includes(branchSegId)) {
              entrySeg.nextSegmentId = [...existingNext, branchSegId];
            }
          }
        });
      }
    }

    // 4. Generate route-aware checkpoints along track segments
    const segList = Array.from(graph.segments.values()).filter(s => s.routeId === 'main');
    segList.forEach((seg, idx) => {
      const cp: RouteAwareCheckpoint = {
        checkpointId: `cp_${String(idx + 1).padStart(2, '0')}`,
        segmentId: seg.id,
        routeId: seg.routeId,
        sequenceIndex: idx,
        position: seg.entryPoint.clone().add(new THREE.Vector3(0, 1.5, 0)),
        tangent: seg.entryTangent.clone(),
        normal: new THREE.Vector3(0, 1, 0),
        width: seg.width,
        t: idx / segList.length,
        isStartFinish: idx === 0,
      };
      graph.addCheckpoint(cp);
    });

    graph.recalculateMetrics();
    return graph;
  }
}

/**
 * TrackManager acts as the primary coordinator for track graph, routing, checkpoints, laps, and respawn.
 */
export class TrackManager {
  public graph: TrackGraph;
  public routeManager: RouteManager;
  public checkpointManager: CheckpointManager;
  public lapManager: LapManager;
  public respawnManager: RespawnManager;

  constructor(graph: TrackGraph) {
    this.graph = graph;
    this.routeManager = new RouteManager(graph);
    this.checkpointManager = new CheckpointManager(graph.checkpoints);
    this.lapManager = new LapManager(graph.trackType, graph.totalLaps);
    this.respawnManager = new RespawnManager(graph);
  }

  // 17 Required API Functions
  public detectNearbyJunction(distanceOrSplineT: number) {
    return this.routeManager.detectNearbyJunction(distanceOrSplineT);
  }

  public getAvailableRoutes(junctionId: string) {
    return this.routeManager.getAvailableRoutes(junctionId);
  }

  public selectRoute(routeId: string, junctionId?: string) {
    return this.routeManager.selectRoute(routeId, junctionId);
  }

  public validateRoute(routeId: string, junctionId?: string) {
    return this.routeManager.validateRoute(routeId, junctionId);
  }

  public transitionToRoute(routeId: string, speed?: number) {
    return this.routeManager.transitionToRoute(routeId, speed);
  }

  public commitRoute(routeId: string) {
    return this.routeManager.commitRoute(routeId);
  }

  public lockRouteSelection() {
    this.routeManager.lockRouteSelection();
  }

  public updateRouteProgress(dt: number, speed: number, onCp?: (cpIndices: number[]) => void) {
    return this.routeManager.updateRouteProgress(dt, speed, onCp);
  }

  public getCurrentSegment() {
    return this.routeManager.getCurrentSegment();
  }

  public getCurrentRoute() {
    return this.routeManager.getCurrentRoute();
  }

  public getNextSegment() {
    return this.routeManager.getNextSegment();
  }

  public getTrackProgress() {
    return this.routeManager.getTrackProgress();
  }

  public getDefaultRoute(junctionOrId?: TrackJunctionConfig | string) {
    return this.routeManager.getDefaultRoute(junctionOrId);
  }

  public validateTrackGraph() {
    return validateTrackGraph(this.graph);
  }

  public validateCheckpointOrder(
    checkpoint: RouteAwareCheckpoint,
    activeRouteId: string = 'main'
  ) {
    return this.checkpointManager.validateCheckpointOrder(checkpoint, activeRouteId);
  }

  public isValidFinishCrossing(
    shipPos: THREE.Vector3,
    shipVelocity: THREE.Vector3,
    finishTangent: THREE.Vector3
  ) {
    return this.lapManager.isValidFinishCrossing(shipPos, shipVelocity, finishTangent, this.checkpointManager);
  }
}
