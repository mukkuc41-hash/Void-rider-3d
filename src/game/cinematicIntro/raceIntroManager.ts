import * as THREE from 'three';
import { GameMode } from '../../types';
import { CosmicTrack } from '../trackData';
import {
  IntroHUDTelemetry,
  IntroPhase,
  ModeIntroConfig,
} from './cinematicTypes';
import { getModeIntroConfig } from './modeIntroConfigs';
import { CinematicDirector, CinematicDirectorCallbacks } from './cinematicDirector';

export class RaceIntroManager {
  private director: CinematicDirector;
  private config: ModeIntroConfig;
  private currentMode: GameMode;
  public latestTelemetry: IntroHUDTelemetry | null = null;
  public isControlsLocked: boolean = false;

  constructor(
    mode: GameMode,
    track: CosmicTrack,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    callbacks?: CinematicDirectorCallbacks
  ) {
    this.currentMode = mode;
    this.config = getModeIntroConfig(mode);

    const mergedCallbacks: CinematicDirectorCallbacks = {
      ...callbacks,
      onTelemetryUpdate: telem => {
        this.latestTelemetry = telem;
        callbacks?.onTelemetryUpdate?.(telem);
      },
    };

    this.director = new CinematicDirector(
      this.config,
      track,
      camera,
      scene,
      mergedCallbacks
    );
  }

  public setMode(mode: GameMode, track: CosmicTrack) {
    this.currentMode = mode;
    this.config = getModeIntroConfig(mode);
    this.director.setConfig(this.config);
  }

  public startIntro(
    playerShipGroup: THREE.Group | null,
    aiRacers: Array<{ id: string; name: string; isRival?: boolean }>,
    startT: number = 0,
    rival?: { name: string; shipId: string; personality: string }
  ) {
    this.isControlsLocked = true;
    this.director.startIntro(playerShipGroup, aiRacers, startT, rival);
  }

  public skip() {
    this.director.skip();
  }

  public getGridSlot(racerId: string) {
    return this.director.startingGridManager.getSlot(racerId);
  }

  public getDirector(): CinematicDirector {
    return this.director;
  }

  public update(
    dt: number,
    gameplayCamPos: THREE.Vector3,
    gameplayLookAt: THREE.Vector3,
    gameplayFov: number = 60
  ): {
    isIntroActive: boolean;
    phase: IntroPhase;
    countdownNumber: number | null;
    isControlsLocked: boolean;
  } {
    const res = this.director.update(dt, gameplayCamPos, gameplayLookAt, gameplayFov);
    this.isControlsLocked = res.isControlsLocked;
    return res;
  }

  public syncNetworkCountdown(count: number) {
    this.director.countdownManager.syncFromNetwork(count);
    if (count === 0) {
      this.director.setPhase('RACE_START');
    }
  }

  public cleanup() {
    this.director.cleanup();
    this.isControlsLocked = false;
    this.latestTelemetry = null;
  }
}
