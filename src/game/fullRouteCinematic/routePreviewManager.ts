import * as THREE from 'three';
import { CosmicTrack } from '../trackData';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';
import { FullRouteCinematicDirector } from './fullRouteCinematicDirector';
import { RoutePreviewTelemetry } from './routeCinematicTypes';

export interface RoutePreviewManagerCallbacks {
  onTelemetryUpdate?: (telem: RoutePreviewTelemetry | null) => void;
  onPreviewComplete?: () => void;
}

export class RoutePreviewManager {
  private director: FullRouteCinematicDirector;
  private isPreviewActive: boolean = false;
  private callbacks: RoutePreviewManagerCallbacks = {};

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    track: CosmicTrack,
    pathConfig: ExtendedPathConfig,
    callbacks?: RoutePreviewManagerCallbacks
  ) {
    if (callbacks) this.callbacks = callbacks;

    this.director = new FullRouteCinematicDirector(
      camera,
      scene,
      track,
      pathConfig,
      {
        onTelemetryUpdate: telem => {
          this.callbacks.onTelemetryUpdate?.(telem);
        },
        onComplete: () => {
          this.isPreviewActive = false;
          this.callbacks.onTelemetryUpdate?.(null);
          this.callbacks.onPreviewComplete?.();
        },
      }
    );
  }

  public setPath(track: CosmicTrack, pathConfig: ExtendedPathConfig) {
    this.director.setPath(track, pathConfig);
  }

  public startPreview() {
    this.isPreviewActive = true;
    this.director.start();
  }

  public skipPreview() {
    if (!this.isPreviewActive) return;
    this.director.skip();
  }

  public update(dt: number): boolean {
    if (!this.isPreviewActive) return false;
    const active = this.director.update(dt);
    if (!active) {
      this.isPreviewActive = false;
    }
    return active;
  }

  public isActive(): boolean {
    return this.isPreviewActive;
  }

  public cleanup() {
    this.director.cleanup();
    this.isPreviewActive = false;
    this.callbacks.onTelemetryUpdate?.(null);
  }
}
