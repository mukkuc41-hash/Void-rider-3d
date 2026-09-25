import React, { useState } from 'react';
import { RouteDiagramData, RouteDiagramMarker } from '../game/fullRouteCinematic/routeCinematicTypes';
import {
  MapPin,
  Flag,
  AlertTriangle,
  GitBranch,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from 'lucide-react';

interface RouteMapOverlayProps {
  diagramData?: RouteDiagramData | null;
}

export const RouteMapOverlay: React.FC<RouteMapOverlayProps> = ({ diagramData }) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!diagramData || !diagramData.points || diagramData.points.length === 0) {
    return null;
  }

  const { points, markers, branches, cameraT, currentSectorName, totalKm } = diagramData;

  // Build SVG path data from normalized points
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Calculate current camera drone position on the SVG diagram
  const camIndex = Math.min(
    points.length - 1,
    Math.max(0, Math.floor(cameraT * (points.length - 1)))
  );
  const camPos = points[camIndex] || { x: 50, y: 50 };

  return (
    <div className="absolute top-20 right-6 sm:right-10 z-20 pointer-events-auto select-none max-w-xs sm:max-w-sm animate-fadeIn">
      <div className="bg-[#030914]/90 border border-cyan-500/60 rounded-2xl p-3 sm:p-4 shadow-[0_0_35px_rgba(0,240,255,0.3)] backdrop-blur-md">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono font-black text-cyan-300 tracking-wider uppercase">
              PROCEDURAL ROUTE TOPOLOGY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
              {totalKm} KM
            </span>
            <button
              onClick={() => setIsMinimized(prev => !prev)}
              className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors"
              title={isMinimized ? 'Expand Route Map' : 'Minimize Route Map'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Minimized Quick Bar */}
        {isMinimized ? (
          <div className="flex items-center justify-between text-[10px] font-mono py-1">
            <span className="text-slate-400">ACTIVE:</span>
            <span className="text-cyan-300 font-bold uppercase truncate max-w-[180px]">
              {currentSectorName}
            </span>
            <span className="text-amber-400 font-bold">{Math.round(cameraT * 100)}%</span>
          </div>
        ) : (
          <>
            {/* Sector & Camera Tracker Subtitle */}
            <div className="flex items-center justify-between text-[9px] font-mono mb-2 text-slate-400">
              <span>
                SECTOR: <strong className="text-cyan-300">{currentSectorName}</strong>
              </span>
              <span>
                PROGRESS: <strong className="text-emerald-400">{Math.round(cameraT * 100)}%</strong>
              </span>
            </div>

            {/* 3D / Isometric Route Diagram Canvas (Generated from actual PathNodes) */}
            <div className="relative w-full aspect-square max-h-[190px] sm:max-h-[210px] rounded-xl bg-slate-950/90 border border-cyan-500/30 overflow-hidden flex items-center justify-center p-1">
              {/* Subtle Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #00f0ff 1px, transparent 1px), linear-gradient(to right, #00f0ff08 1px, transparent 1px), linear-gradient(to bottom, #00f0ff08 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                  {/* Glow filter for energy track */}
                  <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="85%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#ffe600" />
                  </linearGradient>
                </defs>

                {/* Base Route Ambient Glow Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  filter="url(#routeGlow)"
                />

                {/* Main Playable Route Spine */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />

                {/* Animated Traveling Pulse along the Route */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeDasharray="4 28"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Alternate Branch Routes */}
                {branches &&
                  branches.map(b => {
                    if (b.points.length < 2) return null;
                    const branchD = b.points.reduce((acc, pt, i) => {
                      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                    }, '');
                    return (
                      <g key={b.id}>
                        <path
                          d={branchD}
                          fill="none"
                          stroke={b.color || '#ffaa00'}
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                          opacity="0.85"
                        />
                      </g>
                    );
                  })}

                {/* PathNode Markers (START, CHECKPOINTS, BRANCHES, HAZARDS, FINAL SECTOR, FINISH) */}
                {markers.map(m => {
                  const isCloseToCam = Math.abs(m.t - cameraT) < 0.08;
                  return (
                    <g key={m.id} className="transition-transform duration-200">
                      {/* Pulse ring for active or important node */}
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={isCloseToCam ? 4.5 : 2.5}
                        fill="none"
                        stroke={m.color}
                        strokeWidth="0.8"
                        opacity={isCloseToCam ? 1 : 0.6}
                        className={isCloseToCam ? 'animate-ping' : ''}
                      />
                      {/* Node Center */}
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={m.type === 'START' || m.type === 'FINISH' ? 2.2 : 1.6}
                        fill={m.color}
                      />
                    </g>
                  );
                })}

                {/* Active Camera Flythrough Drone Indicator */}
                <g className="transition-all duration-100 ease-out">
                  <circle
                    cx={camPos.x}
                    cy={camPos.y}
                    r="5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    className="animate-ping"
                  />
                  <circle
                    cx={camPos.x}
                    cy={camPos.y}
                    r="2.8"
                    fill="#39ff14"
                    stroke="#000000"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={camPos.x - 3}
                    y1={camPos.y}
                    x2={camPos.x + 3}
                    y2={camPos.y}
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                  <line
                    x1={camPos.x}
                    y1={camPos.y - 3}
                    x2={camPos.x}
                    y2={camPos.y + 3}
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                </g>
              </svg>

              {/* Flythrough Camera Marker Tag Floating on SVG */}
              <div
                className="absolute text-[8px] font-mono font-black text-emerald-300 bg-black/90 px-1 py-0.5 rounded border border-emerald-400 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-1 transition-all duration-150"
                style={{
                  left: `${camPos.x}%`,
                  top: `${Math.max(12, camPos.y - 4)}%`,
                }}
              >
                CAM DRONE
              </div>
            </div>

            {/* REQUIRED DISPLAY TAGS: START • CHECKPOINTS • BRANCHES • HAZARDS • FINAL SECTOR • FINISH */}
            <div className="mt-2.5 pt-2 border-t border-cyan-500/20">
              <div className="text-[8px] font-mono text-slate-400 tracking-wider uppercase mb-1.5 flex items-center justify-between">
                <span>ROUTE MARKER MATRIX</span>
                <span className="text-[7px] text-cyan-400/80">LIVE SYNC</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono font-bold">
                {/* START */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/50 text-cyan-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>START</span>
                </div>

                {/* CHECKPOINTS */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-400/50 text-emerald-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="truncate">CHECKPOINTS</span>
                </div>

                {/* BRANCHES */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-400/50 text-amber-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>BRANCHES</span>
                </div>

                {/* HAZARDS */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-400/50 text-rose-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  <span>HAZARDS</span>
                </div>

                {/* FINAL SECTOR */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-400/50 text-purple-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="truncate">FINAL SECTOR</span>
                </div>

                {/* FINISH */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-950/60 border border-yellow-400/50 text-yellow-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span>FINISH</span>
                </div>
              </div>
            </div>

            <div className="text-[7.5px] font-mono text-slate-500 text-center mt-1.5">
              SUPPLEMENTAL TOPOLOGY OVERLAY // 3D FLYTHROUGH ENGAGED
            </div>
          </>
        )}
      </div>
    </div>
  );
};
