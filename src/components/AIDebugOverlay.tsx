import React from 'react';
import { AIDebugTelemetry } from '../types';
import { Shield, Rocket, Activity, Zap, Cpu, Compass, AlertTriangle, Eye, X } from 'lucide-react';

interface AIDebugOverlayProps {
  telemetry: AIDebugTelemetry | null;
  onClose?: () => void;
}

export const AIDebugOverlay: React.FC<AIDebugOverlayProps> = ({ telemetry, onClose }) => {
  if (!telemetry || !telemetry.enabled || telemetry.racers.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 w-80 sm:w-96 max-h-[80vh] flex flex-col bg-slate-950/90 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-md overflow-hidden animate-fadeIn select-none pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-cyan-950/80 to-slate-900/80 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase">
            AI TACTICAL TELEMETRY
          </span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 border border-cyan-500/50 text-cyan-300">
            {telemetry.difficulty}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Close AI Telemetry [O]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Racers Telemetry Feed */}
      <div className="p-2.5 space-y-2 overflow-y-auto max-h-[calc(80vh-42px)]">
        {telemetry.racers.map(r => (
          <div
            key={r.id}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 transition-all text-[11px]"
          >
            {/* Racer Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded flex items-center justify-center bg-cyan-950 border border-cyan-500/60 font-mono font-bold text-[9.5px] text-cyan-300">
                  #{r.rank}
                </span>
                <span className="font-ui font-black text-white">{r.name}</span>
                <span className="text-[9px] font-mono font-semibold px-1 rounded bg-slate-800 text-slate-300">
                  {r.personality}
                </span>
              </div>
              <span className="font-mono font-bold text-amber-400">{r.speed} km/h</span>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-[10px] font-mono">
              {/* Overtaking Status */}
              <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">OVERTAKE</span>
                <span
                  className={`font-bold ${
                    r.overtakeState === 'OVERTAKING' || r.overtakeState === 'PASSING'
                      ? 'text-emerald-400'
                      : r.overtakeState === 'ANALYZING' || r.overtakeState === 'SELECTING_SIDE'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {r.overtakeState}
                </span>
              </div>

              {/* Blocking Status */}
              <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">BLOCKING</span>
                <span
                  className={`font-bold ${
                    r.defensiveState === 'DEFENDING_LINE' || r.defensiveState === 'BLOCKING_LANE'
                      ? 'text-fuchsia-400'
                      : r.defensiveState === 'THREAT_DETECTED'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {r.defensiveState}
                </span>
              </div>

              {/* Missile Telemetry */}
              <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                <span className="flex items-center gap-1 text-slate-400">
                  <Rocket className="w-3 h-3 text-red-400" /> MISSILE
                </span>
                <span className={`font-bold ${r.missileCooldown === 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                  {r.missileCooldown === 0 ? 'READY' : `${r.missileCooldown}s`}
                </span>
              </div>

              {/* Shield Telemetry */}
              <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                <span className="flex items-center gap-1 text-slate-400">
                  <Shield className="w-3 h-3 text-cyan-400" /> SHIELD
                </span>
                <span
                  className={`font-bold ${
                    r.isShieldActive
                      ? 'text-cyan-300 animate-pulse'
                      : r.shieldCooldown === 0
                      ? 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  {r.isShieldActive ? 'ACTIVE' : r.shieldCooldown === 0 ? 'READY' : `${r.shieldCooldown}s`}
                </span>
              </div>

              {/* Target / Route */}
              <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 col-span-2">
                <span className="text-slate-400">TARGET / ROUTE</span>
                <span className="font-bold text-cyan-300 truncate max-w-[140px]">
                  {r.targetedOpponent ? `LOCKED: ${r.targetedOpponent.toUpperCase()}` : r.currentRoute}
                </span>
              </div>

              {/* Lane / Reaction / Aggression */}
              <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 col-span-2 text-[9.5px]">
                <span className="text-slate-400">
                  LANE: <strong className="text-white">{r.currentLateral}m</strong>
                </span>
                <span className="text-slate-400">
                  REACT: <strong className="text-white">{r.reactionTime}s</strong>
                </span>
                <span className="text-slate-400">
                  AGGR: <strong className="text-amber-400">{Math.round(r.aggression * 100)}%</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
