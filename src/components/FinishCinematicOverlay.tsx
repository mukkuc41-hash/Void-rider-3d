import React, { useEffect } from 'react';
import { Trophy, FastForward, CheckCircle2 } from 'lucide-react';
import { FinishCinematicTelemetry } from '../game/fullRouteCinematic/finishCinematicManager';

interface FinishCinematicOverlayProps {
  telemetry: FinishCinematicTelemetry | null;
  onContinue: () => void;
}

export const FinishCinematicOverlay: React.FC<FinishCinematicOverlayProps> = ({
  telemetry,
  onContinue,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        if (telemetry?.canSkip) {
          onContinue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [telemetry?.canSkip, onContinue]);

  if (!telemetry || !telemetry.isActive) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-50 flex flex-col justify-between overflow-hidden"
      onClick={() => {
        if (telemetry.canSkip) onContinue();
      }}
    >
      {/* Top Cinematic Letterbox */}
      <div className="w-full h-16 sm:h-20 bg-black/90 backdrop-blur-md border-b border-amber-500/30 flex items-center justify-between px-8 z-10 animate-slideDown">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-amber-300 uppercase">
            RACE FINISH // VICTORY CINEMATIC
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <span className="hidden sm:inline">CHRONO-STATUS: LOCKED</span>
          <span className="text-amber-400 font-bold tracking-wider">
            CAMERA SHOT {telemetry.shotIndex} / {telemetry.totalShots}
          </span>
        </div>
      </div>

      {/* Center Screen: Grand Victory Announcement */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-6">
        <div className="flex flex-col items-center text-center animate-zoomIn max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-bounce" />
            <span className="px-3 py-1 rounded bg-amber-500/20 border border-amber-400/80 text-xs sm:text-sm font-mono font-bold text-amber-300 tracking-widest uppercase">
              CHECKERED FLAG // SECTOR CONQUERED
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-ui font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-amber-400 uppercase tracking-widest drop-shadow-[0_0_40px_rgba(251,191,36,0.8)]">
            {telemetry.title}
          </h1>

          <div className="mt-3 text-sm sm:text-lg font-mono font-bold text-cyan-300 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
            {telemetry.subtitle}
          </div>

          <div className="mt-2 text-xs sm:text-sm font-mono font-semibold text-emerald-400 uppercase tracking-widest">
            {telemetry.victoryMessage}
          </div>

          {telemetry.timeScale < 0.9 && (
            <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-950/80 border border-cyan-400/60 text-xs font-mono font-bold text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              TIME DILATION: {(1 / Math.max(0.1, telemetry.timeScale)).toFixed(1)}X SLOW MOTION
            </div>
          )}
        </div>
      </div>

      {/* Bottom Center / Right: Interactive Continue Button */}
      {telemetry.canSkip && (
        <div className="absolute bottom-24 right-8 pointer-events-auto z-30">
          <button
            onClick={e => {
              e.stopPropagation();
              onContinue();
            }}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-mono font-black text-sm tracking-wider shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all cursor-pointer active:scale-95 group"
          >
            <span>VIEW RACE RESULTS</span>
            <FastForward className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-xs text-black/70 font-mono">
              [SPACE / ENTER]
            </span>
          </button>
        </div>
      )}

      {/* Bottom Letterbox */}
      <div className="w-full h-16 sm:h-20 bg-black/90 backdrop-blur-md border-t border-amber-500/30 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>ALL ROUTE CHECKPOINTS VERIFIED</span>
        </div>
        <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
          VOID-RIDER 3D // REAL-TIME WEBGL CINEMATIC
        </div>
      </div>
    </div>
  );
};
