import React, { useRef, useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Clock,
  Pause,
  Camera,
  AlertTriangle,
  AlertOctagon,
  Magnet,
  RotateCcw,
  Wind,
  ChevronsUp,
  Wrench,
  Radio,
  Hourglass,
  Anchor,
  Copy,
  Flame,
  Eye,
  Target,
  Crosshair,
  Rocket,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import {
  ActivePowerUp,
  BeamTelemetry,
  CameraMode,
  DynamicTrackEvent,
  PlayerInput,
  ShipDamageZones,
  MissileTelemetry,
  ActiveShieldTelemetry,
  MinimapTelemetry,
} from '../types';
import { ActiveJunctionTelemetry, BranchRouteDirection } from '../game/junctionSystem';
import { JunctionHUD } from './JunctionHUD';
import { InteractiveMinimap } from './InteractiveMinimap';
import { ModeHUDTelemetry } from '../game/modeManager';
import { SingularityTelemetry } from '../game/blackHoleSystem';

interface RaceHUDProps {
  speed: number;
  boost: number;
  currentLap: number;
  totalLaps: number;
  rank: number;
  totalPlayers: number;
  checkpoint: number;
  totalCheckpoints: number;
  countdown: number | null;
  activeEvent: DynamicTrackEvent | null;
  hazardHitMessage: string | null;
  shortcutMessage: string | null;
  powerUps: ActivePowerUp[];
  hullHealth: number;
  sessionCredits: number;
  distanceMeters: number;
  milestoneMessage: string | null;
  isWrongWay: boolean;
  destroyedMessage: string | null;
  respawnTimeRemaining: number;
  currentLapMs: number;
  bestLapMs: number;
  cameraMode: CameraMode;
  trackId?: string;
  damageZones?: ShipDamageZones;
  isSpectator?: boolean;
  spectatorTargetName?: string;
  onNextSpectatorTarget?: () => void;
  onTogglePause: () => void;
  onToggleCamera: () => void;
  onInputChange?: (input: Partial<PlayerInput>) => void;
  onRecover?: () => void;
  beamTelemetry?: BeamTelemetry | null;
  junctionTelemetry?: ActiveJunctionTelemetry | null;
  onSelectRoute?: (direction: BranchRouteDirection) => void;
  onCommitRoute?: () => void;
  modeTelemetry?: ModeHUDTelemetry | null;
  singularityTelemetry?: SingularityTelemetry | null;
  missileTelemetry?: MissileTelemetry | null;
  activeShieldTelemetry?: ActiveShieldTelemetry | null;
  minimapTelemetry?: MinimapTelemetry | null;
  onFireMissile?: () => void;
  onActivateShield?: () => void;
  onToggleMinimapMode?: () => void;
  onZoomInMinimap?: () => void;
  onZoomOutMinimap?: () => void;
  onResetMinimapZoom?: () => void;
  onToggleMinimapExpand?: () => void;
  isAIRaceActive?: boolean;
  isAIDebugOpen?: boolean;
  onToggleAIDebug?: () => void;
  isIntroActive?: boolean;
}

const SECTOR_NAMES: Record<string, string> = {
  circuit_alpha: 'SECTOR ALPHA',
  neon_orbit: 'NEON ORBIT',
  void_rift: 'VOID RIFT',
  asteroid_run: 'ASTEROID RUN',
  cosmic_ring: 'COSMIC RING',
  quantum_highway: 'QUANTUM HWY',
  nebula_rift: 'NEBULA RIFT',
};

export const RaceHUD: React.FC<RaceHUDProps> = ({
  speed,
  boost,
  currentLap,
  totalLaps,
  rank,
  totalPlayers,
  checkpoint,
  totalCheckpoints,
  countdown,
  activeEvent,
  hazardHitMessage,
  shortcutMessage,
  powerUps,
  hullHealth,
  sessionCredits,
  distanceMeters,
  milestoneMessage,
  isWrongWay,
  destroyedMessage,
  respawnTimeRemaining,
  currentLapMs,
  bestLapMs,
  cameraMode,
  trackId = 'circuit_alpha',
  damageZones,
  isSpectator = false,
  spectatorTargetName,
  onNextSpectatorTarget,
  onTogglePause,
  onToggleCamera,
  onInputChange,
  onRecover,
  beamTelemetry,
  junctionTelemetry,
  onSelectRoute,
  onCommitRoute,
  modeTelemetry,
  singularityTelemetry,
  missileTelemetry,
  activeShieldTelemetry,
  minimapTelemetry,
  onFireMissile,
  onActivateShield,
  onToggleMinimapMode,
  onZoomInMinimap,
  onZoomOutMinimap,
  onResetMinimapZoom,
  onToggleMinimapExpand,
  isAIRaceActive,
  isAIDebugOpen,
  onToggleAIDebug,
  isIntroActive,
}) => {
  // Joystick State
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [touchActive, setTouchActive] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Format race timer: mm:ss. and hundredths (SS)
  const formatMinSec = (ms: number) => {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatHundredths = (ms: number) => {
    if (ms <= 0) return '00';
    const hundredths = Math.floor((ms % 1000) / 10);
    return hundredths.toString().padStart(2, '0');
  };

  // Joystick pointer handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setTouchActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId === pointerIdRef.current) {
      pointerIdRef.current = null;
      setTouchActive(false);
      setStickPos({ x: 0, y: 0 });
      onInputChange?.({ steer: 0, throttle: 0 });
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const maxRadius = (rect.width / 2) * 0.72;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    setStickPos({ x: deltaX, y: deltaY });

    const steer = Math.max(-1, Math.min(1, deltaX / maxRadius));
    // Invert Y so pushing up provides forward acceleration
    const throttle = Math.max(-1, Math.min(1, -deltaY / maxRadius));

    onInputChange?.({
      steer: Math.abs(steer) > 0.06 ? steer : 0,
      throttle: Math.abs(throttle) > 0.06 ? throttle : 0,
    });
  };

  // Compute Radar Player Blip Coordinates along the loop
  const totalGates = Math.max(1, totalCheckpoints);
  const gateProgress = (checkpoint % totalGates) / totalGates;
  const radarAngle = gateProgress * Math.PI * 2 - Math.PI / 2;
  const radarPlayerX = 50 + 26 * Math.cos(radarAngle);
  const radarPlayerY = 50 + 26 * Math.sin(radarAngle) * (1 - 0.25 * Math.sin(radarAngle));

  const sectorTitle = SECTOR_NAMES[trackId] || 'SECTOR ALPHA';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
      {/* ================= TOP TELEMETRY SECTION ================= */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Logo & Position / Lap Card */}
        <div className="flex flex-col items-start select-none">
          <div className="text-[#00f0ff] font-ui font-black italic tracking-widest text-lg sm:text-xl drop-shadow-[0_0_12px_rgba(0,240,255,0.85)] leading-tight">
            VOID-RIDER 3D
          </div>
          <div className="text-[#ff00e5] font-ui font-bold italic tracking-wider text-[10px] sm:text-xs drop-shadow-[0_0_8px_rgba(255,0,229,0.7)] mt-[-1px]">
            RACE BEYOND LIMITS
          </div>

          {/* Position & Lap Box */}
          <div className="mt-2.5 flex flex-col bg-[#050b14]/90 border border-cyan-500/40 rounded-2xl p-2 sm:p-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <div className="flex items-center gap-3">
              {/* Position */}
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold text-cyan-400/80 tracking-wider">
                  POSITION
                </span>
                <div className="flex items-baseline mt-0.5">
                  <span className="text-cyan-300 bg-cyan-950/90 border border-cyan-400/70 rounded px-1.5 py-0.5 font-ui font-black text-xl sm:text-2xl leading-none">
                    {String(rank || 6).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-500/70 ml-1">
                    /{String(totalPlayers || 1).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Lap */}
              <div className="flex flex-col border-l border-slate-800 pl-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">
                  LAP
                </span>
                <div className="flex items-baseline mt-0.5">
                  <span className="text-white bg-slate-800/90 border border-slate-600/70 rounded px-1.5 py-0.5 font-ui font-black text-xl sm:text-2xl leading-none">
                    {String(Math.min(currentLap, totalLaps) || 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 ml-1">
                    /{String(totalLaps || 2).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 horizontal indicator segments */}
            <div className="flex items-center gap-1.5 mt-2">
              {[0, 1, 2, 3].map(seg => {
                const activeSeg = Math.floor((checkpoint / Math.max(1, totalCheckpoints)) * 4);
                return (
                  <div
                    key={seg}
                    className={`h-0.5 w-4 rounded-full transition-all duration-300 ${
                      seg <= activeSeg
                        ? 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]'
                        : 'bg-slate-700/60'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Hull & Systems Damage Card */}
          <div className="mt-2 flex flex-col bg-[#050b14]/90 border border-slate-700/60 rounded-xl p-2 backdrop-blur-md min-w-[150px]">
            <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-400">
              <span>HULL INTEGRITY</span>
              <span className={hullHealth < 35 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}>
                {Math.round(hullHealth)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-200 ${
                  hullHealth < 35 ? 'bg-rose-500' : hullHealth < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, hullHealth))}%` }}
              />
            </div>
            {damageZones && (
              <div className="grid grid-cols-4 gap-1 mt-1.5 text-[7px] font-mono text-center">
                <div className={`px-1 py-0.5 rounded ${damageZones.frontHull > 40 ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse' : 'bg-slate-900/60 text-slate-400'}`}>
                  NOSE
                </div>
                <div className={`px-1 py-0.5 rounded ${damageZones.leftWing > 40 ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse' : 'bg-slate-900/60 text-slate-400'}`}>
                  L-WING
                </div>
                <div className={`px-1 py-0.5 rounded ${damageZones.rightWing > 40 ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse' : 'bg-slate-900/60 text-slate-400'}`}>
                  R-WING
                </div>
                <div className={`px-1 py-0.5 rounded ${damageZones.rearEngine > 40 ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse' : 'bg-slate-900/60 text-slate-400'}`}>
                  ENG
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Center: Mode & Singularity Telemetry Banner */}
        {singularityTelemetry ? (
          <div className="flex flex-col items-center pointer-events-none bg-[#050b14]/95 border border-purple-500/80 rounded-2xl px-3.5 py-1.5 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.35)] min-w-[200px]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-purple-300 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>MODE 01: SINGULARITY RUN</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
              <div className="text-slate-300">
                HORIZON: <span className={singularityTelemetry.distanceToHorizon < 200 ? 'text-red-400 font-bold animate-pulse' : 'text-purple-300'}>{Math.round(singularityTelemetry.distanceToHorizon)}M</span>
              </div>
              <div className="text-slate-300">
                GRAVITY: <span className="text-amber-400 font-bold">{Math.round(singularityTelemetry.gravitationalPull)} M/S²</span>
              </div>
              <div className="text-slate-300">
                ESCAPE PORTAL: <span className="text-cyan-400 font-bold">{Math.round(singularityTelemetry.escapePortalDistance)}M</span>
              </div>
            </div>
            {singularityTelemetry.warningAlert && (
              <div className="mt-0.5 text-[9px] font-mono font-bold text-red-400 tracking-wider animate-pulse">
                {singularityTelemetry.warningAlert}
              </div>
            )}
          </div>
        ) : modeTelemetry ? (
          <div className="flex flex-col items-center pointer-events-none bg-[#050b14]/90 border border-cyan-500/40 rounded-2xl px-3.5 py-1.5 backdrop-blur-md shadow-[0_0_18px_rgba(0,240,255,0.2)] min-w-[190px]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{modeTelemetry.modeName.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] font-mono">
              <span className="text-white font-bold">{modeTelemetry.primaryMetric}</span>
              {modeTelemetry.secondaryMetric && (
                <span className="text-slate-400">{modeTelemetry.secondaryMetric}</span>
              )}
            </div>
            {modeTelemetry.warningText && (
              <div className="text-[9px] font-mono font-bold text-amber-400 animate-pulse">
                {modeTelemetry.warningText}
              </div>
            )}
          </div>
        ) : null}

        {/* Top Center: Spectator Broadcast Banner */}
        {isSpectator && (
          <div className="flex flex-col items-center pointer-events-auto bg-[#050b14]/90 border border-purple-500/60 rounded-2xl px-4 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 tracking-widest">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>SPECTATOR BROADCAST</span>
            </div>
            <div className="text-white font-ui font-black text-sm tracking-wider mt-0.5">
              OBSERVING: <span className="text-cyan-400">{spectatorTargetName || 'LEAD PILOT'}</span>
            </div>
            {onNextSpectatorTarget && (
              <button
                onClick={onNextSpectatorTarget}
                className="mt-1.5 px-3 py-1 bg-purple-900/60 hover:bg-purple-850 border border-purple-400/50 rounded-lg text-[10px] font-mono font-bold text-white uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                SWITCH PILOT (SPACE)
              </button>
            )}
          </div>
        )}

        {/* Top Right: Camera, Pause, Race Timer & Minimap Radar */}
        <div className="flex flex-col items-end gap-2 sm:gap-2.5 select-none">
          {/* Camera & Pause Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleCamera}
              className="w-9 h-9 rounded-xl bg-[#060c18]/85 border border-cyan-500/40 text-cyan-400 hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-md cursor-pointer"
              title={`Camera Mode: ${cameraMode}`}
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePause}
              className="w-9 h-9 rounded-xl bg-[#060c18]/85 border border-cyan-500/40 text-cyan-400 hover:text-white active:scale-95 flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Pause Race"
            >
              <Pause className="w-4 h-4" />
            </button>
            {isAIRaceActive && onToggleAIDebug && (
              <button
                onClick={onToggleAIDebug}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isAIDebugOpen
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_#00f0ff]'
                    : 'bg-[#060c18]/85 border-cyan-500/40 text-slate-400 hover:text-cyan-300'
                }`}
                title="Toggle AI Intelligence Telemetry [O]"
              >
                <Cpu className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Race Timer Card */}
          <div className="flex flex-col items-end bg-[#050b14]/90 border border-cyan-500/40 rounded-2xl p-2 sm:p-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)] min-w-[125px]">
            <span className="text-[9px] font-mono font-bold text-cyan-400/80 tracking-widest uppercase">
              RACE TIMER
            </span>
            <div className="flex items-baseline font-mono font-bold mt-0.5">
              <span className="text-lg text-white font-bold tracking-wider">
                {formatMinSec(currentLapMs)}.
              </span>
              <span className="text-lg text-[#ff00e5] font-black tracking-wider">
                {formatHundredths(currentLapMs)}
              </span>
            </div>
            <div className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider mt-0.5">
              GATE {checkpoint}/{totalCheckpoints}
            </div>
          </div>

          {/* Interactive Dynamic HUD Minimap */}
          {minimapTelemetry ? (
            <div className="pointer-events-auto mt-1">
              <InteractiveMinimap
                telemetry={minimapTelemetry}
                onToggleMode={onToggleMinimapMode}
                onZoomIn={onZoomInMinimap}
                onZoomOut={onZoomOutMinimap}
                onResetZoom={onResetMinimapZoom}
                onToggleExpand={onToggleMinimapExpand}
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border border-cyan-500/40 bg-[#040812]/90 backdrop-blur-md relative flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)] pointer-events-none mt-1">
              <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="16" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1="50" y1="4" x2="50" y2="96" stroke="#00f0ff" strokeWidth="0.6" strokeDasharray="2,2" />
                <line x1="4" y1="50" x2="96" y2="50" stroke="#00f0ff" strokeWidth="0.6" strokeDasharray="2,2" />
              </svg>
              <div className="absolute bottom-1.5 text-[8px] font-mono font-bold text-cyan-300 tracking-widest uppercase text-center w-full">
                {sectorTitle}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= SCREEN CENTER ALERTS & COUNTDOWN ================= */}
      <div className="my-auto flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
        {/* Race Start Countdown */}
        {!isIntroActive && countdown !== null && countdown > 0 && (
          <div className="animate-ping text-7xl sm:text-9xl font-ui font-black text-cyan-400 drop-shadow-[0_0_35px_#00f0ff]">
            {countdown}
          </div>
        )}
        {!isIntroActive && countdown === 0 && (
          <div className="text-7xl sm:text-9xl font-ui font-black text-emerald-400 drop-shadow-[0_0_35px_#39ff14] animate-bounce">
            ENGAGE!
          </div>
        )}

        {/* Wrong Way Warning Banner */}
        {isWrongWay && (
          <div className="px-6 py-3 rounded-2xl bg-rose-600/90 border-2 border-white text-white font-ui font-black text-xl tracking-widest uppercase shadow-[0_0_35px_#ff0055] animate-pulse flex items-center gap-3">
            <AlertOctagon className="w-7 h-7 animate-bounce" />
            WRONG WAY! REVERSE COURSE
          </div>
        )}

        {/* Destruction & Respawn Alert */}
        {destroyedMessage && (
          <div className="p-4 rounded-3xl bg-slate-950/90 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] flex flex-col items-center animate-fadeIn">
            <div className="text-xl font-ui font-black text-rose-500 uppercase tracking-widest">
              {destroyedMessage}
            </div>
            <div className="text-xs font-mono text-slate-300 mt-1">
              RECONSTRUCTING HULL IN {respawnTimeRemaining.toFixed(1)}s
            </div>
          </div>
        )}

        {/* Hazard Hit / Deflect Notification */}
        {hazardHitMessage && (
          <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400 text-cyan-300 text-xs font-mono tracking-wider shadow-lg">
            {hazardHitMessage}
          </div>
        )}

        {/* Active Dynamic Hazard Alert Banner */}
        {activeEvent && (
          <div className="px-4 py-1.5 rounded-full bg-fuchsia-950/90 border border-fuchsia-400 text-fuchsia-300 text-xs font-mono font-bold tracking-wider shadow-[0_0_15px_rgba(255,0,229,0.4)] flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-fuchsia-400" />
            <span>{activeEvent.title}</span>
          </div>
        )}

        {/* Milestone Popups */}
        {milestoneMessage && (
          <div className="px-5 py-2 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-ui font-black uppercase tracking-wider shadow-[0_0_20px_#ffaa00] animate-bounce">
            {milestoneMessage}
          </div>
        )}

        {/* Shortcut Alert */}
        {shortcutMessage && (
          <div className="px-5 py-2 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 text-xs font-ui font-black uppercase tracking-wider shadow-[0_0_20px_#ff00e5] animate-bounce">
            WARP PASSAGE: {shortcutMessage}
          </div>
        )}

        {/* Guided Homing Missile Target Lock Reticle */}
        {missileTelemetry?.hasTargetLock && missileTelemetry.targetInfo && (
          <div className="flex flex-col items-center pointer-events-none select-none transition-all duration-150 animate-fadeIn mb-2">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-red-500 rounded-2xl rotate-45 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(255,51,102,0.6)]">
                <div className="w-14 h-14 border border-dashed border-red-400/90 -rotate-45 flex items-center justify-center">
                  <Crosshair className="w-6 h-6 text-red-400 animate-spin" />
                </div>
              </div>
              <div className="absolute -top-2 px-2 py-0.5 bg-red-950/95 border border-red-500 rounded text-[9px] font-mono font-bold text-red-300 tracking-wider shadow">
                MISSILE LOCK // [M]
              </div>
            </div>

            <div className="mt-2 px-3 py-1.5 rounded-xl bg-black/90 border border-red-500/70 text-red-300 text-[10px] font-mono font-bold tracking-wider flex items-center gap-3 shadow-[0_0_15px_rgba(255,0,85,0.4)]">
              <Rocket className="w-4 h-4 text-red-400 animate-bounce" />
              <span>{missileTelemetry.targetInfo.name.toUpperCase()}</span>
              <span className="text-white">{Math.round(missileTelemetry.targetInfo.distance)}M</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-cyan-300">SHD</span>
                <div className="w-10 h-1.5 bg-slate-800 rounded overflow-hidden">
                  <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${Math.max(0, Math.min(100, missileTelemetry.targetInfo.shield))}%` }} />
                </div>
                <span className="text-[9px] text-rose-300">HUL</span>
                <div className="w-10 h-1.5 bg-slate-800 rounded overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-75" style={{ width: `${Math.max(0, Math.min(100, missileTelemetry.targetInfo.hull))}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Asteroid Destruction Beam Target Reticle & HUD Lock */}
        {beamTelemetry && (
          <div className="flex flex-col items-center pointer-events-none select-none transition-all duration-150">
            {beamTelemetry.hasTargetLock ? (
              <div className="flex flex-col items-center animate-fadeIn">
                <div className="relative flex items-center justify-center">
                  {/* Animated Locking Brackets */}
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 transition-all duration-100 flex items-center justify-center ${
                      beamTelemetry.isFiring
                        ? 'border-rose-500 scale-90 shadow-[0_0_25px_#ff0055]'
                        : 'border-cyan-400/80 scale-100 shadow-[0_0_15px_#00f0ff]'
                    }`}
                  >
                    {/* Crosshair ticks */}
                    <div className="absolute -top-1 w-0.5 h-3 bg-cyan-300" />
                    <div className="absolute -bottom-1 w-0.5 h-3 bg-cyan-300" />
                    <div className="absolute -left-1 w-3 h-0.5 bg-cyan-300" />
                    <div className="absolute -right-1 w-3 h-0.5 bg-cyan-300" />
                    <div
                      className={`w-4 h-4 rounded-full border border-dashed transition-all ${
                        beamTelemetry.isFiring ? 'border-rose-300 animate-spin' : 'border-cyan-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Target telemetry badge */}
                <div className="mt-1.5 px-3 py-1 rounded-xl bg-slate-950/90 border border-cyan-400/70 text-cyan-300 text-[10px] font-mono font-bold tracking-wider flex items-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                  <Crosshair
                    className={`w-3.5 h-3.5 ${
                      beamTelemetry.isFiring
                        ? 'text-rose-400 animate-spin'
                        : 'text-cyan-400 animate-pulse'
                    }`}
                  />
                  <span>TARGET LOCK [{beamTelemetry.targetType || 'ASTEROID'}]</span>
                  <span className="text-white">{Math.round(beamTelemetry.targetDistance)}M</span>
                  {beamTelemetry.targetMaxHealth > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className={`h-full transition-all duration-75 ${
                            beamTelemetry.targetHealth < 35 ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                (beamTelemetry.targetHealth / beamTelemetry.targetMaxHealth) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-300">
                        {Math.round(beamTelemetry.targetHealth)}/{beamTelemetry.targetMaxHealth}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40 hover:opacity-70 transition-opacity">
                <div className="text-[13px] font-mono font-bold text-cyan-300/80 leading-none mb-0.5">
                  +
                </div>
                <div className="text-[7.5px] font-mono tracking-widest text-cyan-400/70 uppercase">
                  TARGET
                </div>
              </div>
            )}
          </div>
        )}

        {/* Asteroid Shatter Combo Banner */}
        {beamTelemetry && beamTelemetry.comboCount > 1 && (
          <div className="flex flex-col items-center animate-bounce pointer-events-none select-none">
            <div className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/90 via-rose-500/90 to-amber-500/90 border-2 border-amber-300 text-slate-950 font-ui font-black text-sm uppercase tracking-wider shadow-[0_0_25px_#ffaa00] flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-950 fill-amber-300" />
              <span>SHATTER COMBO x{beamTelemetry.comboCount}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-amber-300 text-[10px] font-mono">
                +{beamTelemetry.comboMultiplier.toFixed(1)}x VC
              </span>
            </div>
            {/* Combo Timer Bar */}
            <div className="w-32 h-1 bg-slate-900/90 rounded-full mt-1 overflow-hidden border border-amber-500/50">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (beamTelemetry.comboTimeRemaining / 3.0) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Active Power-Ups Shelf */}
        {powerUps.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 max-w-lg">
            {powerUps.map(p => {
              let Icon = Zap;
              let colorClass = 'border-amber-400 text-amber-300 bg-amber-950/80 shadow-[0_0_15px_#ffaa00]';
              let label = p.type.replace(/_/g, ' ');

              switch (p.type) {
                case 'NITRO_BOOST':
                  Icon = Flame;
                  colorClass = 'border-orange-500 text-orange-300 bg-orange-950/85 shadow-[0_0_15px_#ff5500]';
                  label = 'NITRO BOOST';
                  break;
                case 'ENERGY_SHIELD':
                case 'PHASE_SHIELD':
                  Icon = Shield;
                  colorClass = 'border-cyan-400 text-cyan-300 bg-cyan-950/85 shadow-[0_0_15px_#00f0ff]';
                  label = 'ENERGY SHIELD';
                  break;
                case 'REPAIR_CORE':
                  Icon = Wrench;
                  colorClass = 'border-emerald-400 text-emerald-300 bg-emerald-950/85 shadow-[0_0_15px_#39ff14]';
                  label = 'NANO REPAIR';
                  break;
                case 'MAGNET_BOOST':
                case 'CREDIT_MAGNET':
                  Icon = Magnet;
                  colorClass = 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-950/85 shadow-[0_0_15px_#ff00e5]';
                  label = 'MAG VORTEX';
                  break;
                case 'EMP_PULSE':
                  Icon = Radio;
                  colorClass = 'border-blue-400 text-blue-300 bg-blue-950/85 shadow-[0_0_15px_#00e5ff]';
                  label = 'EMP DISCHARGE';
                  break;
                case 'TIME_WARP':
                  Icon = Hourglass;
                  colorClass = 'border-purple-400 text-purple-300 bg-purple-950/85 shadow-[0_0_15px_#9d4edd]';
                  label = 'TIME DILATION';
                  break;
                case 'GRAVITY_BURST':
                  Icon = Anchor;
                  colorClass = 'border-yellow-400 text-yellow-300 bg-yellow-950/85 shadow-[0_0_15px_#ffcc00]';
                  label = 'GRAV CLAMP';
                  break;
                case 'DECOY_SHIP':
                  Icon = Copy;
                  colorClass = 'border-pink-400 text-pink-300 bg-pink-950/85 shadow-[0_0_15px_#ff007f]';
                  label = 'PHANTOM DECOY';
                  break;
                case 'TEMPORARY_SPEED_SURGE':
                case 'HYPER_BOOST':
                  Icon = Zap;
                  colorClass = 'border-rose-400 text-rose-300 bg-rose-950/85 shadow-[0_0_15px_#ff0055]';
                  label = 'SPEED SURGE';
                  break;
              }

              return (
                <div
                  key={p.type}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono backdrop-blur-md ${colorClass} animate-pulse`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-bold tracking-wide">{label}</span>
                  <span className="font-mono font-black opacity-90">{p.remainingTime}s</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= BOTTOM CONTROLS & TELEMETRY ================= */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom Left: Mode Pill & Steering Joystick */}
        <div className="flex flex-col items-start pointer-events-auto select-none">
          {/* Mode Pill */}
          <div className="mb-2 px-2.5 py-0.5 rounded-full bg-[#060e1b]/90 border border-fuchsia-500/60 text-fuchsia-300 text-[9px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(217,70,239,0.3)]">
            <span className="text-[10px]">🎛</span>
            <span>MODE: JOYSTICK</span>
          </div>

          {/* Virtual Steering Joystick */}
          <div
            ref={joystickRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#040914]/90 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.2)] touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Directional Chevrons */}
            <div className="absolute top-1 text-cyan-500/50 text-xs font-mono font-bold">▲</div>
            <div className="absolute bottom-1 text-cyan-500/50 text-xs font-mono font-bold">▼</div>
            <div className="absolute left-1.5 text-cyan-500/50 text-xs font-mono font-bold">◀</div>
            <div className="absolute right-1.5 text-cyan-500/50 text-xs font-mono font-bold">▶</div>

            {/* Concentric Guide Rings */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border border-cyan-500/20" />
            <div className="w-12 h-12 rounded-full border border-cyan-500/30" />

            {/* Movable Thumbstick Knob */}
            <div
              className={`absolute w-12 h-12 rounded-full border-2 border-cyan-300 shadow-[0_0_18px_#00f0ff] transition-transform duration-75 flex items-center justify-center ${
                touchActive
                  ? 'bg-gradient-to-b from-cyan-400 to-blue-600 scale-95'
                  : 'bg-gradient-to-b from-cyan-500/85 to-blue-700/85 scale-100'
              }`}
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            >
              <div className="w-6 h-6 rounded-full border border-cyan-200/60 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-200 shadow-[0_0_6px_#fff]" />
              </div>
            </div>
          </div>

          {/* Joystick Label */}
          <div className="text-[10px] font-mono font-bold text-cyan-400/90 tracking-widest mt-1.5 pl-1">
            STEER // JOYSTICK
          </div>
        </div>

        {/* Bottom Center: Reset Orientation Button */}
        <div className="flex flex-col items-center pointer-events-auto select-none mb-1">
          <button
            onPointerDown={e => {
              e.preventDefault();
              onRecover?.();
            }}
            className="w-10 h-10 rounded-xl bg-[#060e1b]/90 border border-slate-700 text-slate-400 hover:text-white active:bg-cyan-500 active:text-slate-950 flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Reset Orientation [R]"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span className="text-[7px] font-mono font-bold tracking-wider text-slate-400 mt-0.5 uppercase">
              RESET
            </span>
          </button>
        </div>

        {/* Bottom Right: Velocity, Boost Fuel, Drift & Boost Buttons */}
        <div className="flex flex-col items-end pointer-events-auto select-none">
          {/* Speedometer Digital Readout */}
          <div className="flex flex-col items-end mb-2">
            <div className="flex items-baseline">
              <div className="w-7 h-9 rounded-md bg-cyan-950/90 border-2 border-cyan-400 shadow-[0_0_12px_#00f0ff] flex items-center justify-center text-2xl font-ui font-black text-cyan-300 leading-none">
                {speed}
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 ml-1.5 tracking-wider">
                KM/H
              </span>
            </div>
            {/* Slanted chevron bars ///// */}
            <div className="flex items-center gap-1 mt-1 text-xs font-mono font-black select-none tracking-tight">
              {[0, 1, 2, 3, 4].map(idx => (
                <span
                  key={idx}
                  className={`transition-colors duration-150 ${
                    speed > idx * 60
                      ? 'text-cyan-400 drop-shadow-[0_0_5px_#00f0ff]'
                      : 'text-slate-800'
                  }`}
                >
                  /
                </span>
              ))}
            </div>
          </div>

          {/* Boost Fuel Card */}
          <div className="w-44 sm:w-48 bg-[#050b14]/90 border border-cyan-500/40 rounded-2xl p-2 sm:p-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)] mb-2">
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-[9px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                BOOST FUEL
              </span>
              <span className="text-[11px] font-mono font-black text-fuchsia-400">
                {Math.round(boost)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-400 rounded-full shadow-[0_0_10px_#ff00e5] transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, boost))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[8px] font-mono font-bold tracking-wider">
              <span className="text-slate-400 uppercase">THERMAL LOAD</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map(dotIdx => (
                  <div
                    key={dotIdx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      speed > 240
                        ? dotIdx < 3
                          ? 'bg-amber-400 shadow-[0_0_4px_#ffaa00]'
                          : 'bg-rose-500 shadow-[0_0_4px_#ff0055]'
                        : 'bg-cyan-400 shadow-[0_0_4px_#00f0ff]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Beam Weapon Status Card */}
          {beamTelemetry && (
            <div
              className={`w-44 sm:w-48 bg-[#050b14]/90 border rounded-2xl p-2 sm:p-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(255,0,85,0.2)] mb-3 transition-colors ${
                beamTelemetry.isOverheated ? 'border-rose-500 bg-rose-950/30' : 'border-rose-500/40'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-[9px] font-mono font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-rose-400" />
                  BEAM ENERGY
                </span>
                <span className="text-[11px] font-mono font-black text-rose-400">
                  {Math.round(beamTelemetry.energy)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 rounded-full shadow-[0_0_10px_#ff0055] transition-all duration-75"
                  style={{ width: `${Math.max(0, Math.min(100, beamTelemetry.energy))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[8px] font-mono font-bold tracking-wider">
                <span
                  className={
                    beamTelemetry.isOverheated
                      ? 'text-rose-400 font-black animate-pulse'
                      : 'text-slate-400 uppercase'
                  }
                >
                  {beamTelemetry.isOverheated
                    ? `OVERHEATED (${beamTelemetry.cooldownRemaining.toFixed(1)}s)`
                    : 'CORE HEAT'}
                </span>
                <span
                  className={`text-[9px] font-mono font-black ${
                    beamTelemetry.heat > 75 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                  }`}
                >
                  {Math.round(beamTelemetry.heat)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800/60">
                <div
                  className={`h-full transition-all duration-75 ${
                    beamTelemetry.heat > 75 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, beamTelemetry.heat))}%` }}
                />
              </div>
            </div>
          )}

          {/* Tactical Flight Action Deck (2-Tier Ergonomic Clustered Layout) */}
          <div className="flex flex-col items-end gap-2 mt-1">
            {/* Upper Tier: Tactical Sub-systems (Drift, Missile, Shield) */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Drift Button */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  onInputChange?.({ drift: true });
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ drift: false });
                }}
                onPointerLeave={() => {
                  onInputChange?.({ drift: false });
                }}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border-2 border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-300 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.3)] active:scale-95 active:bg-fuchsia-500 active:text-slate-950 transition-all cursor-pointer"
                title="Drift Brake [SHIFT]"
              >
                <Wind className="w-4 h-4 sm:w-4.5 sm:h-4.5 mb-0.5" />
                <span className="text-[7.5px] sm:text-[8px] font-ui font-black uppercase tracking-wider">
                  DRIFT
                </span>
              </button>

              {/* Guided Homing Missile Weapon Button (All 20 Modes) */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (missileTelemetry?.status !== 'RELOADING') {
                    onFireMissile?.();
                    onInputChange?.({ fireMissile: true });
                    setTimeout(() => onInputChange?.({ fireMissile: false }), 100);
                  }
                }}
                onClick={e => {
                  e.preventDefault();
                  if (missileTelemetry?.status !== 'RELOADING') {
                    onFireMissile?.();
                    onInputChange?.({ fireMissile: true });
                    setTimeout(() => onInputChange?.({ fireMissile: false }), 100);
                  }
                }}
                disabled={missileTelemetry?.status === 'RELOADING'}
                className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden select-none touch-none active:scale-95 ${
                  missileTelemetry?.status === 'RELOADING'
                    ? 'bg-slate-950/80 border-slate-700/60 text-slate-500 cursor-not-allowed'
                    : missileTelemetry?.hasTargetLock
                    ? 'bg-red-600 text-white border-white shadow-[0_0_25px_#ff0033] scale-105 ring-2 ring-red-400 animate-pulse'
                    : 'bg-red-950/90 border-red-500/80 text-red-300 hover:border-red-400 active:bg-red-600 active:text-white shadow-[0_0_15px_rgba(255,51,102,0.3)]'
                }`}
                title="Launch Guided Missile [M]"
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-800/80" />
                  <circle
                    cx="32"
                    cy="32"
                    r="29"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={182}
                    strokeDashoffset={
                      182 - (182 * Math.max(0, Math.min(100, missileTelemetry?.cooldownProgress ?? 0))) / 100
                    }
                    className="text-red-400 transition-all duration-100"
                  />
                </svg>

                {missileTelemetry?.status === 'RELOADING' && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-0.5 z-10">
                    <span className="text-[7px] font-mono font-black text-red-400 leading-tight">
                      RELOAD
                    </span>
                    <span className="text-[8.5px] font-mono font-bold text-white leading-tight">
                      {Math.ceil(missileTelemetry.cooldownRemaining)}s
                    </span>
                  </div>
                )}

                {missileTelemetry?.hasTargetLock && missileTelemetry.status !== 'RELOADING' && (
                  <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#ff0033] animate-ping" />
                )}

                <Rocket
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                    missileTelemetry?.hasTargetLock ? 'animate-bounce text-white drop-shadow-[0_0_8px_#fff]' : ''
                  }`}
                />
                <span className="text-[7.5px] sm:text-[8px] font-ui font-black uppercase tracking-wider leading-none mt-0.5">
                  MISSILE
                </span>
                <span className="text-[6.5px] font-mono font-bold text-red-300/80 uppercase tracking-wider leading-none">
                  [M]
                </span>
              </button>

              {/* Active Damage Mitigation Shield Button (60s Cooldown) */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (activeShieldTelemetry?.status !== 'RECHARGING') {
                    onActivateShield?.();
                    onInputChange?.({ activateShield: true });
                    setTimeout(() => onInputChange?.({ activateShield: false }), 100);
                  }
                }}
                onClick={e => {
                  e.preventDefault();
                  if (activeShieldTelemetry?.status !== 'RECHARGING') {
                    onActivateShield?.();
                    onInputChange?.({ activateShield: true });
                    setTimeout(() => onInputChange?.({ activateShield: false }), 100);
                  }
                }}
                disabled={activeShieldTelemetry?.status === 'RECHARGING'}
                className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden select-none touch-none active:scale-95 ${
                  activeShieldTelemetry?.status === 'ACTIVE'
                    ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_25px_#00f0ff] ring-2 ring-cyan-300 scale-105'
                    : activeShieldTelemetry?.status === 'RECHARGING'
                    ? 'bg-slate-950/80 border-slate-700/60 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-950/90 border-cyan-400 text-cyan-300 hover:border-cyan-300 active:bg-cyan-400 active:text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                }`}
                title="Deploy Active Shield (6s duration / 60s cooldown) [C]"
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-800/80" />
                  <circle
                    cx="32"
                    cy="32"
                    r="29"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={182}
                    strokeDashoffset={
                      182 - (182 * Math.max(0, Math.min(100, activeShieldTelemetry?.rechargeProgress ?? 0))) / 100
                    }
                    className="text-cyan-400 transition-all duration-100"
                  />
                </svg>

                {activeShieldTelemetry?.status === 'RECHARGING' && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-0.5 z-10">
                    <span className="text-[7px] font-mono font-black text-cyan-400 leading-tight">
                      RECHARGE
                    </span>
                    <span className="text-[8.5px] font-mono font-bold text-white leading-tight">
                      {Math.ceil(activeShieldTelemetry.rechargeRemaining)}s
                    </span>
                  </div>
                )}

                {activeShieldTelemetry?.status === 'ACTIVE' && (
                  <div className="absolute top-1 right-1 px-0.5 rounded bg-slate-950/80 text-[6.5px] font-mono font-black text-cyan-300 animate-pulse">
                    {(activeShieldTelemetry.activeTimeRemaining ?? 0).toFixed(1)}s
                  </div>
                )}

                <ShieldCheck
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                    activeShieldTelemetry?.status === 'ACTIVE' ? 'animate-spin text-slate-950 drop-shadow-[0_0_8px_#fff]' : ''
                  }`}
                />
                <span className="text-[7.5px] sm:text-[8px] font-ui font-black uppercase tracking-wider leading-none mt-0.5">
                  SHIELD
                </span>
                <span className="text-[6.5px] font-mono font-bold text-cyan-300/80 uppercase tracking-wider leading-none">
                  [C]
                </span>
              </button>
            </div>

            {/* Lower Tier: Main Offense & Propulsion (Beam, Hyper-Boost) */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Front Asteroid Beam Button */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (!beamTelemetry?.isOverheated && (beamTelemetry?.energy ?? 100) > 3) {
                    onInputChange?.({ fireBeam: true });
                  }
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ fireBeam: false });
                }}
                onPointerLeave={() => {
                  onInputChange?.({ fireBeam: false });
                }}
                onPointerCancel={() => {
                  onInputChange?.({ fireBeam: false });
                }}
                onTouchEnd={() => {
                  onInputChange?.({ fireBeam: false });
                }}
                disabled={beamTelemetry?.isOverheated || (beamTelemetry?.energy ?? 100) <= 3}
                className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,0,85,0.3)] active:scale-95 transition-all cursor-pointer overflow-hidden select-none touch-none ${
                  beamTelemetry?.isFiring
                    ? 'bg-rose-500 text-white border-white shadow-[0_0_35px_#ff0055] scale-95 ring-4 ring-rose-400/60'
                    : beamTelemetry?.isOverheated
                    ? 'bg-rose-950/40 border-rose-900 text-rose-700/60 opacity-60 cursor-not-allowed'
                    : (beamTelemetry?.energy ?? 100) <= 3
                    ? 'bg-slate-950/60 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-rose-950/90 border-rose-400 text-rose-300 hover:border-rose-300 active:bg-rose-500 active:text-slate-950'
                }`}
                title="Fire Front Asteroid Destruction Beam [E / RMB]"
              >
                {/* Radial Energy Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="29"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-rose-950/60"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="29"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={182}
                    strokeDashoffset={182 - (182 * Math.max(0, Math.min(100, beamTelemetry?.energy ?? 100))) / 100}
                    className={`transition-all duration-75 ${
                      (beamTelemetry?.energy ?? 100) < 25 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  />
                </svg>

                {/* Cooldown overlay when overheated */}
                {beamTelemetry?.isOverheated && (
                  <div className="absolute inset-0 bg-rose-950/95 flex flex-col items-center justify-center p-0.5 z-10">
                    <span className="text-[7px] font-mono font-black text-rose-400 leading-tight animate-pulse">
                      COOLDOWN
                    </span>
                    <span className="text-[9px] font-mono font-bold text-white leading-tight">
                      {beamTelemetry.cooldownRemaining.toFixed(1)}s
                    </span>
                  </div>
                )}

                {/* Target lock ping pip */}
                {beamTelemetry?.hasTargetLock && !beamTelemetry.isOverheated && (
                  <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#39ff14] animate-ping" />
                )}

                <Zap
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    beamTelemetry?.isFiring ? 'animate-bounce text-white drop-shadow-[0_0_10px_#fff]' : ''
                  }`}
                />
                <span className="text-[9px] sm:text-[10px] font-ui font-black uppercase tracking-wider leading-none mt-0.5">
                  ⚡ BEAM
                </span>
                <span className="text-[7px] font-mono font-bold text-rose-300/80 uppercase tracking-wider leading-none mt-0.5">
                  [E]
                </span>
              </button>

              {/* Boost Hold Button */}
              <button
                onPointerDown={e => {
                  e.preventDefault();
                  if (boost > 5) onInputChange?.({ boost: true });
                }}
                onPointerUp={e => {
                  e.preventDefault();
                  onInputChange?.({ boost: false });
                }}
                onPointerLeave={() => {
                  onInputChange?.({ boost: false });
                }}
                disabled={boost <= 5}
                className={`w-15 h-15 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-95 transition-all cursor-pointer ${
                  speed > 250
                    ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_35px_#00f0ff]'
                    : boost > 5
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 active:bg-cyan-400 active:text-slate-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-600'
                }`}
                title="Hyper-Boost [SPACE]"
              >
                <ChevronsUp className="w-5 h-5 sm:w-6 sm:h-6 leading-none" />
                <span className="text-[10px] sm:text-[11px] font-ui font-black uppercase tracking-widest leading-none mt-0.5">
                  BOOST
                </span>
                <span className="text-[7px] font-mono font-bold text-cyan-400/80 uppercase tracking-wider leading-none mt-0.5">
                  HOLD
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Holographic Branching Path & Junction Switching HUD */}
      <JunctionHUD
        telemetry={junctionTelemetry}
        onSelectRoute={onSelectRoute}
        onCommitRoute={onCommitRoute}
      />
    </div>
  );
};
