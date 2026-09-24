import * as THREE from 'three';
import { ModeIntroConfig, StoryScene, StoryTransmission } from './cinematicTypes';
import { CinematicCamera } from './cinematicCamera';
import { sound } from '../audio';

export class StoryIntroManager {
  private config: ModeIntroConfig;
  private currentSceneIndex: number = 0;
  private sceneElapsed: number = 0;
  private transmissionIndex: number = 0;
  private currentActiveTransmission: StoryTransmission | null = null;
  private cinematicCamera: CinematicCamera;
  private playerShip: THREE.Group | null = null;
  private startOrigin: THREE.Vector3 = new THREE.Vector3();
  private isFinished: boolean = false;

  constructor(config: ModeIntroConfig, cinematicCamera: CinematicCamera) {
    this.config = config;
    this.cinematicCamera = cinematicCamera;
  }

  public init(playerShip: THREE.Group | null, startOrigin: THREE.Vector3) {
    this.playerShip = playerShip;
    this.startOrigin.copy(startOrigin);
    this.currentSceneIndex = 0;
    this.sceneElapsed = 0;
    this.transmissionIndex = 0;
    this.currentActiveTransmission = null;
    this.isFinished = false;

    this.setupScene(0);
  }

  private setupScene(index: number) {
    const scenes = this.config.storyIntro.scenes;
    if (index >= scenes.length) {
      this.isFinished = true;
      return;
    }

    const scene = scenes[index];
    this.currentSceneIndex = index;
    this.sceneElapsed = 0;
    this.transmissionIndex = 0;

    // Convert scene relative offsets to world positions based on startOrigin
    const startPos = new THREE.Vector3(...scene.cameraStartOffset).add(this.startOrigin);
    const endPos = new THREE.Vector3(...scene.cameraEndOffset).add(this.startOrigin);
    const lookAtStart = new THREE.Vector3(...scene.lookAtStartOffset).add(this.startOrigin);
    const lookAtEnd = new THREE.Vector3(...scene.lookAtEndOffset).add(this.startOrigin);

    this.cinematicCamera.setCut({
      startPos,
      endPos,
      lookAtStart,
      lookAtEnd,
      fovStart: scene.fovStart,
      fovEnd: scene.fovEnd,
      durationSec: scene.durationSec,
    });

    this.cinematicCamera.triggerShake(this.config.introCamera.shake);
    sound.playCinematicSwoosh?.();
  }

  public update(dt: number): { isFinished: boolean; transmission: StoryTransmission | null } {
    if (this.isFinished) {
      return { isFinished: true, transmission: this.currentActiveTransmission };
    }

    const scenes = this.config.storyIntro.scenes;
    const scene = scenes[this.currentSceneIndex];
    if (!scene) {
      this.isFinished = true;
      return { isFinished: true, transmission: null };
    }

    this.sceneElapsed += dt;

    // Check transmissions for current scene
    if (scene.transmissions && this.transmissionIndex < scene.transmissions.length) {
      const trans = scene.transmissions[this.transmissionIndex];
      if (this.sceneElapsed >= trans.timeSec) {
        this.currentActiveTransmission = trans;
        this.transmissionIndex++;
        sound.playTransmissionBeep?.();
      }
    }

    // Check if scene complete
    if (this.sceneElapsed >= scene.durationSec) {
      if (this.currentSceneIndex + 1 < scenes.length) {
        this.setupScene(this.currentSceneIndex + 1);
      } else {
        this.isFinished = true;
      }
    }

    return {
      isFinished: this.isFinished,
      transmission: this.currentActiveTransmission,
    };
  }

  public getProgress(): number {
    const scenes = this.config.storyIntro.scenes;
    if (scenes.length === 0) return 1;
    const sceneFraction = 1 / scenes.length;
    const currentScene = scenes[this.currentSceneIndex];
    const inSceneProgress = currentScene ? Math.min(1, this.sceneElapsed / currentScene.durationSec) : 1;
    return (this.currentSceneIndex + inSceneProgress) * sceneFraction;
  }
}
