import * as THREE from 'three';
import {
  IntroPhase,
  IntroHUDTelemetry,
  ModeIntroConfig,
  StoryTransmission,
} from './cinematicTypes';
import { CinematicCamera } from './cinematicCamera';
import { StoryIntroManager } from './storyIntroManager';
import { StartingGridManager } from './startingGridManager';
import { CountdownManager } from './countdownManager';
import { RaceStartManager } from './raceStartManager';
import { CosmicTrack } from '../trackData';
import { sound } from '../audio';
import { RoutePreviewManager } from '../fullRouteCinematic/routePreviewManager';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';
import { RoutePreviewTelemetry } from '../fullRouteCinematic/routeCinematicTypes';
import { RaceCountdownManager, RaceCountdownTelemetry } from '../countdown/RaceCountdownManager';

export interface CinematicDirectorCallbacks {
  onPhaseChange?: (phase: IntroPhase) => void;
  onCountdownTick?: (count: number) => void;
  onRaceStart?: () => void;
  onIntroComplete?: () => void;
  onTelemetryUpdate?: (telem: IntroHUDTelemetry) => void;
}

export class CinematicDirector {
  private config: ModeIntroConfig;
  private track: CosmicTrack;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  public cinematicCamera: CinematicCamera;
  public storyIntroManager: StoryIntroManager;
  public startingGridManager: StartingGridManager;
  public countdownManager: CountdownManager;
  public raceCountdownManager: RaceCountdownManager;
  public raceStartManager: RaceStartManager;
  public routePreviewManager: RoutePreviewManager;
  private latestRoutePreviewTelemetry: RoutePreviewTelemetry | null = null;
  private latestCountdownTelemetry: RaceCountdownTelemetry | null = null;

  private currentPhase: IntroPhase = 'STORY_OPENING';
  private phaseTimer: number = 0;
  private overallTimer: number = 0;
  private isIntroActive: boolean = false;
  private canSkip: boolean = false;

  private callbacks: CinematicDirectorCallbacks = {};
  private activeTransmission: StoryTransmission | null = null;
  private rivalInfo?: { name: string; shipId: string; personality: string };

  constructor(
    config: ModeIntroConfig,
    track: CosmicTrack,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    callbacks?: CinematicDirectorCallbacks
  ) {
    this.config = config;
    this.track = track;
    this.camera = camera;
    this.scene = scene;
    if (callbacks) this.callbacks = callbacks;

    this.cinematicCamera = new CinematicCamera(this.camera);
    this.storyIntroManager = new StoryIntroManager(this.config, this.cinematicCamera);
    this.startingGridManager = new StartingGridManager(
      this.config,
      this.track,
      this.scene,
      this.cinematicCamera
    );
    this.countdownManager = new CountdownManager(this.config, this.cinematicCamera);
    this.raceStartManager = new RaceStartManager(
      this.config,
      this.cinematicCamera,
      this.startingGridManager
    );

    this.raceCountdownManager = new RaceCountdownManager(
      this.config.modeId,
      this.track,
      this.scene,
      this.camera,
      {
        onCountdownTick: count => {
          this.callbacks.onCountdownTick?.(count);
        },
        onRaceStart: () => {
          this.setPhase('RACE_START');
        },
        onTelemetryUpdate: telem => {
          this.latestCountdownTelemetry = telem;
        },
        onCameraShake: intensity => {
          this.cinematicCamera.triggerShake(intensity);
        },
      }
    );

    const pathConfig = getExtendedPathConfig(this.config.modeId);
    this.routePreviewManager = new RoutePreviewManager(
      this.camera,
      this.scene,
      this.track,
      pathConfig,
      {
        onTelemetryUpdate: telem => {
          this.latestRoutePreviewTelemetry = telem;
        },
        onPreviewComplete: () => {
          if (this.currentPhase === 'FULL_ROUTE_FLYTHROUGH') {
            this.setPhase('PLAYER_REVEAL');
          }
        },
      }
    );
  }

  public setConfig(config: ModeIntroConfig) {
    this.config = config;
    this.raceCountdownManager.setMode(this.config.modeId);
    const pathConfig = getExtendedPathConfig(this.config.modeId);
    this.routePreviewManager.setPath(this.track, pathConfig);
  }

  public startIntro(
    playerShipGroup: THREE.Group | null,
    aiRacers: Array<{ id: string; name: string; isRival?: boolean }>,
    startT: number = 0,
    rival?: { name: string; shipId: string; personality: string }
  ) {
    this.isIntroActive = true;
    this.phaseTimer = 0;
    this.overallTimer = 0;
    this.canSkip = false;
    this.rivalInfo = rival;

    const sample = this.track.getSampleAt(startT);

    // Build 3D starting gate and physical starting lights
    this.startingGridManager.buildStartingGridStructure(startT);
    this.startingGridManager.setupGridFormation('player', aiRacers, startT);
    this.raceCountdownManager.setupStartingGate(startT);

    // Initialize story manager with origin around starting gate
    this.storyIntroManager.init(playerShipGroup, sample.point);

    // Begin in PHASE 1: STORY OPENING
    this.setPhase('STORY_OPENING');
  }

  public skip() {
    if (!this.isIntroActive || !this.canSkip) return;

    if (this.currentPhase === 'FULL_ROUTE_FLYTHROUGH') {
      this.routePreviewManager.skipPreview();
    }

    // Failsafe 48.19: Even if skipped, seamlessly return to start camera & execute full countdown sequence
    if (
      this.currentPhase === 'STORY_OPENING' ||
      this.currentPhase === 'WORLD_REVEAL' ||
      this.currentPhase === 'FULL_ROUTE_FLYTHROUGH' ||
      this.currentPhase === 'PLAYER_REVEAL' ||
      this.currentPhase === 'TRAVEL_TO_GRID' ||
      this.currentPhase === 'STARTING_GRID' ||
      this.currentPhase === 'RACER_INTRO'
    ) {
      sound.playMenuClick?.();
      this.setPhase('CAMERA_BLEND');
    }
  }

  public setPhase(phase: IntroPhase) {
    this.currentPhase = phase;
    this.phaseTimer = 0;
    this.callbacks.onPhaseChange?.(phase);

    const startSample = this.track.getSampleAt(0);

    switch (phase) {
      case 'STORY_OPENING':
        // Camera handled by StoryIntroManager
        break;

      case 'WORLD_REVEAL':
        // StoryIntroManager continues scene 1
        break;

      case 'FULL_ROUTE_FLYTHROUGH':
        this.routePreviewManager.startPreview();
        break;

      case 'PLAYER_REVEAL': {
        // Dramatic cut around player ship
        const tangent = startSample.tangent.clone().normalize();
        const normal = startSample.normal.clone().normalize();
        const binormal = startSample.binormal.clone().normalize();

        let camStart = startSample.point.clone().addScaledVector(tangent, -15).addScaledVector(normal, 3);
        let camEnd = startSample.point.clone().addScaledVector(binormal, -8).addScaledVector(normal, 4).addScaledVector(tangent, -4);
        let lookStart = startSample.point.clone().addScaledVector(normal, 1);
        let lookEnd = startSample.point.clone().addScaledVector(normal, 1.5);

        if (this.config.playerReveal.type === 'UNDERNEATH_FLYBY') {
          camStart = startSample.point.clone().addScaledVector(tangent, 10).addScaledVector(normal, -3);
          camEnd = startSample.point.clone().addScaledVector(tangent, -12).addScaledVector(normal, 4);
        } else if (this.config.playerReveal.type === 'CIRCULAR_SWEEP') {
          camStart = startSample.point.clone().addScaledVector(binormal, 12).addScaledVector(normal, 6);
          camEnd = startSample.point.clone().addScaledVector(binormal, -12).addScaledVector(normal, 5);
        }

        this.cinematicCamera.setCut({
          startPos: camStart,
          endPos: camEnd,
          lookAtStart: lookStart,
          lookAtEnd: lookEnd,
          fovStart: 70,
          fovEnd: 58,
          durationSec: this.config.playerReveal.durationSec,
        });

        sound.playCinematicSwoosh?.();
        break;
      }

      case 'TRAVEL_TO_GRID': {
        // Camera glides backwards leading ship towards the gate
        const tangent = startSample.tangent.clone().normalize();
        const normal = startSample.normal.clone().normalize();
        const camStart = startSample.point.clone().addScaledVector(tangent, 18).addScaledVector(normal, 6);
        const camEnd = startSample.point.clone().addScaledVector(tangent, 8).addScaledVector(normal, 4);
        const lookAt = startSample.point.clone().addScaledVector(normal, 1.5);

        this.cinematicCamera.setCut({
          startPos: camStart,
          endPos: camEnd,
          lookAtStart: lookAt,
          lookAtEnd: lookAt,
          fovStart: 64,
          fovEnd: 58,
          durationSec: 2.2,
        });
        break;
      }

      case 'STARTING_GRID': {
        // Overhead angled high shot showing all grid slots
        const tangent = startSample.tangent.clone().normalize();
        const normal = startSample.normal.clone().normalize();
        const binormal = startSample.binormal.clone().normalize();
        const camStart = startSample.point.clone().addScaledVector(tangent, -24).addScaledVector(normal, 14).addScaledVector(binormal, 10);
        const camEnd = startSample.point.clone().addScaledVector(tangent, -16).addScaledVector(normal, 8).addScaledVector(binormal, 4);
        const lookAt = startSample.point.clone().addScaledVector(normal, 2);

        this.cinematicCamera.setCut({
          startPos: camStart,
          endPos: camEnd,
          lookAtStart: lookAt,
          lookAtEnd: lookAt,
          fovStart: 68,
          fovEnd: 60,
          durationSec: 2.0,
        });
        break;
      }

      case 'RACER_INTRO': {
        // Cut focusing on rival / grid front
        const tangent = startSample.tangent.clone().normalize();
        const normal = startSample.normal.clone().normalize();
        const binormal = startSample.binormal.clone().normalize();
        const camStart = startSample.point.clone().addScaledVector(tangent, -8).addScaledVector(normal, 3).addScaledVector(binormal, 5);
        const camEnd = startSample.point.clone().addScaledVector(tangent, -12).addScaledVector(normal, 4).addScaledVector(binormal, 0);
        const lookAt = startSample.point.clone().addScaledVector(tangent, 10).addScaledVector(normal, 1.5);

        this.cinematicCamera.setCut({
          startPos: camStart,
          endPos: camEnd,
          lookAtStart: lookAt,
          lookAtEnd: lookAt,
          fovStart: 62,
          fovEnd: 58,
          durationSec: 1.8,
        });
        break;
      }

      case 'CAMERA_BLEND': {
        // 48.13 Seamless camera blend from intro cut into gameplay chase camera
        break;
      }

      case 'COUNTDOWN': {
        // 48.1 - 48.12 Complete 3D Countdown & Traffic Light Launch System
        this.raceCountdownManager.startCountdownDirect();
        break;
      }

      case 'RACE_START':
        this.raceStartManager.triggerLaunch();
        this.callbacks.onRaceStart?.();
        break;

      case 'GAMEPLAY_TRANSITION':
        break;

      case 'COMPLETE':
        this.isIntroActive = false;
        this.callbacks.onIntroComplete?.();
        break;
    }
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
    if (!this.isIntroActive) {
      return {
        isIntroActive: false,
        phase: 'COMPLETE',
        countdownNumber: null,
        isControlsLocked: false,
      };
    }

    this.phaseTimer += dt;
    this.overallTimer += dt;

    if (this.overallTimer >= this.config.openingCinematic.skipAvailableAtSec) {
      this.canSkip = true;
    }

    // Update Starting Grid formation animation
    this.startingGridManager.update(dt);

    // Phase State Machine Progression
    switch (this.currentPhase) {
      case 'STORY_OPENING': {
        const res = this.storyIntroManager.update(dt);
        this.activeTransmission = res.transmission;
        this.cinematicCamera.update(dt);

        if (this.phaseTimer >= 3.0 || res.isFinished) {
          this.setPhase('WORLD_REVEAL');
        }
        break;
      }

      case 'WORLD_REVEAL': {
        const res = this.storyIntroManager.update(dt);
        this.activeTransmission = res.transmission;
        this.cinematicCamera.update(dt);

        if (this.phaseTimer >= 2.5 || res.isFinished) {
          this.setPhase('FULL_ROUTE_FLYTHROUGH');
        }
        break;
      }

      case 'FULL_ROUTE_FLYTHROUGH': {
        const active = this.routePreviewManager.update(dt);
        if (!active) {
          this.setPhase('PLAYER_REVEAL');
        }
        break;
      }

      case 'PLAYER_REVEAL': {
        this.cinematicCamera.update(dt);
        if (this.phaseTimer >= this.config.playerReveal.durationSec) {
          this.setPhase('TRAVEL_TO_GRID');
        }
        break;
      }

      case 'TRAVEL_TO_GRID': {
        this.cinematicCamera.update(dt);
        if (this.phaseTimer >= 2.0) {
          this.setPhase('STARTING_GRID');
        }
        break;
      }

      case 'STARTING_GRID': {
        this.cinematicCamera.update(dt);
        if (this.phaseTimer >= 1.8) {
          this.setPhase('RACER_INTRO');
        }
        break;
      }

      case 'RACER_INTRO': {
        this.cinematicCamera.update(dt);
        if (this.phaseTimer >= 1.6) {
          this.setPhase('CAMERA_BLEND');
        }
        break;
      }

      case 'CAMERA_BLEND': {
        // 48.13 Seamless camera blend from cinematic cut into gameplay chase camera
        const blendFactor = Math.min(1.0, dt * 5.0);
        this.camera.position.lerp(gameplayCamPos, blendFactor);
        const curLook = new THREE.Vector3();
        this.camera.getWorldDirection(curLook);
        const targetDir = gameplayLookAt.clone().sub(this.camera.position).normalize();
        curLook.lerp(targetDir, blendFactor);
        this.camera.lookAt(this.camera.position.clone().add(curLook));
        this.camera.fov += (gameplayFov - this.camera.fov) * blendFactor;
        this.camera.updateProjectionMatrix();

        if (this.phaseTimer >= 0.9 || this.camera.position.distanceTo(gameplayCamPos) < 0.35) {
          this.setPhase('COUNTDOWN');
        }
        break;
      }

      case 'COUNTDOWN': {
        this.raceCountdownManager.update(dt, gameplayCamPos, gameplayLookAt, gameplayFov);
        // Camera remains in gameplay chase position with slight anticipation shake
        this.camera.position.copy(gameplayCamPos);
        this.camera.lookAt(gameplayLookAt);
        if (this.latestCountdownTelemetry?.cameraFovOffset) {
          this.camera.fov = gameplayFov + this.latestCountdownTelemetry.cameraFovOffset;
          this.camera.updateProjectionMatrix();
        }
        break;
      }

      case 'RACE_START': {
        const res = this.raceStartManager.update(dt, gameplayCamPos, gameplayLookAt, gameplayFov);
        if (this.phaseTimer >= 0.4) {
          this.setPhase('GAMEPLAY_TRANSITION');
        }
        break;
      }

      case 'GAMEPLAY_TRANSITION': {
        const res = this.raceStartManager.update(dt, gameplayCamPos, gameplayLookAt, gameplayFov);
        if (res.isTransitionComplete || this.phaseTimer >= 1.2) {
          this.setPhase('COMPLETE');
        }
        break;
      }

      case 'COMPLETE':
        this.isIntroActive = false;
        break;
    }

    // Build Traffic Light State for HUD
    let lightState: 'OFF' | 'RED' | 'YELLOW' | 'RED_YELLOW' | 'GREEN' | 'GO' = 'OFF';
    let trafficLights = { red: false, yellow: false, green: false };

    if (this.latestCountdownTelemetry) {
      lightState = this.latestCountdownTelemetry.lightState;
      if (lightState === 'RED') {
        trafficLights = { red: true, yellow: false, green: false };
      } else if (lightState === 'YELLOW') {
        trafficLights = { red: false, yellow: true, green: false };
      } else if (lightState === 'RED_YELLOW') {
        trafficLights = { red: true, yellow: true, green: false };
      } else if (lightState === 'GREEN' || lightState === 'GO') {
        trafficLights = { red: false, yellow: false, green: true };
      }
    }

    const currentCount = this.latestCountdownTelemetry?.displayNumber !== undefined
      ? this.latestCountdownTelemetry.displayNumber
      : this.countdownManager.getCurrentCount();

    // Build Telemetry for React HUD
    const telem: IntroHUDTelemetry = {
      isActive: this.isIntroActive,
      phase: this.currentPhase,
      phaseTime: this.phaseTimer,
      phaseDuration: 3.0,
      overallTime: this.overallTimer,
      totalDuration: this.config.openingCinematic.totalDurationSec,
      missionName: this.config.missionName,
      locationName: this.config.locationName,
      objectiveText: this.config.objectiveText,
      currentTransmission: this.activeTransmission,
      countdownNumber: currentCount,
      countdownStyle: this.config.countdownStyle,
      countdownEffects: this.config.countdownEffects,
      firstHazardWarning: {
        name: this.config.firstHazard.name,
        warningText: this.config.firstHazard.warningText,
        color: this.config.firstHazard.color,
      },
      rivalName: this.rivalInfo?.name,
      rivalShipId: this.rivalInfo?.shipId,
      rivalPersonality: this.rivalInfo?.personality,
      canSkip: this.canSkip,
      launchProgress: this.currentPhase === 'RACE_START' || this.currentPhase === 'GAMEPLAY_TRANSITION' ? Math.min(1.0, this.phaseTimer / 1.0) : 0,
      routePreview: this.latestRoutePreviewTelemetry,
      lightState,
      trafficLights,
    };

    this.callbacks.onTelemetryUpdate?.(telem);

    const isControlsLocked =
      this.currentPhase !== 'RACE_START' &&
      this.currentPhase !== 'GAMEPLAY_TRANSITION' &&
      this.currentPhase !== 'COMPLETE';

    return {
      isIntroActive: this.isIntroActive,
      phase: this.currentPhase,
      countdownNumber: currentCount,
      isControlsLocked,
    };
  }

  public cleanup() {
    this.isIntroActive = false;
    this.routePreviewManager.cleanup();
    this.startingGridManager.cleanup();
    this.raceCountdownManager.cleanup();
    this.countdownManager.reset();
    this.raceStartManager.reset();
  }
}

