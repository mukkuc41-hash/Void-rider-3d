import * as THREE from 'three';
import { CinematicTrigger, CinematicShotType } from '../extendedPath/extendedPathTypes';

export interface CinematicEventData {
  id: string;
  title: string;
  subtitle: string;
  triggerT: number;
  durationSec: number;
  shotType: CinematicShotType;
  fovDelta: number;
  timeScale: number;
  cameraOffset: [number, number, number];
  lookAtOffset: [number, number, number];
  soundFx?: string;
}

export class CinematicEvent {
  public static fromTrigger(trigger: CinematicTrigger): CinematicEventData {
    return {
      id: trigger.id,
      title: trigger.title,
      subtitle: trigger.subtitle,
      triggerT: trigger.triggerT,
      durationSec: trigger.durationSec,
      shotType: trigger.shotType,
      fovDelta: trigger.fovDelta,
      timeScale: trigger.timeScale,
      cameraOffset: trigger.cameraOffset,
      lookAtOffset: trigger.lookAtOffset,
      soundFx: trigger.soundFx,
    };
  }
}
