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
  FINAL_SINGULARITY: 12,
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
  public finalCountdownSeconds: number | null = null;
  public readonly blackHoleCenter: THREE.Vector3;

  private finalCountdownInitial = 300;
  private completed = false;

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
    this.cameraOverride = ['INTRO', 'PRE_RACE', 'BLACK_HOLE_REVEAL', 'FINAL_SINGULARITY', 'RESULTS'].includes(event);
    this.gameplayLocked = ['INTRO', 'PRE_RACE', 'FINAL_SINGULARITY'].includes(event);
    if (event === 'ESCAPE_SEQUENCE') this.escapeRouteActive = true;
    if (event === 'TRACK_COLLAPSE' || event === 'FINAL_SINGULARITY') this.danger = 'COLLAPSE';
    if (event === 'FINAL_SINGULARITY') {
      this.finalCountdownSeconds = this.finalCountdownInitial;
      this.trackCollapseProgress = 0;
    }
  }

  public stop(): void {
    this.event = 'NONE';
    this.eventElapsed = 0;
    this.cameraOverride = false;
    this.gameplayLocked = false;
    this.completed = true;
  }

  /** Starts the exact 05:00 countdown used by submode 10. */
  public startFinalFiveMinuteCountdown(): void {
    this.finalCountdownSeconds = this.finalCountdownInitial;
    this.event = 'NONE';
    this.eventElapsed = 0;
    this.danger = 'SAFE';
    this.trackCollapseProgress = 0;
    this.completed = false;
  }

  /** Presentation update only; the existing race loop remains authoritative. */
  public update(dt: number): BlackHoleCinematicTelemetry {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsed += delta;
    this.eventElapsed += delta;

    if (this.finalCountdownSeconds !== null) {
      this.finalCountdownSeconds = Math.max(0, this.finalCountdownSeconds - delta);
      if (this.finalCountdownSeconds <= 0 && this.event === 'NONE') {
        this.start('FINAL_SINGULARITY');
      }
    }

    if (this.event === 'TRACK_COLLAPSE' || this.event === 'FINAL_SINGULARITY') {
      const duration = EVENT_DURATIONS[this.event] || EVENT_DURATIONS.FINAL_SINGULARITY;
      this.trackCollapseProgress = Math.min(1, this.eventElapsed / duration);
    }

    const duration = EVENT_DURATIONS[this.event] || 0;
    if (duration > 0 && this.eventElapsed >= duration) {
      this.completed = true;
      if (this.event !== 'FINAL_SINGULARITY') {
        this.cameraOverride = false;
        this.gameplayLocked = false;
      }
    }
    return this.getTelemetry();
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
    this.start('ESCAPE_SEQUENCE');
    this.danger = 'CRITICAL';
  }

  public completeEscape(): void {
    this.escapeRouteActive = false;
    this.start('RESULTS');
    this.danger = 'SAFE';
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
    };
  }

  private getTitle(): string {
    const titles: Record<BlackHoleCinematicEvent, string> = {
      NONE: 'QUANTUM LAUNCH PRO', INTRO: 'MODE 21 — BLACK HOLE', PRE_RACE: 'QUANTUM LAUNCH PRO',
      BLACK_HOLE_REVEAL: 'SINGULARITY DETECTED', DANGER_EVENT: 'GRAVITY ANOMALY',
      TRACK_COLLAPSE: 'TRACK COLLAPSE', GRAVITY_EVENT: 'GRAVITATIONAL SURGE',
      ESCAPE_SEQUENCE: 'EMERGENCY ESCAPE', FINAL_SINGULARITY: 'THE FINAL SINGULARITY',
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
      FINAL_SINGULARITY: 'Five minutes are over. Escape before the route disappears.',
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
