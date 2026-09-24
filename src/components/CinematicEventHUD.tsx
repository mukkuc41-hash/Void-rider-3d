import React from 'react';
import { ActiveCinematicState, ExtendedPathTelemetry } from '../game/extendedPath/extendedPathTypes';
import { AlertTriangle, Compass, Sparkles } from 'lucide-react';

interface CinematicEventHUDProps {
  cinematicState: ActiveCinematicState | null;
  pathTelemetry: ExtendedPathTelemetry | null;
  isRacing: boolean;
}

export const CinematicEventHUD: React.FC<CinematicEventHUDProps> = ({
  cinematicState,
  pathTelemetry,
  isRacing,
}) => {
  if (!isRacing) return null;

  const isCinActive = cinematicState?.isActive || (cinematicState?.letterboxProgress || 0) > 0.02;
  const letterboxH = (cinematicState?.letterboxProgress || 0) * 8; // 0 to 8vh

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Cinematic Letterbox Bar */}
      <div
        className="w-full bg-black transition-all duration-150 ease-out"
        style={{ height: `${letterboxH}vh` }}
      />

      {/* Main Center Overlay Notifications */}
      <div className="relative flex flex-1 flex-col items-center justify-between p-4">
        {/* Cinematic Title & Subtitle Banner */}
        {isCinActive && cinematicState?.trigger && (
          <div
            className="mt-6 flex flex-col items-center transition-opacity duration-300"
            style={{ opacity: cinematicState.bannerOpacity }}
          >
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/75 px-4 py-1 text-xs font-black tracking-widest text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>CINEMATIC SEQUENCE</span>
            </div>
            <div className="mt-2 text-2xl font-black italic tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {cinematicState.trigger.title}
            </div>
            <div className="text-xs font-bold tracking-widest text-cyan-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {cinematicState.trigger.subtitle}
            </div>
          </div>
        )}

        {/* Hazard Zone Alert Banner */}
        {pathTelemetry?.activeHazardWarning && !isCinActive && (
          <div className="mt-8 flex items-center gap-2 rounded-md border border-amber-500/60 bg-amber-950/80 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-200 backdrop-blur-md animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>{pathTelemetry.activeHazardWarning}</span>
          </div>
        )}

        {/* Sector Progress & Telemetry Pill */}
        {pathTelemetry && (
          <div className="mb-2 flex flex-col items-center">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/80 px-3.5 py-1 text-[11px] font-bold tracking-wider text-slate-300 backdrop-blur-sm">
              <Compass className="h-3 w-3 text-cyan-400" />
              <span className="text-cyan-400">{pathTelemetry.currentSectorName}</span>
              <span className="text-slate-500">•</span>
              <span>{pathTelemetry.totalTrackKm.toFixed(1)} KM TRACK</span>
              {pathTelemetry.isClimaxSector && (
                <span className="rounded bg-red-600/80 px-1.5 py-0.2 text-[9px] font-black text-white animate-pulse">
                  CLIMAX
                </span>
              )}
            </div>
            {/* Sector Progress Bar */}
            <div className="mt-1 h-1 w-48 overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50">
              <div
                className="h-full bg-cyan-400 transition-all duration-100 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.round(pathTelemetry.currentSectorProgress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div
        className="w-full bg-black transition-all duration-150 ease-out"
        style={{ height: `${letterboxH}vh` }}
      />
    </div>
  );
};
