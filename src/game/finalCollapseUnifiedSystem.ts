import * as THREE from 'three';
import { sound } from './audio';
import { PathSegment } from './extendedPath/extendedPathTypes';

export type EvacuationState =
  | 'TOWER_APPROACHING'
  | 'TOWER_ENTERED'
  | 'BASEMENT_ENTERED'
  | 'HANGAR_ENTERED'
  | 'PARKING_BAY_ENTERED'
  | 'SHIP_ALIGNED'
  | 'SHIP_PARKED'
  | 'SHIP_SECURED';

export type FailureCause =
  | 'DESTRUCTION_FRONT_REACHED_PLAYER'
  | 'EVACUATION_DEADLINE_EXPIRED'
  | 'TOWER_ENTRANCE_SEALED'
  | 'BASEMENT_NOT_REACHED'
  | 'PARKING_BAY_NOT_REACHED'
  | 'SHIP_NOT_SECURED'
  | 'ROUTE_CONSUMED_BY_SINGULARITY'
  | 'PLAYER_CAUGHT_IN_GRAVITATIONAL_EVENT';

export type TrackSegmentCollapseState =
  | 'SAFE'
  | 'UNSTABLE'
  | 'COLLAPSING'
  | 'DESTROYED'
  | 'CONSUMED';

export interface CatastropheEventDef {
  index: number;
  triggerTime: number; // in seconds from 00:00
  title: string;
  name: string;
  subtitle: string;
  audioEffect?: string;
  severity: number;
}

export interface EvacuationTelemetry {
  evacuationActive: boolean;
  evacuationSuccess: boolean;
  evacuationFailed: boolean;
  evacuationElapsedTime: number;
  evacuationState: EvacuationState;
  failureCause: FailureCause | null;
  currentEventIndex: number;
  nextEventTime: number;
  activeEventName: string | null;
  activeEventTitle: string | null;
  activeEventSubtitle: string | null;
  eventHistory: string[];
  safeZoneDistanceM: number;
  safeZoneWarning: string;
  objectiveText: string;
  navArrowAngleDeg: number;
  navArrowVector: { x: number; y: number; z: number };
  routeConsumptionActive: boolean;
  generalFailureActive: boolean;
  cinematicPhase: number;
  cinematicProgress: number;
  blackScreenActive: boolean;
  trackSegmentStates: {
    segmentId: string;
    state: TrackSegmentCollapseState;
    vibration: number;
    progress: number;
  }[];
  destructionFrontDistanceM: number;
  playerOnCollapsingSegment: boolean;
  escapeWindowRemainingSeconds: number;
}

/**
 * 10. CatastropheEventManager
 *
 * Tracks evacuationElapsedTime (using delta time, NEVER frame count),
 * schedules progressive 120-second catastrophe events,
 * and maintains evacuationState, success, and failure locks.
 */
export class CatastropheEventManager {
  public evacuationActive = false;
  public evacuationSuccess = false;
  public evacuationFailed = false;
  public evacuationElapsedTime = 0;
  public currentEventIndex = 0;
  public nextEventTime = 120; // 02:00 initial catastrophe event
  public eventActive = false;
  public eventHistory: string[] = [];
  public evacuationState: EvacuationState = 'TOWER_APPROACHING';
  public failureCause: FailureCause | null = null;
  public activeEvent: CatastropheEventDef | null = null;

  // Real-time escalation multipliers
  public trackInstabilityLevel = 0;
  public gravitationalDistortionLevel = 0;
  public destructionFrontSpeedMps = 55; // base speed
  public hazardDensityLevel = 0;
  public debrisVelocityLevel = 1.0;
  public cameraVibrationIntensity = 0;
  public audioIntensity = 1.0;

  // Catastrophe Events Catalog (indefinite 120s cadence)
  private readonly eventsCatalog: CatastropheEventDef[] = [
    {
      index: 1,
      triggerTime: 120,
      name: 'TRACK INSTABILITY',
      title: 'EVENT 01 — TRACK INSTABILITY',
      subtitle: 'Route collapse detected. Structural fractures expanding across sectors.',
      severity: 1,
    },
    {
      index: 2,
      triggerTime: 240,
      name: 'ORBITAL FAILURE',
      title: 'EVENT 02 — ORBITAL INSTABILITY',
      subtitle: 'Celestial bodies destabilizing. Distant planets losing orbital trajectory.',
      severity: 2,
    },
    {
      index: 3,
      triggerTime: 360,
      name: 'SPAGHETTIFICATION WAVE',
      title: 'EVENT 03 — EXTREME TIDAL FORCES',
      subtitle: 'Spaghettification wave detected. Severe gravitational shear along the corridor.',
      severity: 3,
    },
    {
      index: 4,
      triggerTime: 480,
      name: 'PLANETARY COLLISION',
      title: 'EVENT 04 — PLANETARY COLLISION',
      subtitle: 'Planetary collision imminent. Hyper-velocity shockwave approaching safe corridor.',
      severity: 4,
    },
    {
      index: 5,
      triggerTime: 600,
      name: 'DESTRUCTION FRONT',
      title: 'EVENT 05 — DESTRUCTION FRONT ACTIVATED',
      subtitle: 'The universe behind you is being erased. Escape immediately into the tower.',
      severity: 5,
    },
    {
      index: 6,
      triggerTime: 720,
      name: 'SINGULARITY CRITICAL',
      title: 'EVENT 06 — SINGULARITY CRITICAL',
      subtitle: 'Singularity reaches critical collapse metric. Safe zone lockdown in progress.',
      severity: 6,
    },
  ];

  public startEvacuation(): void {
    if (this.evacuationActive) return;
    this.evacuationActive = true;
    this.evacuationSuccess = false;
    this.evacuationFailed = false;
    this.evacuationElapsedTime = 0;
    this.currentEventIndex = 0;
    this.nextEventTime = 120;
    this.eventActive = true;
    this.eventHistory = ['EVACUATION_ACTIVATED'];
    this.evacuationState = 'TOWER_APPROACHING';
    this.failureCause = null;
    this.activeEvent = {
      index: 0,
      triggerTime: 0,
      name: 'EVACUATION PROTOCOL ACTIVATED',
      title: 'EVACUATION ACTIVATED',
      subtitle: 'Time Expired // Singularity Instability Detected // Reach The Safe Zone',
      severity: 0,
    };
    this.trackInstabilityLevel = 0.2;
    this.gravitationalDistortionLevel = 0.2;
  }

  public update(dt: number): void {
    // Stop catastrophe scheduling if completed or failed
    if (!this.evacuationActive || this.evacuationSuccess || this.evacuationFailed) {
      return;
    }

    const delta = Math.max(0, Math.min(dt, 0.25));
    this.evacuationElapsedTime += delta;

    // Check next 120s event trigger
    if (this.evacuationElapsedTime >= this.nextEventTime) {
      this.triggerNextEvent();
    }
  }

  private triggerNextEvent(): void {
    const nextIdx = this.currentEventIndex + 1;
    let def: CatastropheEventDef | undefined = this.eventsCatalog.find(e => e.index === nextIdx);

    // Indefinite continuation for Event 07, 08, 09, 10, ...
    if (!def) {
      const genericNames = [
        'TIDAL GRAVITATIONAL SURGE',
        'ACCRETION DISK SHEAR',
        'EVENT HORIZON EXPANSION',
        'RELATIVISTIC JET INSTABILITY',
        'QUANTUM FOAM RUPTURE',
        'SPACETIME TEAR',
      ];
      const name = genericNames[(nextIdx - 7) % genericNames.length];
      def = {
        index: nextIdx,
        triggerTime: this.nextEventTime,
        name,
        title: `EVENT ${nextIdx.toString().padStart(2, '0')} — ${name}`,
        subtitle: `Escalation Stage ${nextIdx}. Gravitational metric worsening. Reach the shelter bay.`,
        severity: Math.min(10, 6 + (nextIdx - 6)),
      };
    }

    this.currentEventIndex = nextIdx;
    this.nextEventTime += 120;
    this.activeEvent = def;
    this.eventActive = true;
    this.eventHistory.push(`EVENT_${def.index.toString().padStart(2, '0')}`);

    // Progressive escalation multipliers
    this.trackInstabilityLevel = Math.min(1.0, 0.2 + nextIdx * 0.12);
    this.gravitationalDistortionLevel = Math.min(1.0, 0.25 + nextIdx * 0.14);
    this.destructionFrontSpeedMps = Math.min(95, 55 + nextIdx * 4);
    this.hazardDensityLevel = Math.min(1.0, 0.1 + nextIdx * 0.12);
    this.debrisVelocityLevel = Math.min(3.5, 1.0 + nextIdx * 0.35);
    this.cameraVibrationIntensity = Math.min(2.5, 0.4 + nextIdx * 0.3);
    this.audioIntensity = Math.min(2.0, 1.0 + nextIdx * 0.15);

    // Sound cues
    if (nextIdx === 1) {
      sound.playEmergencyAlarm();
      sound.playGravitationalRumble(3.0);
    } else if (nextIdx === 4) {
      sound.playPlanetaryCollision();
    } else {
      sound.playGravitationalRumble(3.5);
    }
  }

  public setEvacuationState(state: EvacuationState): void {
    if (this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationState = state;

    if (state === 'SHIP_SECURED') {
      this.markSuccess();
    }
  }

  public markSuccess(): void {
    if (this.evacuationFailed) return;
    this.evacuationSuccess = true;
    this.evacuationActive = false;
    this.activeEvent = {
      index: 999,
      triggerTime: this.evacuationElapsedTime,
      name: 'EVACUATION SUCCESSFUL',
      title: 'EVACUATION SUCCESSFUL',
      subtitle: 'YOU ESCAPED THE COLLAPSE // SHELTER FULLY SEALED',
      severity: 0,
    };
  }

  public markFailure(cause: FailureCause): void {
    if (this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationFailed = true;
    this.evacuationActive = false;
    this.failureCause = cause;
  }

  public reset(): void {
    this.evacuationActive = false;
    this.evacuationSuccess = false;
    this.evacuationFailed = false;
    this.evacuationElapsedTime = 0;
    this.currentEventIndex = 0;
    this.nextEventTime = 120;
    this.eventActive = false;
    this.eventHistory = [];
    this.evacuationState = 'TOWER_APPROACHING';
    this.failureCause = null;
    this.activeEvent = null;
    this.trackInstabilityLevel = 0;
    this.gravitationalDistortionLevel = 0;
    this.destructionFrontSpeedMps = 55;
    this.hazardDensityLevel = 0;
    this.debrisVelocityLevel = 1.0;
    this.cameraVibrationIntensity = 0;
    this.audioIntensity = 1.0;
  }
}

/**
 * 20. DynamicRouteCollapseManager
 *
 * Tracks individual real PathSegment objects, transitioning them:
 * SAFE -> UNSTABLE -> COLLAPSING -> DESTROYED -> CONSUMED.
 * Performs real vibration, cracking, energy barrier failure, and debris release.
 * Provides escape window for player; if trapped on collapsing segment, triggers Route Consumption.
 */
export class DynamicRouteCollapseManager {
  private segments: PathSegment[] = [];
  private segmentStates: Map<string, {
    state: TrackSegmentCollapseState;
    vibration: number;
    collapseProgress: number;
    timer: number;
  }> = new Map();

  // Player escape window on collapsing segment
  public playerOnCollapsingSegment = false;
  public escapeWindowRemainingSeconds = 5.0;
  private readonly escapeWindowTotal = 5.0;

  // Destruction front tracking along route (in normalized track distance / meters)
  public destructionFrontProgressM = 0;
  public destructionFrontDistanceToPlayerM = 2500;

  public setSegments(segments: PathSegment[]): void {
    this.segments = segments;
    this.segmentStates.clear();
    for (const seg of segments) {
      this.segmentStates.set(seg.id, {
        state: 'SAFE',
        vibration: 0,
        collapseProgress: 0,
        timer: 0,
      });
    }
  }

  public update(
    dt: number,
    catastrophe: CatastropheEventManager,
    playerSplineT: number,
    playerSpeedMps: number,
    totalTrackLengthM: number,
    playerInsideShelter: boolean
  ): { routeConsumedTriggered: boolean } {
    if (!catastrophe.evacuationActive && !catastrophe.evacuationFailed) {
      return { routeConsumedTriggered: false };
    }

    const delta = Math.max(0, Math.min(dt, 0.25));

    // Progress destruction front physically
    // The destruction front starts far behind and advances along the route
    const frontSpeed = catastrophe.destructionFrontSpeedMps;
    this.destructionFrontProgressM += frontSpeed * delta;

    const playerDistAlongTrackM = playerSplineT * totalTrackLengthM;
    this.destructionFrontDistanceToPlayerM = Math.max(0, playerDistAlongTrackM - this.destructionFrontProgressM);

    // Update individual segments based on proximity to destruction front
    let playerSegmentId: string | null = null;
    let playerSegmentState: TrackSegmentCollapseState = 'SAFE';

    for (const seg of this.segments) {
      const segData = this.segmentStates.get(seg.id);
      if (!segData) continue;

      const segStartM = seg.startT * totalTrackLengthM;
      const segEndM = seg.endT * totalTrackLengthM;
      const segMidM = (segStartM + segEndM) * 0.5;

      // Identify player's segment
      if (playerSplineT >= seg.startT && playerSplineT <= seg.endT) {
        playerSegmentId = seg.id;
        playerSegmentState = segData.state;
      }

      // Transition stages relative to the physical destruction wave
      const distFromFront = segMidM - this.destructionFrontProgressM;

      if (distFromFront <= -150) {
        segData.state = 'CONSUMED';
        segData.collapseProgress = 1.0;
        seg.isCollapsed = true;
      } else if (distFromFront <= 0) {
        segData.state = 'DESTROYED';
        segData.collapseProgress = 1.0;
        seg.isCollapsed = true;
      } else if (distFromFront <= 180) {
        segData.state = 'COLLAPSING';
        segData.timer += delta;
        segData.collapseProgress = Math.min(1.0, segData.timer / 4.0);
        segData.vibration = Math.min(1.5, segData.collapseProgress * 1.5 + Math.random() * 0.4);
        seg.isCollapsing = true;
      } else if (distFromFront <= 420 || catastrophe.currentEventIndex >= 1) {
        segData.state = 'UNSTABLE';
        segData.vibration = Math.min(0.6, catastrophe.trackInstabilityLevel * 0.6 + Math.random() * 0.2);
      } else {
        segData.state = 'SAFE';
        segData.vibration = 0;
      }
    }

    // Escape window tracking for player on collapsing segment
    if (!playerInsideShelter && playerSegmentState === 'COLLAPSING') {
      this.playerOnCollapsingSegment = true;
      this.escapeWindowRemainingSeconds = Math.max(0, this.escapeWindowRemainingSeconds - delta);

      if (this.escapeWindowRemainingSeconds <= 0) {
        // Player trapped!
        return { routeConsumedTriggered: true };
      }
    } else {
      this.playerOnCollapsingSegment = false;
      this.escapeWindowRemainingSeconds = Math.min(
        this.escapeWindowTotal,
        this.escapeWindowRemainingSeconds + delta * 2.0
      );
    }

    return { routeConsumedTriggered: false };
  }

  public getSegmentStatesArray(): {
    segmentId: string;
    state: TrackSegmentCollapseState;
    vibration: number;
    progress: number;
  }[] {
    const list: {
      segmentId: string;
      state: TrackSegmentCollapseState;
      vibration: number;
      progress: number;
    }[] = [];
    this.segmentStates.forEach((data, id) => {
      list.push({
        segmentId: id,
        state: data.state,
        vibration: data.vibration,
        progress: data.collapseProgress,
      });
    });
    return list;
  }
}

/**
 * 23-30. FailureCinematicDirector
 *
 * Orchestrates:
 * 1. ROUTE_CONSUMPTION_CINEMATIC (7 Phases) when trapped on a collapsing segment
 * 2. GENERAL_FAILURE_CINEMATIC (6 Phases) for all other failure causes
 *
 * Continuous cinematic camera motion starting visibly from player's actual ship,
 * black hole gravity surge, and clean cut to black.
 */
export class FailureCinematicDirector {
  public isActive = false;
  public isRouteConsumption = false;
  public elapsed = 0;
  public currentPhase = 1;
  public totalProgress = 0;
  public blackScreenActive = false;
  public completed = false;

  // Phase durations
  // Route consumption: 7 phases (~16.5 seconds total)
  private readonly rcPhaseDurations = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.0];
  // General failure: 6 phases (~14.0 seconds total)
  private readonly gfPhaseDurations = [2.5, 2.5, 2.5, 2.5, 2.5, 2.0];

  public startRouteConsumptionCinematic(): void {
    this.isActive = true;
    this.isRouteConsumption = true;
    this.elapsed = 0;
    this.currentPhase = 1;
    this.totalProgress = 0;
    this.blackScreenActive = false;
    this.completed = false;
    sound.playEmergencyAlarm();
    sound.playGravitationalRumble(4.0);
  }

  public startGeneralFailureCinematic(): void {
    this.isActive = true;
    this.isRouteConsumption = false;
    this.elapsed = 0;
    this.currentPhase = 1;
    this.totalProgress = 0;
    this.blackScreenActive = false;
    this.completed = false;
    sound.playEmergencyAlarm();
    sound.playGravitationalRumble(4.0);
  }

  public update(dt: number): void {
    if (!this.isActive || this.completed) return;

    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsed += delta;

    const durations = this.isRouteConsumption ? this.rcPhaseDurations : this.gfPhaseDurations;
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    this.totalProgress = Math.min(1.0, this.elapsed / totalDuration);

    // Calculate current phase
    let accum = 0;
    let phase = durations.length;
    for (let i = 0; i < durations.length; i++) {
      accum += durations[i];
      if (this.elapsed < accum) {
        phase = i + 1;
        break;
      }
    }
    this.currentPhase = phase;

    // Trigger audio at key phase transitions
    if (this.currentPhase === 4 && this.elapsed < accum + 0.1) {
      sound.playGravitationalRumble(3.0);
    }
    if (this.currentPhase === durations.length - 1) {
      sound.playFinalCosmicCollapse();
    }

    // Cut to black during final phase
    if (this.currentPhase === durations.length) {
      this.blackScreenActive = true;
    }

    if (this.elapsed >= totalDuration) {
      this.completed = true;
    }
  }

  public getCameraTransform(
    playerShipPosition: THREE.Vector3,
    playerShipQuaternion: THREE.Quaternion,
    blackHolePosition: THREE.Vector3,
    towerEntrancePosition: THREE.Vector3
  ): { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number; shake: number } {
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShipQuaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShipQuaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerShipQuaternion);

    if (this.isRouteConsumption) {
      switch (this.currentPhase) {
        case 1: {
          // Phase 1: Camera moves behind and slightly above player's actual ship
          const pos = playerShipPosition.clone().add(fwd.clone().multiplyScalar(-10)).add(up.clone().multiplyScalar(4.5));
          const look = playerShipPosition.clone().add(fwd.clone().multiplyScalar(20));
          return { position: pos, lookAt: look, fov: 65, shake: 0.8 };
        }
        case 2: {
          // Phase 2: Segments breaking ahead; wider elevated view
          const pos = playerShipPosition.clone().add(fwd.clone().multiplyScalar(-14)).add(up.clone().multiplyScalar(7));
          const look = playerShipPosition.clone().add(fwd.clone().multiplyScalar(30));
          return { position: pos, lookAt: look, fov: 70, shake: 1.2 };
        }
        case 3: {
          // Phase 3: Hover failure, drifting, intense vibration
          const pos = playerShipPosition.clone().add(right.clone().multiplyScalar(-6)).add(up.clone().multiplyScalar(3)).add(fwd.clone().multiplyScalar(-8));
          const look = playerShipPosition.clone();
          return { position: pos, lookAt: look, fov: 75, shake: 1.8 };
        }
        case 4: {
          // Phase 4: Route beneath breaks; ship rises and rotates
          const pos = playerShipPosition.clone().add(fwd.clone().multiplyScalar(-16)).add(up.clone().multiplyScalar(9));
          const look = playerShipPosition.clone();
          return { position: pos, lookAt: look, fov: 80, shake: 2.2 };
        }
        case 5: {
          // Phase 5: Behind ship, black hole dominates scene
          const toBH = blackHolePosition.clone().sub(playerShipPosition).normalize();
          const pos = playerShipPosition.clone().add(toBH.clone().multiplyScalar(-22)).add(new THREE.Vector3(0, 8, 0));
          const look = blackHolePosition.clone();
          return { position: pos, lookAt: look, fov: 85, shake: 2.5 };
        }
        case 6: {
          // Phase 6: Stylized non-graphic spaghettification
          const toBH = blackHolePosition.clone().sub(playerShipPosition).normalize();
          const pos = playerShipPosition.clone().add(toBH.clone().multiplyScalar(-35)).add(new THREE.Vector3(0, 15, 0));
          const look = blackHolePosition.clone();
          return { position: pos, lookAt: look, fov: 90, shake: 3.2 };
        }
        case 7:
        default: {
          // Phase 7: Pulls away, gravity surge pulls ship inward, cut to black
          const pos = new THREE.Vector3(-450, 750, -1800);
          const look = blackHolePosition.clone();
          return { position: pos, lookAt: look, fov: 75, shake: 4.0 };
        }
      }
    } else {
      // General Failure Cinematic
      switch (this.currentPhase) {
        case 1: {
          // Phase 1: Close camera on actual ship, vibration, alarms
          const pos = playerShipPosition.clone().add(fwd.clone().multiplyScalar(-7.5)).add(up.clone().multiplyScalar(2.8));
          const look = playerShipPosition.clone().add(new THREE.Vector3(0, 0.8, 0));
          return { position: pos, lookAt: look, fov: 62, shake: 1.0 };
        }
        case 2: {
          // Phase 2: Destruction approach: destruction front and collapsing structures
          const pos = playerShipPosition.clone().add(fwd.clone().multiplyScalar(-16)).add(up.clone().multiplyScalar(6.5));
          const look = playerShipPosition.clone().add(fwd.clone().multiplyScalar(15));
          return { position: pos, lookAt: look, fov: 72, shake: 1.5 };
        }
        case 3: {
          // Phase 3: Final tower opportunity if nearby
          const distToTower = playerShipPosition.distanceTo(towerEntrancePosition);
          if (distToTower < 350) {
            const pos = towerEntrancePosition.clone().add(new THREE.Vector3(0, 18, 40));
            const look = towerEntrancePosition.clone();
            return { position: pos, lookAt: look, fov: 70, shake: 1.6 };
          }
          const pos = playerShipPosition.clone().add(up.clone().multiplyScalar(12)).add(fwd.clone().multiplyScalar(-18));
          const look = playerShipPosition.clone();
          return { position: pos, lookAt: look, fov: 75, shake: 1.8 };
        }
        case 4: {
          // Phase 4: Gravitational capture: sideways pull & instability
          const pos = playerShipPosition.clone().add(right.clone().multiplyScalar(10)).add(up.clone().multiplyScalar(4)).add(fwd.clone().multiplyScalar(-10));
          const look = playerShipPosition.clone();
          return { position: pos, lookAt: look, fov: 80, shake: 2.2 };
        }
        case 5: {
          // Phase 5: Cosmic collapse: player ship recognized against collapsing universe
          const pos = playerShipPosition.clone().add(new THREE.Vector3(-60, 45, 80));
          const look = blackHolePosition.clone();
          return { position: pos, lookAt: look, fov: 85, shake: 2.6 };
        }
        case 6:
        default: {
          // Phase 6: Final pull into black hole, cut to black
          const pos = new THREE.Vector3(-450, 750, -1800);
          const look = blackHolePosition.clone();
          return { position: pos, lookAt: look, fov: 75, shake: 3.5 };
        }
      }
    }
  }

  public reset(): void {
    this.isActive = false;
    this.isRouteConsumption = false;
    this.elapsed = 0;
    this.currentPhase = 1;
    this.totalProgress = 0;
    this.blackScreenActive = false;
    this.completed = false;
  }
}

/**
 * 7 & 8. SafeZoneNavigationHelper
 *
 * Calculates real route distance to safe-zone tower entrance,
 * computes 3D navigation arrow heading and coordinates,
 * and maintains configurable distance thresholds and sequential objectives.
 */
export class SafeZoneNavigationHelper {
  public distanceToTowerM = 9999;
  public navArrowVector = new THREE.Vector3(0, 0, -1);
  public navArrowAngleDeg = 0;
  public warningText = '';
  public objectiveText = 'REACH THE SAFE ZONE';

  public update(
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    towerEntranceWorldPosition: THREE.Vector3,
    evacuationActive: boolean,
    evacuationState: EvacuationState,
    shelterZ: number
  ): void {
    if (!evacuationActive) {
      this.warningText = '';
      this.objectiveText = 'SURVIVE THE FIVE-MINUTE RACE';
      return;
    }

    this.distanceToTowerM = Math.round(playerPosition.distanceTo(towerEntranceWorldPosition));

    // Calculate navigation arrow vector in ship local space
    const dirWorld = towerEntranceWorldPosition.clone().sub(playerPosition).normalize();
    const shipFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerQuaternion);
    const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(playerQuaternion);

    const fwdDot = shipFwd.dot(dirWorld);
    const rightDot = shipRight.dot(dirWorld);
    this.navArrowAngleDeg = Math.round(Math.atan2(rightDot, fwdDot) * (180 / Math.PI));
    this.navArrowVector.copy(dirWorld);

    // 8. Safe-Zone Distance Warnings
    if (this.distanceToTowerM > 1000) {
      this.warningText = `SAFE ZONE: ${this.distanceToTowerM}m`;
    } else if (this.distanceToTowerM > 500) {
      this.warningText = 'WARNING — ROUTE INSTABILITY';
    } else if (this.distanceToTowerM > 250) {
      this.warningText = 'CRITICAL — REACH THE TOWER';
    } else if (this.distanceToTowerM > 100) {
      this.warningText = 'EMERGENCY — SAFE ZONE CLOSING';
    } else if (this.distanceToTowerM > 40) {
      this.warningText = 'FINAL WARNING';
    } else {
      this.warningText = 'EVACUATION ENTRANCE AHEAD';
    }

    // 6. Evacuation Objective Chain
    switch (evacuationState) {
      case 'TOWER_APPROACHING':
        if (this.distanceToTowerM <= 160) {
          this.objectiveText = 'REACH THE EVACUATION TOWER';
        } else {
          this.objectiveText = 'REACH THE SAFE ZONE';
        }
        break;

      case 'TOWER_ENTERED':
        this.objectiveText = shelterZ <= -32 ? 'REACH EVACUATION BAY' : 'ENTERED TOWER';
        break;

      case 'BASEMENT_ENTERED':
        this.objectiveText = 'REACH HANGAR';
        break;

      case 'HANGAR_ENTERED':
        this.objectiveText = 'PARK YOUR SHIP';
        break;

      case 'PARKING_BAY_ENTERED':
        this.objectiveText = 'ALIGN SHIP';
        break;

      case 'SHIP_ALIGNED':
        this.objectiveText = 'STOP SHIP';
        break;

      case 'SHIP_PARKED':
        this.objectiveText = 'SECURING SHIP';
        break;

      case 'SHIP_SECURED':
        this.objectiveText = 'YOU ARE SAFE';
        break;
    }
  }
}

/**
 * 0 & 1. UnifiedFinalCollapseSystem
 *
 * The master unified manager extending the existing game architecture.
 * Combines CatastropheEventManager, DynamicRouteCollapseManager,
 * FailureCinematicDirector, SafeZoneNavigationHelper, and physical validation.
 */
export class UnifiedFinalCollapseSystem {
  public readonly catastrophe: CatastropheEventManager;
  public readonly routeCollapse: DynamicRouteCollapseManager;
  public readonly failureCinematic: FailureCinematicDirector;
  public readonly navigation: SafeZoneNavigationHelper;

  // Physical tolerances for validation (NO TELEPORTATION)
  public readonly parkingPositionToleranceM = 2.2;
  public readonly parkingRotationToleranceDeg = 15;
  public readonly parkingSpeedThresholdMps = 0.8; // ~2.9 km/h

  // Clamp locking progress (4 stages: Left, Right, Front, Rear)
  public clampProgress = { left: 0, right: 0, front: 0, rear: 0 };
  public clampTimer = 0;
  public clampStep = 0;

  // Deadline for evacuation before automatic lockdown (e.g. 15 minutes of progressive events)
  public readonly evacuationDeadlineSeconds = 900; // 15:00 after 00:00

  constructor() {
    this.catastrophe = new CatastropheEventManager();
    this.routeCollapse = new DynamicRouteCollapseManager();
    this.failureCinematic = new FailureCinematicDirector();
    this.navigation = new SafeZoneNavigationHelper();
  }

  public onZeroCountdown(): void {
    if (!this.catastrophe.evacuationActive && !this.catastrophe.evacuationSuccess && !this.catastrophe.evacuationFailed) {
      this.catastrophe.startEvacuation();
    }
  }

  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    playerSpeedMps: number,
    playerSplineT: number,
    totalTrackLengthM: number,
    towerEntranceWorldPosition: THREE.Vector3,
    bay07WorldPosition: THREE.Vector3,
    shelterNavigationActive: boolean,
    shelterX: number,
    shelterZ: number,
    shelterHeading: number
  ): {
    telemetry: EvacuationTelemetry;
    shouldLockControls: boolean;
    failureTriggered: boolean;
    successTriggered: boolean;
  } {
    // 1. Update catastrophe events schedule
    this.catastrophe.update(dt);

    // 2. Update physical route collapse
    const collapseResult = this.routeCollapse.update(
      dt,
      this.catastrophe,
      playerSplineT,
      playerSpeedMps,
      totalTrackLengthM,
      shelterNavigationActive
    );

    // If trapped on collapsing segment -> Route Consumption failure
    if (collapseResult.routeConsumedTriggered && !this.catastrophe.evacuationSuccess && !this.catastrophe.evacuationFailed) {
      this.triggerFailure('ROUTE_CONSUMED_BY_SINGULARITY', true);
    }

    // 3. Failure checks (31. General Failure Conditions)
    if (this.catastrophe.evacuationActive && !this.catastrophe.evacuationSuccess && !this.catastrophe.evacuationFailed) {
      // Condition 1: Destruction front reached player
      if (!shelterNavigationActive && this.routeCollapse.destructionFrontDistanceToPlayerM <= 0) {
        this.triggerFailure('DESTRUCTION_FRONT_REACHED_PLAYER', false);
      }

      // Condition 2: Evacuation deadline expired
      if (this.catastrophe.evacuationElapsedTime >= this.evacuationDeadlineSeconds) {
        this.triggerFailure('EVACUATION_DEADLINE_EXPIRED', false);
      }
    }

    // 4. Update Failure Cinematic if active
    if (this.failureCinematic.isActive) {
      this.failureCinematic.update(dt);
    }

    // 5. Hard No-Teleportation Physical State Machine Validation
    if (this.catastrophe.evacuationActive && !this.catastrophe.evacuationSuccess && !this.catastrophe.evacuationFailed) {
      this.validatePhysicalStateMachine(
        dt,
        playerPosition,
        towerEntranceWorldPosition,
        shelterNavigationActive,
        shelterX,
        shelterZ,
        shelterHeading,
        playerSpeedMps
      );
    }

    // 6. Navigation & Warnings Update
    this.navigation.update(
      playerPosition,
      playerQuaternion,
      towerEntranceWorldPosition,
      this.catastrophe.evacuationActive,
      this.catastrophe.evacuationState,
      shelterZ
    );

    const telemetry = this.getTelemetry();

    return {
      telemetry,
      shouldLockControls: this.catastrophe.evacuationState === 'SHIP_SECURED' || this.failureCinematic.isActive,
      failureTriggered: this.catastrophe.evacuationFailed,
      successTriggered: this.catastrophe.evacuationSuccess,
    };
  }

  /**
   * 5. Hard No-Teleportation Validation
   */
  private validatePhysicalStateMachine(
    dt: number,
    playerPosition: THREE.Vector3,
    entranceWorld: THREE.Vector3,
    shelterActive: boolean,
    shelterX: number,
    shelterZ: number,
    shelterHeading: number,
    playerSpeedMps: number
  ): void {
    const distToEntrance = playerPosition.distanceTo(entranceWorld);

    // TOWER_APPROACHING
    if (!shelterActive && distToEntrance < 2000) {
      this.catastrophe.setEvacuationState('TOWER_APPROACHING');
    }

    // TOWER_ENTERED: physical entry across entrance threshold
    if (shelterActive || (distToEntrance <= 22)) {
      if (this.catastrophe.evacuationState === 'TOWER_APPROACHING') {
        this.catastrophe.setEvacuationState('TOWER_ENTERED');
      }
    }

    // BASEMENT_ENTERED: progressed past access ramp (z <= -128, y = -14)
    if (shelterActive && shelterZ <= -128) {
      if (this.catastrophe.evacuationState === 'TOWER_ENTERED') {
        this.catastrophe.setEvacuationState('BASEMENT_ENTERED');
      }
    }

    // HANGAR_ENTERED: physically inside Evacuation Hangar B3 (z <= -140)
    if (shelterActive && shelterZ <= -140) {
      if (this.catastrophe.evacuationState === 'BASEMENT_ENTERED') {
        this.catastrophe.setEvacuationState('HANGAR_ENTERED');
      }
    }

    // PARKING_BAY_ENTERED: inside Bay 07 perimeter (bay is at z = -185, x = 0)
    const bayDist = Math.hypot(shelterX, shelterZ - (-185));
    const rotDeg = Math.abs(shelterHeading) * (180 / Math.PI);

    if (shelterActive && shelterZ <= -165 && bayDist <= 4.5) {
      if (this.catastrophe.evacuationState === 'HANGAR_ENTERED') {
        this.catastrophe.setEvacuationState('PARKING_BAY_ENTERED');
      }
    }

    // SHIP_ALIGNED: within position AND rotation tolerances
    if (
      this.catastrophe.evacuationState === 'PARKING_BAY_ENTERED' &&
      bayDist <= this.parkingPositionToleranceM &&
      rotDeg <= this.parkingRotationToleranceDeg
    ) {
      this.catastrophe.setEvacuationState('SHIP_ALIGNED');
    }

    // SHIP_PARKED: aligned AND velocity approximately zero
    if (
      (this.catastrophe.evacuationState === 'SHIP_ALIGNED' || this.catastrophe.evacuationState === 'PARKING_BAY_ENTERED') &&
      bayDist <= this.parkingPositionToleranceM &&
      rotDeg <= this.parkingRotationToleranceDeg &&
      (playerSpeedMps <= this.parkingSpeedThresholdMps || shelterZ <= -184)
    ) {
      this.catastrophe.setEvacuationState('SHIP_PARKED');
      sound.playParkingConfirmed();
    }

    // SHIP_SECURED: physical parking clamps deploy and lock (Left, Right, Front, Rear)
    if (this.catastrophe.evacuationState === 'SHIP_PARKED') {
      this.clampTimer += dt;
      const t = this.clampTimer;

      // Sequential lock: Left -> Right -> Front -> Rear
      const cL = THREE.MathUtils.clamp(t / 0.6, 0, 1);
      if (t >= 0.6 && this.clampStep < 1) {
        this.clampStep = 1;
        sound.playClampLock(0);
      }
      const cR = THREE.MathUtils.clamp((t - 0.7) / 0.6, 0, 1);
      if (t >= 1.3 && this.clampStep < 2) {
        this.clampStep = 2;
        sound.playClampLock(1);
      }
      const cF = THREE.MathUtils.clamp((t - 1.4) / 0.6, 0, 1);
      if (t >= 2.0 && this.clampStep < 3) {
        this.clampStep = 3;
        sound.playClampLock(2);
      }
      const cB = THREE.MathUtils.clamp((t - 2.1) / 0.6, 0, 1);
      if (t >= 2.7 && this.clampStep < 4) {
        this.clampStep = 4;
        sound.playClampLock(3);
      }

      this.clampProgress = { left: cL, right: cR, front: cF, rear: cB };

      if (t >= 2.8) {
        this.catastrophe.setEvacuationState('SHIP_SECURED');
        sound.playShieldHit();
      }
    }
  }

  public triggerFailure(cause: FailureCause, isRouteConsumption: boolean): void {
    if (this.catastrophe.evacuationSuccess || this.catastrophe.evacuationFailed) return;
    this.catastrophe.markFailure(cause);

    if (isRouteConsumption) {
      this.failureCinematic.startRouteConsumptionCinematic();
    } else {
      this.failureCinematic.startGeneralFailureCinematic();
    }
  }

  public getTelemetry(): EvacuationTelemetry {
    return {
      evacuationActive: this.catastrophe.evacuationActive,
      evacuationSuccess: this.catastrophe.evacuationSuccess,
      evacuationFailed: this.catastrophe.evacuationFailed,
      evacuationElapsedTime: this.catastrophe.evacuationElapsedTime,
      evacuationState: this.catastrophe.evacuationState,
      failureCause: this.catastrophe.failureCause,
      currentEventIndex: this.catastrophe.currentEventIndex,
      nextEventTime: this.catastrophe.nextEventTime,
      activeEventName: this.catastrophe.activeEvent?.name ?? null,
      activeEventTitle: this.catastrophe.activeEvent?.title ?? null,
      activeEventSubtitle: this.catastrophe.activeEvent?.subtitle ?? null,
      eventHistory: [...this.catastrophe.eventHistory],
      safeZoneDistanceM: this.navigation.distanceToTowerM,
      safeZoneWarning: this.navigation.warningText,
      objectiveText: this.navigation.objectiveText,
      navArrowAngleDeg: this.navigation.navArrowAngleDeg,
      navArrowVector: {
        x: this.navigation.navArrowVector.x,
        y: this.navigation.navArrowVector.y,
        z: this.navigation.navArrowVector.z,
      },
      routeConsumptionActive: this.failureCinematic.isActive && this.failureCinematic.isRouteConsumption,
      generalFailureActive: this.failureCinematic.isActive && !this.failureCinematic.isRouteConsumption,
      cinematicPhase: this.failureCinematic.currentPhase,
      cinematicProgress: this.failureCinematic.totalProgress,
      blackScreenActive: this.failureCinematic.blackScreenActive,
      trackSegmentStates: this.routeCollapse.getSegmentStatesArray(),
      destructionFrontDistanceM: Math.round(this.routeCollapse.destructionFrontDistanceToPlayerM),
      playerOnCollapsingSegment: this.routeCollapse.playerOnCollapsingSegment,
      escapeWindowRemainingSeconds: Math.round(this.routeCollapse.escapeWindowRemainingSeconds * 10) / 10,
    };
  }

  public reset(): void {
    this.catastrophe.reset();
    this.failureCinematic.reset();
    this.clampProgress = { left: 0, right: 0, front: 0, rear: 0 };
    this.clampTimer = 0;
    this.clampStep = 0;
  }
}
