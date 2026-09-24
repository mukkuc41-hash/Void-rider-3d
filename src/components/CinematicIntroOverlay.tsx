import React, { useEffect, useState } from 'react';
import {
  Radio,
  AlertTriangle,
  Crosshair,
  FastForward,
  Compass,
  Activity,
  Flame,
  Zap,
  Target,
  Trophy,
} from 'lucide-react';
import { IntroHUDTelemetry } from '../game/cinematicIntro/cinematicTypes';

interface CinematicIntroOverlayProps {
  telemetry: IntroHUDTelemetry | null;
  onSkip?: () => void;
}

export const CinematicIntroOverlay: React.FC<CinematicIntroOverlayProps> = ({
  telemetry,
  onSkip,
}) => {
  const [pulseCount, setPulseCount] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        if (telemetry?.canSkip && onSkip) {
          onSkip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [telemetry?.canSkip, onSkip]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(c => (c + 1) % 100);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  if (!telemetry || !telemetry.isActive) return null;

  const {
    phase,
    missionName,
    locationName,
    objectiveText,
    currentTransmission,
    countdownNumber,
    countdownStyle,
    countdownEffects,
    firstHazardWarning,
    rivalName,
    canSkip,
    launchProgress,
  } = telemetry;

  const isStoryPhase =
    phase === 'STORY_OPENING' ||
    phase === 'WORLD_REVEAL' ||
    phase === 'PLAYER_REVEAL' ||
    phase === 'TRAVEL_TO_GRID' ||
    phase === 'STARTING_GRID' ||
    phase === 'RACER_INTRO';

  const isCountdownPhase = phase === 'COUNTDOWN';
  const isLaunchPhase = phase === 'RACE_START' || phase === 'GAMEPLAY_TRANSITION';

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-40 flex flex-col justify-between overflow-hidden"
      onClick={() => {
        if (canSkip && onSkip) onSkip();
      }}
    >
      {/* Cinematic Letterbox Top Bar */}
      <div className="w-full h-14 sm:h-18 bg-black/90 backdrop-blur-md border-b border-cyan-500/20 flex items-center justify-between px-6 z-10 transition-all duration-700">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
            LIVE BROADCAST // {phase.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono text-slate-400">
          <span className="hidden sm:inline">SECTOR STATUS: LIVE</span>
          <span className="text-cyan-400 font-bold">{locationName}</span>
        </div>
      </div>

      {/* Top Left: Mission Dossier Card (During Story & Reveal Phases) */}
      {isStoryPhase && (
        <div className="absolute top-20 left-6 sm:left-10 max-w-md animate-fadeIn z-20">
          <div className="bg-[#050c18]/90 border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-[10px] font-mono font-black text-cyan-400 tracking-widest uppercase">
                  MISSION BRIEFING
                </span>
              </div>
              <span className="text-[9px] font-mono text-cyan-300/70">SEC-OP // CLASSIFIED</span>
            </div>

            <div className="space-y-1.5 text-left">
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  MISSION
                </div>
                <div className="text-sm font-ui font-black text-white tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  {missionName}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  LOCATION
                </div>
                <div className="text-xs font-mono font-bold text-cyan-300">
                  {locationName}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  OBJECTIVE
                </div>
                <div className="text-xs font-mono font-semibold text-emerald-400 leading-tight">
                  {objectiveText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Right: Opening Hazard Warning Banner */}
      {firstHazardWarning && isStoryPhase && (
        <div className="absolute top-20 right-6 sm:right-10 max-w-xs animate-fadeIn z-20">
          <div className="bg-[#120509]/90 border border-rose-500/50 rounded-2xl p-3 shadow-[0_0_25px_rgba(244,63,94,0.3)] backdrop-blur-md text-right">
            <div className="flex items-center justify-end gap-1.5 text-rose-400 text-[10px] font-mono font-bold tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span>FIRST SECTOR HAZARD</span>
            </div>
            <div className="text-xs font-ui font-black text-rose-300 uppercase">
              {firstHazardWarning.name}
            </div>
            <div className="text-[10px] font-mono text-slate-300 mt-0.5">
              {firstHazardWarning.warningText}
            </div>
          </div>
        </div>
      )}

      {/* Rival Spotlight Card (During Racer Intro Phase) */}
      {phase === 'RACER_INTRO' && rivalName && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce z-20 pointer-events-none">
          <div className="bg-slate-950/95 border-2 border-fuchsia-500 rounded-2xl p-4 shadow-[0_0_40px_rgba(217,70,239,0.5)] flex items-center gap-4 text-left min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-950 border border-fuchsia-400 flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-fuchsia-400 animate-spin" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-fuchsia-400 tracking-widest font-black uppercase">
                KEY OPPONENT SPOTLIGHT
              </div>
              <div className="text-xl font-ui font-black text-white uppercase tracking-wider">
                {rivalName}
              </div>
              <div className="text-xs font-mono text-slate-300">
                AI BEHAVIOR: AGGRESSIVE TACTICAL
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center Screen: MODE-SPECIFIC COUNTDOWN SYSTEM (PHASE 7) */}
      {isCountdownPhase && countdownNumber !== null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
          {renderModeCountdown(countdownNumber, countdownStyle, countdownEffects)}
        </div>
      )}

      {/* Center Screen: RACE START LAUNCH EXPLOSION (PHASE 8 & 9) */}
      {isLaunchPhase && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
          <div className="relative flex flex-col items-center animate-ping">
            <div className="text-8xl sm:text-[140px] font-ui font-black tracking-widest text-emerald-400 drop-shadow-[0_0_60px_#39ff14]">
              ENGAGE!
            </div>
            <div className="mt-2 text-sm sm:text-lg font-mono font-bold tracking-widest text-cyan-300 uppercase">
              RACE CLOCK ACTIVE // BOOST OVERDRIVE RELEASED
            </div>
          </div>

          {/* Speed Streaks Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-cyan-500/20 pointer-events-none opacity-80"
            style={{ opacity: 1 - launchProgress }}
          />
        </div>
      )}

      {/* Bottom Center: Subtitles & Radio Transmission Bar */}
      {currentTransmission && isStoryPhase && (
        <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl z-20 animate-fadeIn pointer-events-none">
          <div className="bg-[#040914]/95 border border-cyan-400/60 rounded-2xl p-4 shadow-[0_0_35px_rgba(0,240,255,0.35)] backdrop-blur-md flex flex-col items-center text-center">
            {/* Transmission Meta Header */}
            <div className="flex items-center gap-3 mb-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                {currentTransmission.sender} {currentTransmission.callsign ? `// ${currentTransmission.callsign}` : ''}
              </div>
              {/* Audio Waveform Bars */}
              <div className="flex items-center gap-0.5 h-3">
                {[4, 8, 12, 6, 14, 10, 5, 11].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${((h + pulseCount * (i + 1)) % 14) + 3}px`,
                      animationDuration: `${0.3 + i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Transmission Text Transcript */}
            <div className="text-sm sm:text-base font-mono font-bold text-white tracking-wide leading-snug drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              "{currentTransmission.text}"
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right: Interactive Skip Button */}
      {canSkip && isStoryPhase && (
        <div className="absolute bottom-20 right-6 sm:right-10 pointer-events-auto z-30">
          <button
            onClick={e => {
              e.stopPropagation();
              if (onSkip) onSkip();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/80 text-cyan-300 hover:text-white text-xs font-mono font-bold tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer active:scale-95 group"
          >
            <span>SKIP INTRO</span>
            <FastForward className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline text-[10px] text-cyan-400/60 font-mono">
              [SPACE]
            </span>
          </button>
        </div>
      )}

      {/* Cinematic Letterbox Bottom Bar */}
      <div className="w-full h-14 sm:h-18 bg-black/90 backdrop-blur-md border-t border-cyan-500/20 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono text-slate-400">
          <span>AI PILOT GRID: SYNCHRONIZED</span>
          <span className="hidden sm:inline">TELEMETRY: OPTIMAL</span>
        </div>
        <div className="text-[10px] sm:text-xs font-mono text-cyan-400 tracking-wider">
          VOID-RIDER 3D // CINEMATIC ENGINE
        </div>
      </div>
    </div>
  );
};

/**
 * Render the distinct countdown styles for all 20 modes!
 */
function renderModeCountdown(
  count: number,
  style: string,
  effects: { primaryColor: string; secondaryColor: string; soundType: string; glitchIntensity: number; sublabel: string }
) {
  const isGo = count === 0;
  const numDisplay = isGo ? 'GO!' : count.toString();

  switch (style) {
    case 'SINGULARITY_DISTORTION':
      return (
        <div className="relative flex flex-col items-center animate-ping">
          {/* Gravitational Lensing Outer Ring */}
          <div className="absolute -inset-16 rounded-full border-4 border-dashed border-purple-500/50 animate-spin" />
          <div className="text-8xl sm:text-[130px] font-ui font-black text-purple-400 drop-shadow-[0_0_50px_#d000ff]">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs sm:text-sm font-mono font-bold tracking-widest text-cyan-300 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'NEON_HOLOGRAM':
      return (
        <div className="relative flex flex-col items-center animate-bounce">
          <div className="px-10 py-4 border-2 border-cyan-400 bg-cyan-950/70 rounded-3xl shadow-[0_0_40px_#00f0ff] backdrop-blur-md">
            <div className="text-8xl sm:text-[120px] font-ui font-black text-white drop-shadow-[0_0_30px_#ff00e5]">
              {numDisplay}
            </div>
          </div>
          <div className="mt-3 text-xs sm:text-sm font-mono font-bold text-fuchsia-300 tracking-widest">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'TACTICAL_HUD':
      return (
        <div className="relative flex flex-col items-center">
          {/* Tactical Crosshair Brackets */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-amber-400/80 rounded-2xl flex items-center justify-center relative shadow-[0_0_35px_#ffaa00]">
            <div className="absolute top-2 left-2 text-[9px] font-mono text-amber-300">RADAR LOCK</div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-300">RNG: 0.0M</div>
            <div className="text-8xl sm:text-[110px] font-mono font-black text-amber-400">
              {numDisplay}
            </div>
          </div>
          <div className="mt-3 text-xs font-mono font-bold text-amber-300">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'WORMHOLE_PULSE':
      return (
        <div className="relative flex flex-col items-center animate-pulse">
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 border-cyan-400/70 border-t-purple-500 animate-spin flex items-center justify-center shadow-[0_0_50px_#00f0ff]">
            <div className="text-8xl sm:text-[120px] font-ui font-black text-cyan-300">
              {numDisplay}
            </div>
          </div>
          <div className="mt-3 text-xs font-mono font-bold text-purple-300 tracking-wider">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'SOLAR_FLARE':
      return (
        <div className="relative flex flex-col items-center animate-ping">
          <div className="text-8xl sm:text-[130px] font-ui font-black text-orange-400 drop-shadow-[0_0_50px_#ff5500]">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-yellow-300 uppercase tracking-widest">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'GRAVITY_FLOATING':
      return (
        <div className="relative flex flex-col items-center animate-bounce">
          <div className="text-8xl sm:text-[125px] font-ui font-black text-cyan-200 drop-shadow-[0_0_40px_#ffffff] rotate-2">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'PLASMA_LIGHTNING':
      return (
        <div className="relative flex flex-col items-center">
          <div className="text-8xl sm:text-[130px] font-ui font-black text-fuchsia-400 drop-shadow-[0_0_45px_#b000ff] animate-pulse">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'SKYLINE_BILLBOARD':
      return (
        <div className="relative flex flex-col items-center">
          <div className="px-8 py-3 bg-slate-950/90 border-2 border-cyan-400 rounded-xl shadow-[0_0_35px_#00f0ff]">
            <div className="text-7xl sm:text-[110px] font-ui font-black text-cyan-300">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-fuchsia-300 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'DEBRIS_EMERGENCY':
      return (
        <div className="relative flex flex-col items-center animate-pulse">
          <div className="px-8 py-3 bg-red-950/90 border-2 border-red-500 rounded-xl shadow-[0_0_40px_#ff2200]">
            <div className="text-7xl sm:text-[110px] font-ui font-black text-red-400">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-amber-400 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'QUANTUM_GATE':
      return (
        <div className="relative flex flex-col items-center">
          <div className="px-6 py-2 border border-emerald-400/80 bg-slate-950/80 rounded-2xl shadow-[0_0_30px_#39ff14]">
            <div className="text-7xl sm:text-[110px] font-mono font-black text-emerald-400">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-emerald-300 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'COVERT_HEIST':
      return (
        <div className="relative flex flex-col items-center">
          <div className="px-8 py-3 border-2 border-rose-500 bg-black/90 rounded-xl shadow-[0_0_35px_#ff0055]">
            <div className="text-7xl sm:text-[110px] font-mono font-black text-rose-400">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-rose-300 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'DRONE_TARGETING':
      return (
        <div className="relative flex flex-col items-center">
          <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_40px_#ff0033] animate-pulse">
            <div className="text-7xl sm:text-[110px] font-ui font-black text-red-500">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-red-400 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'COLLAPSE_WARNING':
      return (
        <div className="relative flex flex-col items-center animate-bounce">
          <div className="px-8 py-3 border-4 border-amber-500 bg-amber-950/80 rounded-2xl shadow-[0_0_35px_#ffaa00]">
            <div className="text-7xl sm:text-[110px] font-ui font-black text-amber-300">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-amber-400 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'ORBITAL_RING':
      return (
        <div className="relative flex flex-col items-center animate-pulse">
          <div className="text-8xl sm:text-[120px] font-ui font-black text-cyan-300 drop-shadow-[0_0_40px_#00f0ff]">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-white uppercase tracking-widest">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'WARP_STRETCH':
      return (
        <div className="relative flex flex-col items-center scale-x-125">
          <div className="text-8xl sm:text-[130px] font-ui font-black text-cyan-400 drop-shadow-[0_0_50px_#ffffff]">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest scale-x-75">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'RIVAL_DUEL':
      return (
        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-6">
            <div className="text-xs font-mono font-bold text-cyan-400">YOU</div>
            <div className="text-8xl sm:text-[120px] font-ui font-black text-white drop-shadow-[0_0_40px_#ff0055]">
              {numDisplay}
            </div>
            <div className="text-xs font-mono font-bold text-rose-400">RIVAL</div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-fuchsia-300 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'RELAY_PADDOCK':
      return (
        <div className="relative flex flex-col items-center">
          <div className="px-8 py-3 border-2 border-emerald-400 bg-emerald-950/80 rounded-2xl shadow-[0_0_35px_#39ff14]">
            <div className="text-7xl sm:text-[110px] font-ui font-black text-emerald-300">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-emerald-400 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'SURVIVAL_ARENA':
      return (
        <div className="relative flex flex-col items-center">
          <div className="px-8 py-3 border-2 border-rose-600 bg-slate-950/90 rounded-2xl shadow-[0_0_40px_#ff0033]">
            <div className="text-7xl sm:text-[110px] font-ui font-black text-rose-400">
              {numDisplay}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-rose-400 uppercase">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'ANCIENT_GLYPH':
      return (
        <div className="relative flex flex-col items-center animate-pulse">
          <div className="text-8xl sm:text-[120px] font-ui font-black text-amber-400 drop-shadow-[0_0_45px_#ffaa00]">
            {numDisplay}
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            {effects.sublabel}
          </div>
        </div>
      );

    case 'CHAMPIONSHIP_STADIUM':
    default:
      return (
        <div className="relative flex flex-col items-center animate-bounce">
          <div className="px-10 py-3 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 border-2 border-amber-400 rounded-3xl shadow-[0_0_50px_#ffaa00]">
            <div className="text-8xl sm:text-[130px] font-ui font-black text-amber-300 drop-shadow-[0_0_40px_#ffaa00]">
              {numDisplay}
            </div>
          </div>
          <div className="mt-3 text-xs sm:text-sm font-mono font-bold text-cyan-300 uppercase tracking-widest">
            {effects.sublabel}
          </div>
        </div>
      );
  }
}
