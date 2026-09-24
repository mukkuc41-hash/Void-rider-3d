import * as THREE from 'three';
import {
  CinematicTrigger,
  CinematicShotType,
  ActiveCinematicState,
} from './extendedPathTypes';
import { sound } from '../audio';

export class CinematicTriggerSystem {
  private triggers: CinematicTrigger[] = [];
  private activeState: ActiveCinematicState = {
    isActive: false,
    trigger: null,
    elapsedSec: 0,
    totalDurationSec: 0,
    currentShot: 'SHOT_01_LOW_REAR_CHASE',
    cameraPos: new THREE.Vector3(),
    cameraLookAt: new THREE.Vector3(),
    cameraFov: 60,
    letterboxProgress: 0,
    bannerOpacity: 0,
  };

  private baseGameplayFov: number = 60;
  private blendBackDuration: number = 0.6;
  private isBlendingBack: boolean = false;
  private blendBackElapsed: number = 0;
  private blendStartPos = new THREE.Vector3();
  private blendStartLookAt = new THREE.Vector3();
  private blendStartFov: number = 60;

  private orbitAngle: number = 0;

  constructor() {}

  public initTriggers(triggers: CinematicTrigger[]) {
    this.triggers = triggers.map(t => ({ ...t, hasTriggered: false }));
    this.reset();
  }

  public reset() {
    this.triggers.forEach(t => (t.hasTriggered = false));
    this.activeState.isActive = false;
    this.activeState.trigger = null;
    this.activeState.elapsedSec = 0;
    this.activeState.totalDurationSec = 0;
    this.activeState.letterboxProgress = 0;
    this.activeState.bannerOpacity = 0;
    this.isBlendingBack = false;
    this.blendBackElapsed = 0;
    this.orbitAngle = 0;
  }

  /**
   * Check if player spline progress crosses any cinematic trigger
   */
  public checkTriggers(splineT: number, isRacing: boolean): CinematicTrigger | null {
    if (!isRacing || this.activeState.isActive || this.isBlendingBack) return null;

    for (const trig of this.triggers) {
      if (!trig.hasTriggered && splineT >= trig.triggerT && splineT <= trig.triggerT + 0.04) {
        trig.hasTriggered = true;
        this.startCinematic(trig);
        return trig;
      }
    }
    return null;
  }

  public startCinematic(trigger: CinematicTrigger) {
    this.activeState.isActive = true;
    this.activeState.trigger = trigger;
    this.activeState.elapsedSec = 0;
    this.activeState.totalDurationSec = Math.max(1.2, Math.min(5.0, trigger.durationSec));
    this.activeState.currentShot = trigger.shotType;
    this.activeState.letterboxProgress = 0;
    this.activeState.bannerOpacity = 0;
    this.isBlendingBack = false;
    this.orbitAngle = 0;

    // Audio cue
    sound.playCheckpoint();
  }

  /**
   * Update active cinematic camera position & lookAt relative to the racing ship.
   * Returns true if cinematic is actively controlling camera, false if gameplay camera has full control.
   */
  public update(
    dt: number,
    shipPos: THREE.Vector3,
    shipQuat: THREE.Quaternion,
    shipSpeed: number,
    gameplayCamPos: THREE.Vector3,
    gameplayLookAt: THREE.Vector3,
    outputCamera: THREE.PerspectiveCamera
  ): boolean {
    if (!this.activeState.isActive && !this.isBlendingBack) {
      return false;
    }

    const shipForward = new THREE.Vector3(0, 0, -1).applyQuaternion(shipQuat);
    const shipUp = new THREE.Vector3(0, 1, 0).applyQuaternion(shipQuat);
    const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(shipQuat);

    if (this.activeState.isActive && this.activeState.trigger) {
      this.activeState.elapsedSec += dt;
      const progress = Math.min(1.0, this.activeState.elapsedSec / this.activeState.totalDurationSec);

      // Letterbox bars smooth fade in/out
      if (progress < 0.2) {
        this.activeState.letterboxProgress = progress / 0.2;
        this.activeState.bannerOpacity = progress / 0.2;
      } else if (progress > 0.8) {
        this.activeState.letterboxProgress = (1.0 - progress) / 0.2;
        this.activeState.bannerOpacity = (1.0 - progress) / 0.2;
      } else {
        this.activeState.letterboxProgress = 1.0;
        this.activeState.bannerOpacity = 1.0;
      }

      // Compute camera pose based on shot type
      this.computeShotPose(
        this.activeState.currentShot,
        progress,
        shipPos,
        shipForward,
        shipUp,
        shipRight,
        this.activeState.trigger
      );

      // Apply to Three.js camera
      outputCamera.position.copy(this.activeState.cameraPos);
      outputCamera.lookAt(this.activeState.cameraLookAt);
      outputCamera.fov = THREE.MathUtils.lerp(outputCamera.fov, this.activeState.cameraFov, 0.15);
      outputCamera.updateProjectionMatrix();

      // Check for completion
      if (this.activeState.elapsedSec >= this.activeState.totalDurationSec) {
        this.activeState.isActive = false;
        this.isBlendingBack = true;
        this.blendBackElapsed = 0;
        this.blendStartPos.copy(outputCamera.position);
        this.blendStartLookAt.copy(this.activeState.cameraLookAt);
        this.blendStartFov = outputCamera.fov;
      }

      return true;
    }

    if (this.isBlendingBack) {
      this.blendBackElapsed += dt;
      const blendT = Math.min(1.0, this.blendBackElapsed / this.blendBackDuration);
      const easeT = blendT * blendT * (3 - 2 * blendT); // Smoothstep

      outputCamera.position.lerpVectors(this.blendStartPos, gameplayCamPos, easeT);
      const targetLookAt = new THREE.Vector3().lerpVectors(this.blendStartLookAt, gameplayLookAt, easeT);
      outputCamera.lookAt(targetLookAt);
      outputCamera.fov = THREE.MathUtils.lerp(this.blendStartFov, this.baseGameplayFov, easeT);
      outputCamera.updateProjectionMatrix();

      this.activeState.letterboxProgress = THREE.MathUtils.lerp(this.activeState.letterboxProgress, 0, 0.2);
      this.activeState.bannerOpacity = 0;

      if (blendT >= 1.0) {
        this.isBlendingBack = false;
        this.activeState.trigger = null;
      }

      return true;
    }

    return false;
  }

  private computeShotPose(
    shot: CinematicShotType,
    progress: number,
    shipPos: THREE.Vector3,
    forward: THREE.Vector3,
    up: THREE.Vector3,
    right: THREE.Vector3,
    trigger: CinematicTrigger
  ) {
    const pos = this.activeState.cameraPos;
    const look = this.activeState.cameraLookAt;
    const baseFov = 60 + trigger.fovDelta;

    switch (shot) {
      case 'SHOT_01_LOW_REAR_CHASE': {
        // Camera extremely low to the track, tightly following exhaust thrusters
        const dist = 7.0 - progress * 1.5;
        const height = 1.1 + Math.sin(progress * Math.PI) * 0.4;
        pos.copy(shipPos)
          .addScaledVector(forward, -dist)
          .addScaledVector(up, height);
        look.copy(shipPos).addScaledVector(forward, 25).addScaledVector(up, 1.2);
        this.activeState.cameraFov = baseFov;
        break;
      }

      case 'SHOT_02_SIDE_FLYBY': {
        // Dramatic side camera as the ship roars past
        const sideOffset = 14.0 + Math.sin(progress * Math.PI * 0.5) * 4.0;
        const lead = (progress - 0.5) * 20.0;
        pos.copy(shipPos)
          .addScaledVector(right, sideOffset)
          .addScaledVector(up, 3.5)
          .addScaledVector(forward, -lead);
        look.copy(shipPos).addScaledVector(up, 1.5);
        this.activeState.cameraFov = baseFov - 6;
        break;
      }

      case 'SHOT_03_WIDE_ENVIRONMENT_REVEAL': {
        // Wide elevated camera revealing landmark
        const offset = new THREE.Vector3(...trigger.cameraOffset);
        pos.copy(shipPos)
          .addScaledVector(right, offset.x)
          .addScaledVector(up, offset.y + progress * 4.0)
          .addScaledVector(forward, offset.z);
        const lookOffset = new THREE.Vector3(...trigger.lookAtOffset);
        look.copy(shipPos).add(lookOffset);
        this.activeState.cameraFov = baseFov + 8;
        break;
      }

      case 'SHOT_04_TOP_DOWN_REVEAL': {
        // High vertical angle looking down
        pos.copy(shipPos)
          .addScaledVector(up, 24.0 + (1 - progress) * 8.0)
          .addScaledVector(forward, -8.0);
        look.copy(shipPos).addScaledVector(forward, 15.0);
        this.activeState.cameraFov = baseFov + 10;
        break;
      }

      case 'SHOT_05_FRONT_OBSTACLE_REVEAL': {
        // Looking backwards at the ship charging toward the camera / upcoming obstacle
        const frontDist = 22.0 - progress * 8.0;
        pos.copy(shipPos)
          .addScaledVector(forward, frontDist)
          .addScaledVector(up, 2.5)
          .addScaledVector(right, 2.0);
        look.copy(shipPos).addScaledVector(up, 1.2);
        this.activeState.cameraFov = baseFov;
        break;
      }

      case 'SHOT_06_ORBITING_PLAYER': {
        // 180-degree dynamic sweep around player
        this.orbitAngle = progress * Math.PI * 1.2;
        const orbitRadius = 12.0;
        const orbitX = Math.cos(this.orbitAngle) * orbitRadius;
        const orbitZ = Math.sin(this.orbitAngle) * orbitRadius;
        pos.copy(shipPos)
          .addScaledVector(right, orbitX)
          .addScaledVector(up, 3.2 + Math.sin(progress * Math.PI) * 2.0)
          .addScaledVector(forward, -orbitZ);
        look.copy(shipPos).addScaledVector(up, 1.2);
        this.activeState.cameraFov = baseFov;
        break;
      }

      case 'SHOT_07_EXTREME_SPEED': {
        // High FOV, low chase with dynamic forward pull
        pos.copy(shipPos)
          .addScaledVector(forward, -(6.0 + progress * 2.0))
          .addScaledVector(up, 1.5);
        look.copy(shipPos).addScaledVector(forward, 45.0);
        this.activeState.cameraFov = baseFov + 18;
        break;
      }

      case 'SHOT_08_REAR_DESTRUCTION': {
        // Reverse angle looking back at destruction/collapse behind the ship
        pos.copy(shipPos)
          .addScaledVector(forward, 5.0)
          .addScaledVector(up, 2.8);
        look.copy(shipPos).addScaledVector(forward, -35.0).addScaledVector(up, 0.5);
        this.activeState.cameraFov = baseFov + 6;
        break;
      }

      case 'SHOT_09_MASSIVE_SCALE_REVEAL': {
        // Ultra-wide shot framing the entire planet / megastructure
        pos.copy(shipPos)
          .addScaledVector(right, -30.0 + progress * 8.0)
          .addScaledVector(up, 20.0 + progress * 4.0)
          .addScaledVector(forward, -15.0);
        look.copy(shipPos).addScaledVector(forward, 25.0);
        this.activeState.cameraFov = baseFov + 20;
        break;
      }

      case 'SHOT_10_FINALE_CAMERA':
      default: {
        // Dramatic low-to-high crane sweep
        const craneY = 1.5 + progress * 14.0;
        const craneDist = 8.0 + progress * 12.0;
        pos.copy(shipPos)
          .addScaledVector(forward, -craneDist)
          .addScaledVector(up, craneY)
          .addScaledVector(right, Math.sin(progress * Math.PI) * 6.0);
        look.copy(shipPos).addScaledVector(forward, 20.0).addScaledVector(up, 1.0);
        this.activeState.cameraFov = baseFov + progress * 10;
        break;
      }
    }
  }

  public getActiveState(): ActiveCinematicState {
    return this.activeState;
  }
}
