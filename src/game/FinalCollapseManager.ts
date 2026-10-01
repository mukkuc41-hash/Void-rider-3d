import * as THREE from 'three';
import { sound } from './audio';
import { PathSegment } from './extendedPath/extendedPathTypes';

/**
 * 3. Evacuation State Machine
 * STRICT PHYSICAL PROGRESSION:
 * TOWER_APPROACHING -> TOWER_ENTERED -> BASEMENT_ENTERED -> HANGAR_ENTERED ->
 * PARKING_BAY_ENTERED -> SHIP_ALIGNED -> SHIP_PARKED -> SHIP_SECURED
 */
export type EvacuationState =
  | 'TOWER_APPROACHING'
  | 'TOWER_ENTERED'
  | 'BASEMENT_ENTERED'
  | 'HANGAR_ENTERED'
  | 'PARKING_BAY_ENTERED'
  | 'SHIP_ALIGNED'
  | 'SHIP_PARKED'
  | 'SHIP_SECURED';

/**
 * 55. Authoritative Game State Priority
 * NORMAL_RACE -> EVACUATION -> EVACUATION_SUCCESS or EVACUATION_FAILURE
 */
export type FinalCollapseGameState =
  | 'NORMAL_RACE'
  | 'EVACUATION'
  | 'EVACUATION_SUCCESS'
  | 'EVACUATION_FAILURE';

/**
 * Failure Cause Classification
 */
export type FailureCause =
  | 'DESTRUCTION_FRONT_REACHED_PLAYER'
  | 'EVACUATION_DEADLINE_EXPIRED'
  | 'ROUTE_CONSUMED_BY_SINGULARITY'
  | 'TOWER_ENTRANCE_SEALED'
  | 'BASEMENT_NOT_REACHED'
  | 'PARKING_BAY_NOT_REACHED'
  | 'SHIP_NOT_SECURED'
  | 'PLAYER_CAUGHT_IN_GRAVITATIONAL_EVENT'
  | 'CRITICAL_HULL_BREACH'
  | 'CONSUMED_BY_EVENT_HORIZON';

/**
 * Real Track Segment Collapse State
 */
export type TrackSegmentCollapseState =
  | 'SAFE'
  | 'UNSTABLE'
  | 'COLLAPSING'
  | 'DESTROYED'
  | 'CONSUMED';

/**
 * 5 & 17–31. Catastrophe Event Definition (Exact 15 Events at 120s cadence)
 */
export interface CatastropheEventDef {
  index: number;
  triggerTime: number; // in seconds from 00:00 evacuation start
  name: string;
  title: string;
  subtitle: string;
  severity: number;
  phase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY';
  phaseTimer: number;
}

/**
 * Ship Impact Forces applied physically to spaceship
 */
export interface ShipImpactForces {
  lateralForce: number;
  steeringResistance: number;
  velocityDisturbance: number;
  pitchDisturbance: number;
  rollDisturbance: number;
  yawDisturbance: number;
  cameraShake: number;
  fovDistortion: number;
  hudInterference: number;
  shieldStress: number;
  navigationInterference: number;
}

/**
 * Final Collapse Statistics (for Results screen & telemetry)
 */
export interface FinalCollapseStats {
  survivalStatus: 'SURVIVED' | 'FAILED';
  safeZoneStatus: 'SECURED' | 'NOT REACHED';
  towerEntryReached: boolean;
  basementEntryReached: boolean;
  hangarEntryReached: boolean;
  parkingBayReached: boolean;
  shipAligned: boolean;
  shipParked: boolean;
  shipSecured: boolean;
  raceTimeFormatted: string;
  raceTimeMs: number;
  evacuationTimeFormatted: string;
  evacuationTimeSeconds: number;
  distanceTraveledM: number;
  checkpointsReached: number;
  boostUsedCount: number;
  shieldsUsedCount: number;
  missilesUsedCount: number;
  failureCause: FailureCause | null;
  safeZone: string;
  shipStatus: string;
}

/**
 * Telemetry snapshot emitted to HUD / UI components
 */
export interface EvacuationTelemetry {
  gameState: FinalCollapseGameState;
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
  eventPhase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' | null;
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
  destructionFrontDistanceM: number;
  playerOnCollapsingSegment: boolean;
  escapeWindowRemainingSeconds: number;
  clampsLocked: { left: boolean; right: boolean; front: boolean; rear: boolean };
  absoluteCollapseActive: boolean;
  hudGlitchIntensity: number;
}

/* =========================================================================
   SUB-SYSTEM 1: EvacuationManager
   Coordinates evacuation lifecycle, strict state machine, and terminal locks.
   ========================================================================= */
export class EvacuationManager {
  public gameState: FinalCollapseGameState = 'NORMAL_RACE';
  public evacuationState: EvacuationState = 'TOWER_APPROACHING';
  public evacuationActive = false;
  public evacuationSuccess = false;
  public evacuationFailed = false;
  public evacuationElapsedTime = 0;
  public failureCause: FailureCause | null = null;

  // Milestone tracking
  public towerEntryReached = false;
  public basementEntryReached = false;
  public hangarEntryReached = false;
  public parkingBayReached = false;
  public shipAligned = false;
  public shipParked = false;
  public shipSecured = false;

  public startEvacuation(): void {
    if (this.evacuationActive || this.evacuationSuccess || this.evacuationFailed) return;
    this.gameState = 'EVACUATION';
    this.evacuationActive = true;
    this.evacuationSuccess = false;
    this.evacuationFailed = false;
    this.evacuationElapsedTime = 0;
    this.evacuationState = 'TOWER_APPROACHING';
    this.failureCause = null;
    this.towerEntryReached = false;
    this.basementEntryReached = false;
    this.hangarEntryReached = false;
    this.parkingBayReached = false;
    this.shipAligned = false;
    this.shipParked = false;
    this.shipSecured = false;
  }

  public update(dt: number): void {
    if (!this.evacuationActive || this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationElapsedTime += Math.max(0, Math.min(dt, 0.25));
  }

  public setEvacuationState(state: EvacuationState): void {
    if (this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationState = state;

    if (state === 'TOWER_ENTERED') this.towerEntryReached = true;
    if (state === 'BASEMENT_ENTERED') this.basementEntryReached = true;
    if (state === 'HANGAR_ENTERED') this.hangarEntryReached = true;
    if (state === 'PARKING_BAY_ENTERED') this.parkingBayReached = true;
    if (state === 'SHIP_ALIGNED') this.shipAligned = true;
    if (state === 'SHIP_PARKED') this.shipParked = true;
    if (state === 'SHIP_SECURED') {
      this.shipSecured = true;
      this.markSuccess();
    }
  }

  public markSuccess(): void {
    if (this.evacuationFailed) return;
    this.evacuationSuccess = true;
    this.evacuationActive = false;
    this.gameState = 'EVACUATION_SUCCESS';
  }

  /**
   * 45. FAILURE STATE LOCK
   * When EVACUATION_FAILED === true:
   * Immediately stop scheduling, lock failure state, prevent later events
   * from overwriting failure sequence, preserve failure cause.
   */
  public markFailure(cause: FailureCause): void {
    if (this.evacuationSuccess || this.evacuationFailed) return;
    this.evacuationFailed = true;
    this.evacuationActive = false;
    this.gameState = 'EVACUATION_FAILURE';
    this.failureCause = cause;
  }

  public reset(): void {
    this.gameState = 'NORMAL_RACE';
    this.evacuationState = 'TOWER_APPROACHING';
    this.evacuationActive = false;
    this.evacuationSuccess = false;
    this.evacuationFailed = false;
    this.evacuationElapsedTime = 0;
    this.failureCause = null;
    this.towerEntryReached = false;
    this.basementEntryReached = false;
    this.hangarEntryReached = false;
    this.parkingBayReached = false;
    this.shipAligned = false;
    this.shipParked = false;
    this.shipSecured = false;
  }
}

/* =========================================================================
   SUB-SYSTEM 2: CatastropheEventManager
   5. Exact Catastrophe Clock:
   EVACUATION_ELAPSED_TIME += dt
   Threshold crossing: previousElapsed < eventTime && currentElapsed >= eventTime
   Exactly 15 events (02:00 to 30:00). There is no Event 16.
   ========================================================================= */
export class CatastropheEventManager {
  public currentEventIndex = 0;
  public nextEventTime = 120; // 02:00 (Event 01)
  public activeEvent: CatastropheEventDef | null = null;
  public eventHistory: string[] = [];
  public previousElapsed = 0;
  public currentElapsed = 0;
  public absoluteCollapse = false;

  // Escalation parameters
  public gravityStrength = 0.2;
  public tidalForce = 0.15;
  public debrisVelocity = 30;
  public routeCollapseSpeed = 40;
  public destructionFrontSpeed = 55;
  public environmentalInstability = 0.2;
  public gravitationalLensing = 0.15;
  public cameraShake = 0;
  public audioIntensity = 0.2;
  public infallRate = 0.2;
  public orbitalInstability = 0.2;
  public navigationInterference = 0;

  // Exactly 15 Events
  private readonly eventCatalog: Omit<CatastropheEventDef, 'phase' | 'phaseTimer'>[] = [
    {
      index: 1,
      triggerTime: 120, // 02:00
      name: 'GRAVITATIONAL DISTURBANCE',
      title: 'EVENT 01 — GRAVITATIONAL DISTURBANCE',
      subtitle: 'Singularity tidal forces rising. Route stability decreasing.',
      severity: 1,
    },
    {
      index: 2,
      triggerTime: 240, // 04:00
      name: 'ORBITAL FAILURE',
      title: 'EVENT 02 — ORBITAL FAILURE',
      subtitle: 'Planetary gravitational balance lost. Orbital vectors decaying inward.',
      severity: 2,
    },
    {
      index: 3,
      triggerTime: 360, // 06:00
      name: 'SPAGHETTIFICATION WAVE',
      title: 'EVENT 03 — EXTREME TIDAL FORCES',
      subtitle: 'Spaghettification wave detected. Gravitational shear along corridor.',
      severity: 3,
    },
    {
      index: 4,
      triggerTime: 480, // 08:00
      name: 'PLANETARY COLLISION',
      title: 'EVENT 04 — PLANETARY COLLISION',
      subtitle: 'Planetary collision imminent. Hyper-velocity shockwave approaching.',
      severity: 4,
    },
    {
      index: 5,
      triggerTime: 600, // 10:00
      name: 'DESTRUCTION FRONT',
      title: 'EVENT 05 — DESTRUCTION FRONT ACTIVATED',
      subtitle: 'The universe behind you is being erased. Reach the evacuation tower.',
      severity: 5,
    },
    {
      index: 6,
      triggerTime: 720, // 12:00
      name: 'SINGULARITY CRITICAL',
      title: 'EVENT 06 — SINGULARITY CRITICAL',
      subtitle: 'Accretion disk at relativistic collapse. Safe zone closing.',
      severity: 6,
    },
    {
      index: 7,
      triggerTime: 840, // 14:00
      name: 'ACCRETION DISK ERUPTION',
      title: 'EVENT 07 — ACCRETION DISK ERUPTION',
      subtitle: 'Superheated plasma streams erupting from event horizon.',
      severity: 7,
    },
    {
      index: 8,
      triggerTime: 960, // 16:00
      name: 'GRAVITATIONAL SHOCKWAVE',
      title: 'EVENT 08 — GRAVITATIONAL SHOCKWAVE',
      subtitle: 'Relativistic space-time compression wave propagating through sector.',
      severity: 7.5,
    },
    {
      index: 9,
      triggerTime: 1080, // 18:00
      name: 'ORBITAL RING COLLAPSE',
      title: 'EVENT 09 — ORBITAL STRUCTURE COLLAPSING',
      subtitle: 'Mega-structure ring fractures detaching into sub-orbital infall.',
      severity: 8,
    },
    {
      index: 10,
      triggerTime: 1200, // 20:00
      name: 'EVENT HORIZON EXPANSION',
      title: 'EVENT 10 — EVENT HORIZON EXPANSION',
      subtitle: 'Singularity boundary expanding. Safe corridor narrowing rapidly.',
      severity: 8.5,
    },
    {
      index: 11,
      triggerTime: 1320, // 22:00
      name: 'MASS INFALL',
      title: 'EVENT 11 — MASS INFALL DETECTED',
      subtitle: 'Planetary fragments and orbital stations spiraling into the void.',
      severity: 9,
    },
    {
      index: 12,
      triggerTime: 1440, // 24:00
      name: 'SPACE-TIME DISTORTION',
      title: 'EVENT 12 — SPACE-TIME DISTORTION',
      subtitle: 'Metric distortion warping local space-time perspective.',
      severity: 9.2,
    },
    {
      index: 13,
      triggerTime: 1560, // 26:00
      name: 'SINGULARITY SURGE',
      title: 'EVENT 13 — SINGULARITY SURGE',
      subtitle: 'Massive gravitational surge accelerating route collapse.',
      severity: 9.5,
    },
    {
      index: 14,
      triggerTime: 1680, // 28:00
      name: 'FINAL DESTRUCTION FRONT',
      title: 'EVENT 14 — FINAL DESTRUCTION FRONT',
      subtitle: 'Lethal destruction wave advancing. Reach the evacuation tower.',
      severity: 9.8,
    },
    {
      index: 15,
      triggerTime: 1800, // 30:00
      name: 'ABSOLUTE COLLAPSE',
      title: 'EVENT 15 — ABSOLUTE COLLAPSE',
      subtitle: 'Maximum black hole activity. Final evacuation window active.',
      severity: 10,
    },
  ];

  public update(dt: number, evacuation: EvacuationManager): void {
    // 45. Immediately stop scheduling when failed or succeeded
    if (!evacuation.evacuationActive || evacuation.evacuationSuccess || evacuation.evacuationFailed) {
      return;
    }

    this.previousElapsed = this.currentElapsed;
    this.currentElapsed = evacuation.evacuationElapsedTime;

    // Check threshold crossing for exact 15 events:
    // previousElapsed < eventTime AND currentElapsed >= eventTime
    for (const def of this.eventCatalog) {
      if (this.previousElapsed < def.triggerTime && this.currentElapsed >= def.triggerTime) {
        this.triggerEvent(def);
        break;
      }
    }

    // 50. Progress active event lifecycle: WARNING -> BUILDUP -> CINEMATIC -> GAMEPLAY
    if (this.activeEvent) {
      this.activeEvent.phaseTimer += dt;
      const t = this.activeEvent.phaseTimer;

      if (this.activeEvent.phase === 'WARNING' && t >= 3.0) {
        this.activeEvent.phase = 'BUILDUP';
        this.cameraShake = Math.min(2.8, 0.6 + this.activeEvent.severity * 0.22);
      } else if (this.activeEvent.phase === 'BUILDUP' && t >= 5.5) {
        this.activeEvent.phase = 'CINEMATIC';
      } else if (this.activeEvent.phase === 'CINEMATIC' && t >= 8.0) {
        this.activeEvent.phase = 'GAMEPLAY';
        // Control returned to player completely
        this.cameraShake = Math.max(0, this.cameraShake * 0.4);
      }
    }
  }

  private triggerEvent(def: Omit<CatastropheEventDef, 'phase' | 'phaseTimer'>): void {
    this.currentEventIndex = def.index;
    this.nextEventTime = def.index < 15 ? (def.index + 1) * 120 : 1800;
    this.activeEvent = {
      ...def,
      phase: 'WARNING',
      phaseTimer: 0,
    };
    this.eventHistory.push(`EVENT_${def.index.toString().padStart(2, '0')}`);

    if (def.index === 15) {
      this.absoluteCollapse = true;
    }

    // Progressive escalation of physical parameters
    this.gravityStrength = Math.min(1.0, 0.2 + def.index * 0.055);
    this.tidalForce = Math.min(1.0, 0.15 + def.index * 0.058);
    this.debrisVelocity = Math.min(120, 30 + def.index * 6);
    this.routeCollapseSpeed = Math.min(100, 40 + def.index * 4);
    this.destructionFrontSpeed = Math.min(95, 55 + def.index * 2.8);
    this.environmentalInstability = Math.min(1.0, 0.2 + def.index * 0.055);
    this.gravitationalLensing = Math.min(1.0, 0.15 + def.index * 0.058);
    this.audioIntensity = Math.min(1.0, 0.2 + def.index * 0.055);
    this.infallRate = Math.min(1.0, 0.2 + def.index * 0.055);
    this.orbitalInstability = Math.min(1.0, 0.2 + def.index * 0.055);
    this.navigationInterference = Math.min(1.0, def.index >= 6 ? (def.index - 5) * 0.12 : 0);

    // Audio cues
    if (def.index === 1) {
      sound.playEmergencyAlarm();
      sound.playGravitationalRumble(3.0);
    } else if (def.index === 4) {
      sound.playPlanetaryCollision();
      sound.playHeavyImpact();
    } else if (def.index === 8) {
      sound.playHeavyImpact();
      sound.playGravitationalRumble(4.0);
    } else if (def.index === 15) {
      sound.playFinalCosmicCollapse();
      sound.playGravitationalRumble(6.0);
    } else {
      sound.playGravitationalRumble(3.5);
    }
  }

  /**
   * 16. Evaluates smoothly blended physical forces for the player spaceship
   */
  public getShipImpactForces(timeSec: number): ShipImpactForces {
    if (!this.activeEvent) {
      return {
        lateralForce: 0,
        steeringResistance: 0,
        velocityDisturbance: 0,
        pitchDisturbance: 0,
        rollDisturbance: 0,
        yawDisturbance: 0,
        cameraShake: 0,
        fovDistortion: 0,
        hudInterference: 0,
        shieldStress: 0,
        navigationInterference: 0,
      };
    }

    const sev = this.activeEvent.severity;
    const wave = Math.sin(timeSec * 3.5) * 0.5 + Math.sin(timeSec * 7.2) * 0.25;

    // Lateral force and steering resistance
    const lateralForce = wave * (sev * 0.35);
    const steeringResistance = Math.min(0.45, (sev / 10) * 0.45);

    // Velocity fluctuation
    const velocityDisturbance = Math.cos(timeSec * 2.0) * (sev * 0.6);

    // Pitch / roll perturbations
    const pitchDisturbance = Math.sin(timeSec * 4.2) * (sev * 0.02);
    const rollDisturbance = Math.cos(timeSec * 3.8) * (sev * 0.035);
    const yawDisturbance = Math.sin(timeSec * 2.5) * (sev * 0.015);

    // Camera shake & FOV
    const isWaveEvent = this.activeEvent.index === 3 || this.activeEvent.index === 8 || this.activeEvent.index === 13;
    const fovDistortion = isWaveEvent ? Math.sin(timeSec * 4.0) * (sev * 1.8) : 0;
    const cameraShake = Math.max(this.cameraShake, (sev / 10) * 0.8 + Math.abs(wave) * 0.4);

    // HUD glitch
    const hudInterference = (sev >= 6 ? (sev - 5) * 0.18 : 0) * (0.8 + Math.random() * 0.4);

    return {
      lateralForce,
      steeringResistance,
      velocityDisturbance,
      pitchDisturbance,
      rollDisturbance,
      yawDisturbance,
      cameraShake,
      fovDistortion,
      hudInterference: Math.min(1.0, hudInterference),
      shieldStress: (sev / 10) * 0.3,
      navigationInterference: this.navigationInterference,
    };
  }

  public reset(): void {
    this.currentEventIndex = 0;
    this.nextEventTime = 120;
    this.activeEvent = null;
    this.eventHistory = [];
    this.previousElapsed = 0;
    this.currentElapsed = 0;
    this.absoluteCollapse = false;
    this.gravityStrength = 0.2;
    this.tidalForce = 0.15;
    this.debrisVelocity = 30;
    this.routeCollapseSpeed = 40;
    this.destructionFrontSpeed = 55;
    this.environmentalInstability = 0.2;
    this.gravitationalLensing = 0.15;
    this.cameraShake = 0;
    this.audioIntensity = 0.2;
    this.infallRate = 0.2;
    this.orbitalInstability = 0.2;
    this.navigationInterference = 0;
  }
}

/* =========================================================================
   SUB-SYSTEM 3: EvacuationTowerManager (EvacuationTower)
   Physical 3D world geometry for the safe-zone facility.
   ========================================================================= */
export class EvacuationTowerManager {
  public towerRoot: THREE.Group | null = null;
  public entranceCenter = new THREE.Vector3(0, 0, -900);
  public bay07Center = new THREE.Vector3(0, -14, -1085);
  public isSealed = false;

  public initialize(scene: THREE.Scene, entrancePos: THREE.Vector3, bay07Pos: THREE.Vector3): void {
    this.entranceCenter.copy(entrancePos);
    this.bay07Center.copy(bay07Pos);
    this.isSealed = false;
  }

  public seal(): void {
    this.isSealed = true;
    sound.playBlastDoorClose();
  }

  public reset(): void {
    this.isSealed = false;
  }
}
export type EvacuationTower = EvacuationTowerManager;

/* =========================================================================
   SUB-SYSTEM 4: EvacuationRouteManager
   47. Failure Fairness: Directional safe-zone arrow, real distance meter,
   audio & visual warning triggers.
   ========================================================================= */
export class EvacuationRouteManager {
  public distanceToTowerM = 9999;
  public navArrowVector = new THREE.Vector3(0, 0, -1);
  public navArrowAngleDeg = 0;
  public warningText = '';
  public objectiveText = 'REACH THE SAFE ZONE';

  public update(
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    towerEntranceWorldPosition: THREE.Vector3,
    evacuation: EvacuationManager,
    shelterZ: number
  ): void {
    if (!evacuation.evacuationActive) {
      this.warningText = '';
      this.objectiveText = evacuation.evacuationSuccess ? 'SAFE ZONE SECURED' : 'SURVIVE THE FIVE-MINUTE RACE';
      return;
    }

    this.distanceToTowerM = Math.round(playerPosition.distanceTo(towerEntranceWorldPosition));

    // Directional Safe-Zone Arrow
    const dirWorld = towerEntranceWorldPosition.clone().sub(playerPosition).normalize();
    const shipFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerQuaternion);
    const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(playerQuaternion);

    const fwdDot = shipFwd.dot(dirWorld);
    const rightDot = shipRight.dot(dirWorld);
    this.navArrowAngleDeg = Math.round(Math.atan2(rightDot, fwdDot) * (180 / Math.PI));
    this.navArrowVector.copy(dirWorld);

    // 12. Distance Warnings
    if (this.distanceToTowerM > 2000) {
      this.warningText = `SAFE ZONE: ${this.distanceToTowerM}m`;
    } else if (this.distanceToTowerM > 1000) {
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

    // Objective chain
    switch (evacuation.evacuationState) {
      case 'TOWER_APPROACHING':
        this.objectiveText = this.distanceToTowerM <= 160 ? 'REACH THE EVACUATION TOWER' : 'REACH THE SAFE ZONE';
        break;
      case 'TOWER_ENTERED':
        this.objectiveText = shelterZ <= -32 ? 'DESCEND TO BASEMENT B3' : 'ENTERED TOWER THRESHOLD';
        break;
      case 'BASEMENT_ENTERED':
        this.objectiveText = 'FOLLOW ACCESS RAMP TO HANGAR';
        break;
      case 'HANGAR_ENTERED':
        this.objectiveText = 'LOCATE EVACUATION BAY 07';
        break;
      case 'PARKING_BAY_ENTERED':
        this.objectiveText = 'ALIGN SHIP WITH PARKING MARKER';
        break;
      case 'SHIP_ALIGNED':
        this.objectiveText = 'ALIGNMENT CONFIRMED — REDUCE SPEED';
        break;
      case 'SHIP_PARKED':
        this.objectiveText = 'SECURING SHIP // CLAMPS ENGAGING';
        break;
      case 'SHIP_SECURED':
        this.objectiveText = 'SAFE ZONE SECURED // EVACUATION COMPLETE';
        break;
    }
  }

  public reset(): void {
    this.distanceToTowerM = 9999;
    this.warningText = '';
    this.objectiveText = 'REACH THE SAFE ZONE';
  }
}

/* =========================================================================
   SUB-SYSTEM 5: RouteCollapseManager
   13. REAL ROUTE COLLAPSE: Real PathSegments transition:
   SAFE -> UNSTABLE -> COLLAPSING -> DESTROYED -> CONSUMED.
   Never instantly delete track. Physical disintegration breakdown.
   Escape window: 5.0 seconds. Trapped -> ROUTE_CONSUMED_BY_SINGULARITY.
   ========================================================================= */
export class RouteCollapseManager {
  private segments: PathSegment[] = [];
  private segmentStates: Map<string, {
    state: TrackSegmentCollapseState;
    vibration: number;
    collapseProgress: number;
    timer: number;
  }> = new Map();

  public playerOnCollapsingSegment = false;
  public escapeWindowRemainingSeconds = 5.0;
  private readonly escapeWindowTotal = 5.0;

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
    totalTrackLengthM: number,
    playerInsideShelter: boolean,
    destructionFrontM: number
  ): { routeConsumedTriggered: boolean } {
    let playerSegmentState: TrackSegmentCollapseState = 'SAFE';

    for (const seg of this.segments) {
      const segData = this.segmentStates.get(seg.id);
      if (!segData) continue;

      const segMidM = (seg.startT + seg.endT) * 0.5 * totalTrackLengthM;

      if (playerSplineT >= seg.startT && playerSplineT <= seg.endT) {
        playerSegmentState = segData.state;
      }

      const distFromFront = segMidM - destructionFrontM;

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
        segData.timer += dt;
        segData.collapseProgress = Math.min(1.0, segData.timer / 4.0);
        segData.vibration = Math.min(1.5, segData.collapseProgress * 1.5 + Math.random() * 0.4);
        seg.isCollapsing = true;
      } else if (distFromFront <= 420 || catastrophe.currentEventIndex >= 1) {
        segData.state = 'UNSTABLE';
        segData.vibration = Math.min(0.6, catastrophe.environmentalInstability * 0.6 + Math.random() * 0.2);
      } else {
        segData.state = 'SAFE';
        segData.vibration = 0;
      }
    }

    // Escape window check
    if (!playerInsideShelter && playerSegmentState === 'COLLAPSING') {
      this.playerOnCollapsingSegment = true;
      this.escapeWindowRemainingSeconds = Math.max(0, this.escapeWindowRemainingSeconds - dt);
      if (this.escapeWindowRemainingSeconds <= 0) {
        return { routeConsumedTriggered: true };
      }
    } else {
      this.playerOnCollapsingSegment = false;
      this.escapeWindowRemainingSeconds = Math.min(
        this.escapeWindowTotal,
        this.escapeWindowRemainingSeconds + dt * 2.0
      );
    }

    return { routeConsumedTriggered: false };
  }

  public reset(): void {
    this.playerOnCollapsingSegment = false;
    this.escapeWindowRemainingSeconds = 5.0;
    this.segmentStates.forEach(data => {
      data.state = 'SAFE';
      data.vibration = 0;
      data.collapseProgress = 0;
      data.timer = 0;
    });
  }
}

/* =========================================================================
   SUB-SYSTEM 6: DestructionFrontManager (DestructionFront)
   14. Physical moving destruction front advancing along track world coordinates.
   ========================================================================= */
export class DestructionFrontManager {
  public progressM = 0;
  public distanceToPlayerM = 2500;

  public update(
    dt: number,
    catastrophe: CatastropheEventManager,
    playerSplineT: number,
    totalTrackLengthM: number,
    evacuationActive: boolean
  ): boolean {
    if (!evacuationActive) return false;

    const speed = catastrophe.destructionFrontSpeed;
    this.progressM += speed * dt;

    const playerTrackPosM = playerSplineT * totalTrackLengthM;
    this.distanceToPlayerM = Math.max(0, playerTrackPosM - this.progressM);

    return this.distanceToPlayerM <= 0;
  }

  public reset(): void {
    this.progressM = 0;
    this.distanceToPlayerM = 2500;
  }
}
export type DestructionFront = DestructionFrontManager;

/* =========================================================================
   SUB-SYSTEM 7: ParkingManager (ParkingController)
   8. Physical tolerances: position <= 2.2m, rotation <= 15 deg, speed <= 0.8 m/s.
   Automatic parking assist brings velocity to 0 without snapping/teleporting.
   ========================================================================= */
export class ParkingManager {
  public readonly positionToleranceM = 2.2;
  public readonly rotationToleranceDeg = 15;
  public readonly speedThresholdMps = 0.8; // ~2.9 km/h

  public isAligned = false;
  public isParked = false;

  public evaluate(
    shelterX: number,
    shelterZ: number,
    shelterHeading: number,
    playerSpeedMps: number
  ): { isAligned: boolean; isParked: boolean } {
    const bayDist = Math.hypot(shelterX, shelterZ - (-185));
    const rotDeg = Math.abs(shelterHeading) * (180 / Math.PI);

    this.isAligned = bayDist <= this.positionToleranceM && rotDeg <= this.rotationToleranceDeg;
    this.isParked = this.isAligned && (playerSpeedMps <= this.speedThresholdMps || shelterZ <= -184.8);

    return { isAligned: this.isAligned, isParked: this.isParked };
  }

  public reset(): void {
    this.isAligned = false;
    this.isParked = false;
  }
}
export type ParkingController = ParkingManager;

/* =========================================================================
   SUB-SYSTEM 8: ParkingClampController
   Sequential clamping: LEFT -> RIGHT -> FRONT -> REAR
   ========================================================================= */
export class ParkingClampController {
  public clampProgress = { left: 0, right: 0, front: 0, rear: 0 };
  public clampStep = 0;
  public clampTimer = 0;
  public isSecured = false;

  public update(dt: number, shipParked: boolean): boolean {
    if (!shipParked) return false;

    this.clampTimer += dt;
    const t = this.clampTimer;

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

    if (t >= 2.8 && !this.isSecured) {
      this.isSecured = true;
      sound.playShieldHit();
      return true;
    }

    return this.isSecured;
  }

  public reset(): void {
    this.clampProgress = { left: 0, right: 0, front: 0, rear: 0 };
    this.clampStep = 0;
    this.clampTimer = 0;
    this.isSecured = false;
  }
}

/* =========================================================================
   SUB-SYSTEM 9: SuccessFailureManager
   Authoritative arbiter of terminal failure locks and final outcome generation.
   ========================================================================= */
export class SuccessFailureManager {
  public isLocked = false;
  public survivalConfirmed = false;
  public failureLocked = false;
  public failureCause: FailureCause | null = null;

  public lockFailure(cause: FailureCause): void {
    if (this.survivalConfirmed || this.failureLocked) return;
    this.failureLocked = true;
    this.isLocked = true;
    this.failureCause = cause;
  }

  public lockSuccess(): void {
    if (this.failureLocked) return;
    this.survivalConfirmed = true;
    this.isLocked = true;
  }

  public reset(): void {
    this.isLocked = false;
    this.survivalConfirmed = false;
    this.failureLocked = false;
    this.failureCause = null;
  }
}

/* =========================================================================
   SUB-SYSTEM 10: CollapseCinematicCoordinator
   Presentation-only cinematic coordination:
   - Failure Cinematics: 7-phase Route-Consumption & General Failure
   - Success Cinematics: 15-phase Aftermath
   ========================================================================= */
export class CollapseCinematicCoordinator {
  public isActive = false;
  public elapsed = 0;

  public start(): void {
    this.isActive = true;
    this.elapsed = 0;
  }

  public update(dt: number): void {
    if (!this.isActive) return;
    this.elapsed += dt;
  }

  public reset(): void {
    this.isActive = false;
    this.elapsed = 0;
  }
}
export type EvacuationCinematicController = CollapseCinematicCoordinator;

/* =========================================================================
   SUB-SYSTEM 11: FailureCinematicController
   34. ROUTE-CONSUMPTION FAILURE CINEMATIC (7 DISTINCT PHASES):
   Starts at player's exact physical world position.
   Phase 1: Camera moves behind/above ship; track ahead breaks.
   Phase 2: Track cracks, breaks, detaches, falls inward, consumed.
   Phase 3: Ship loses route support, drifts, controls difficult.
   Phase 4: Track beneath breaks, ship rises from actual location, rotates toward singularity.
   Phase 5: Camera moves behind ship, black hole dominates.
   Phase 6: Stylized non-graphic tidal distortion, ship stretches/distorts.
   Phase 7: Camera pulls away, event horizon absorbs ship (dark implosion, boom, shockwave, black screen).
   ========================================================================= */
export class FailureCinematicController {
  public isActive = false;
  public isRouteConsumption = false;
  public elapsed = 0;
  public currentPhase = 1;
  public totalProgress = 0;
  public blackScreenActive = false;
  public completed = false;

  public shipInitialPosition = new THREE.Vector3();
  public shipCurrentTrajectory = new THREE.Vector3();
  public shipRotation = new THREE.Euler();

  // Section 35: 11 Distinct Phases for Full Cosmic Collapse Ending (total 21.5s)
  // Phase 1 (0-2.5s): Camera moves behind/above ship; track ahead breaks.
  // Phase 2 (2.5-5.0s): Track cracks, breaks, detaches, falls inward.
  // Phase 3 (5.0-7.5s): Ship loses route support, drifts, controls difficult.
  // Phase 4 (7.5-10.0s): Track beneath breaks, ship rises from actual location, rotates toward singularity.
  // Phase 5 (10.0-12.5s): Camera behind ship, black hole dominates.
  // Phase 6 (12.5-14.5s): Stylized non-graphic tidal distortion, ship stretches/distorts.
  // Phase 7 (14.5-15.5s): Ship absorbed into event horizon and disappears.
  // Phase 8 (15.5-16.5s): Complete silence + darkness (0.5–1s).
  // Phase 9 (16.5-18.2s): Accretion disk contracts, stars bend violently, space visually compresses -> Massive Gravitational Implosion.
  // Phase 10 (18.2-20.2s): Deep Cosmic Boom + Dark Gravitational Shockwave, stars/debris/track distort, camera pushed back.
  // Phase 11 (20.2-21.5s): Shockwave dissipates -> Total Darkness.
  private readonly rcPhaseDurations = [2.5, 2.5, 2.5, 2.5, 2.5, 2.0, 1.0, 1.0, 1.7, 2.0, 1.3];
  private readonly gfPhaseDurations = [2.5, 2.5, 2.5, 2.5, 1.0, 1.0, 1.7, 2.0, 1.3];
  private phaseTriggered: Set<number> = new Set();

  public start(isRouteConsumption: boolean, startPosition?: THREE.Vector3): void {
    this.isActive = true;
    this.isRouteConsumption = isRouteConsumption;
    this.elapsed = 0;
    this.currentPhase = 1;
    this.totalProgress = 0;
    this.blackScreenActive = false;
    this.completed = false;
    this.phaseTriggered.clear();

    if (startPosition) {
      this.shipInitialPosition.copy(startPosition);
      this.shipCurrentTrajectory.copy(startPosition);
    }

    sound.playEmergencyAlarm();
    sound.playGravitationalRumble(4.0);
  }

  public update(dt: number, blackHoleCenter: THREE.Vector3): void {
    if (!this.isActive || this.completed) return;

    this.elapsed += dt;
    const durations = this.isRouteConsumption ? this.rcPhaseDurations : this.gfPhaseDurations;
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    this.totalProgress = Math.min(1.0, this.elapsed / totalDuration);

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

    // Physical continuous gravitational trajectory starting from actual world position (Phases 4-6)
    if (this.currentPhase >= 4 && this.currentPhase <= 6) {
      const pullFrac = (this.elapsed - (durations[0] + durations[1] + durations[2])) / (durations[3] + durations[4] + durations[5]);
      const eased = Math.pow(Math.max(0, Math.min(1, pullFrac)), 1.8);
      this.shipCurrentTrajectory.lerpVectors(this.shipInitialPosition, blackHoleCenter, eased);
      this.shipRotation.x += dt * (1.2 + eased * 3.0);
      this.shipRotation.y += dt * (0.8 + eased * 2.2);
      this.shipRotation.z += dt * (1.5 + eased * 4.0);
    }

    // Section 35 & 40: Phase-specific cosmic failure audio triggers
    if (this.isRouteConsumption) {
      if (this.currentPhase === 8 && !this.phaseTriggered.has(8)) {
        this.phaseTriggered.add(8);
        // Complete silence for 0.5-1.0s darkness
      } else if (this.currentPhase === 9 && !this.phaseTriggered.has(9)) {
        this.phaseTriggered.add(9);
        // Massive Sub-bass Gravitational Implosion
        sound.playSubBassGravitationalImplosion();
      } else if (this.currentPhase === 10 && !this.phaseTriggered.has(10)) {
        this.phaseTriggered.add(10);
        // Deep Cosmic Boom + Dark Gravitational Shockwave
        sound.playDeepCosmicBoom();
        sound.playDarkGravitationalShockwave();
      } else if (this.currentPhase === 11) {
        this.blackScreenActive = true;
      }
    } else {
      // General failure sequence equivalent triggers
      const gImplosionPhase = durations.length - 2; // Phase 8
      const gBoomPhase = durations.length - 1;      // Phase 9
      if (this.currentPhase === gImplosionPhase && !this.phaseTriggered.has(gImplosionPhase)) {
        this.phaseTriggered.add(gImplosionPhase);
        sound.playSubBassGravitationalImplosion();
      } else if (this.currentPhase === gBoomPhase && !this.phaseTriggered.has(gBoomPhase)) {
        this.phaseTriggered.add(gBoomPhase);
        sound.playDeepCosmicBoom();
        sound.playDarkGravitationalShockwave();
      } else if (this.currentPhase === durations.length) {
        this.blackScreenActive = true;
      }
    }

    if (this.elapsed >= totalDuration) {
      this.completed = true;
      this.blackScreenActive = true;
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
    this.phaseTriggered.clear();
  }
}
export type FailureCinematicDirector = FailureCinematicController;

/* =========================================================================
   SUB-SYSTEM 12: SuccessCinematicController
   ========================================================================= */
export class SuccessCinematicController {
  public isActive = false;
  public elapsed = 0;

  public start(): void {
    this.isActive = true;
    this.elapsed = 0;
  }

  public update(dt: number): void {
    if (!this.isActive) return;
    this.elapsed += dt;
  }

  public reset(): void {
    this.isActive = false;
    this.elapsed = 0;
  }
}

/* =========================================================================
   SUB-SYSTEM 13: AIEvacuationController
   48. AI EVACUATION: AI racers use the same physical evacuation system.
   Detects unstable routes, navigates branches, enters tower basement,
   docks in assigned bays (Bays 01-06) without teleportation.
   ========================================================================= */
export interface AIEvacuationState {
  id: string;
  state: EvacuationState;
  assignedBayId: string;
  assignedBayPosition: THREE.Vector3;
  isParked: boolean;
  isSecured: boolean;
  clampProgress: number;
}

export class AIEvacuationController {
  public aiStates: Map<string, AIEvacuationState> = new Map();

  public registerAIRacer(id: string, index: number, bayBasePosition: THREE.Vector3): void {
    const bayIndex = (index % 6) + 1;
    const xOffset = (bayIndex % 2 === 1 ? -1 : 1) * (12 + Math.floor(bayIndex / 2) * 8);
    const zOffset = -185 + (Math.floor(bayIndex / 2) * 10);
    const bayPos = bayBasePosition.clone().add(new THREE.Vector3(xOffset, 0, zOffset - (-185)));

    this.aiStates.set(id, {
      id,
      state: 'TOWER_APPROACHING',
      assignedBayId: `BAY 0${bayIndex}`,
      assignedBayPosition: bayPos,
      isParked: false,
      isSecured: false,
      clampProgress: 0,
    });
  }

  public update(dt: number, aiList: { id: string; position: THREE.Vector3; speed: number }[]): void {
    for (const ai of aiList) {
      const state = this.aiStates.get(ai.id);
      if (!state || state.isSecured) continue;

      const distToBay = ai.position.distanceTo(state.assignedBayPosition);

      if (distToBay < 35 && state.state === 'TOWER_APPROACHING') {
        state.state = 'HANGAR_ENTERED';
      }

      if (distToBay < 8 && state.state === 'HANGAR_ENTERED') {
        state.state = 'PARKING_BAY_ENTERED';
      }

      if (distToBay <= 2.2 && (ai.speed <= 3.0 || distToBay < 1.0)) {
        state.state = 'SHIP_PARKED';
        state.isParked = true;
      }

      if (state.isParked && !state.isSecured) {
        state.clampProgress += dt * 0.4;
        if (state.clampProgress >= 1.0) {
          state.isSecured = true;
          state.state = 'SHIP_SECURED';
        }
      }
    }
  }

  public reset(): void {
    this.aiStates.clear();
  }
}

/* =========================================================================
   MASTER CLASS: FinalCollapseManager
   Integrates all authoritative subsystems seamlessly:
   - EvacuationManager
   - CatastropheEventManager
   - RouteCollapseManager
   - DestructionFrontManager
   - EvacuationTowerManager
   - ParkingManager
   - SuccessFailureManager
   - CollapseCinematicCoordinator
   ========================================================================= */
export class FinalCollapseManager {
  public readonly evacuation: EvacuationManager;
  public readonly catastrophe: CatastropheEventManager;
  public readonly tower: EvacuationTowerManager;
  public readonly routeManager: EvacuationRouteManager;
  public readonly routeCollapse: RouteCollapseManager;
  public readonly destructionFront: DestructionFrontManager;
  public readonly parking: ParkingManager;
  public readonly clamps: ParkingClampController;
  public readonly successFailure: SuccessFailureManager;
  public readonly cinematicCoordinator: CollapseCinematicCoordinator;
  public readonly evacuationCinematic: EvacuationCinematicController;
  public readonly failureCinematic: FailureCinematicController;
  public readonly successCinematic: SuccessCinematicController;
  public readonly aiEvacuation: AIEvacuationController;

  // Backward compatibility fields with previous system
  public phase = 'FIVE_MINUTE_RACE';
  public elapsed = 0;
  public readonly raceDuration = 300;
  public collapseProgress = 0;
  public destructionFrontDistance = Number.POSITIVE_INFINITY;
  public safeZoneActive = false;
  public towerEntryActive = false;
  public towerSealed = false;

  constructor() {
    this.evacuation = new EvacuationManager();
    this.catastrophe = new CatastropheEventManager();
    this.tower = new EvacuationTowerManager();
    this.routeManager = new EvacuationRouteManager();
    this.routeCollapse = new RouteCollapseManager();
    this.destructionFront = new DestructionFrontManager();
    this.parking = new ParkingManager();
    this.clamps = new ParkingClampController();
    this.successFailure = new SuccessFailureManager();
    this.cinematicCoordinator = new CollapseCinematicCoordinator();
    this.evacuationCinematic = this.cinematicCoordinator;
    this.failureCinematic = new FailureCinematicController();
    this.successCinematic = new SuccessCinematicController();
    this.aiEvacuation = new AIEvacuationController();
  }

  public start(): void {
    this.phase = 'FIVE_MINUTE_RACE';
    this.elapsed = 0;
    this.collapseProgress = 0;
    this.destructionFrontDistance = 2500;
    this.safeZoneActive = false;
    this.towerEntryActive = false;
    this.towerSealed = false;

    this.evacuation.reset();
    this.catastrophe.reset();
    this.tower.reset();
    this.routeManager.reset();
    this.routeCollapse.reset();
    this.destructionFront.reset();
    this.parking.reset();
    this.clamps.reset();
    this.successFailure.reset();
    this.cinematicCoordinator.reset();
    this.failureCinematic.reset();
    this.successCinematic.reset();
    this.aiEvacuation.reset();
  }

  public onZeroCountdown(): void {
    this.phase = 'EVACUATION_PROTOCOL';
    this.safeZoneActive = true;
    this.evacuation.startEvacuation();
  }

  public update(
    dt: number,
    playerContext?: {
      position: THREE.Vector3;
      quaternion: THREE.Quaternion;
      speedMps: number;
      splineT: number;
      totalTrackLengthM: number;
      towerEntrancePos: THREE.Vector3;
      bay07Pos: THREE.Vector3;
      shelterNavigationActive: boolean;
      shelterX: number;
      shelterZ: number;
      shelterHeading: number;
      blackHoleCenter?: THREE.Vector3;
    }
  ): {
    telemetry: EvacuationTelemetry;
    impactForces: ShipImpactForces;
    shouldLockControls: boolean;
    failureTriggered: boolean;
    successTriggered: boolean;
  } {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsed += delta;

    if (this.evacuation.evacuationActive) {
      this.collapseProgress = Math.min(1.0, this.evacuation.evacuationElapsedTime / 300);
    }

    if (!playerContext) {
      return {
        telemetry: this.getTelemetry(),
        impactForces: this.catastrophe.getShipImpactForces(this.elapsed),
        shouldLockControls: false,
        failureTriggered: this.evacuation.evacuationFailed,
        successTriggered: this.evacuation.evacuationSuccess,
      };
    }

    // 1. Update Evacuation Lifecycle
    this.evacuation.update(delta);

    // 2. Update Catastrophe Events (Exact 15 threshold events)
    this.catastrophe.update(delta, this.evacuation);

    // 3. Update Destruction Front
    const frontCaughtPlayer = this.destructionFront.update(
      delta,
      this.catastrophe,
      playerContext.splineT,
      playerContext.totalTrackLengthM,
      this.evacuation.evacuationActive
    );
    this.destructionFrontDistance = this.destructionFront.distanceToPlayerM;

    if (
      !playerContext.shelterNavigationActive &&
      frontCaughtPlayer &&
      !this.evacuation.evacuationSuccess &&
      !this.evacuation.evacuationFailed
    ) {
      this.triggerFailure('DESTRUCTION_FRONT_REACHED_PLAYER', false, playerContext.position);
    }

    // 4. Update Dynamic Route Collapse
    const collapseResult = this.routeCollapse.update(
      delta,
      this.catastrophe,
      playerContext.splineT,
      playerContext.totalTrackLengthM,
      playerContext.shelterNavigationActive,
      this.destructionFront.progressM
    );

    if (
      collapseResult.routeConsumedTriggered &&
      !this.evacuation.evacuationSuccess &&
      !this.evacuation.evacuationFailed
    ) {
      this.triggerFailure('ROUTE_CONSUMED_BY_SINGULARITY', true, playerContext.position);
    }

    // 4b. Explicit Failure Condition Checks (Section 37)
    if (this.evacuation.evacuationActive && !this.evacuation.evacuationSuccess && !this.evacuation.evacuationFailed) {
      if (this.tower.isSealed && !this.evacuation.towerEntryReached) {
        this.triggerFailure('TOWER_ENTRANCE_SEALED', false, playerContext.position);
      } else if (this.evacuation.evacuationElapsedTime >= 1860) {
        if (!this.evacuation.towerEntryReached) {
          this.triggerFailure('EVACUATION_DEADLINE_EXPIRED', false, playerContext.position);
        } else if (!this.evacuation.basementEntryReached) {
          this.triggerFailure('BASEMENT_NOT_REACHED', false, playerContext.position);
        } else if (!this.evacuation.parkingBayReached) {
          this.triggerFailure('PARKING_BAY_NOT_REACHED', false, playerContext.position);
        } else if (!this.evacuation.shipSecured) {
          this.triggerFailure('SHIP_NOT_SECURED', false, playerContext.position);
        }
      }
    }

    // 5. Update Navigation & Warnings
    this.routeManager.update(
      playerContext.position,
      playerContext.quaternion,
      playerContext.towerEntrancePos,
      this.evacuation,
      playerContext.shelterZ
    );

    // 6. Update Parking & Clamps
    if (playerContext.shelterNavigationActive) {
      // 7 & 8. Authoritative physical progression through shelter zones
      if (playerContext.shelterZ <= 12 && this.evacuation.evacuationState === 'TOWER_APPROACHING') {
        this.evacuation.setEvacuationState('TOWER_ENTERED');
      }
      if (playerContext.shelterZ <= -32 && this.evacuation.evacuationState === 'TOWER_ENTERED') {
        this.evacuation.setEvacuationState('BASEMENT_ENTERED');
      }
      if (playerContext.shelterZ <= -140 && this.evacuation.evacuationState === 'BASEMENT_ENTERED') {
        this.evacuation.setEvacuationState('HANGAR_ENTERED');
      }
      const bayDist = Math.hypot(playerContext.shelterX, playerContext.shelterZ - (-185));
      if (bayDist < 8 && this.evacuation.evacuationState === 'HANGAR_ENTERED') {
        this.evacuation.setEvacuationState('PARKING_BAY_ENTERED');
      }

      const parkEval = this.parking.evaluate(
        playerContext.shelterX,
        playerContext.shelterZ,
        playerContext.shelterHeading,
        playerContext.speedMps
      );

      if (parkEval.isAligned && this.evacuation.evacuationState === 'PARKING_BAY_ENTERED') {
        this.evacuation.setEvacuationState('SHIP_ALIGNED');
      }

      if (
        parkEval.isParked &&
        (this.evacuation.evacuationState === 'SHIP_ALIGNED' ||
          this.evacuation.evacuationState === 'PARKING_BAY_ENTERED')
      ) {
        this.evacuation.setEvacuationState('SHIP_PARKED');
      }

      if (this.evacuation.evacuationState === 'SHIP_PARKED') {
        const secured = this.clamps.update(delta, true);
        if (secured) {
          this.evacuation.setEvacuationState('SHIP_SECURED');
          this.successFailure.lockSuccess();
          this.tower.seal();
          this.towerSealed = true;
        }
      }
    }

    // 7. Update Failure / Success Cinematics
    const bhCenter = playerContext.blackHoleCenter ?? new THREE.Vector3(0, 180, -3500);
    if (this.failureCinematic.isActive) {
      this.failureCinematic.update(delta, bhCenter);
    }
    if (this.cinematicCoordinator.isActive) {
      this.cinematicCoordinator.update(delta);
    }

    const telemetry = this.getTelemetry();
    const impactForces = this.catastrophe.getShipImpactForces(this.elapsed);

    return {
      telemetry,
      impactForces,
      shouldLockControls:
        this.evacuation.evacuationState === 'SHIP_SECURED' ||
        this.failureCinematic.isActive,
      failureTriggered: this.evacuation.evacuationFailed,
      successTriggered: this.evacuation.evacuationSuccess,
    };
  }

  public triggerFailure(
    cause: FailureCause,
    isRouteConsumption: boolean,
    startPosition?: THREE.Vector3
  ): void {
    if (this.evacuation.evacuationSuccess || this.evacuation.evacuationFailed) return;
    this.evacuation.markFailure(cause);
    this.successFailure.lockFailure(cause);
    this.failureCinematic.start(isRouteConsumption, startPosition);
  }

  public sealTower(): void {
    this.tower.seal();
    this.towerSealed = true;
  }

  public markSurvived(): void {
    this.evacuation.markSuccess();
    this.successFailure.lockSuccess();
  }

  public beginTrackCollapse(): void {
    this.phase = 'TRACK_COLLAPSE';
  }

  public beginSpaghettification(): void {
    this.phase = 'SPAGHETTIFICATION';
  }

  public beginPlanetaryCollision(): void {
    this.phase = 'PLANETARY_COLLISION';
  }

  public beginDestructionFront(distance: number): void {
    this.phase = 'DESTRUCTION_FRONT';
    this.destructionFrontDistance = distance;
  }

  public updateDestructionFront(distance: number): void {
    this.destructionFrontDistance = distance;
  }

  public beginEmergencyRoute(): void {
    this.phase = 'EMERGENCY_ROUTE';
    this.safeZoneActive = true;
  }

  public beginTowerEntry(): void {
    this.phase = 'TOWER_ENTRY';
    this.safeZoneActive = true;
    this.towerEntryActive = true;
    this.evacuation.setEvacuationState('TOWER_ENTERED');
  }

  public beginFinalCollapse(): void {
    this.phase = 'FINAL_COLLAPSE';
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.raceDuration - this.elapsed);
  }

  public getObjective(): string {
    return this.routeManager.objectiveText;
  }

  public initializePhysicalShelter(scene: THREE.Scene, safeZoneCenter: THREE.Vector3): void {
    this.tower.initialize(
      scene,
      safeZoneCenter,
      safeZoneCenter.clone().add(new THREE.Vector3(0, -14, -185))
    );
  }

  public disposePhysicalShelter(scene: THREE.Scene): void {
    this.tower.reset();
  }

  public isPlayerInsideSafeZone(playerPosition: THREE.Vector3): boolean {
    return playerPosition.distanceTo(this.tower.bay07Center) <= 25;
  }

  /**
   * 46. Compiles complete failure or success telemetry stats with actual values
   */
  public generateStats(
    raceStartTime: number,
    totalDistanceM: number,
    checkpointsCount: number,
    boostCount: number,
    shieldsCount: number,
    missilesCount: number
  ): FinalCollapseStats {
    const totalMs = Math.max(0, Date.now() - raceStartTime);
    const totalSec = Math.floor(totalMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const ms = totalMs % 1000;
    const raceTimeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;

    const evacSec = Math.floor(this.evacuation.evacuationElapsedTime);
    const em = Math.floor(evacSec / 60);
    const es = evacSec % 60;
    const evacuationTimeFormatted = `${em.toString().padStart(2, '0')}:${es.toString().padStart(2, '0')}`;

    const survived = this.evacuation.evacuationSuccess && this.evacuation.shipSecured;

    return {
      survivalStatus: survived ? 'SURVIVED' : 'FAILED',
      safeZoneStatus: survived ? 'SECURED' : 'NOT REACHED',
      towerEntryReached: this.evacuation.towerEntryReached,
      basementEntryReached: this.evacuation.basementEntryReached,
      hangarEntryReached: this.evacuation.hangarEntryReached,
      parkingBayReached: this.evacuation.parkingBayReached,
      shipAligned: this.evacuation.shipAligned,
      shipParked: this.evacuation.shipParked,
      shipSecured: this.evacuation.shipSecured,
      raceTimeFormatted,
      raceTimeMs: totalMs,
      evacuationTimeFormatted,
      evacuationTimeSeconds: Math.round(this.evacuation.evacuationElapsedTime),
      distanceTraveledM: Math.round(totalDistanceM),
      checkpointsReached: checkpointsCount,
      boostUsedCount: boostCount,
      shieldsUsedCount: shieldsCount,
      missilesUsedCount: missilesCount,
      failureCause: this.evacuation.failureCause,
      safeZone: survived ? 'EVACUATION BAY 07 (SECURED)' : 'NOT REACHED',
      shipStatus: survived ? '100% INTACT // SECURED' : (this.evacuation.failureCause || 'DESTROYED'),
    };
  }

  public getTelemetry(): EvacuationTelemetry {
    return {
      gameState: this.evacuation.gameState,
      evacuationActive: this.evacuation.evacuationActive,
      evacuationSuccess: this.evacuation.evacuationSuccess,
      evacuationFailed: this.evacuation.evacuationFailed,
      evacuationElapsedTime: this.evacuation.evacuationElapsedTime,
      evacuationState: this.evacuation.evacuationState,
      failureCause: this.evacuation.failureCause,
      currentEventIndex: this.catastrophe.currentEventIndex,
      nextEventTime: this.catastrophe.nextEventTime,
      activeEventName: this.catastrophe.activeEvent?.name ?? null,
      activeEventTitle: this.catastrophe.activeEvent?.title ?? null,
      activeEventSubtitle: this.catastrophe.activeEvent?.subtitle ?? null,
      eventPhase: this.catastrophe.activeEvent?.phase ?? null,
      eventHistory: [...this.catastrophe.eventHistory],
      safeZoneDistanceM: this.routeManager.distanceToTowerM,
      safeZoneWarning: this.routeManager.warningText,
      objectiveText: this.routeManager.objectiveText,
      navArrowAngleDeg: this.routeManager.navArrowAngleDeg,
      navArrowVector: {
        x: this.routeManager.navArrowVector.x,
        y: this.routeManager.navArrowVector.y,
        z: this.routeManager.navArrowVector.z,
      },
      routeConsumptionActive:
        this.failureCinematic.isActive && this.failureCinematic.isRouteConsumption,
      generalFailureActive:
        this.failureCinematic.isActive && !this.failureCinematic.isRouteConsumption,
      cinematicPhase: this.failureCinematic.currentPhase,
      cinematicProgress: this.failureCinematic.totalProgress,
      blackScreenActive: this.failureCinematic.blackScreenActive,
      destructionFrontDistanceM: Math.round(this.destructionFront.distanceToPlayerM),
      playerOnCollapsingSegment: this.routeCollapse.playerOnCollapsingSegment,
      escapeWindowRemainingSeconds:
        Math.round(this.routeCollapse.escapeWindowRemainingSeconds * 10) / 10,
      clampsLocked: {
        left: this.clamps.clampStep >= 1,
        right: this.clamps.clampStep >= 2,
        front: this.clamps.clampStep >= 3,
        rear: this.clamps.clampStep >= 4,
      },
      absoluteCollapseActive: this.catastrophe.absoluteCollapse,
      hudGlitchIntensity: (this.catastrophe.activeEvent?.severity ?? 0) >= 6 ? 0.35 : 0,
    };
  }
}
