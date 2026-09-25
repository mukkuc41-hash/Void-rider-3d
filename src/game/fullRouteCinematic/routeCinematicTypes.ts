import * as THREE from 'three';
import { GameMode } from '../../types';

export type RouteCinematicShotId =
  | 'SHOT_1_ESTABLISHING'
  | 'SHOT_2_APPROACH_START'
  | 'SHOT_3_LOW_TRACK'
  | 'SHOT_4_HIGH_SPEED'
  | 'SHOT_5_SCALE_REVEAL'
  | 'SHOT_6_CORNER_DIVE'
  | 'SHOT_7_TUNNEL_RUN'
  | 'SHOT_8_BRANCH_JUNCTION'
  | 'SHOT_9_SET_PIECE_ORBIT'
  | 'SHOT_10_FINAL_ACCEL'
  | 'SHOT_11_FINISH_APPROACH'
  | 'SHOT_12_RETURN_START';

export interface RouteShotDefinition {
  id: RouteCinematicShotId;
  index: number; // 1 to 12
  name: string;
  durationSec: number;
  startSplineT: number;
  endSplineT: number;
  altitudeOffset: number;
  lookAheadT: number;
  fovStart: number;
  fovEnd: number;
  shakeIntensity: number;
  isScaleReveal: boolean;
  highlightActionText: string;
}

export interface RouteHighlightMarker {
  id: string;
  position: THREE.Vector3;
  type: 'CHECKPOINT' | 'SECTOR_GATE' | 'BRANCH_JUNCTION' | 'HAZARD_ZONE' | 'MAJOR_SET_PIECE' | 'FINISH_GATE';
  label: string;
  color: number;
  scale: number;
}

export interface RouteDiagramMarker {
  id: string;
  type: 'START' | 'CHECKPOINT' | 'BRANCH' | 'HAZARD' | 'FINAL_SECTOR' | 'FINISH';
  label: string;
  x: number;
  y: number;
  t: number;
  color: string;
  subtext?: string;
}

export interface RouteDiagramBranch {
  id: string;
  name: string;
  type: string;
  points: { x: number; y: number }[];
  color: string;
  riskLevel?: string;
}

export interface RouteDiagramData {
  points: { x: number; y: number }[];
  markers: RouteDiagramMarker[];
  branches: RouteDiagramBranch[];
  cameraT: number;
  currentSectorName: string;
  totalKm: number;
}

export interface RoutePreviewTelemetry {
  isActive: boolean;
  shotId: RouteCinematicShotId;
  shotIndex: number;
  totalShots: number;
  shotName: string;
  currentSplineT: number;
  progress01: number;
  timeRemainingSec: number;
  activeSectorName: string;
  activeSectorIndex: number;
  totalSectors: number;
  highlightText: string;
  isScaleReveal: boolean;
  estimatedTrackLengthKm: number;
  diagramData?: RouteDiagramData;
}

export interface FinishCinematicShot {
  durationSec: number;
  cameraStartOffset: [number, number, number];
  cameraEndOffset: [number, number, number];
  lookAtStartOffset: [number, number, number];
  lookAtEndOffset: [number, number, number];
  fovStart: number;
  fovEnd: number;
  timeScale: number; // For slow motion triumph
}

export interface ModeFinishCinematicConfig {
  modeId: GameMode;
  title: string;
  subtitle: string;
  victoryMessage: string;
  shots: FinishCinematicShot[];
  totalDurationSec: number;
  particleColor: number;
}
