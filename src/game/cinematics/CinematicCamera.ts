import * as THREE from 'three';

export class CinematicCamera {
  private camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private targetPos: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();
  private baseFov: number = 75;
  private targetFov: number = 75;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPos.copy(camera.position);
    this.baseFov = camera.fov;
    this.targetFov = camera.fov;
  }

  public reset(pos: THREE.Vector3, lookAt: THREE.Vector3, fov?: number) {
    this.currentPos.copy(pos);
    this.targetPos.copy(pos);
    this.currentLookAt.copy(lookAt);
    this.targetLookAt.copy(lookAt);
    this.camera.position.copy(pos);
    this.camera.lookAt(lookAt);
    if (fov) {
      this.baseFov = fov;
      this.targetFov = fov;
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  public setTargets(pos: THREE.Vector3, lookAt: THREE.Vector3, fov?: number) {
    this.targetPos.copy(pos);
    this.targetLookAt.copy(lookAt);
    if (fov !== undefined) {
      this.targetFov = fov;
    }
  }

  public update(dt: number, lerpSpeed: number = 5.0, shakeAmount: number = 0.0) {
    const factor = Math.min(1.0, dt * lerpSpeed);
    this.currentPos.lerp(this.targetPos, factor);
    this.currentLookAt.lerp(this.targetLookAt, factor);

    this.camera.position.copy(this.currentPos);
    if (shakeAmount > 0) {
      this.camera.position.x += (Math.random() - 0.5) * shakeAmount;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmount;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmount;
    }

    this.camera.lookAt(this.currentLookAt);

    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov += (this.targetFov - this.camera.fov) * factor;
      this.camera.updateProjectionMatrix();
    }
  }
}
