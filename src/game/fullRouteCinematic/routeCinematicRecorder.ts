import { RouteShotDefinition, RoutePreviewTelemetry } from './routeCinematicTypes';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';

export class RouteCinematicRecorder {
  private pathConfig: ExtendedPathConfig;
  private totalDuration: number = 0;

  constructor(pathConfig: ExtendedPathConfig, shots: RouteShotDefinition[]) {
    this.pathConfig = pathConfig;
    this.totalDuration = shots.reduce((acc, s) => acc + s.durationSec, 0);
  }

  public setConfig(pathConfig: ExtendedPathConfig, shots: RouteShotDefinition[]) {
    this.pathConfig = pathConfig;
    this.totalDuration = shots.reduce((acc, s) => acc + s.durationSec, 0);
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
      estimatedTrackLengthKm: Math.round(this.pathConfig.totalDistanceUnits / 100) / 10,
    };
  }
}
