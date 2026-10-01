import * as THREE from 'three';
import { EvacuationTelemetry } from './FinalCollapseManager';

export type FinalCollapseState =
  | 'NORMAL_RACE'
  | 'SINGULARITY_ACTIVATION'
  | 'TRACK_COLLAPSE'
  | 'EVACUATION'
  | 'TOWER_APPROACH'
  | 'BASEMENT_ENTRY'
  | 'BASEMENT_DESCENT'
  | 'PARKING_APPROACH'
  | 'PARKING_ALIGNMENT'
  | 'SHIP_PARKING'
  | 'PARKING_CLAMPS'
  | 'SHIP_SECURED'
  | 'SHELTER_SEALING'
  | 'SHELTER_SEALED'
  | 'SHELTER_SECURED'
  | 'AFTERMATH_START'
  | 'TOWER_REVEAL'
  | 'WORLD_COLLAPSE'
  | 'FINAL_SINGULARITY'
  | 'COSMIC_LIGHT_EVENT'
  | 'SILENCE'
  | 'AFTERMATH_REVEAL'
  | 'TOWER_REVEAL_RETURN'
  | 'SHIP_FINAL_SHOT'
  | 'CINEMATIC_END'
  | 'RESULTS_INTRO'
  | 'RESULTS_STATS'
  | 'REWARD_SEQUENCE'
  | 'RESULTS_COMPLETE'
  | 'HANGAR_ENTRY'
  | 'AFTERMATH_CINEMATIC'
  | 'FINAL_SINGULARITY_COLLAPSE'
  | 'SURVIVAL_RESULTS';

export type BlackHoleCinematicEvent =
  | 'NONE'
  | 'INTRO'
  | 'PRE_RACE'
  | 'BLACK_HOLE_REVEAL'
  | 'DANGER_EVENT'
  | 'TRACK_COLLAPSE'
  | 'GRAVITY_EVENT'
  | 'ESCAPE_SEQUENCE'
  | 'FINAL_SINGULARITY_WARNING'
  | 'SPAGHETTIFICATION'
  | 'PLANETARY_COLLISION'
  | 'DESTRUCTION_FRONT'
  | 'EVACUATION'
  | 'TOWER_APPROACH'
  | 'BASEMENT_ENTRY'
  | 'BASEMENT_DESCENT'
  | 'HANGAR_ENTRY'
  | 'PARKING_APPROACH'
  | 'PARKING_ALIGNMENT'
  | 'SHIP_PARKING'
  | 'PARKING_CLAMPS'
  | 'SHIP_SECURED'
  | 'SHELTER_SEALING'
  | 'SHELTER_SEALED'
  | 'SHELTER_SECURED'
  | 'AFTERMATH_START'
  | 'TOWER_REVEAL'
  | 'WORLD_COLLAPSE'
  | 'FINAL_SINGULARITY'
  | 'COSMIC_LIGHT_EVENT'
  | 'SILENCE'
  | 'AFTERMATH_REVEAL'
  | 'TOWER_REVEAL_RETURN'
  | 'SHIP_FINAL_SHOT'
  | 'CINEMATIC_END'
  | 'RESULTS_INTRO'
  | 'RESULTS_STATS'
  | 'REWARD_SEQUENCE'
  | 'RESULTS_COMPLETE'
  | 'AFTERMATH_CINEMATIC'
  | 'FINAL_SINGULARITY_COLLAPSE'
  | 'SURVIVAL_RESULTS'
  | 'TOWER_ENTRY'
  | 'TOWER_SEALING'
  | 'FINAL_COLLAPSE'
  | 'FINAL_FLASH'
  | 'FLASHBANG'
  | 'REBUILDING_MAP'
  | 'AFTERMATH'
  | 'RESULTS';

export type BlackHoleDangerState =
  | 'SAFE'
  | 'WARNING'
  | 'DANGER'
  | 'CRITICAL'
  | 'COLLAPSE';

export interface FinalCollapseStats {
  survivalStatus: 'SURVIVED';
  raceTimeFormatted: string;
  raceTimeMs: number;
  distanceTraveledM: number;
  checkpointsReached: number;
  aiRacersTotal: number;
  missilesUsed: number;
  shieldsUsed: number;
  safeZone: string;
  shipStatus: string;
}

export interface ParkingTelemetry {
  bayId: string;
  distanceToBay: number;
  isAligned: boolean;
  alignmentScore: number;
  positionErrorM: number;
  rotationErrorDeg: number;
  currentSpeedKmh: number;
  targetSpeedKmh: number;
  clampsLocked: { left: boolean; right: boolean; front: boolean; rear: boolean };
  isParked: boolean;
  isSecured: boolean;
  isHangarSealed: boolean;
}

export interface TowerApproachTelemetry {
  distanceToEntrance: number;
  entryReady: boolean;
  level: string;
}

export interface BlackHoleCinematicTelemetry {
  event: BlackHoleCinematicEvent;
  state?: FinalCollapseState;
  danger: BlackHoleDangerState;
  elapsed: number;
  eventElapsed: number;
  progress: number;
  cameraOverride: boolean;
  gameplayLocked: boolean;
  title: string;
  subtitle: string;
  warning: string | null;
  finalCountdown: number | null;
  escapeRouteActive: boolean;
  trackCollapseProgress: number;
  destructionFrontDistance: number | null;
  objective: string | null;
  submode: 'FINAL_COLLAPSE' | null;
  finalCollapseStage?: number;
  finalCollapseStageElapsed?: number;
  blackHoleStatus?: 'STABLE' | 'CRITICAL' | 'COLLAPSED';
  parking?: ParkingTelemetry;
  towerApproach?: TowerApproachTelemetry;
  stats?: FinalCollapseStats;
  evacuation?: EvacuationTelemetry;
}

export interface BlackHoleCinematicOptions {
  scene?: THREE.Scene;
  blackHoleCenter?: THREE.Vector3;
  finalCountdownSeconds?: number;
}

const EVENT_DURATIONS: Record<BlackHoleCinematicEvent, number> = {
  NONE: 0,
  INTRO: 4,
  PRE_RACE: 3,
  BLACK_HOLE_REVEAL: 5,
  DANGER_EVENT: 3,
  TRACK_COLLAPSE: 6,
  GRAVITY_EVENT: 4,
  ESCAPE_SEQUENCE: 8,
  FINAL_SINGULARITY_WARNING: 3.5,
  SPAGHETTIFICATION: 7.5,
  PLANETARY_COLLISION: 6.5,
  DESTRUCTION_FRONT: 12.0,
  EVACUATION: 15.0,
  TOWER_APPROACH: 10.0,
  BASEMENT_ENTRY: 6.0,
  BASEMENT_DESCENT: 8.0,
  HANGAR_ENTRY: 8.0,
  PARKING_APPROACH: 4.0,
  PARKING_ALIGNMENT: 30.0,
  SHIP_PARKING: 2.5,
  PARKING_CLAMPS: 3.0,
  SHIP_SECURED: 2.0,
  SHELTER_SEALING: 2.5,
  SHELTER_SECURED: 2.0,
  SHELTER_SEALED: 2.5,
  AFTERMATH_START: 2.8,
  TOWER_REVEAL: 5.0,
  WORLD_COLLAPSE: 5.5,
  FINAL_SINGULARITY: 6.0,
  COSMIC_LIGHT_EVENT: 3.0,
  SILENCE: 4.0,
  TOWER_REVEAL_RETURN: 4.5,
  SHIP_FINAL_SHOT: 4.5,
  SURVIVAL_RESULTS: 4.0,
  RESULTS: 60.0,
  RESULTS_COMPLETE: 60.0,
  AFTERMATH_REVEAL: 4.0,
  CINEMATIC_END: 4.0,
  RESULTS_INTRO: 1.5,
  RESULTS_STATS: 4.5,
  REWARD_SEQUENCE: 2.0,
  AFTERMATH_CINEMATIC: 10.0,
  FINAL_SINGULARITY_COLLAPSE: 6.0,
  TOWER_ENTRY: 15.0,
  TOWER_SEALING: 4.0,
  FINAL_COLLAPSE: 5.5,
  FINAL_FLASH: 1.5,
  FLASHBANG: 2.5,
  REBUILDING_MAP: 4.0,
  AFTERMATH: 3.0,
};

/** Reusable presentation/event controller for Mode 21 — Black Hole. */
export class BlackHoleCinematicManager {
  public readonly scene: THREE.Scene | null;
  public event: BlackHoleCinematicEvent = 'NONE';
  public danger: BlackHoleDangerState = 'SAFE';
  public elapsed = 0;
  public eventElapsed = 0;
  public cameraOverride = false;
  public gameplayLocked = false;
  public escapeRouteActive = false;
  public trackCollapseProgress = 0;
  public destructionFrontDistance: number | null = null;
  public objective: string | null = null;
  public finalCountdownSeconds: number | null = null;
  public readonly blackHoleCenter: THREE.Vector3;
  public blackHoleStatus: 'STABLE' | 'CRITICAL' | 'COLLAPSED' = 'STABLE';

  private finalCountdownInitial = 300;
  private completed = false;

  /** Final Collapse 5-minute stage state. */
  public finalCollapseStage = 1;
  public finalCollapseStageElapsed = 0;

  constructor(options: BlackHoleCinematicOptions = {}) {
    this.scene = options.scene ?? null;
    this.blackHoleCenter = options.blackHoleCenter?.clone() ?? new THREE.Vector3(0, -40, 0);
    if (Number.isFinite(options.finalCountdownSeconds)) {
      this.finalCountdownInitial = Math.max(1, options.finalCountdownSeconds as number);
    }
  }

  public start(event: BlackHoleCinematicEvent): void {
    this.event = event;
    this.eventElapsed = 0;
    this.completed = false;

    // Only non-playable presentation moments take full camera control
    this.cameraOverride = [
      'INTRO', 'PRE_RACE', 'BLACK_HOLE_REVEAL', 'FINAL_SINGULARITY_WARNING',
      'SHIP_PARKING', 'PARKING_CLAMPS', 'SHIP_SECURED', 'SHELTER_SEALING', 'SHELTER_SEALED', 'SHELTER_SECURED',
      'AFTERMATH_START', 'TOWER_REVEAL', 'WORLD_COLLAPSE', 'PLANETARY_COLLISION', 'FINAL_SINGULARITY',
      'COSMIC_LIGHT_EVENT', 'SILENCE', 'TOWER_REVEAL_RETURN', 'SHIP_FINAL_SHOT', 'SURVIVAL_RESULTS',
      'AFTERMATH_CINEMATIC', 'FINAL_SINGULARITY_COLLAPSE', 'AFTERMATH_REVEAL',
      'TOWER_SEALING', 'FINAL_COLLAPSE',
      'FINAL_FLASH', 'FLASHBANG', 'REBUILDING_MAP', 'AFTERMATH', 'RESULTS', 'RESULTS_COMPLETE',
    ].includes(event);

    // Gameplay locking: during non-interactive cinematics
    this.gameplayLocked = [
      'INTRO', 'PRE_RACE', 'FINAL_SINGULARITY_WARNING',
      'SHIP_PARKING', 'PARKING_CLAMPS', 'SHIP_SECURED', 'SHELTER_SEALING', 'SHELTER_SEALED', 'SHELTER_SECURED',
      'AFTERMATH_START', 'TOWER_REVEAL', 'WORLD_COLLAPSE', 'PLANETARY_COLLISION', 'FINAL_SINGULARITY',
      'COSMIC_LIGHT_EVENT', 'SILENCE', 'TOWER_REVEAL_RETURN', 'SHIP_FINAL_SHOT', 'SURVIVAL_RESULTS',
      'AFTERMATH_CINEMATIC', 'FINAL_SINGULARITY_COLLAPSE', 'AFTERMATH_REVEAL',
      'TOWER_SEALING', 'FINAL_COLLAPSE', 'FINAL_FLASH', 'FLASHBANG', 'REBUILDING_MAP', 'RESULTS', 'RESULTS_COMPLETE',
    ].includes(event);

    if ([
      'TRACK_COLLAPSE', 'GRAVITY_EVENT', 'SPAGHETTIFICATION', 'PLANETARY_COLLISION', 'DESTRUCTION_FRONT',
      'EVACUATION', 'TOWER_APPROACH', 'BASEMENT_ENTRY', 'BASEMENT_DESCENT', 'HANGAR_ENTRY', 'PARKING_ALIGNMENT',
      'TOWER_ENTRY', 'TOWER_SEALING', 'FINAL_COLLAPSE', 'FINAL_FLASH', 'FLASHBANG',
      'FINAL_SINGULARITY',
    ].includes(event)) {
      this.danger = 'COLLAPSE';
      this.blackHoleStatus = 'CRITICAL';
    } else {
      this.blackHoleStatus = 'STABLE';
    }

    if (
      event === 'FINAL_COLLAPSE' || event === 'FINAL_FLASH' || event === 'FLASHBANG' ||
      event === 'REBUILDING_MAP' || event === 'AFTERMATH' || event === 'RESULTS' ||
      event === 'FINAL_SINGULARITY_COLLAPSE' || event === 'COSMIC_LIGHT_EVENT' ||
      event === 'AFTERMATH_REVEAL' || event === 'SURVIVAL_RESULTS'
    ) {
      this.blackHoleStatus = 'COLLAPSED';
    }

    if (event === 'FINAL_SINGULARITY' || event === 'FINAL_SINGULARITY_WARNING') {
      this.trackCollapseProgress = 0;
    }
    if (event === 'EVACUATION' || event === 'TOWER_ENTRY') {
      this.escapeRouteActive = true;
      this.objective = 'REACH THE SAFE ZONE';
    }
    if (event === 'TOWER_APPROACH') {
      this.objective = 'SAFE ZONE REACHED // EVACUATION TOWER AHEAD';
    }
    if (event === 'BASEMENT_ENTRY') {
      this.objective = 'EVACUATION IN PROGRESS // ENTER BASEMENT';
    }
    if (event === 'BASEMENT_DESCENT') {
      this.objective = 'DESCENDING TO EVACUATION LEVEL: B3';
    }
    if (event === 'HANGAR_ENTRY' || event === 'PARKING_ALIGNMENT') {
      this.objective = 'EVACUATION BAY 07 // ALIGN SHIP WITH PARKING MARKER';
    }
    if (event === 'SHIP_PARKING') {
      this.objective = 'SHIP PARKING CONFIRMED';
    }
    if (event === 'SHIP_SECURED') {
      this.objective = 'SHIP SECURED // CLAMPS LOCKED';
    }
    if (event === 'SHELTER_SEALED') {
      this.objective = 'SAFE ZONE SEALED // SHELTER STATUS: SECURE';
    }
    if (event === 'AFTERMATH_START') {
      this.objective = 'SHELTER DOORS SEALED // LIFE SUPPORT 100%';
    }
    if (event === 'TOWER_REVEAL') {
      this.objective = 'EVACUATION SHELTER SECURE // OBSERVATION FEED ACTIVE';
    }
    if (event === 'WORLD_COLLAPSE') {
      this.objective = 'EXTERIOR COLLAPSE DETECTED // TRACK DISINTEGRATION';
    }
    if (event === 'PLANETARY_COLLISION') {
      this.objective = 'CATASTROPHE EVENT: PLANETARY IMPACT';
    }
    if (event === 'FINAL_SINGULARITY') {
      this.objective = 'SINGULARITY EVENT HORIZON CONSUMPTION';
    }
    if (event === 'COSMIC_LIGHT_EVENT') {
      this.objective = 'HIGH-ENERGY CHERENKOV BURST DETECTED';
    }
    if (event === 'SILENCE') {
      this.objective = 'SINGULARITY CRITICAL MASS REACHED // VOID STABILITY';
    }
    if (event === 'TOWER_REVEAL_RETURN' || event === 'SHIP_FINAL_SHOT') {
      this.objective = 'SHELTER INTEGRITY: MAXIMUM // CREW SAFE';
    }
    if (event === 'SURVIVAL_RESULTS' || event === 'RESULTS' || event === 'RESULTS_COMPLETE') {
      this.objective = 'MISSION COMPLETE // EVACUATION SUCCESSFUL';
    }
    if (event === 'TOWER_SEALING') {
      this.objective = 'SAFE ZONE SECURED';
    }
    if (event === 'REBUILDING_MAP') {
      this.objective = 'REBUILDING MAP...';
    }
  }

  public stop(): void {
    this.event = 'NONE';
    this.eventElapsed = 0;
    this.cameraOverride = false;
    this.gameplayLocked = false;
    this.completed = true;
    this.destructionFrontDistance = null;
    this.objective = null;
    this.blackHoleStatus = 'STABLE';
  }

  /** Starts the exact 05:00 (300 seconds) countdown for submode 10. */
  public startFinalFiveMinuteCountdown(): void {
    this.finalCountdownSeconds = 300;
    this.event = 'NONE';
    this.eventElapsed = 0;
    this.danger = 'SAFE';
    this.trackCollapseProgress = 0;
    this.destructionFrontDistance = null;
    this.objective = 'SURVIVE THE FIVE-MINUTE RACE';
    this.escapeRouteActive = false;
    this.completed = false;
    this.finalCollapseStage = 1;
    this.finalCollapseStageElapsed = 0;
    this.blackHoleStatus = 'STABLE';
    this.cameraOverride = false;
    this.gameplayLocked = false;
  }

  /** Skip to 00:00 immediately for rapid developer testing/validation */
  public skipToZeroCountdown(): void {
    if (this.finalCountdownSeconds !== null && this.finalCountdownSeconds > 0) {
      this.finalCountdownSeconds = 0;
      this.finalCollapseStage = 2;
      this.finalCollapseStageElapsed = 0;
      this.start('FINAL_SINGULARITY_WARNING');
    }
  }

  /** Presentation/event update; the existing race loop remains authoritative. */
  public update(dt: number): BlackHoleCinematicTelemetry {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsed += delta;
    this.eventElapsed += delta;

    // 5-minute countdown management
    if (this.finalCountdownSeconds !== null && this.finalCountdownSeconds > 0) {
      this.finalCountdownSeconds = Math.max(0, this.finalCountdownSeconds - delta);
      this.finalCollapseStageElapsed += delta;

      // STRICT REQUIREMENT:
      // "For the first 5 minutes: Normal racing...
      //  Do NOT start the catastrophe before 00:00."
      if (this.finalCountdownSeconds <= 0) {
        // EXACTLY 00:00 — Trigger the catastrophe!
        this.finalCountdownSeconds = 0;
        this.finalCollapseStage = 2;
        this.finalCollapseStageElapsed = 0;
        this.start('FINAL_SINGULARITY_WARNING');
      }
    }

    if (['TRACK_COLLAPSE', 'SPAGHETTIFICATION', 'PLANETARY_COLLISION', 'DESTRUCTION_FRONT', 'EVACUATION', 'FINAL_COLLAPSE', 'FINAL_SINGULARITY'].includes(this.event)) {
      const duration = EVENT_DURATIONS[this.event] || EVENT_DURATIONS.FINAL_COLLAPSE;
      this.trackCollapseProgress = Math.min(1, this.eventElapsed / duration);
    }

    if (this.event === 'DESTRUCTION_FRONT' || this.event === 'EVACUATION') {
      if (this.destructionFrontDistance === null) {
        this.destructionFrontDistance = 2500;
      }
    }

    const duration = EVENT_DURATIONS[this.event] || 0;
    if (duration > 0 && this.eventElapsed >= duration) {
      this.completed = true;
      this.advanceAutomaticEvent();
    }

    return this.getTelemetry();
  }

  private advanceAutomaticEvent(): void {
    if (this.event === 'PLANETARY_COLLISION') {
      const isAftermath = this.parkingTelemetry?.isParked || this.parkingTelemetry?.isSecured;
      this.start(isAftermath ? 'FINAL_SINGULARITY' : 'DESTRUCTION_FRONT');
      return;
    }

    const next: Partial<Record<BlackHoleCinematicEvent, BlackHoleCinematicEvent>> = {
      FINAL_SINGULARITY_WARNING: 'SPAGHETTIFICATION',
      SPAGHETTIFICATION: 'PLANETARY_COLLISION',
      DESTRUCTION_FRONT: 'EVACUATION',
      EVACUATION: 'TOWER_APPROACH',
      TOWER_APPROACH: 'BASEMENT_ENTRY',
      BASEMENT_ENTRY: 'BASEMENT_DESCENT',
      BASEMENT_DESCENT: 'PARKING_APPROACH',
      PARKING_APPROACH: 'PARKING_ALIGNMENT',
      PARKING_ALIGNMENT: 'SHIP_PARKING',
      SHIP_PARKING: 'PARKING_CLAMPS',
      PARKING_CLAMPS: 'SHIP_SECURED',
      SHIP_SECURED: 'SHELTER_SEALING',
      SHELTER_SEALING: 'SHELTER_SEALED',
      SHELTER_SEALED: 'AFTERMATH_START',
      SHELTER_SECURED: 'AFTERMATH_START',
      AFTERMATH_START: 'TOWER_REVEAL',
      TOWER_REVEAL: 'WORLD_COLLAPSE',
      WORLD_COLLAPSE: 'PLANETARY_COLLISION',
      PLANETARY_COLLISION: 'FINAL_SINGULARITY',
      FINAL_SINGULARITY: 'COSMIC_LIGHT_EVENT',
      COSMIC_LIGHT_EVENT: 'SILENCE',
      SILENCE: 'TOWER_REVEAL_RETURN',
      TOWER_REVEAL_RETURN: 'SHIP_FINAL_SHOT',
      SHIP_FINAL_SHOT: 'SURVIVAL_RESULTS',
      SURVIVAL_RESULTS: 'RESULTS',
      RESULTS: 'RESULTS_COMPLETE',
      // backward-compatible fallbacks
      FLASHBANG: 'SILENCE',
      FINAL_SINGULARITY_COLLAPSE: 'COSMIC_LIGHT_EVENT',
      AFTERMATH_REVEAL: 'TOWER_REVEAL_RETURN',
      CINEMATIC_END: 'RESULTS',
      RESULTS_INTRO: 'RESULTS',
      RESULTS_STATS: 'RESULTS',
      REWARD_SEQUENCE: 'RESULTS',
      AFTERMATH_CINEMATIC: 'TOWER_REVEAL',
      AFTERMATH: 'RESULTS',
      REBUILDING_MAP: 'RESULTS',
    };
    const nextEvent = next[this.event];
    if (!nextEvent) {
      if (this.event !== 'RESULTS_COMPLETE' && this.event !== 'RESULTS' && this.event !== 'SURVIVAL_RESULTS') {
        this.cameraOverride = false;
        this.gameplayLocked = false;
      }
      return;
    }
    this.start(nextEvent);
    // Playable states keep full camera and movement only if ship is not yet parked
    const isParked = this.parkingTelemetry?.isParked || this.parkingTelemetry?.isSecured;
    if (!isParked && ['SPAGHETTIFICATION', 'PLANETARY_COLLISION', 'DESTRUCTION_FRONT', 'EVACUATION', 'TOWER_APPROACH', 'BASEMENT_ENTRY', 'BASEMENT_DESCENT', 'HANGAR_ENTRY', 'PARKING_APPROACH', 'PARKING_ALIGNMENT'].includes(nextEvent)) {
      this.cameraOverride = false;
      this.gameplayLocked = false;
    }
  }

  public parkingTelemetry: ParkingTelemetry | null = null;
  public towerApproachTelemetry: TowerApproachTelemetry | null = null;
  public finalCollapseStats: FinalCollapseStats | null = null;

  public setParkingTelemetry(telemetry: ParkingTelemetry | null): void {
    this.parkingTelemetry = telemetry;
  }

  public setTowerApproachTelemetry(telemetry: TowerApproachTelemetry | null): void {
    this.towerApproachTelemetry = telemetry;
  }

  public setFinalCollapseStats(stats: FinalCollapseStats | null): void {
    this.finalCollapseStats = stats;
  }

  public setDestructionFrontDistance(distance: number | null): void {
    this.destructionFrontDistance = distance === null ? null : Math.max(0, distance);
  }

  public setObjective(objective: string | null): void {
    this.objective = objective;
  }

  public setDangerState(state: BlackHoleDangerState): void { this.danger = state; }

  public triggerDanger(): void {
    const next: Record<BlackHoleDangerState, BlackHoleDangerState> = {
      SAFE: 'WARNING', WARNING: 'DANGER', DANGER: 'CRITICAL', CRITICAL: 'COLLAPSE', COLLAPSE: 'COLLAPSE',
    };
    this.danger = next[this.danger];
  }

  public activateEscapeRoute(): void {
    this.escapeRouteActive = true;
    this.objective = 'REACH THE SAFE ZONE';
    this.start('EVACUATION');
    this.danger = 'CRITICAL';
    this.cameraOverride = false;
    this.gameplayLocked = false;
  }

  public completeEscape(): void {
    this.escapeRouteActive = false;
    this.objective = 'SAFE ZONE SECURED';
    this.start('TOWER_SEALING');
    this.danger = 'SAFE';
  }

  public startFinalCollapse(): void {
    this.escapeRouteActive = false;
    this.objective = 'SHELTER SEALED';
    this.start('FINAL_COLLAPSE');
    this.danger = 'COLLAPSE';
  }

  private evacuationTelemetry: EvacuationTelemetry | null = null;

  public setEvacuationTelemetry(telem: EvacuationTelemetry): void {
    this.evacuationTelemetry = telem;
  }

  public isEventComplete(): boolean { return this.completed; }

  public getTelemetry(): BlackHoleCinematicTelemetry {
    const duration = EVENT_DURATIONS[this.event] || 0;
    return {
      event: this.event,
      state: this.getExplicitState(),
      danger: this.danger,
      elapsed: this.elapsed,
      eventElapsed: this.eventElapsed,
      progress: duration > 0 ? Math.min(1, this.eventElapsed / duration) : 0,
      cameraOverride: this.cameraOverride,
      gameplayLocked: this.gameplayLocked,
      title: this.getTitle(),
      subtitle: this.getSubtitle(),
      warning: this.getWarning(),
      finalCountdown: this.finalCountdownSeconds,
      escapeRouteActive: this.escapeRouteActive,
      trackCollapseProgress: this.trackCollapseProgress,
      destructionFrontDistance: this.destructionFrontDistance,
      objective: this.objective,
      submode: this.finalCountdownSeconds !== null ? 'FINAL_COLLAPSE' : null,
      finalCollapseStage: this.finalCollapseStage,
      finalCollapseStageElapsed: this.finalCollapseStageElapsed,
      parking: this.parkingTelemetry ?? undefined,
      towerApproach: this.towerApproachTelemetry ?? undefined,
      stats: this.finalCollapseStats ?? undefined,
      evacuation: this.evacuationTelemetry ?? undefined,
    };
  }

  public getExplicitState(): FinalCollapseState {
    const map: Partial<Record<BlackHoleCinematicEvent, FinalCollapseState>> = {
      NONE: 'NORMAL_RACE',
      INTRO: 'NORMAL_RACE',
      PRE_RACE: 'NORMAL_RACE',
      FINAL_SINGULARITY_WARNING: 'SINGULARITY_ACTIVATION',
      TRACK_COLLAPSE: 'TRACK_COLLAPSE',
      SPAGHETTIFICATION: 'TRACK_COLLAPSE',
      PLANETARY_COLLISION: 'TRACK_COLLAPSE',
      DESTRUCTION_FRONT: 'EVACUATION',
      EVACUATION: 'EVACUATION',
      TOWER_APPROACH: 'TOWER_APPROACH',
      BASEMENT_ENTRY: 'BASEMENT_ENTRY',
      BASEMENT_DESCENT: 'BASEMENT_DESCENT',
      HANGAR_ENTRY: 'HANGAR_ENTRY',
      PARKING_APPROACH: 'PARKING_APPROACH',
      PARKING_ALIGNMENT: 'PARKING_ALIGNMENT',
      SHIP_PARKING: 'SHIP_PARKING',
      PARKING_CLAMPS: 'PARKING_CLAMPS',
      SHIP_SECURED: 'SHIP_SECURED',
      SHELTER_SEALING: 'SHELTER_SEALING',
      SHELTER_SECURED: 'SHELTER_SECURED',
      AFTERMATH_START: 'AFTERMATH_START',
      TOWER_REVEAL: 'TOWER_REVEAL',
      WORLD_COLLAPSE: 'WORLD_COLLAPSE',
      FINAL_SINGULARITY: 'FINAL_SINGULARITY',
      COSMIC_LIGHT_EVENT: 'COSMIC_LIGHT_EVENT',
      SILENCE: 'SILENCE',
      AFTERMATH_REVEAL: 'AFTERMATH_REVEAL',
      TOWER_REVEAL_RETURN: 'TOWER_REVEAL_RETURN',
      SHIP_FINAL_SHOT: 'SHIP_FINAL_SHOT',
      CINEMATIC_END: 'CINEMATIC_END',
      RESULTS_INTRO: 'RESULTS_INTRO',
      RESULTS_STATS: 'RESULTS_STATS',
      REWARD_SEQUENCE: 'REWARD_SEQUENCE',
      RESULTS_COMPLETE: 'RESULTS_COMPLETE',
      AFTERMATH_CINEMATIC: 'AFTERMATH_CINEMATIC',
      FINAL_SINGULARITY_COLLAPSE: 'FINAL_SINGULARITY_COLLAPSE',
      SURVIVAL_RESULTS: 'SURVIVAL_RESULTS',
      TOWER_ENTRY: 'BASEMENT_ENTRY',
      TOWER_SEALING: 'SHELTER_SECURED',
      FINAL_COLLAPSE: 'FINAL_SINGULARITY',
      FLASHBANG: 'COSMIC_LIGHT_EVENT',
      REBUILDING_MAP: 'RESULTS_COMPLETE',
      RESULTS: 'RESULTS_COMPLETE',
    };
    return map[this.event] || 'NORMAL_RACE';
  }

  private getTitle(): string {
    if (this.event === 'FINAL_SINGULARITY') {
      return this.eventElapsed < 3.0 ? 'SINGULARITY CRITICAL' : 'FINAL COLLAPSE';
    }

    const titles: Record<BlackHoleCinematicEvent, string> = {
      NONE: 'QUANTUM LAUNCH PRO', INTRO: 'MODE 21 — BLACK HOLE', PRE_RACE: 'QUANTUM LAUNCH PRO',
      BLACK_HOLE_REVEAL: 'SINGULARITY DETECTED', DANGER_EVENT: 'GRAVITY ANOMALY',
      TRACK_COLLAPSE: 'TRACK COLLAPSE', GRAVITY_EVENT: 'GRAVITATIONAL SURGE',
      ESCAPE_SEQUENCE: 'EMERGENCY ESCAPE', FINAL_SINGULARITY_WARNING: 'SINGULARITY FAILURE',
      SPAGHETTIFICATION: 'SPAGHETTIFICATION DETECTED', PLANETARY_COLLISION: 'PLANETARY COLLISION',
      DESTRUCTION_FRONT: 'DESTRUCTION FRONT', EVACUATION: 'EMERGENCY EVACUATION',
      TOWER_APPROACH: 'SAFE ZONE REACHED', BASEMENT_ENTRY: 'EVACUATION IN PROGRESS',
      BASEMENT_DESCENT: 'DESCENDING TO LEVEL B3', HANGAR_ENTRY: 'EVACUATION HANGAR B3',
      PARKING_APPROACH: 'EVACUATION BAY 07', PARKING_ALIGNMENT: 'ALIGNMENT CONFIRMED',
      SHIP_PARKING: 'SHIP PARKED', PARKING_CLAMPS: 'LOCKING PARKING CLAMPS',
      SHIP_SECURED: 'SHIP SECURED', SHELTER_SEALING: 'EVACUATION SHELTER CLOSING',
      SHELTER_SECURED: 'SHELTER SEALED', AFTERMATH_START: 'SAFE ZONE SECURED',
      TOWER_REVEAL: 'TOWER EXTERIOR', WORLD_COLLAPSE: 'THE COSMIC COLLAPSE',
      FINAL_SINGULARITY: 'SINGULARITY CRITICAL', COSMIC_LIGHT_EVENT: 'SINGULARITY DETONATION',
      SILENCE: 'ATMOSPHERIC SILENCE', AFTERMATH_REVEAL: 'THE SINGULARITY HAS COLLAPSED',
      TOWER_REVEAL_RETURN: 'RETURNING TO SHELTER', SHIP_FINAL_SHOT: 'SHIP STATUS: SECURE',
      CINEMATIC_END: 'THE SINGULARITY HAS COLLAPSED', RESULTS_INTRO: 'MISSION COMPLETE',
      RESULTS_STATS: 'SURVIVAL TELEMETRY', REWARD_SEQUENCE: 'REWARDS UNLOCKED',
      RESULTS_COMPLETE: 'FINAL COLLAPSE COMPLETE',
      AFTERMATH_CINEMATIC: 'THE COSMIC CATASTROPHE', FINAL_SINGULARITY_COLLAPSE: 'FINAL COLLAPSE',
      SURVIVAL_RESULTS: 'YOU SURVIVED THE FINAL COLLAPSE',
      TOWER_ENTRY: 'EMERGENCY SHELTER', TOWER_SEALING: 'SAFE ZONE SEALED',
      SHELTER_SEALED: 'SHELTER SEALED',
      FINAL_COLLAPSE: 'THE FINAL COLLAPSE', FINAL_FLASH: 'SINGULARITY COLLAPSE',
      FLASHBANG: 'SINGULARITY DETONATION', REBUILDING_MAP: 'REBUILDING MAP...',
      AFTERMATH: 'THE SINGULARITY HAS COLLAPSED',
      RESULTS: 'YOU SURVIVED THE FINAL COLLAPSE',
    };
    return titles[this.event] || 'THE FINAL COLLAPSE';
  }

  private getSubtitle(): string {
    if (this.event === 'FINAL_SINGULARITY') {
      return this.eventElapsed < 3.0
        ? 'Relativistic accretion disk acceleration detected'
        : 'Spacetime metric collapsing inward — all matter falling into the void';
    }

    const subtitles: Partial<Record<BlackHoleCinematicEvent, string>> = {
      BLACK_HOLE_REVEAL: 'Event horizon locked. Accretion field expanding.',
      TRACK_COLLAPSE: 'Route integrity failing. Find the safe corridor.',
      GRAVITY_EVENT: 'Tidal forces rising. Maintain control.',
      ESCAPE_SEQUENCE: 'Evacuation route active. Reach the tower.',
      FINAL_SINGULARITY_WARNING: 'CRITICAL GRAVITATIONAL INSTABILITY',
      SPAGHETTIFICATION: 'EXTREME TIDAL FORCES',
      PLANETARY_COLLISION: 'Distant planetary collision detected.',
      DESTRUCTION_FRONT: 'The world behind you is being erased.',
      EVACUATION: 'SAFE ZONE DETECTED — REACH THE TOWER',
      TOWER_APPROACH: 'EVACUATION TOWER AHEAD — APPROACH SLOWLY',
      BASEMENT_ENTRY: 'Blast doors disengaging. Welcome to emergency facility.',
      BASEMENT_DESCENT: 'Environmental shielding engaged. External hazards muffled.',
      HANGAR_ENTRY: 'Subterranean hangar chamber online. Follow guidance lights.',
      PARKING_APPROACH: 'ALIGN SHIP WITH PARKING MARKER (BAY 07)',
      PARKING_ALIGNMENT: 'REDUCE SPEED // DOCKING IN PROGRESS',
      SHIP_PARKING: 'Controlled deceleration engaged. Velocity zero.',
      PARKING_CLAMPS: 'Hydraulic clamps engaging left, right, front, rear.',
      SHIP_SECURED: 'EVACUATION STATUS // SHIP: SECURED // SHELTER: ACTIVE',
      SHELTER_SEALING: 'Emergency lights active. Outer blast doors closing.',
      SHELTER_SECURED: 'PLAYER STATUS: SAFE // 100% INVULNERABLE',
      SHELTER_SEALED: 'PLAYER STATUS: SAFE // 100% INVULNERABLE',
      AFTERMATH_START: 'Spaceship securely docked inside Bay 07.',
      TOWER_REVEAL: 'Observation cameras online. Ascending from basement to tower exterior.',
      WORLD_COLLAPSE: 'Planetary collision & route disintegration outside the shelter.',
      FINAL_SINGULARITY: 'Accretion disk accelerating to relativistic speeds.',
      COSMIC_LIGHT_EVENT: 'Cosmic energy shockwave detonation. Blinding whiteout.',
      SILENCE: 'Gravitational shockwave dissipated. Distant rumbling.',
      AFTERMATH_REVEAL: 'The surrounding universe has collapsed. Tower survived.',
      TOWER_REVEAL_RETURN: 'Sensors tracking back to lone evacuation shelter in cosmic void.',
      SHIP_FINAL_SHOT: 'Camera returns inside evacuation hangar // Spaceship clamped and safe.',
      CINEMATIC_END: 'THE RACE IS OVER // YOU SURVIVED',
      RESULTS_INTRO: 'Recording flight telemetry...',
      RESULTS_STATS: 'Compiling mission statistics...',
      REWARD_SEQUENCE: 'Survival bonus awarded.',
      RESULTS_COMPLETE: 'Evacuation confirmed.',
      AFTERMATH_CINEMATIC: 'External cosmic structures disintegrating outside.',
      FINAL_SINGULARITY_COLLAPSE: 'Singularity reaches maximum gravitational instability.',
      SURVIVAL_RESULTS: 'SURVIVAL CONFIRMED // EVACUATION SUCCESSFUL // PILOT STATUS: ALIVE',
      TOWER_ENTRY: 'ENTER BASEMENT',
      TOWER_SEALING: 'SEALING PROCEDURE',
      FINAL_COLLAPSE: 'External environment critical. Shelter sealed.',
      FINAL_FLASH: 'Maximum singularity instability.',
      FLASHBANG: 'Singularity detonation shockwave. Blinding whiteout.',
      REBUILDING_MAP: 'Reconstructing orbital topography and spacetime grid.',
      AFTERMATH: 'The surrounding planetary system has collapsed.',
      RESULTS: 'You survived the final singularity collapse. Evacuation confirmed.',
    };
    return subtitles[this.event] ?? '';
  }

  private getWarning(): string | null {
    const warnings: Partial<Record<BlackHoleDangerState, string>> = {
      WARNING: 'GRAVITY DISTORTION DETECTED',
      DANGER: 'DANGER — GRAVITY FIELD INTENSIFYING',
      CRITICAL: 'CRITICAL — ESCAPE ROUTE REQUIRED',
      COLLAPSE: 'COLLAPSE — TRACK INTEGRITY FAILING',
    };
    return warnings[this.danger] ?? null;
  }

  public dispose(): void { this.stop(); }
}
