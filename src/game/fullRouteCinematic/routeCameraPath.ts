import * as THREE from 'three';
import { CosmicTrack } from '../trackData';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';
import { RouteShotDefinition, RouteCinematicShotId } from './routeCinematicTypes';

export const ROUTE_12_SHOTS: RouteShotDefinition[] = [
  {
    id: 'SHOT_1_ESTABLISHING',
    index: 1,
    name: 'SECTOR ALPHA // ESTABLISHING ORBIT',
    durationSec: 9.68,
    startSplineT: 0.0,
    endSplineT: 0.06,
    altitudeOffset: 120,
    lookAheadT: 0.08,
    fovStart: 75,
    fovEnd: 65,
    shakeIntensity: 0.05,
    isScaleReveal: false,
    highlightActionText: 'ESTABLISHING ORBITAL TELEMETRY',
  },
  {
    id: 'SHOT_2_APPROACH_START',
    index: 2,
    name: 'LAUNCH PADDOCK // DESCENT APPROACH',
    durationSec: 8.85,
    startSplineT: 0.98,
    endSplineT: 1.04,
    altitudeOffset: 45,
    lookAheadT: 0.05,
    fovStart: 68,
    fovEnd: 60,
    shakeIntensity: 0.1,
    isScaleReveal: false,
    highlightActionText: 'APPROACHING LAUNCH GATES',
  },
  {
    id: 'SHOT_3_LOW_TRACK',
    index: 3,
    name: 'SECTOR 01 // LOW-ALTITUDE SPEED RUN',
    durationSec: 10.51,
    startSplineT: 0.05,
    endSplineT: 0.18,
    altitudeOffset: 5.5,
    lookAheadT: 0.06,
    fovStart: 62,
    fovEnd: 68,
    shakeIntensity: 0.25,
    isScaleReveal: false,
    highlightActionText: 'SCANNING SECTOR 1 SPEED HIGHWAY',
  },
  {
    id: 'SHOT_4_HIGH_SPEED',
    index: 4,
    name: 'SECTOR 02 // ACCELERATION CORRIDOR',
    durationSec: 9.95,
    startSplineT: 0.18,
    endSplineT: 0.32,
    altitudeOffset: 14,
    lookAheadT: 0.07,
    fovStart: 70,
    fovEnd: 82,
    shakeIntensity: 0.35,
    isScaleReveal: false,
    highlightActionText: 'HIGH-VELOCITY CORRIDOR TRAVERSAL',
  },
  {
    id: 'SHOT_5_SCALE_REVEAL',
    index: 5,
    name: 'GLOBAL MACRO REVEAL // COMPLETE 3D ROUTE',
    durationSec: 13.27,
    startSplineT: 0.30,
    endSplineT: 0.40,
    altitudeOffset: 650, // Minimum height; actual whole-route framing is bounds-driven
    lookAheadT: 0.15,
    fovStart: 85,
    fovEnd: 72,
    shakeIntensity: 0.02,
    isScaleReveal: true, // Complete route scale reveal!
    highlightActionText: 'COMPLETE 3D ROUTE TOPOLOGY REVEALED',
  },
  {
    id: 'SHOT_6_CORNER_DIVE',
    index: 6,
    name: 'SECTOR 03 // TECHNICAL APEX DIVE',
    durationSec: 9.40,
    startSplineT: 0.38,
    endSplineT: 0.50,
    altitudeOffset: 22,
    lookAheadT: 0.05,
    fovStart: 72,
    fovEnd: 64,
    shakeIntensity: 0.2,
    isScaleReveal: false,
    highlightActionText: 'SURVEYING TECHNICAL CORNER APEXES',
  },
  {
    id: 'SHOT_7_TUNNEL_RUN',
    index: 7,
    name: 'SECTOR 04 // TECHNICAL CORRIDOR RUN',
    durationSec: 9.95,
    startSplineT: 0.50,
    endSplineT: 0.60,
    altitudeOffset: 4.2,
    lookAheadT: 0.04,
    fovStart: 60,
    fovEnd: 70,
    shakeIntensity: 0.3,
    isScaleReveal: false,
    highlightActionText: 'SCANNING INTERIOR HAZARD CORRIDOR',
  },
  {
    id: 'SHOT_8_BRANCH_JUNCTION',
    index: 8,
    name: 'SECTOR 04 // TACTICAL BRANCH JUNCTION',
    durationSec: 10.51,
    startSplineT: 0.60,
    endSplineT: 0.70,
    altitudeOffset: 35,
    lookAheadT: 0.08,
    fovStart: 65,
    fovEnd: 62,
    shakeIntensity: 0.1,
    isScaleReveal: false,
    highlightActionText: 'IDENTIFYING SHORTCUT & RISK LANES',
  },
  {
    id: 'SHOT_9_SET_PIECE_ORBIT',
    index: 9,
    name: 'MAJOR SET PIECE // MONOLITHIC ORBIT',
    durationSec: 11.06,
    startSplineT: 0.70,
    endSplineT: 0.80,
    altitudeOffset: 65,
    lookAheadT: 0.09,
    fovStart: 70,
    fovEnd: 60,
    shakeIntensity: 0.15,
    isScaleReveal: false,
    highlightActionText: 'SURVEYING MAJOR ENVIRONMENTAL HAZARD',
  },
  {
    id: 'SHOT_10_FINAL_ACCEL',
    index: 10,
    name: 'FINAL SECTOR // SLIPSTREAM ACCELERATION',
    durationSec: 9.68,
    startSplineT: 0.80,
    endSplineT: 0.90,
    altitudeOffset: 12,
    lookAheadT: 0.06,
    fovStart: 72,
    fovEnd: 86,
    shakeIntensity: 0.4,
    isScaleReveal: false,
    highlightActionText: 'FINAL ACCELERATION SPRINT PREVIEW',
  },
  {
    id: 'SHOT_11_FINISH_APPROACH',
    index: 11,
    name: 'FINISH SECTOR // VICTORY ARCH APPROACH',
    durationSec: 8.85,
    startSplineT: 0.90,
    endSplineT: 0.98,
    altitudeOffset: 28,
    lookAheadT: 0.05,
    fovStart: 66,
    fovEnd: 58,
    shakeIntensity: 0.1,
    isScaleReveal: false,
    highlightActionText: 'TARGETING FINAL SECTOR FINISH LINE',
  },
  {
    id: 'SHOT_12_RETURN_START',
    index: 12,
    name: 'RETURN TO GRID // RACERS FORMATION',
    durationSec: 8.29,
    startSplineT: 0.98,
    endSplineT: 1.0,
    altitudeOffset: 16,
    lookAheadT: 0.04,
    fovStart: 64,
    fovEnd: 60,
    shakeIntensity: 0.05,
    isScaleReveal: false,
    highlightActionText: 'SYNCHRONIZING RACERS TO START GRID',
  },
];

export class RouteCameraPath {
  private track: CosmicTrack;
  private pathConfig: ExtendedPathConfig;
  private trackCenter: THREE.Vector3 = new THREE.Vector3();
  private routeBoundsRadius: number = 500;
  private routeBoundsMin: THREE.Vector3 = new THREE.Vector3();
  private routeBoundsMax: THREE.Vector3 = new THREE.Vector3();

  constructor(track: CosmicTrack, pathConfig: ExtendedPathConfig) {
    this.track = track;
    this.pathConfig = pathConfig;
    this.computeTrackCenter();
  }

  public setPath(track: CosmicTrack, pathConfig: ExtendedPathConfig) {
    this.track = track;
    this.pathConfig = pathConfig;
    this.computeTrackCenter();
  }

  private computeTrackCenter() {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    // Sample the real main route densely enough for a stable whole-course frame.
    const sampleCount = 256;
    for (let i = 0; i < sampleCount; i++) {
      const sample = this.track.getSampleAt(i / sampleCount);
      min.min(sample.point);
      max.max(sample.point);
    }

    // Include every configured branch/shortcut in the framing bounds.
    for (const branch of this.pathConfig.branches || []) {
      const branchSamples = 32;
      for (let i = 0; i <= branchSamples; i++) {
        const point = branch.curve.getPoint(i / branchSamples);
        min.min(point);
        max.max(point);
      }
    }

    this.routeBoundsMin.copy(min);
    this.routeBoundsMax.copy(max);
    this.trackCenter.copy(min).add(max).multiplyScalar(0.5);

    const size = new THREE.Vector3().subVectors(max, min);
    this.routeBoundsRadius = Math.max(100, size.length() * 0.5);
  }

  public sampleShotPose(
    shot: RouteShotDefinition,
    shotProgress: number // 0.0 to 1.0
  ): {
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov: number;
    currentSplineT: number;
    shake: number;
  } {
    // Interpolate spline progress in authored travel direction.  Values above 1.0
    // intentionally wrap through the finish/start seam (e.g. 0.98 -> 1.04),
    // instead of taking the long way around the course.
    const rawCurrentT = shot.startSplineT + (shot.endSplineT - shot.startSplineT) * shotProgress;
    const tCurrent = ((rawCurrentT % 1.0) + 1.0) % 1.0;
    const rawLookT = rawCurrentT + shot.lookAheadT;
    const tLook = ((rawLookT % 1.0) + 1.0) % 1.0;

    const currentSample = this.track.getSampleAt(tCurrent);
    const lookSample = this.track.getSampleAt(tLook);

    const pos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    if (shot.isScaleReveal) {
      // SHOT 5: Complete Route Scale Reveal
      // Frame the actual main route AND all configured shortcut curves.
      // The distance is derived from the route bounds instead of a fixed
      // radius, so long/short tracks both remain completely visible.
      const angle = shotProgress * Math.PI * 0.6 + 0.4;
      const radius = this.routeBoundsRadius * (1.15 + Math.sin(shotProgress * Math.PI) * 0.12);
      const height = Math.max(shot.altitudeOffset, this.routeBoundsRadius * 0.75)
        + Math.sin(shotProgress * Math.PI) * this.routeBoundsRadius * 0.18;

      pos.set(
        this.trackCenter.x + Math.cos(angle) * radius,
        this.trackCenter.y + height,
        this.trackCenter.z + Math.sin(angle) * radius
      );
      lookAt.copy(this.trackCenter);
    } else {
      // Standard camera following spline track nodes
      const tangent = currentSample.tangent.clone().normalize();
      const normal = currentSample.normal.clone().normalize();
      const binormal = currentSample.binormal.clone().normalize();

      // Keep the cinematic camera in the route's local frame. This is important
      // for climbing, descending, banked and inverted sections: world-Y offsets
      // can put the camera inside the track or below it.
      const sideSweep = Math.sin(shotProgress * Math.PI);
      const sideFactor = sideSweep * (shot.index % 2 === 0 ? 12 : -12);
      const safeAltitude = Math.max(2.5, shot.altitudeOffset);

      pos.copy(currentSample.point)
        .addScaledVector(normal, safeAltitude)
        .addScaledVector(binormal, sideFactor)
        .addScaledVector(tangent, -8);

      // Look slightly above the route surface in its local normal direction,
      // keeping the ship/track visible even on vertical or inverted sections.
      lookAt.copy(lookSample.point).addScaledVector(lookSample.normal, 2.5);
    }

    const fov = THREE.MathUtils.lerp(shot.fovStart, shot.fovEnd, shotProgress);
    const shake = shot.shakeIntensity * (1 - shotProgress * 0.2);

    return { pos, lookAt, fov, currentSplineT: tCurrent, shake };
  }
}
