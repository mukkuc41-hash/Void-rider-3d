import * as THREE from 'three';

export interface CameraCut {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  lookAtStart: THREE.Vector3;
  lookAtEnd: THREE.Vector3;
  fovStart: number;
  fovEnd: number;
  durationSec: number;
}

export class CinematicCamera {
  private camera: THREE.PerspectiveCamera;
  private currentCut: CameraCut | null = null;
  private cutElapsed: number = 0;
  private currentPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private currentFov: number = 60;
  
  // Transition / blend to gameplay camera
  private isBlendingToGameplay: boolean = false;
  private blendDuration: number = 0.8;
  private blendElapsed: number = 0;
  private blendStartPos = new THREE.Vector3();
  private blendStartLookAt = new THREE.Vector3();
  private blendStartFov: number = 60;

  // Camera Shake
  public shakeIntensity: number = 0;
  public shakeDecay: number = 3.0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentFov = camera.fov;
  }

  public setCut(cut: CameraCut) {
    this.currentCut = cut;
    this.cutElapsed = 0;
    this.isBlendingToGameplay = false;
    this.currentPos.copy(cut.startPos);
    this.currentLookAt.copy(cut.lookAtStart);
    this.currentFov = cut.fovStart;
    this.applyToCamera();
  }

  public startBlendToGameplay(duration: number = 0.8) {
    this.isBlendingToGameplay = true;
    this.blendDuration = Math.max(0.2, duration);
    this.blendElapsed = 0;
    this.blendStartPos.copy(this.camera.position);
    this.blendStartFov = this.camera.fov;
    // Compute current lookAt target from camera direction
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.blendStartLookAt.copy(this.camera.position).addScaledVector(forward, 25);
  }

  public triggerShake(intensity: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  public update(dt: number, gameplayCamPos?: THREE.Vector3, gameplayLookAt?: THREE.Vector3, gameplayFov: number = 60): boolean {
    // Shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    if (this.isBlendingToGameplay && gameplayCamPos && gameplayLookAt) {
      this.blendElapsed += dt;
      const t = Math.min(1.0, this.blendElapsed / this.blendDuration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      this.currentPos.lerpVectors(this.blendStartPos, gameplayCamPos, ease);
      this.currentLookAt.lerpVectors(this.blendStartLookAt, gameplayLookAt, ease);
      this.currentFov = THREE.MathUtils.lerp(this.blendStartFov, gameplayFov, ease);

      this.applyToCamera();

      if (t >= 1.0) {
        this.isBlendingToGameplay = false;
        return true; // Blend complete
      }
      return false;
    }

    if (this.currentCut) {
      this.cutElapsed += dt;
      const rawT = Math.min(1.0, this.cutElapsed / this.currentCut.durationSec);
      // Smooth sinusoidal ease in-out
      const ease = 0.5 - 0.5 * Math.cos(rawT * Math.PI);

      this.currentPos.lerpVectors(this.currentCut.startPos, this.currentCut.endPos, ease);
      this.currentLookAt.lerpVectors(this.currentCut.lookAtStart, this.currentCut.lookAtEnd, ease);
      this.currentFov = THREE.MathUtils.lerp(this.currentCut.fovStart, this.currentCut.fovEnd, ease);

      this.applyToCamera();
    }

    return false;
  }

  private applyToCamera() {
    this.camera.position.copy(this.currentPos);

    // Apply subtle camera shake if active
    if (this.shakeIntensity > 0.001) {
      const shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const shakeOffsetZ = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.camera.position.x += shakeOffsetX;
      this.camera.position.y += shakeOffsetY;
      this.camera.position.z += shakeOffsetZ;
    }

    this.camera.lookAt(this.currentLookAt);

    if (Math.abs(this.camera.fov - this.currentFov) > 0.1) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }
  }

  public setFovPunch(punchFov: number) {
    this.currentFov = punchFov;
    this.camera.fov = punchFov;
    this.camera.updateProjectionMatrix();
  }
}
