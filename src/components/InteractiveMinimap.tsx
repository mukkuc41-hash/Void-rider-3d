import React, { useRef, useState, useMemo } from 'react';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Target,
  Flag,
  GitBranch,
} from 'lucide-react';
import { MinimapTelemetry, MinimapMode } from '../types';
import { sound } from '../game/audio';

interface InteractiveMinimapProps {
  telemetry?: MinimapTelemetry | null;
  onToggleMode?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleExpand?: () => void;
  className?: string;
}

export const InteractiveMinimap: React.FC<InteractiveMinimapProps> = ({
  telemetry,
  onToggleMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleExpand,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!telemetry || telemetry.trackPoints.length === 0) {
    return null;
  }

  const {
    mode,
    zoom,
    isExpanded: propExpanded,
    playerPos,
    playerHeading,
    trackPoints,
    branches,
    checkpoints,
    finishLine,
    markers,
    activeJunctionName,
    activeRouteDirection,
    sectorName,
    bounds,
  } = telemetry;

  const isExpanded = propExpanded ?? internalExpanded;

  const handleToggleExpand = () => {
    sound.playMenuClick();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(prev => !prev);
    }
  };

  // World to Map coordinate transformation
  // SVG viewport size: 240 x 240 for compact radar, 540 x 540 for expanded
  const svgSize = isExpanded ? 540 : 220;
  const halfSize = svgSize / 2;

  // View bounds & scaling
  const rangeX = Math.max(10, bounds.maxX - bounds.minX);
  const rangeZ = Math.max(10, bounds.maxZ - bounds.minZ);
  const maxRange = Math.max(rangeX, rangeZ);
  // Scale factor: world units to svg pixels
  const baseScale = (svgSize * 0.82) / maxRange;
  const currentScale = baseScale * zoom;

  // Rotation angle for map container:
  // In PLAYER_FACING mode, rotate world so player heading aligns UP (180 deg offset)
  const mapRotationDeg = mode === 'PLAYER_FACING' ? (-playerHeading * 180) / Math.PI + 180 : 0;

  // Transform world (x, z) to centered SVG coords
  const worldToSvg = (wx: number, wz: number) => {
    if (mode === 'PLAYER_FACING') {
      // Relative to player position
      const dx = (wx - playerPos.x) * currentScale;
      const dz = (wz - playerPos.z) * currentScale;
      return {
        x: halfSize + dx,
        y: halfSize + dz,
      };
    } else {
      // Relative to track center
      const dx = (wx - bounds.centerX) * currentScale;
      const dz = (wz - bounds.centerZ) * currentScale;
      return {
        x: halfSize + dx,
        y: halfSize + dz,
      };
    }
  };

  // Build SVG Path for Main Track
  const trackPathData = useMemo(() => {
    if (trackPoints.length === 0) return '';
    return trackPoints.reduce((acc, pt, idx) => {
      const p = worldToSvg(pt.x, pt.z);
      return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, '') + ' Z';
  }, [trackPoints, currentScale, mode, playerPos.x, playerPos.z, zoom]);

  // Player position in SVG
  const playerSvg = worldToSvg(playerPos.x, playerPos.z);
  const finishSvg = worldToSvg(finishLine.x, finishLine.z);

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className} ${
        isExpanded
          ? 'fixed inset-4 sm:inset-10 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl rounded-3xl border border-cyan-500/40 p-4 sm:p-6 shadow-[0_0_60px_rgba(0,240,255,0.3)] animate-fadeIn'
          : 'w-48 sm:w-56 flex flex-col items-end'
      }`}
    >
      {/* Expanded Modal Wrapper Header */}
      {isExpanded && (
        <div className="absolute top-4 left-6 right-6 flex items-center justify-between pb-3 border-b border-cyan-500/20 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-ui font-black uppercase tracking-wider text-white">
                  TACTICAL TRACK RADAR & ROUTE MATRIX
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold">
                  {sectorName}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Mode: {mode === 'PLAYER_FACING' ? 'PLAYER-FACING (HUD ALIGNED)' : 'NORTH-UP (ABSOLUTE)'} | Zoom: {zoom.toFixed(2)}x
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleExpand}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Radar Card */}
      <div
        className={`relative rounded-3xl bg-[#040812]/92 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_25px_rgba(0,240,255,0.22)] overflow-hidden flex flex-col items-center justify-center ${
          isExpanded ? 'w-[320px] h-[320px] sm:w-[500px] sm:h-[500px]' : 'w-48 h-48 sm:w-56 sm:h-56'
        }`}
      >
        {/* Radar Circular Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
          <div className="w-[88%] h-[88%] rounded-full border border-cyan-400 border-dashed" />
          <div className="w-[58%] h-[58%] rounded-full border border-cyan-400/70" />
          <div className="w-[28%] h-[28%] rounded-full border border-cyan-400/50" />
          <div className="absolute w-full h-[1px] bg-cyan-400/40" />
          <div className="absolute h-full w-[1px] bg-cyan-400/40" />
        </div>

        {/* Dynamic SVG Map Canvas */}
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full p-2 transition-transform duration-75"
          style={{
            transform: `rotate(${mapRotationDeg}deg)`,
            transformOrigin: `${playerSvg.x}px ${playerSvg.y}px`,
          }}
        >
          <defs>
            {/* Glow Filters */}
            <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="targetGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Main Track Path Line */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#00f0ff"
            strokeWidth={isExpanded ? 4.5 : 3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#trackGlow)"
            className="opacity-90"
          />

          {/* Track Center Guidance Dash */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeDasharray="4,6"
            className="opacity-40"
          />

          {/* 2. Branch Routes & Shortcuts */}
          {branches.map(b => {
            if (b.points.length < 2) return null;
            const branchPath = b.points.reduce((acc, pt, idx) => {
              const p = worldToSvg(pt.x, pt.z);
              return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            }, '');

            return (
              <g key={b.id}>
                <path
                  d={branchPath}
                  fill="none"
                  stroke={b.isSelected ? '#39ff14' : '#ff00e5'}
                  strokeWidth={b.isSelected ? 3.8 : 2.4}
                  strokeDasharray={b.direction === 'SHORTCUT' ? '3,3' : undefined}
                  className={b.isSelected ? 'opacity-100 drop-shadow-[0_0_8px_#39ff14]' : 'opacity-70'}
                />
              </g>
            );
          })}

          {/* 3. Checkpoints */}
          {checkpoints.map(cp => {
            const p = worldToSvg(cp.x, cp.z);
            return (
              <g key={cp.id} transform={`translate(${p.x}, ${p.y})`}>
                <circle r={isExpanded ? 3.5 : 2.5} fill="#00f0ff" className="opacity-80" />
                {isExpanded && (
                  <text
                    y={-5}
                    textAnchor="middle"
                    fill="#00f0ff"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {cp.id}
                  </text>
                )}
              </g>
            );
          })}

          {/* 4. Finish Line Gate */}
          <g transform={`translate(${finishSvg.x}, ${finishSvg.y})`}>
            <circle r={isExpanded ? 5 : 3.8} fill="#ffd700" stroke="#ffffff" strokeWidth="1" />
            <text y={-5} textAnchor="middle" fill="#ffd700" fontSize="8" fontWeight="bold">
              🏁
            </text>
          </g>

          {/* 5. Opponents & Teammate Markers */}
          {markers.map(m => {
            if (m.type === 'PLAYER') return null; // Player rendered prominently separately
            const p = worldToSvg(m.x, m.z);
            const headingDeg = m.heading ? (m.heading * 180) / Math.PI : 0;

            return (
              <g
                key={m.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="transition-all duration-75"
              >
                {/* Locked Missile Target Crosshair */}
                {m.isLockedTarget && (
                  <g filter="url(#targetGlow)">
                    <circle r="9" fill="none" stroke="#ff0055" strokeWidth="1.5" strokeDasharray="3,2" className="animate-spin-slow" />
                    <line x1="-12" y1="0" x2="-6" y2="0" stroke="#ff0055" strokeWidth="1.5" />
                    <line x1="6" y1="0" x2="12" y2="0" stroke="#ff0055" strokeWidth="1.5" />
                    <line x1="0" y1="-12" x2="0" y2="-6" stroke="#ff0055" strokeWidth="1.5" />
                    <line x1="0" y1="6" x2="0" y2="12" stroke="#ff0055" strokeWidth="1.5" />
                    <text
                      y={-14}
                      textAnchor="middle"
                      fill="#ff0055"
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      TARGET ↓
                    </text>
                  </g>
                )}

                {/* Rival Marker Triangle */}
                <g transform={`rotate(${headingDeg})`}>
                  <polygon
                    points="0,-4.5 3.5,3.5 -3.5,3.5"
                    fill={m.color}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                </g>

                {/* Name & Rank */}
                {isExpanded && (
                  <text
                    y={9}
                    textAnchor="middle"
                    fill={m.color}
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {m.label?.slice(0, 5)}
                  </text>
                )}
              </g>
            );
          })}

          {/* 6. Player Marker (Center or Dynamic depending on Mode) */}
          <g
            transform={`translate(${playerSvg.x}, ${playerSvg.y})`}
            className="transition-all duration-75"
          >
            {/* Outer Pulse Ring */}
            <circle
              r={isExpanded ? 11 : 8}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              className="animate-ping opacity-60"
            />
            {/* Center Directional Chevron Arrow */}
            <g transform={mode === 'NORTH_UP' ? `rotate(${(playerHeading * 180) / Math.PI})` : undefined}>
              <polygon
                points="0,-6.5 5,5 0,2 -5,5"
                fill="#ffffff"
                stroke="#00f0ff"
                strokeWidth="1.8"
                className="drop-shadow-[0_0_8px_#00f0ff]"
              />
            </g>
          </g>
        </svg>

        {/* Junction Branch Overlay Banner */}
        {activeJunctionName && (
          <div className="absolute top-1 left-1 right-1 flex items-center justify-between px-2 py-1 rounded-xl bg-cyan-950/80 border border-cyan-400/60 text-[9px] font-mono font-bold text-cyan-300 backdrop-blur-md">
            <div className="flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-cyan-400" />
              <span className="truncate max-w-[90px]">{activeJunctionName}</span>
            </div>
            {activeRouteDirection && (
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-white border border-cyan-400 text-[8px]">
                {activeRouteDirection}
              </span>
            )}
          </div>
        )}

        {/* Bottom Sector Title & Zoom Indicator */}
        <div className="absolute bottom-1 left-0 right-0 flex items-center justify-between px-2.5 text-[8px] font-mono font-bold text-cyan-400/80 pointer-events-none">
          <span>{mode === 'PLAYER_FACING' ? '▲ PLAYER' : '▲ NORTH'}</span>
          <span>{zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Interactive Controls Bar (Right or Bottom) */}
      <div className="flex items-center gap-1 mt-1.5 z-10">
        <button
          onClick={() => {
            sound.playMenuClick();
            onZoomIn ? onZoomIn() : null;
          }}
          className="p-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors shadow"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            sound.playMenuClick();
            onZoomOut ? onZoomOut() : null;
          }}
          className="p-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors shadow"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            sound.playMenuClick();
            onResetZoom ? onResetZoom() : null;
          }}
          className="p-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors shadow"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            sound.playMenuClick();
            onToggleMode ? onToggleMode() : null;
          }}
          className="px-1.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[9px] font-mono font-bold text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors shadow"
          title="Toggle Mode (Player-Facing / North-Up)"
        >
          {mode === 'PLAYER_FACING' ? 'FACING' : 'NORTH'}
        </button>

        <button
          onClick={handleToggleExpand}
          className="p-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors shadow"
          title={isExpanded ? 'Collapse Map' : 'Expand Map'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Map Legend & Route Details */}
      {isExpanded && (
        <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/20 text-xs font-mono w-full max-w-xl flex flex-wrap items-center justify-around gap-2 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-cyan-400" />
            <span>YOU (PLAYER)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-pink-500 rounded" />
            <span>AI OPPONENT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping" />
            <span>MISSILE TARGET</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-green-500 rounded" />
            <span>ACTIVE BRANCH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-yellow-400 rounded-full" />
            <span>FINISH LINE</span>
          </div>
        </div>
      )}
    </div>
  );
};
