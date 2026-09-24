import { ModeIntroConfig } from './cinematicTypes';
import { CinematicCamera } from './cinematicCamera';
import { sound } from '../audio';

export type CountdownTickCallback = (count: number) => void;

export class CountdownManager {
  private config: ModeIntroConfig;
  private cinematicCamera: CinematicCamera;
  private currentCount: number | null = null;
  private timer: number = 0;
  private tickInterval: number = 1.0;
  private isRunning: boolean = false;
  private isFinished: boolean = false;
  private onTickCallback?: CountdownTickCallback;

  constructor(config: ModeIntroConfig, cinematicCamera: CinematicCamera) {
    this.config = config;
    this.cinematicCamera = cinematicCamera;
  }

  public start(onTick?: CountdownTickCallback) {
    this.onTickCallback = onTick;
    this.isRunning = true;
    this.isFinished = false;
    this.timer = 0;
    this.setCount(3);
  }

  private setCount(val: number) {
    this.currentCount = val;
    this.cinematicCamera.triggerShake(val === 0 ? 0.6 : 0.2);

    if (val > 0) {
      sound.playCountdownBeep?.(false);
    } else if (val === 0) {
      sound.playCountdownGo?.();
    }

    if (this.onTickCallback) {
      this.onTickCallback(val);
    }
  }

  public update(dt: number): { isComplete: boolean; currentCount: number | null } {
    if (!this.isRunning || this.isFinished) {
      return { isComplete: this.isFinished, currentCount: this.currentCount };
    }

    this.timer += dt;

    if (this.currentCount === 3 && this.timer >= 1.0) {
      this.setCount(2);
    } else if (this.currentCount === 2 && this.timer >= 2.0) {
      this.setCount(1);
    } else if (this.currentCount === 1 && this.timer >= 3.0) {
      this.setCount(0); // GO!
      this.isRunning = false;
      this.isFinished = true;
    }

    return {
      isComplete: this.isFinished,
      currentCount: this.currentCount,
    };
  }

  public syncFromNetwork(count: number) {
    this.currentCount = count;
    if (this.onTickCallback) {
      this.onTickCallback(count);
    }
    if (count === 0) {
      this.isRunning = false;
      this.isFinished = true;
      sound.playCountdownGo?.();
    } else {
      sound.playCountdownBeep?.(false);
    }
  }

  public reset() {
    this.isRunning = false;
    this.isFinished = false;
    this.currentCount = null;
    this.timer = 0;
  }

  public getCurrentCount(): number | null {
    return this.currentCount;
  }
}
