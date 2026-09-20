import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  GitBranch,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Timer,
  Navigation,
} from 'lucide-react';
import { ActiveJunctionTelemetry, BranchRouteDirection, BranchRouteConfig } from '../game/junctionSystem';

interface JunctionHUDProps {
  telemetry: ActiveJunctionTelemetry | null;
  onSelectRoute?: (direction: BranchRouteDirection) => void;
}

export const JunctionHUD: React.FC<JunctionHUDProps> = ({ telemetry, onSelectRoute }) => {
  if (!telemetry || telemetry.status === 'PASSED') return null;

  const isApproaching = telemetry.status === 'APPROACHING' || telemetry.isApproaching;
  const selectedRoute = telemetry.availableRoutes.find(r => r.id === telemetry.selectedRouteId);

  // If in branch, show current route progress bar
  if (telemetry.playerInBranch) {
    const currentRoute = selectedRoute || telemetry.availableRoutes[0];
    const progressPct = Math.round((telemetry.branchProgress || telemetry.progressInRoute || 0) * 100);

    return (
      <div
        id="junction-branch-progress"
        className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none flex flex-col items-center max-w-sm w-full px-4"
      >
        <div className="w-full bg-slate-950/90 backdrop-blur-md border border-cyan-500/60 rounded-xl px-4 py-2.5 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold truncate">
                BRANCH ROUTE ACTIVE
              </span>
              <span className="text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 truncate">
                {currentRoute?.name || 'ALTERNATE PATH'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900/90 rounded-full overflow-hidden mt-1.5 border border-cyan-900/50">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 transition-all duration-75 shadow-[0_0_10px_#00f0ff]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-white ml-1">
            {progressPct}%
          </span>
        </div>
      </div>
    );
  }

  const getDirectionIcon = (dir: BranchRouteDirection) => {
    switch (dir) {
      case 'LEFT':
        return <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'RIGHT':
        return <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'SHORTCUT':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'CENTER':
      default:
        return <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getDirectionKeyPrompt = (dir: BranchRouteDirection) => {
    switch (dir) {
      case 'LEFT':
        return 'A / ←';
      case 'RIGHT':
        return 'D / →';
      case 'SHORTCUT':
        return 'D / →';
      case 'CENTER':
      default:
        return 'W / ↑';
    }
  };

  const getDirectionMobileLabel = (dir: BranchRouteDirection) => {
    switch (dir) {
      case 'LEFT':
        return 'LEFT ROUTE';
      case 'RIGHT':
        return 'RIGHT ROUTE';
      case 'SHORTCUT':
        return 'SHORTCUT ROUTE';
      case 'CENTER':
      default:
        return 'CENTER ROUTE';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return { label: 'LOW RISK', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'HIGH':
        return { label: 'HIGH RISK', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      case 'MEDIUM':
      default:
        return { label: 'MED RISK', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    }
  };

  const getRouteTheme = (dir: BranchRouteDirection, isShortcut: boolean) => {
    if (isShortcut || dir === 'SHORTCUT') {
      return {
        border: 'border-amber-400',
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
        bg: 'bg-amber-950/85',
        activeBg: 'bg-amber-500 text-slate-950',
        text: 'text-amber-300',
        neon: '#f59e0b',
      };
    }
    if (dir === 'LEFT') {
      return {
        border: 'border-cyan-400',
        glow: 'shadow-[0_0_30px_rgba(0,240,255,0.5)]',
        bg: 'bg-cyan-950/85',
        activeBg: 'bg-cyan-500 text-slate-950',
        text: 'text-cyan-300',
        neon: '#00f0ff',
      };
    }
    if (dir === 'RIGHT') {
      return {
        border: 'border-fuchsia-400',
        glow: 'shadow-[0_0_30px_rgba(217,70,239,0.5)]',
        bg: 'bg-fuchsia-950/85',
        activeBg: 'bg-fuchsia-500 text-slate-950',
        text: 'text-fuchsia-300',
        neon: '#d946ef',
      };
    }
    return {
      border: 'border-blue-400',
      glow: 'shadow-[0_0_30px_rgba(96,165,250,0.5)]',
      bg: 'bg-blue-950/85',
      activeBg: 'bg-blue-500 text-slate-950',
      text: 'text-blue-300',
      neon: '#60a5fa',
    };
  };

  const distanceM = Math.round(telemetry.distanceToJunction ?? telemetry.distanceToJunctionMeters ?? 0);
  const decisionSec = (telemetry.timeRemainingSec ?? 3).toFixed(1);

  return (
    <div
      id="junction-switching-hud"
      className="fixed inset-x-0 bottom-28 sm:bottom-24 z-40 pointer-events-none flex flex-col items-center select-none px-3 sm:px-4"
    >
      {/* Top Banner Alert & Junction Distance Telemetry */}
      <div className="flex flex-col items-center mb-2">
        <div className="bg-slate-950/95 backdrop-blur-md border-2 border-cyan-400/90 rounded-2xl px-4 sm:px-6 py-2 shadow-[0_0_35px_rgba(0,240,255,0.45)] flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-cyan-400 animate-pulse flex-shrink-0" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-bold">
                {isApproaching ? 'APPROACHING JUNCTION' : 'JUNCTION ZONE ACTIVE'}
              </span>
              <span className="text-[10px] sm:text-[11px] font-ui uppercase font-black text-white px-2 py-0.5 rounded bg-cyan-900/80 border border-cyan-400/50">
                {telemetry.junctionName || telemetry.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300 mt-0.5">
              <span>
                DISTANCE: <strong className="text-cyan-400">{distanceM}m</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-amber-400" />
                <span>
                  DECISION WINDOW:{' '}
                  <strong
                    className={
                      Number(decisionSec) < 2
                        ? 'text-rose-400 animate-ping'
                        : 'text-amber-400'
                    }
                  >
                    {decisionSec}s
                  </strong>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Route Selection Feedback Banner */}
      {(telemetry.selectedRouteDirection || telemetry.statusMessage) && (
        <div
          id="junction-route-feedback-banner"
          className="mb-2.5 transition-all duration-200"
        >
          <div className="bg-slate-950/95 backdrop-blur-md border-2 border-cyan-400 rounded-xl px-4 py-1.5 shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-bounce flex-shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider text-white">
              ROUTE SELECTED:{' '}
              <span className="text-cyan-300 font-extrabold">
                {telemetry.selectedRouteDirection === 'SHORTCUT'
                  ? 'SHORTCUT (RIGHT)'
                  : telemetry.selectedRouteDirection}
              </span>
              {selectedRoute ? ` — ${selectedRoute.name}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Route Selection Buttons (Responsive Mobile & Desktop) */}
      <div className="flex items-stretch justify-center gap-2.5 sm:gap-4 max-w-2xl w-full pointer-events-auto">
        {telemetry.availableRoutes.map((route: BranchRouteConfig) => {
          const isSelected = route.id === telemetry.selectedRouteId;
          const theme = getRouteTheme(route.direction, route.isShortcut || !!route.hasShortcut);
          const riskInfo = getRiskBadge(route.riskLevel || (route as any).difficulty || 'MEDIUM');
          const boostPads =
            route.boostPadCount ??
            (route.boostPadFractions?.length || (route.hasBoostPads ? 2 : 0));
          const obstacles =
            route.obstacleCount ??
            (route.obstacleFractions?.length || (route.hasObstacles ? 2 : 0));

          // Estimated length delta
          const isShort = route.lengthMultiplier < 0.98;
          const lengthDeltaText = isShort
            ? `-${Math.round((1 - route.lengthMultiplier) * 100)}% DISTANCE`
            : route.lengthMultiplier > 1.02
            ? `+${Math.round((route.lengthMultiplier - 1) * 100)}% BOOST SLIPSTREAM`
            : 'STANDARD VECTOR';

          return (
            <button
              key={route.id}
              id={`junction-route-btn-${route.id}`}
              onClick={() => onSelectRoute?.(route.direction)}
              className={`relative flex-1 rounded-2xl border-2 p-2.5 sm:p-3.5 transition-all duration-150 cursor-pointer flex flex-col items-center backdrop-blur-xl active:scale-95 ${
                isSelected
                  ? `${theme.border} ${theme.bg} ${theme.glow} ring-4 ring-white/70 scale-[1.03] z-10`
                  : 'border-slate-800 bg-slate-950/80 opacity-85 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute -top-3 bg-cyan-400 text-slate-950 text-[8px] sm:text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full shadow-[0_0_12px_#00f0ff] flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  SELECTED
                </div>
              )}

              {/* Shortcut Tag */}
              {(route.isShortcut || route.hasShortcut) && (
                <div className="absolute -top-3 right-2 bg-amber-400 text-slate-950 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full shadow-[0_0_12px_#f59e0b] flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  SHORTCUT
                </div>
              )}

              {/* Header: Arrow Icon & Prompts */}
              <div className="flex items-center justify-between w-full mb-1">
                <div className={`p-1.5 sm:p-2 rounded-xl border ${theme.border} ${theme.bg} ${theme.text}`}>
                  {getDirectionIcon(route.direction)}
                </div>
                <div className="flex flex-col items-end">
                  {/* Desktop key prompt */}
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700">
                    {getDirectionKeyPrompt(route.direction)}
                  </span>
                  {/* Mobile direction label */}
                  <span className="sm:hidden text-[9px] font-mono font-black tracking-wider uppercase text-cyan-300">
                    {getDirectionMobileLabel(route.direction)}
                  </span>
                </div>
              </div>

              {/* Route Name & Metadata */}
              <div className="w-full text-left mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-ui font-black uppercase tracking-wider text-white truncate">
                    {route.name}
                  </span>
                </div>

                {/* Tactical Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${riskInfo.color}`}
                  >
                    {riskInfo.label}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                      isShort
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {lengthDeltaText}
                  </span>
                  {boostPads > 0 && (
                    <span className="text-[8px] sm:text-[9px] font-mono text-cyan-400 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      {boostPads}
                    </span>
                  )}
                  {obstacles > 0 && (
                    <span className="text-[8px] sm:text-[9px] font-mono text-rose-400 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {obstacles}
                    </span>
                  )}
                </div>
              </div>

              {/* Detail Preview Description */}
              <p className="text-[8px] sm:text-[10px] text-slate-400 mt-1 line-clamp-1 w-full text-left font-mono">
                {route.subtitle || route.detail || (route as any).description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Desktop Instruction Hint */}
      <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
        <span>
          Press <strong className="text-cyan-400">[A / ←]</strong> for Left
        </span>
        <span>•</span>
        <span>
          Press <strong className="text-cyan-400">[D / →]</strong> for Right
        </span>
        <span>•</span>
        <span>
          Press <strong className="text-cyan-400">[W / ↑]</strong> for Center
        </span>
        <span>•</span>
        <span>
          Press <strong className="text-amber-400">[E]</strong> to Confirm
        </span>
      </div>
    </div>
  );
};
