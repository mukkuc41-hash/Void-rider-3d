import { RouteShotDefinition, RoutePreviewTelemetry, RouteDiagramData } from './routeCinematicTypes';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';
import { CosmicTrack } from '../trackData';
import { RouteDiagramGenerator } from './routeDiagramGenerator';

export class RouteCinematicRecorder {
  private track: CosmicTrack;
  private pathConfig: ExtendedPathConfig;
  private totalDuration: number = 0;
  private diagramData: RouteDiagramData | null = null;

  constructor(track: CosmicTrack, pathConfig: ExtendedPathConfig, shots: RouteShotDefinition[]) {
    this.track = track;
    this.pathConfig = pathConfig;
    this.totalDuration = shots.reduce((acc, s) => acc + s.durationSec, 0);
    this.regenerateDiagram();
  }

  public setConfig(track: CosmicTrack, pathConfig: ExtendedPathConfig, shots: RouteShotDefinition[]) {
    this.track = track;
    this.pathConfig = pathConfig;
    this.totalDuration = shots.reduce((acc, s) => acc + s.durationSec, 0);
    this.regenerateDiagram();
  }

  private regenerateDiagram() {
    try {
      this.diagramData = RouteDiagramGenerator.generate(this.track, this.pathConfig);
    } catch (err) {
      console.warn('Failed to generate route diagram:', err);
      this.diagramData = null;
    }
  }

  public computeTelemetry(
    currentShot: RouteShotDefinition,
    shotIndex: number,
    totalShots: number,
    shotElapsedSec: number,
    overallElapsedSec: number,
    currentSplineT: number
  ): RoutePreviewTelemetry {
    // Determine active sector at current spline T
    let activeSectorName = this.pathConfig.sectors[0]?.name || 'START SECTOR';
    let activeSectorIdx = 1;
    for (let i = 0; i < this.pathConfig.sectors.length; i++) {
      const sec = this.pathConfig.sectors[i];
      if (currentSplineT >= sec.startT && currentSplineT <= sec.endT) {
        activeSectorName = sec.name;
        activeSectorIdx = i + 1;
        break;
      }
    }

    const progress01 = Math.min(1.0, overallElapsedSec / Math.max(1, this.totalDuration));
    const timeRemainingSec = Math.max(0, this.totalDuration - overallElapsedSec);

    const diagramWithCamera: RouteDiagramData | undefined = this.diagramData
      ? {
          ...this.diagramData,
          cameraT: currentSplineT,
          currentSectorName: activeSectorName,
        }
      : undefined;

    return {
      isActive: true,
      shotId: currentShot.id,
      shotIndex,
      totalShots,
      shotName: currentShot.name,
      currentSplineT,
      progress01,
      timeRemainingSec,
      activeSectorName,
      activeSectorIndex: activeSectorIdx,
      totalSectors: this.pathConfig.sectors.length,
      highlightText: currentShot.highlightActionText,
      isScaleReveal: currentShot.isScaleReveal,
      estimatedTrackLengthKm: this.pathConfig.totalEquivalentKm || Math.round(this.pathConfig.targetSplineLength / 100) / 10,
      diagramData: diagramWithCamera,
    };
  }
}
