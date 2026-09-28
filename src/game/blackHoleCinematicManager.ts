import * as THREE from 'three';

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
  | 'TOWER_ENTRY'
  | 'TOWER_SEALING'
  | 'FINAL_COLLAPSE'
  | 'FINAL_FLASH'
  | 'AFTERMATH'
  | 'FINAL_SINGULARITY'
  | 'RESULTS';

export type BlackHoleDangerState =
  | 'SAFE'
  | 'WARNING'
  | 'DANGER'
  | 'CRITICAL'
  | 'COLLAPSE';

export interface BlackHoleCinematicTelemetry {
  event: BlackHoleCinematicEvent;
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
  FINAL_SINGULARITY_WARNING: 4,
  SPAGHETTIFICATION: 7,
  PLANETARY_COLLISION: 6,
  DESTRUCTION_FRONT: 10,
  EVACUATION: 8,
  TOWER_ENTRY: 12,
  TOWER_SEALING: 10,
  FINAL_COLLAPSE: 18,
  FINAL_FLASH: 4,
  AFTERMATH: 6,
  FINAL_SINGULARITY: 18,
  RESULTS: 5,
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

  private finalCountdownInitial = 420;
  private completed = false;

  /** Final Collapse 7-minute stage state. */
  public finalCollapseStage = 0;
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
    this.cameraOverride = [
      'INTRO', 'PRE_RACE', 'BLACK_HOLE_REVEAL', 'FINAL_SINGULARITY_WARNING',
      'PLANETARY_COLLISION', 'TOWER_SEALING', 'FINAL_COLLAPSE',
      'FINAL_FLASH', 'AFTERMATH', 'RESULTS',
    ].includes(event);

    // The Final Collapse is a survival race. Only short presentation beats
    // lock control; the actual collapse and escape remain fully playable.
    this.gameplayLocked = ['INTRO', 'PRE_RACE', 'FINAL_SINGULARITY_WARNING'].includes(event);

    if ([
      'TRACK_COLLAPSE', 'GRAVITY_EVENT', 'SPAGHETTIFICATION', 'DESTRUCTION_FRONT',
      'EVACUATION', 'TOWER_ENTRY', 'TOWER_SEALING', 'FINAL_COLLAPSE', 'FINAL_FLASH',
      'FINAL_SINGULARITY',
    ].includes(event)) {
      this.danger = 'COLLAPSE';
    }

    if (event === 'FINAL_SINGULARITY' || event === 'FINAL_SINGULARITY_WARNING') {
      this.trackCollapseProgress = 0;
    }
    if (event === 'EVACUATION' || event === 'TOWER_ENTRY') {
      this.escapeRouteActive = true;
      this.objective = 'REACH THE SAFE ZONE';
    }
    if (event === 'TOWER_SEALING') {
      this.objective = 'ENTER THE BASEMENT';
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
  }

  /** Starts the exact 07:00 countdown used by submode 10. */
  public startFinalFiveMinuteCountdown(): void {
    this.finalCountdownSeconds = this.finalCountdownInitial;
    this.event = 'NONE';
    this.eventElapsed = 0;
    this.danger = 'SAFE';
    this.trackCollapseProgress = 0;
    this.destructionFrontDistance = null;
    this.objective = null;
    this.escapeRouteActive = false;
    this.completed = false;
    this.finalCollapseStage = 1;
    this.finalCollapseStageElapsed = 0;
  }

  /** Presentation/event update; the existing race loop remains authoritative. */
  public update(dt: number): BlackHoleCinematicTelemetry {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsed += delta;
    this.eventElapsed += delta;

    if (this.finalCountdownSeconds !== null && this.finalCountdownSeconds > 0) {
      this.finalCountdownSeconds = Math.max(0, this.finalCountdownSeconds - delta);
      this.finalCollapseStageElapsed += delta;

      // Submode 10 uses absolute survival-time thresholds so every physical
      // system can stay synchronized with the same seven-minute clock.
      const remaining = this.finalCountdownSeconds;

      if (remaining <= 0) {
        // 00:00 = final explosion trigger. Do not end the race here;
        // GameEngine/FinalCollapseManager handles the physical collapse.
        if (this.finalCollapseStage !== 6) {
          this.finalCollapseStage = 6;
          this.finalCollapseStageElapsed = 0;
          this.start('FINAL_COLLAPSE');
        }
      } else {
        const nextStage =
          remaining <= 60 ? 5 :
          remaining <= 120 ? 4 :
          remaining <= 300 ? 3 :
          remaining <= 360 ? 2 :
          1;

        if (nextStage !== this.finalCollapseStage) {
          this.finalCollapseStage = nextStage;
          this.finalCollapseStageElapsed = 0;

          const stageEvent: Record<number, BlackHoleCinematicEvent> = {
            1: 'DANGER_EVENT',
            2: 'GRAVITY_EVENT',
            3: 'SPAGHETTIFICATION',
            4: 'DESTRUCTION_FRONT',
            5: 'EVACUATION',
          };

          const nextEvent = stageEvent[nextStage];
          if (nextEvent) {
            this.start(nextEvent);
            // These are playable survival stages; only short warning beats
            // should lock control.
            this.cameraOverride = false;
            this.gameplayLocked = false;
          }
        }
      }
    }

    if (['TRACK_COLLAPSE', 'SPAGHETTIFICATION', 'DESTRUCTION_FRONT', 'FINAL_COLLAPSE', 'FINAL_SINGULARITY'].includes(this.event)) {
      const duration = EVENT_DURATIONS[this.event] || EVENT_DURATIONS.FINAL_COLLAPSE;
      this.trackCollapseProgress = Math.min(1, this.eventElapsed / duration);
    }

    if (this.event === 'DESTRUCTION_FRONT') {
      this.destructionFrontDistance = Math.max(0, 2500 - this.eventElapsed * 95);
    }

    const duration = EVENT_DURATIONS[this.event] || 0;
    if (duration > 0 && this.eventElapsed >= duration) {
      this.completed = true;
      this.advanceAutomaticEvent();
    }

    return this.getTelemetry();
  }

  private advanceAutomaticEvent(): void {
    const next: Partial<Record<BlackHoleCinematicEvent, BlackHoleCinematicEvent>> = {
      FINAL_SINGULARITY_WARNING: 'SPAGHETTIFICATION',
      SPAGHETTIFICATION: 'PLANETARY_COLLISION',
      PLANETARY_COLLISION: 'DESTRUCTION_FRONT',
      DESTRUCTION_FRONT: 'EVACUATION',
      FINAL_COLLAPSE: 'FINAL_FLASH',
      FINAL_FLASH: 'AFTERMATH',
      AFTERMATH: 'RESULTS',
    };
    const nextEvent = next[this.event];
    if (!nextEvent) {
      if (this.event !== 'RESULTS') {
        this.cameraOverride = false;
        this.gameplayLocked = false;
      }
      return;
    }
    this.start(nextEvent);
    if (['SPAGHETTIFICATION', 'PLANETARY_COLLISION', 'DESTRUCTION_FRONT', 'EVACUATION'].includes(nextEvent)) {
      this.cameraOverride = false;
      this.gameplayLocked = false;
    }
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

  public isEventComplete(): boolean { return this.completed; }

  public getTelemetry(): BlackHoleCinematicTelemetry {
    const duration = EVENT_DURATIONS[this.event] || 0;
    return {
      event: this.event,
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
    };
  }

  private getTitle(): string {
    const titles: Record<BlackHoleCinematicEvent, string> = {
      NONE: 'QUANTUM LAUNCH PRO', INTRO: 'MODE 21 — BLACK HOLE', PRE_RACE: 'QUANTUM LAUNCH PRO',
      BLACK_HOLE_REVEAL: 'SINGULARITY DETECTED', DANGER_EVENT: 'GRAVITY ANOMALY',
      TRACK_COLLAPSE: 'TRACK COLLAPSE', GRAVITY_EVENT: 'GRAVITATIONAL SURGE',
      ESCAPE_SEQUENCE: 'EMERGENCY ESCAPE', FINAL_SINGULARITY_WARNING: 'SINGULARITY FAILURE',
      SPAGHETTIFICATION: 'SPAGHETTIFICATION DETECTED', PLANETARY_COLLISION: 'PLANETARY COLLISION',
      DESTRUCTION_FRONT: 'DESTRUCTION FRONT', EVACUATION: 'EMERGENCY EVACUATION',
      TOWER_ENTRY: 'EMERGENCY SHELTER', TOWER_SEALING: 'SAFE ZONE SEALED',
      FINAL_COLLAPSE: 'THE FINAL COLLAPSE', FINAL_FLASH: 'SINGULARITY COLLAPSE',
      AFTERMATH: 'THE SINGULARITY HAS COLLAPSED', FINAL_SINGULARITY: 'THE FINAL COLLAPSE',
      RESULTS: 'YOU SURVIVED THE SINGULARITY',
    };
    return titles[this.event];
  }

  private getSubtitle(): string {
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
      TOWER_ENTRY: 'ENTER BASEMENT',
      TOWER_SEALING: 'SEALING PROCEDURE',
      FINAL_COLLAPSE: 'External environment critical. Shelter sealed.',
      FINAL_FLASH: 'Maximum singularity instability.',
      AFTERMATH: 'The surrounding planetary system has collapsed.',
      FINAL_SINGULARITY: 'Seven minutes are over. The final collapse begins.',
      RESULTS: 'Final escape confirmed. Race results incoming.',
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
