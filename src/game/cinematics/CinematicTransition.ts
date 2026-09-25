export interface CinematicTransitionState {
  isTransitioning: boolean;
  progress: number;
  durationSec: number;
  elapsedSec: number;
  fromShot: string;
  toShot: string;
}

export class CinematicTransition {
  private state: CinematicTransitionState = {
    isTransitioning: false,
    progress: 1.0,
    durationSec: 0.5,
    elapsedSec: 0.5,
    fromShot: '',
    toShot: '',
  };

  public start(fromShot: string, toShot: string, durationSec: number = 0.5) {
    this.state = {
      isTransitioning: true,
      progress: 0.0,
      durationSec,
      elapsedSec: 0.0,
      fromShot,
      toShot,
    };
  }

  public update(dt: number): boolean {
    if (!this.state.isTransitioning) return false;
    this.state.elapsedSec += dt;
    this.state.progress = Math.min(1.0, this.state.elapsedSec / Math.max(0.01, this.state.durationSec));
    if (this.state.progress >= 1.0) {
      this.state.isTransitioning = false;
    }
    return this.state.isTransitioning;
  }

  public getProgress(): number {
    return this.state.progress;
  }

  public isActive(): boolean {
    return this.state.isTransitioning;
  }
}
