import * as THREE from 'three';
import { GameMode } from '../../types';
import { ModeFinishCinematicConfig, FinishCinematicShot } from './routeCinematicTypes';
import { getFinishCinematicConfig } from './finishCinematicConfigs';
import { sound } from '../audio';

export interface FinishCinematicTelemetry {
  isActive: boolean;
  modeId: GameMode;
  title: string;
  subtitle: string;
  victoryMessage: string;
  timeScale: number;
  progress01: number;
  shotIndex: number;
  totalShots: number;
  canSkip: boolean;
}

export interface FinishCinematicCallbacks {
  onTelemetryUpdate?: (telem: FinishCinematicTelemetry | null) => void;
  onComplete?: () => void;
}

export class FinishCinematicManager {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private currentMode: GameMode = 'NEON_CIRCUIT';
  private config: ModeFinishCinematicConfig;

  private isPlaying: boolean = false;
  private currentShotIdx: number = 0;
  private shotElapsedSec: number = 0;
  private overallElapsedSec: number = 0;

  // Real-time 3D Particle Celebration
  private celebrationGroup: THREE.Group;
  private celebrationParticles: THREE.Points | null = null;
  private particlePositions: Float32Array = new Float32Array(0);
  private particleVelocities: Float32Array = new Float32Array(0);

  private callbacks: FinishCinematicCallbacks = {};

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    callbacks?: FinishCinematicCallbacks
  ) {
    this.camera = camera;
    this.scene = scene;
    if (callbacks) this.callbacks = callbacks;

    this.config = getFinishCinematicConfig(this.currentMode);
    this.celebrationGroup = new THREE.Group();
    this.celebrationGroup.name = 'finish_celebration_group';
    this.scene.add(this.celebrationGroup);
  }

  public setMode(mode: GameMode) {
    this.currentMode = mode;
    this.config = getFinishCinematicConfig(mode);
  }

  public start(shipPosition: THREE.Vector3, shipQuaternion: THREE.Quaternion) {
    this.isPlaying = true;
    this.currentShotIdx = 0;
    this.shotElapsedSec = 0;
    this.overallElapsedSec = 0;

    // Spawn 3D celebration fireworks and particle shockwave rings at ship location
    this.spawnCelebration(shipPosition, this.config.particleColor);

    sound.playFinish?.();
    sound.playCinematicSwoosh?.();

    this.emitTelemetry();
  }

  public skip() {
    if (!this.isPlaying) return;
    this.stop();
    this.callbacks.onComplete?.();
  }

  public stop() {
    this.isPlaying = false;
    this.clearCelebration();
    this.callbacks.onTelemetryUpdate?.(null);
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public getTimeScale(): number {
    if (!this.isPlaying) return 1.0;
    const shot = this.config.shots[this.currentShotIdx];
    return shot ? shot.timeScale : 1.0;
  }

  public update(
    dt: number,
    shipPosition: THREE.Vector3,
    shipQuaternion: THREE.Quaternion
  ): boolean {
    if (!this.isPlaying) return false;

    this.shotElapsedSec += dt;
    this.overallElapsedSec += dt;

    const currentShot = this.config.shots[this.currentShotIdx];
    if (!currentShot) {
      this.stop();
      this.callbacks.onComplete?.();
      return false;
    }

    const shotProgress = Math.min(1.0, this.shotElapsedSec / Math.max(0.1, currentShot.durationSec));
    const smoothT = shotProgress * shotProgress * (3 - 2 * shotProgress);

    // Compute relative camera coordinates based on real ship orientation
    const startOffset = new THREE.Vector3(...currentShot.cameraStartOffset).applyQuaternion(shipQuaternion);
    const endOffset = new THREE.Vector3(...currentShot.cameraEndOffset).applyQuaternion(shipQuaternion);
    const camTargetPos = shipPosition.clone().add(startOffset.lerp(endOffset, smoothT));

    const lookStart = new THREE.Vector3(...currentShot.lookAtStartOffset).applyQuaternion(shipQuaternion);
    const lookEnd = new THREE.Vector3(...currentShot.lookAtEndOffset).applyQuaternion(shipQuaternion);
    const camTargetLookAt = shipPosition.clone().add(lookStart.lerp(lookEnd, smoothT));

    // Smoothly apply to camera
    this.camera.position.lerp(camTargetPos, Math.min(1.0, dt * 10));
    this.camera.lookAt(camTargetLookAt);

    const targetFov = THREE.MathUtils.lerp(currentShot.fovStart, currentShot.fovEnd, smoothT);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1.0, dt * 8));
    this.camera.updateProjectionMatrix();

    // Update 3D celebration fireworks particles
    this.updateCelebrationParticles(dt);

    this.emitTelemetry();

    // Advance to next shot
    if (this.shotElapsedSec >= currentShot.durationSec) {
      this.currentShotIdx++;
      this.shotElapsedSec = 0;

      if (this.currentShotIdx >= this.config.shots.length) {
        this.stop();
        this.callbacks.onComplete?.();
        return false;
      } else {
        sound.playCinematicSwoosh?.();
      }
    }

    return true;
  }

  private emitTelemetry() {
    const shot = this.config.shots[this.currentShotIdx];
    const telem: FinishCinematicTelemetry = {
      isActive: true,
      modeId: this.currentMode,
      title: this.config.title,
      subtitle: this.config.subtitle,
      victoryMessage: this.config.victoryMessage,
      timeScale: shot ? shot.timeScale : 1.0,
      progress01: Math.min(1.0, this.overallElapsedSec / Math.max(1, this.config.totalDurationSec)),
      shotIndex: this.currentShotIdx + 1,
      totalShots: this.config.shots.length,
      canSkip: this.overallElapsedSec >= 1.0,
    };
    this.callbacks.onTelemetryUpdate?.(telem);
  }

  private spawnCelebration(origin: THREE.Vector3, colorHex: number) {
    this.clearCelebration();

    const count = 350;
    this.particlePositions = new Float32Array(count * 3);
    this.particleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.particlePositions[i * 3] = origin.x;
      this.particlePositions[i * 3 + 1] = origin.y;
      this.particlePositions[i * 3 + 2] = origin.z;

      // Spherical burst
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 15 + Math.random() * 35;

      this.particleVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      this.particleVelocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      this.particleVelocities[i * 3 + 2] = Math.cos(phi) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 1.6,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.celebrationParticles = new THREE.Points(geo, mat);
    this.celebrationGroup.add(this.celebrationParticles);

    // Add holographic victory ring expanding outwards
    const ringGeo = new THREE.TorusGeometry(12, 0.4, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(origin);
    ring.name = 'victory_shockwave_ring';
    this.celebrationGroup.add(ring);
  }

  private updateCelebrationParticles(dt: number) {
    if (!this.celebrationParticles) return;

    const count = this.particlePositions.length / 3;
    for (let i = 0; i < count; i++) {
      this.particlePositions[i * 3] += this.particleVelocities[i * 3] * dt;
      this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * dt;
      this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * dt;

      // Gravity drag
      this.particleVelocities[i * 3 + 1] -= 5.0 * dt;
    }

    const posAttr = this.celebrationParticles.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.needsUpdate = true;

    // Expand shockwave ring
    const ring = this.celebrationGroup.getObjectByName('victory_shockwave_ring') as THREE.Mesh;
    if (ring) {
      ring.scale.addScalar(dt * 3.5);
      const ringMat = ring.material as THREE.MeshBasicMaterial;
      ringMat.opacity = Math.max(0, ringMat.opacity - dt * 0.25);
    }
  }

  private clearCelebration() {
    if (this.celebrationParticles) {
      this.celebrationGroup.remove(this.celebrationParticles);
      this.celebrationParticles.geometry.dispose();
      (this.celebrationParticles.material as THREE.Material).dispose();
      this.celebrationParticles = null;
    }
    const ring = this.celebrationGroup.getObjectByName('victory_shockwave_ring');
    if (ring) {
      this.celebrationGroup.remove(ring);
    }
  }

  public cleanup() {
    this.stop();
  }
}
