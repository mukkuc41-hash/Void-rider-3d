import * as THREE from 'three';
import { ModeIntroConfig } from './cinematicTypes';
import { CinematicCamera } from './cinematicCamera';
import { StartingGridManager } from './startingGridManager';
import { sound } from '../audio';

export class RaceStartManager {
  private config: ModeIntroConfig;
  private cinematicCamera: CinematicCamera;
  private startingGridManager: StartingGridManager;
  private launchElapsed: number = 0;
  private isLaunched: boolean = false;
  private isTransitionComplete: boolean = false;

  constructor(
    config: ModeIntroConfig,
    cinematicCamera: CinematicCamera,
    startingGridManager: StartingGridManager
  ) {
    this.config = config;
    this.cinematicCamera = cinematicCamera;
    this.startingGridManager = startingGridManager;
  }

  public triggerLaunch() {
    this.isLaunched = true;
    this.launchElapsed = 0;
    this.isTransitionComplete = false;

    // 1. Physically react starting gate
    this.startingGridManager.openGate(this.config.launchAnimation.gateReaction);

    // 2. Camera FOV punch
    this.cinematicCamera.setFovPunch(this.config.launchAnimation.fovPunch);
    this.cinematicCamera.triggerShake(0.8);

    // 3. Audio burst
    sound.playThrusterIgnition?.();
    sound.startEngine?.();

    // 4. Start blending to gameplay follow camera
    this.cinematicCamera.startBlendToGameplay(1.0);
  }

  public update(
    dt: number,
    gameplayCamPos: THREE.Vector3,
    gameplayLookAt: THREE.Vector3,
    gameplayFov: number = 60
  ): { isTransitionComplete: boolean; launchProgress: number } {
    if (!this.isLaunched) {
      return { isTransitionComplete: false, launchProgress: 0 };
    }

    this.launchElapsed += dt;
    const progress = Math.min(1.0, this.launchElapsed / this.config.launchAnimation.boostDuration);

    const blendDone = this.cinematicCamera.update(dt, gameplayCamPos, gameplayLookAt, gameplayFov);
    if (blendDone && progress >= 1.0) {
      this.isTransitionComplete = true;
    }

    return {
      isTransitionComplete: this.isTransitionComplete,
      launchProgress: progress,
    };
  }

  public reset() {
    this.isLaunched = false;
    this.launchElapsed = 0;
    this.isTransitionComplete = false;
  }
}
