import * as THREE from 'three';
import { CosmicTrack } from '../trackData';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';
import {
  RouteShotDefinition,
  RoutePreviewTelemetry,
} from './routeCinematicTypes';
import { ROUTE_12_SHOTS, RouteCameraPath } from './routeCameraPath';
import { RouteFlythroughCamera } from './routeFlythroughCamera';
import { RouteRevealController } from './routeRevealController';
import { RouteCinematicRecorder } from './routeCinematicRecorder';
import { sound } from '../audio';

export interface FullRouteCinematicCallbacks {
  onTelemetryUpdate?: (telem: RoutePreviewTelemetry) => void;
  onShotChange?: (shot: RouteShotDefinition, shotIndex: number) => void;
  onComplete?: () => void;
}

export class FullRouteCinematicDirector {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private track: CosmicTrack;
  private pathConfig: ExtendedPathConfig;

  public flythroughCam: RouteFlythroughCamera;
  public cameraPath: RouteCameraPath;
  public revealController: RouteRevealController;
  public recorder: RouteCinematicRecorder;

  private shots: RouteShotDefinition[] = ROUTE_12_SHOTS;
  private currentShotIdx: number = 0;
  private shotElapsedSec: number = 0;
  private overallElapsedSec: number = 0;
  private isPlaying: boolean = false;

  private callbacks: FullRouteCinematicCallbacks = {};

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    track: CosmicTrack,
    pathConfig: ExtendedPathConfig,
    callbacks?: FullRouteCinematicCallbacks
  ) {
    this.camera = camera;
    this.scene = scene;
    this.track = track;
    this.pathConfig = pathConfig;
    if (callbacks) this.callbacks = callbacks;

    this.flythroughCam = new RouteFlythroughCamera(this.camera);
    this.cameraPath = new RouteCameraPath(this.track, this.pathConfig);
    this.revealController = new RouteRevealController(this.scene);
    this.recorder = new RouteCinematicRecorder(this.track, this.pathConfig, this.shots);
  }

  public setPath(track: CosmicTrack, pathConfig: ExtendedPathConfig) {
    this.track = track;
    this.pathConfig = pathConfig;
    this.cameraPath.setPath(track, pathConfig);
    this.recorder.setConfig(this.track, pathConfig, this.shots);
  }

  public start() {
    this.isPlaying = true;
    this.currentShotIdx = 0;
    this.shotElapsedSec = 0;
    this.overallElapsedSec = 0;

    // Build real-time 3D route visual highlights in the scene
    this.revealController.buildRouteHighlights(this.track, this.pathConfig);

    // Initial pose from Shot 1
    const firstShot = this.shots[0];
    const initialPose = this.cameraPath.sampleShotPose(firstShot, 0.0);
    this.flythroughCam.reset(initialPose.pos, initialPose.lookAt, initialPose.fov);

    this.callbacks.onShotChange?.(firstShot, 1);
    sound.playCinematicSwoosh?.();
  }

  public skip() {
    if (!this.isPlaying) return;
    this.stop();
    this.callbacks.onComplete?.();
  }

  public stop() {
    this.isPlaying = false;
    this.revealController.clear();
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public getCurrentShot(): RouteShotDefinition | null {
    if (!this.isPlaying) return null;
    return this.shots[this.currentShotIdx] || null;
  }

  public update(dt: number): boolean {
    if (!this.isPlaying) return false;

    this.shotElapsedSec += dt;
    this.overallElapsedSec += dt;

    const currentShot = this.shots[this.currentShotIdx];
    if (!currentShot) {
      this.stop();
      this.callbacks.onComplete?.();
      return false;
    }

    const shotProgress = Math.min(1.0, this.shotElapsedSec / Math.max(0.1, currentShot.durationSec));

    // Sample 3D camera pose and target lookAt from the real track geometry
    const pose = this.cameraPath.sampleShotPose(currentShot, shotProgress);
    this.flythroughCam.setTargets(pose.pos, pose.lookAt, pose.fov);
    this.flythroughCam.update(dt, pose.shake, 8.0);

    // Update glowing ribbons and 3D visual markers
    this.revealController.update(dt);

    // Compute telemetry for React HUD
    const telem = this.recorder.computeTelemetry(
      currentShot,
      this.currentShotIdx + 1,
      this.shots.length,
      this.shotElapsedSec,
      this.overallElapsedSec,
      pose.currentSplineT
    );
    this.callbacks.onTelemetryUpdate?.(telem);

    // Check if shot finished, advance to next shot
    if (this.shotElapsedSec >= currentShot.durationSec) {
      this.currentShotIdx++;
      this.shotElapsedSec = 0;

      if (this.currentShotIdx >= this.shots.length) {
        this.stop();
        this.callbacks.onComplete?.();
        return false;
      } else {
        const nextShot = this.shots[this.currentShotIdx];
        this.callbacks.onShotChange?.(nextShot, this.currentShotIdx + 1);

        // Subtle audio cue on shot transition
        if (nextShot.isScaleReveal) {
          sound.playCheckpoint?.();
        } else {
          sound.playCinematicSwoosh?.();
        }
      }
    }

    return true;
  }

  public cleanup() {
    this.stop();
  }
}
