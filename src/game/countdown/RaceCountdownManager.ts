import * as THREE from 'three';
import { GameMode } from '../../types';
import { CosmicTrack } from '../trackData';
import { StartLightSystem, StartLightState } from './StartLightSystem';
import { CountdownController, CountdownState } from './CountdownController';
import { CountdownAudioController } from './CountdownAudioController';
import { RaceStartSequence } from './RaceStartSequence';

export interface RaceCountdownTelemetry {
  state: CountdownState;
  displayNumber: number | null;
  lightState: StartLightState;
  isControlsLocked: boolean;
  isRaceStarted: boolean;
  anticipationRatio: number; // 0 to 1
  engineIdleRumble: number; // 0 to 1
  cameraFovOffset: number;
}

export interface RaceCountdownCallbacks {
  onCountdownTick?: (count: number) => void;
  onRaceStart?: () => void;
  onTelemetryUpdate?: (telem: RaceCountdownTelemetry) => void;
  onCameraShake?: (intensity: number) => void;
  onFovKick?: (amount: number) => void;
}

export class RaceCountdownManager {
  private mode: GameMode;
  private track: CosmicTrack;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Subsystems
  public startLightSystem: StartLightSystem;
  public countdownController: CountdownController;
  public audioController: CountdownAudioController;
  public startSequence: RaceStartSequence;

  private callbacks: RaceCountdownCallbacks = {};
  private isRunning: boolean = false;
  private isFinished: boolean = false;

  // Camera blending (48.13)
  private isCameraBlending: boolean = false;
  private cameraBlendElapsed: number = 0;
  private cameraBlendDuration: number = 1.0;
  private blendStartPos: THREE.Vector3 = new THREE.Vector3();
  private blendStartLook: THREE.Vector3 = new THREE.Vector3();
  private blendStartFov: number = 65;

  // Environment effect intensity
  private envPulseIntensity: number = 0;
  private envPulseColor: THREE.Color = new THREE.Color(0x00f0ff);

  constructor(
    mode: GameMode,
    track: CosmicTrack,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    callbacks?: RaceCountdownCallbacks
  ) {
    this.mode = mode;
    this.track = track;
    this.scene = scene;
    this.camera = camera;
    if (callbacks) this.callbacks = callbacks;

    this.startLightSystem = new StartLightSystem(this.scene);
    this.audioController = new CountdownAudioController();
    this.startSequence = new RaceStartSequence(mode, {
      onControlsUnlocked: () => {
        // Unlocked
      },
      onOfficialTimerStart: () => {
        this.callbacks.onRaceStart?.();
      },
      onFovKick: amount => {
        this.callbacks.onFovKick?.(amount);
      },
    });

    this.countdownController = new CountdownController({
      onRedLight: () => {
        this.startLightSystem.setLightState('RED');
        this.startLightSystem.setCountdownNumber(3, this.mode);
        this.audioController.playRedTone();
        this.callbacks.onCameraShake?.(0.15);
      },
      onYellowLight: () => {
        this.startLightSystem.setLightState('YELLOW');
        this.startLightSystem.setCountdownNumber(2, this.mode);
        this.audioController.playYellowTone();
        this.callbacks.onCameraShake?.(0.25);
      },
      onAnticipation: () => {
        // 48.8 FINAL RED/YELLOW STATE
        this.startLightSystem.setLightState('RED_YELLOW');
        this.startLightSystem.setCountdownNumber(1, this.mode);
        this.audioController.playAnticipationTone();
      },
      onGreenLaunch: () => {
        // 48.9 GREEN LIGHT & 48.10 GO!
        this.startLightSystem.setLightState('GREEN');
        this.startLightSystem.setCountdownNumber(0, this.mode);
        this.audioController.playGreenLaunchSound();
        this.startSequence.executeGreenRelease();
        this.callbacks.onCameraShake?.(0.85);
      },
      onCountdownTick: count => {
        this.callbacks.onCountdownTick?.(count);
        if (count === 1) {
          this.audioController.playHighTensionTone();
          this.startLightSystem.setCountdownNumber(1, this.mode);
        }
      },
      onStateChange: (state, num) => {
        // Environment reaction (48.17)
        this.triggerEnvironmentResponse(state);
      },
    });
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
  }

  /**
   * Initializes 3D starting lights and mounts them at the start gate
   */
  public setupStartingGate(startT: number = 0) {
    const sample = this.track.getSampleAt(startT);
    this.startLightSystem.buildForMode(
      this.mode,
      sample.point,
      sample.tangent,
      sample.normal,
      sample.binormal
    );
  }

  /**
   * Begins the camera blend into chase view, followed immediately by RED light & countdown
   */
  public startWithCameraBlend(
    currentCamPos: THREE.Vector3,
    currentCamLookAt: THREE.Vector3,
    currentFov: number = 65,
    onReadyForRed?: () => void
  ) {
    this.isRunning = true;
    this.isFinished = false;
    this.isCameraBlending = true;
    this.cameraBlendElapsed = 0;
    this.cameraBlendDuration = 0.9;

    this.blendStartPos.copy(currentCamPos);
    this.blendStartLook.copy(currentCamLookAt);
    this.blendStartFov = currentFov;
  }

  /**
   * Trigger immediate countdown (e.g. if camera is already aligned or on skip)
   */
  public startCountdownDirect() {
    this.isRunning = true;
    this.isFinished = false;
    this.isCameraBlending = false;
    this.countdownController.start();
  }

  /**
   * 48.17 MODE-SPECIFIC ENVIRONMENT RESPONSE
   */
  private triggerEnvironmentResponse(state: CountdownState) {
    switch (this.mode) {
      case 'NEON_CIRCUIT':
        this.envPulseIntensity = state === 'GREEN_GO' ? 2.5 : 1.2;
        this.envPulseColor.setHex(0x00f0ff);
        break;
      case 'ASTEROID_RUN':
        this.envPulseIntensity = state === 'GREEN_GO' ? 2.0 : 0.8;
        this.envPulseColor.setHex(0xffaa00);
        break;
      case 'WORMHOLE_EXPRESS':
        this.envPulseIntensity = state === 'GREEN_GO' ? 3.0 : 1.5;
        this.envPulseColor.setHex(0x9900ff);
        break;
      case 'SOLAR_STORM':
        this.envPulseIntensity = state === 'GREEN_GO' ? 2.8 : 1.4;
        this.envPulseColor.setHex(0xff5500);
        break;
      case 'PLASMA_STORM':
        this.envPulseIntensity = state === 'GREEN_GO' ? 3.2 : 1.6;
        this.envPulseColor.setHex(0xcc00ff);
        break;
      case 'VOID_CHAMPIONSHIP':
        this.envPulseIntensity = state === 'GREEN_GO' ? 3.5 : 1.8;
        this.envPulseColor.setHex(0xffe600);
        break;
      default:
        this.envPulseIntensity = state === 'GREEN_GO' ? 2.0 : 1.0;
        this.envPulseColor.setHex(0x00ffff);
        break;
    }
  }

  public update(
    dt: number,
    gameplayCamPos: THREE.Vector3,
    gameplayLookAt: THREE.Vector3,
    gameplayFov: number = 60
  ): {
    isActive: boolean;
    isControlsLocked: boolean;
    isRaceStarted: boolean;
    countdownNumber: number | null;
  } {
    if (!this.isRunning && !this.isCameraBlending) {
      return {
        isActive: false,
        isControlsLocked: false,
        isRaceStarted: this.isFinished,
        countdownNumber: null,
      };
    }

    // 1. Camera Blending Phase (48.13)
    if (this.isCameraBlending) {
      this.cameraBlendElapsed += dt;
      const progress = Math.min(1.0, this.cameraBlendElapsed / this.cameraBlendDuration);
      // Smooth cubic ease out
      const tSmooth = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(this.blendStartPos, gameplayCamPos, tSmooth);
      const curLook = new THREE.Vector3().lerpVectors(this.blendStartLook, gameplayLookAt, tSmooth);
      this.camera.lookAt(curLook);
      this.camera.fov = this.blendStartFov + (gameplayFov - this.blendStartFov) * tSmooth;
      this.camera.updateProjectionMatrix();

      if (progress >= 1.0) {
        this.isCameraBlending = false;
        // Cinematic camera has smoothly returned to gameplay/chase position: START RED LIGHT!
        this.countdownController.start();
      }

      return {
        isActive: true,
        isControlsLocked: true,
        isRaceStarted: false,
        countdownNumber: 3,
      };
    }

    // 2. Countdown Update
    const updateRes = this.countdownController.update(dt);
    this.startLightSystem.update(dt);
    this.startSequence.update(dt);

    if (updateRes.state === 'FINISHED') {
      this.isFinished = true;
      this.isRunning = false;
    }

    // 3. Engine idle & anticipation scaling (48.5, 48.7)
    let engineIdleRumble = 0.2;
    let cameraFovOffset = 0;
    if (updateRes.state === 'RED' || updateRes.state === 'COUNT_3') {
      engineIdleRumble = 0.35;
    } else if (updateRes.state === 'COUNT_2') {
      engineIdleRumble = 0.55;
      cameraFovOffset = 0.5;
    } else if (updateRes.state === 'COUNT_1' || updateRes.state === 'ANTICIPATION') {
      engineIdleRumble = 0.9;
      cameraFovOffset = 1.2;
    } else if (updateRes.state === 'GREEN_GO') {
      engineIdleRumble = 1.0;
      cameraFovOffset = 3.5;
    }

    // 4. Telemetry dispatch
    let lightState: StartLightState = 'OFF';
    if (updateRes.state === 'RED' || updateRes.state === 'COUNT_3') lightState = 'RED';
    else if (updateRes.state === 'COUNT_2' || updateRes.state === 'COUNT_1') lightState = 'YELLOW';
    else if (updateRes.state === 'ANTICIPATION') lightState = 'RED_YELLOW';
    else if (updateRes.state === 'GREEN_GO') lightState = 'GREEN';

    const telem: RaceCountdownTelemetry = {
      state: updateRes.state,
      displayNumber: updateRes.displayNumber,
      lightState,
      isControlsLocked: updateRes.isControlsLocked,
      isRaceStarted: updateRes.isRaceStarted,
      anticipationRatio: Math.min(1.0, updateRes.elapsedInState / 1.0),
      engineIdleRumble,
      cameraFovOffset,
    };

    this.callbacks.onTelemetryUpdate?.(telem);

    return {
      isActive: this.isRunning,
      isControlsLocked: updateRes.isControlsLocked,
      isRaceStarted: updateRes.isRaceStarted,
      countdownNumber: updateRes.displayNumber,
    };
  }

  public syncFromNetwork(count: number) {
    this.countdownController.syncFromNetwork(count);
  }

  public cleanup() {
    this.isRunning = false;
    this.isFinished = false;
    this.isCameraBlending = false;
    this.startLightSystem.cleanup();
    this.countdownController.reset();
    this.startSequence.reset();
  }

  public getIsRunning(): boolean {
    return this.isRunning || this.isCameraBlending;
  }
}
