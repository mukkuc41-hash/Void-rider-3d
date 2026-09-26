import * as THREE from 'three';
import { GameMode } from '../../types';

export interface RaceStartSequenceCallbacks {
  onControlsUnlocked?: () => void;
  onAIAccelerationActive?: () => void;
  onOfficialTimerStart?: () => void;
  onStartingGateOpen?: () => void;
  onLaunchEffects?: () => void;
  onFovKick?: (amount: number) => void;
}

export class RaceStartSequence {
  private mode: GameMode;
  private isReleased: boolean = false;
  private callbacks: RaceStartSequenceCallbacks = {};

  // Gate animation
  private startingEnergyBarrier: THREE.Mesh | null = null;
  private barrierFadeProgress: number = 0;
  private isBarrierFading: boolean = false;

  constructor(mode: GameMode, callbacks?: RaceStartSequenceCallbacks) {
    this.mode = mode;
    if (callbacks) this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: RaceStartSequenceCallbacks) {
    this.callbacks = callbacks;
  }

  public setStartingBarrierMesh(mesh: THREE.Mesh | null) {
    this.startingEnergyBarrier = mesh;
  }

  /**
   * 48.9 GREEN LIGHT: The unified synchronized release event
   */
  public executeGreenRelease() {
    if (this.isReleased) return;
    this.isReleased = true;

    // 1. Unlock player controls
    this.callbacks.onControlsUnlocked?.();

    // 2. Activate AI acceleration
    this.callbacks.onAIAccelerationActive?.();

    // 3. Start official monotonic race timer
    this.callbacks.onOfficialTimerStart?.();

    // 4. Open starting gate & barrier
    this.isBarrierFading = true;
    this.barrierFadeProgress = 0;
    this.callbacks.onStartingGateOpen?.();

    // 5. Trigger launch engine & particle burst
    this.callbacks.onLaunchEffects?.();

    // 6. Camera FOV punch / kick (e.g. 8-12 degrees kick that smoothly relaxes)
    this.callbacks.onFovKick?.(9.0);
  }

  public update(dt: number) {
    // Fade out and remove starting energy barrier on GREEN
    if (this.isBarrierFading && this.startingEnergyBarrier) {
      this.barrierFadeProgress += dt * 3.5;
      const alpha = Math.max(0, 0.35 * (1.0 - this.barrierFadeProgress));
      const mat = this.startingEnergyBarrier.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = alpha;
      }
      if (this.barrierFadeProgress >= 1.0) {
        this.startingEnergyBarrier.visible = false;
        this.isBarrierFading = false;
      }
    }
  }

  public reset() {
    this.isReleased = false;
    this.barrierFadeProgress = 0;
    this.isBarrierFading = false;
    if (this.startingEnergyBarrier) {
      this.startingEnergyBarrier.visible = true;
      const mat = this.startingEnergyBarrier.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.35;
      }
    }
  }

  public getIsReleased(): boolean {
    return this.isReleased;
  }
}
