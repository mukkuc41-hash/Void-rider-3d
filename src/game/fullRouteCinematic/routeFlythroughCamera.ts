import * as THREE from 'three';

export class RouteFlythroughCamera {
  private camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private targetPos: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();
  private currentFov: number = 65;
  private targetFov: number = 65;
  private rollAngle: number = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPos.copy(camera.position);
    this.currentLookAt.set(0, 0, 0);
  }

  public reset(pos: THREE.Vector3, lookAt: THREE.Vector3, fov: number = 65) {
    this.currentPos.copy(pos);
    this.targetPos.copy(pos);
    this.currentLookAt.copy(lookAt);
    this.targetLookAt.copy(lookAt);
    this.currentFov = fov;
    this.targetFov = fov;
    this.rollAngle = 0;
    this.applyToCamera();
  }

  public setTargets(pos: THREE.Vector3, lookAt: THREE.Vector3, fov: number) {
    this.targetPos.copy(pos);
    this.targetLookAt.copy(lookAt);
    this.targetFov = fov;
  }

  public update(dt: number, shakeIntensity: number = 0, lerpSpeed: number = 6.0) {
    const alpha = Math.min(1.0, dt * lerpSpeed);
    this.currentPos.lerp(this.targetPos, alpha);
    this.currentLookAt.lerp(this.targetLookAt, alpha);
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, this.targetFov, alpha);

    // Apply procedural subtle shake if requested
    if (shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * shakeIntensity * 1.2;
      const shakeY = (Math.random() - 0.5) * shakeIntensity * 1.2;
      const shakeZ = (Math.random() - 0.5) * shakeIntensity * 1.2;
      this.currentPos.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
    }

    this.applyToCamera();
  }

  private applyToCamera() {
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
    if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.currentPos.clone();
  }

  public getLookAt(): THREE.Vector3 {
    return this.currentLookAt.clone();
  }

  public getFov(): number {
    return this.currentFov;
  }
}
