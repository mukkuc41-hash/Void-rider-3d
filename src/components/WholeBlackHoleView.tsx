import React, { useRef, useEffect, useState } from 'react';
import {
  Eye,
  Play,
  RotateCcw,
  Compass,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Flame,
  Shield,
  Layers,
} from 'lucide-react';
import { BlackHoleSubmodeConfig } from '../game/blackHoleSubmodes';
import {
  COSMIC_40_EVENT_PAIRS,
  CosmicEventPairData,
  CosmicEventElement,
} from '../game/catastrophe/cosmicEventElementsCatalog';
import { sound } from '../game/audio';

interface WholeBlackHoleViewProps {
  submode: BlackHoleSubmodeConfig;
  onClose?: () => void;
  onLaunchRace?: (useWholeBlackHoleCam: boolean) => void;
  isInline?: boolean;
  initialEventIndex?: number;
}

export const WholeBlackHoleView: React.FC<WholeBlackHoleViewProps> = ({
  submode,
  onClose,
  onLaunchRace,
  isInline = false,
  initialEventIndex = 4, // Default to Event 4: Planetary Collision as highlighted by user
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'WIDE' | 'ORBITAL' | 'HORIZON'>('WIDE');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [orbitAngle, setOrbitAngle] = useState<number>(0.2);
  const [pitchAngle, setPitchAngle] = useState<number>(0.28);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(initialEventIndex);
  const [activeTab, setActiveTab] = useState<'ELEMENTS' | 'SUBMODE'>('ELEMENTS');

  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeEventData: CosmicEventPairData =
    COSMIC_40_EVENT_PAIRS[selectedEventIndex] || COSMIC_40_EVENT_PAIRS[4];

  // Camera preset handler
  const selectPreset = (preset: 'WIDE' | 'ORBITAL' | 'HORIZON') => {
    sound.playMenuClick();
    setCameraPreset(preset);
    if (preset === 'WIDE') {
      setZoomLevel(0.9);
      setPitchAngle(0.3);
      setOrbitAngle(0.2);
    } else if (preset === 'ORBITAL') {
      setZoomLevel(1.35);
      setPitchAngle(0.12);
      setOrbitAngle(0.8);
    } else if (preset === 'HORIZON') {
      setZoomLevel(2.1);
      setPitchAngle(0.04);
      setOrbitAngle(1.4);
    }
  };

  const handlePrevEvent = () => {
    sound.playMenuClick();
    setSelectedEventIndex(prev => (prev > 1 ? prev - 1 : 40));
  };

  const handleNextEvent = () => {
    sound.playMenuClick();
    setSelectedEventIndex(prev => (prev < 40 ? prev + 1 : 1));
  };

  // Canvas Relativistic Black Hole & 2-Element Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Accretion disk particles
    const particleCount = 260;
    const diskParticles = Array.from({ length: particleCount }, () => {
      const radius = 60 + Math.pow(Math.random(), 1.5) * 160;
      const angle = Math.random() * Math.PI * 2;
      const speed = (180 / Math.pow(radius, 0.7)) * 0.012;
      const size = 1.2 + Math.random() * 2.5;
      const hue = 25 + Math.random() * 45;
      return { radius, angle, speed, size, hue, opacity: 0.4 + Math.random() * 0.6 };
    });

    // Spaghettified Stream Particles for Element 1 & 2
    const spaghettifiedParticles = Array.from({ length: 90 }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      distRatio: Math.random(),
      speed: 0.015 + Math.random() * 0.03,
      size: 1.5 + Math.random() * 2.5,
      isElement1: i % 2 === 0,
    }));

    const render = () => {
      time += 0.016;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = (zoomLevel * Math.min(w, h)) / 360;

      // 1. Deep Space Starfield & Singularity Backdrop
      const bgGrad = ctx.createRadialGradient(cx, cy, 10 * scale, cx, cy, 260 * scale);
      bgGrad.addColorStop(0, '#000002');
      bgGrad.addColorStop(0.3, '#030012');
      bgGrad.addColorStop(0.7, '#070324');
      bgGrad.addColorStop(1, '#020008');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Background ambient stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let s = 0; s < 36; s++) {
        const sx = (Math.sin(s * 99 + time * 0.05) * 0.5 + 0.5) * w;
        const sy = (Math.cos(s * 77 + time * 0.05) * 0.5 + 0.5) * h;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // 2. Relativistic Polar Jet Beams
      ctx.save();
      ctx.translate(cx, cy);
      const jetGradTop = ctx.createLinearGradient(0, 0, 0, -220 * scale);
      jetGradTop.addColorStop(0, 'rgba(168, 85, 247, 0.55)');
      jetGradTop.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
      jetGradTop.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = jetGradTop;
      ctx.beginPath();
      ctx.moveTo(-12 * scale, 0);
      ctx.lineTo(-45 * scale, -220 * scale);
      ctx.lineTo(45 * scale, -220 * scale);
      ctx.lineTo(12 * scale, 0);
      ctx.fill();

      const jetGradBottom = ctx.createLinearGradient(0, 0, 0, 220 * scale);
      jetGradBottom.addColorStop(0, 'rgba(168, 85, 247, 0.55)');
      jetGradBottom.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
      jetGradBottom.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = jetGradBottom;
      ctx.beginPath();
      ctx.moveTo(-12 * scale, 0);
      ctx.lineTo(-45 * scale, 220 * scale);
      ctx.lineTo(45 * scale, 220 * scale);
      ctx.lineTo(12 * scale, 0);
      ctx.fill();
      ctx.restore();

      // 3. Gravitational Lensing Arc (Rear light deflection)
      const lensRadius = 82 * scale;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, -6 * scale, lensRadius, Math.PI * 0.95, Math.PI * 2.05);
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.75)';
      ctx.lineWidth = 14 * scale;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18 * scale;
      ctx.stroke();
      ctx.restore();

      // 4. Rear Half of Accretion Disk
      const diskAspect = Math.max(0.15, Math.sin(pitchAngle));
      ctx.save();
      ctx.translate(cx, cy);

      diskParticles.forEach(p => {
        p.angle += p.speed;
        const currentAngle = p.angle + orbitAngle;
        const px = Math.cos(currentAngle) * p.radius * scale;
        const py = Math.sin(currentAngle) * p.radius * scale * diskAspect;

        if (py < 0) {
          const doppler = Math.sin(currentAngle) * 0.4 + 0.6;
          ctx.beginPath();
          ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, ${50 + doppler * 30}%, ${p.opacity * doppler})`;
          ctx.fill();
        }
      });
      ctx.restore();

      // 5. The Event Horizon (The Absolute Singularity Sphere)
      const eventHorizonRadius = 48 * scale;
      ctx.save();
      ctx.translate(cx, cy);

      // Photon Sphere (Intense luminous ring)
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius + 3.5 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.95)';
      ctx.lineWidth = 3.5 * scale;
      ctx.shadowColor = '#ffedd5';
      ctx.shadowBlur = 12 * scale;
      ctx.stroke();

      // True Black Event Horizon
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0;
      ctx.fill();
      ctx.restore();

      // 6. Front Half of Accretion Disk
      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.ellipse(0, 0, 130 * scale, 130 * scale * diskAspect, 0, 0, Math.PI * 2);
      const ringGlow = ctx.createLinearGradient(-130 * scale, 0, 130 * scale, 0);
      ringGlow.addColorStop(0, 'rgba(234, 88, 12, 0.55)');
      ringGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.7)');
      ringGlow.addColorStop(0.7, 'rgba(251, 146, 60, 0.85)');
      ringGlow.addColorStop(1, 'rgba(253, 186, 116, 0.4)');
      ctx.strokeStyle = ringGlow;
      ctx.lineWidth = 26 * scale;
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 24 * scale;
      ctx.stroke();

      diskParticles.forEach(p => {
        const currentAngle = p.angle + orbitAngle;
        const px = Math.cos(currentAngle) * p.radius * scale;
        const py = Math.sin(currentAngle) * p.radius * scale * diskAspect;

        if (py >= 0) {
          const doppler = Math.sin(currentAngle) * 0.4 + 0.6;
          ctx.beginPath();
          ctx.arc(px, py, p.size * scale * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, ${55 + doppler * 30}%, ${p.opacity * doppler})`;
          ctx.shadowColor = '#fb923c';
          ctx.shadowBlur = 4 * scale;
          ctx.fill();
        }
      });
      ctx.restore();

      // 7. Active 2-ELEMENT SIMULATION (Keplerian Orbit, Mutual Revolution, Collision & Spaghettification)
      const e1 = activeEventData.element1;
      const e2 = activeEventData.element2;

      ctx.save();
      ctx.translate(cx, cy);

      // Event cycle progress (0 to 1 over 12 seconds preview)
      const cycleDuration = 12.0;
      const cycleT = (time % cycleDuration) / cycleDuration;
      const distToCollision = Math.abs(cycleT - e1.collisionTimeRatio);
      const isColliding = distToCollision < 0.08;

      // Keplerian orbit of barycenter around black hole
      const bhOrbitRadius = 155 * scale;
      const bhOrbitSpeed = 0.35 + selectedEventIndex * 0.015;
      const bhAngle = time * bhOrbitSpeed + orbitAngle;
      const bcX = Math.cos(bhAngle) * bhOrbitRadius;
      const bcY = Math.sin(bhAngle) * bhOrbitRadius * diskAspect * 1.2;

      // Orbital guide ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, bhOrbitRadius, bhOrbitRadius * diskAspect * 1.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.lineWidth = 1.2 * scale;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mutual revolution around barycenter
      const revSpeed = 1.2 + selectedEventIndex * 0.05;
      const revAngle = time * revSpeed;
      const sepDist = (18 + distToCollision * 70) * scale;

      const p1x = bcX + Math.cos(revAngle) * sepDist * 0.55;
      const p1y = bcY + Math.sin(revAngle) * sepDist * 0.35;

      const p2x = bcX - Math.cos(revAngle) * sepDist * 0.55;
      const p2y = bcY - Math.sin(revAngle) * sepDist * 0.35;

      // Spaghettification progress
      const spaghProgress = Math.min(1.0, (cycleT / 0.85) * e1.spaghettificationRate * 1.2);

      // Collision Shockwave Ring
      if (isColliding) {
        const shockRadius = (8 + (1.0 - distToCollision / 0.08) * 36) * scale;
        ctx.beginPath();
        ctx.arc(bcX, bcY, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
        ctx.lineWidth = 3 * scale;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 16 * scale;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 237, 213, 0.45)';
        ctx.fill();

        // Flash text
        ctx.fillStyle = '#ffedd5';
        ctx.font = `bold ${Math.max(9, Math.round(10 * scale))}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('COLLISION SHOCKWAVE', bcX, bcY - shockRadius - 6);
      }

      // Draw Spaghettified Particle Filaments Streaming into Black Hole
      spaghettifiedParticles.forEach(sp => {
        sp.distRatio += sp.speed * (0.8 + spaghProgress * 1.2);
        if (sp.distRatio > 1.0) sp.distRatio = 0.0;

        const sourceX = sp.isElement1 ? p1x : p2x;
        const sourceY = sp.isElement1 ? p1y : p2y;

        // Infall curve towards (0, 0)
        const curX = sourceX * (1.0 - sp.distRatio);
        const curY = sourceY * (1.0 - sp.distRatio);

        ctx.beginPath();
        ctx.arc(curX, curY, sp.size * scale * (1.0 - sp.distRatio * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = sp.isElement1
          ? `rgba(251, 146, 60, ${0.85 - sp.distRatio * 0.6})`
          : `rgba(56, 189, 248, ${0.85 - sp.distRatio * 0.6})`;
        ctx.shadowColor = sp.isElement1 ? '#f97316' : '#0284c7';
        ctx.shadowBlur = 6 * scale;
        ctx.fill();
      });

      // Render Element 1 (Tidally Stretched along Vector to Singularity)
      const toBH1Angle = Math.atan2(-p1y, -p1x);
      ctx.save();
      ctx.translate(p1x, p1y);
      ctx.rotate(toBH1Angle);

      const r1 = Math.max(5, (e1.radius / 18) * scale);
      const stretch1X = r1 * (1.0 + spaghProgress * 2.2);
      const compress1Y = r1 / Math.sqrt(1.0 + spaghProgress * 2.2);

      ctx.beginPath();
      ctx.ellipse(0, 0, stretch1X, compress1Y, 0, 0, Math.PI * 2);
      ctx.fillStyle = `#${e1.color.toString(16).padStart(6, '0')}`;
      ctx.shadowColor = `#${e1.emissiveColor.toString(16).padStart(6, '0')}`;
      ctx.shadowBlur = 10 * scale;
      ctx.fill();
      ctx.restore();

      // Render Element 2 (Tidally Stretched along Vector to Singularity)
      const toBH2Angle = Math.atan2(-p2y, -p2x);
      ctx.save();
      ctx.translate(p2x, p2y);
      ctx.rotate(toBH2Angle);

      const r2 = Math.max(5, (e2.radius / 18) * scale);
      const stretch2X = r2 * (1.0 + spaghProgress * 2.2);
      const compress2Y = r2 / Math.sqrt(1.0 + spaghProgress * 2.2);

      ctx.beginPath();
      ctx.ellipse(0, 0, stretch2X, compress2Y, 0, 0, Math.PI * 2);
      ctx.fillStyle = `#${e2.color.toString(16).padStart(6, '0')}`;
      ctx.shadowColor = `#${e2.emissiveColor.toString(16).padStart(6, '0')}`;
      ctx.shadowBlur = 10 * scale;
      ctx.fill();
      ctx.restore();

      // Floating labels for Element 1 and Element 2
      ctx.font = `bold ${Math.max(8, Math.round(9 * scale))}px monospace`;
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText(`1: ${e1.name.toUpperCase()}`, p1x, p1y + r1 + 12);
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(`2: ${e2.name.toUpperCase()}`, p2x, p2y + r2 + 12);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [zoomLevel, orbitAngle, pitchAngle, selectedEventIndex, activeEventData]);

  // Mouse drag rotate controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setOrbitAngle(prev => prev + dx * 0.01);
    setPitchAngle(prev => Math.max(0.08, Math.min(1.2, prev - dy * 0.008)));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      className={`rounded-2xl border border-purple-500/40 bg-[#050914]/95 overflow-hidden flex flex-col ${
        isInline ? 'p-3 mt-3' : 'relative w-full max-w-5xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.3)]'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-400 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-black text-purple-400 tracking-widest uppercase flex items-center gap-1.5">
              <span>WHOLE BLACK HOLE CAMERA • 40-EVENT 2-ELEMENT SIMULATOR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-sm sm:text-base font-ui font-black uppercase text-white tracking-wide">
              SUBMODE {submode.number}: {submode.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-black/60 rounded-xl p-1 border border-purple-500/30">
            <button
              onClick={() => selectPreset('WIDE')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                cameraPreset === 'WIDE'
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              WIDE SYSTEM
            </button>
            <button
              onClick={() => selectPreset('ORBITAL')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                cameraPreset === 'ORBITAL'
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              ORBITAL PLANE
            </button>
            <button
              onClick={() => selectPreset('HORIZON')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                cameraPreset === 'HORIZON'
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              HORIZON
            </button>
          </div>

          {onClose && (
            <button
              onClick={() => {
                sound.playMenuClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
        {/* Left: Interactive Canvas Viewport */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="relative aspect-[16/9] min-h-[260px] sm:min-h-[300px] rounded-2xl overflow-hidden border border-purple-500/30 bg-black">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* Top-Left Live HUD Badge */}
            <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 border border-purple-500/40 text-[9px] font-mono font-bold text-purple-200 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>WHOLE BLACK HOLE RADAR // EVENT {activeEventData.eventIndex}</span>
              </div>
              <div className="text-[9px] font-mono text-cyan-400/90 pl-1">
                CLICK & DRAG TO ROTATE VIEW
              </div>
            </div>

            {/* Bottom-Right Zoom Controls */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 rounded-xl p-1 border border-purple-500/40">
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1.0);
                  setOrbitAngle(0.2);
                  setPitchAngle(0.28);
                }}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40"
                title="Reset Angle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 40-Event Scroller Bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevEvent}
                className="p-1 rounded-lg bg-black/60 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400"
                title="Previous Event"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-white uppercase">
                EVENT {activeEventData.eventIndex}/40:
              </span>
              <span className="text-[11px] font-bold text-amber-300 truncate max-w-[150px] sm:max-w-[200px]">
                {activeEventData.eventId.replace(/_/g, ' ').toUpperCase()}
              </span>
              <button
                onClick={handleNextEvent}
                className="p-1 rounded-lg bg-black/60 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400"
                title="Next Event"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 8, 15, 20, 27, 40].map(idx => (
                <button
                  key={idx}
                  onClick={() => {
                    sound.playMenuClick();
                    setSelectedEventIndex(idx);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    selectedEventIndex === idx
                      ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]'
                      : 'bg-black/50 text-purple-300 hover:text-white'
                  }`}
                >
                  {idx}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: 2-Element Details & Strategy Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          <div className="space-y-2 bg-[#081222]/95 border border-purple-500/30 rounded-2xl p-3.5 text-xs font-mono">
            {/* Tab switch between 2-Elements and Submode info */}
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('ELEMENTS')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    activeTab === 'ELEMENTS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2-ELEMENT OCCURRENCE
                </button>
                <button
                  onClick={() => setActiveTab('SUBMODE')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    activeTab === 'SUBMODE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SUBMODE METRICS
                </button>
              </div>

              <div className="text-[10px] font-bold text-purple-400">
                EVT #{activeEventData.eventIndex}
              </div>
            </div>

            {activeTab === 'ELEMENTS' ? (
              <div className="space-y-2.5 pt-1">
                {/* Element 1 Card */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      ELEMENT 1: {activeEventData.element1.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-[9px] text-amber-200 border border-amber-500/30 font-bold">
                      {activeEventData.element1.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 leading-snug">
                    <span className="text-amber-200/80 font-bold">REAL APPEARANCE: </span>
                    {activeEventData.element1.realAppearance}
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-0.5 border-t border-slate-800">
                    <span>ORBIT RADIUS: {activeEventData.element1.initialOrbitRadius}M</span>
                    <span className="text-amber-300">
                      PARTICLES: {activeEventData.element1.particleCount}
                    </span>
                  </div>
                </div>

                {/* Element 2 Card */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      ELEMENT 2: {activeEventData.element2.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-[9px] text-cyan-200 border border-cyan-500/30 font-bold">
                      {activeEventData.element2.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 leading-snug">
                    <span className="text-cyan-200/80 font-bold">REAL APPEARANCE: </span>
                    {activeEventData.element2.realAppearance}
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-0.5 border-t border-slate-800">
                    <span>ORBIT RADIUS: {activeEventData.element2.initialOrbitRadius}M</span>
                    <span className="text-cyan-300">
                      PARTICLES: {activeEventData.element2.particleCount}
                    </span>
                  </div>
                </div>

                {/* Real Event Occurrence Narrative */}
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[10px] text-purple-200/90 leading-relaxed">
                  <div className="font-bold text-purple-300 flex items-center gap-1 mb-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>REAL OCCURRENCE & SPAGHETTIFICATION:</span>
                  </div>
                  {activeEventData.eventOccurrenceNarrative}
                </div>

                {/* How this helps complete the event */}
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[10px] text-emerald-200 leading-relaxed">
                  <div className="font-bold text-emerald-300 flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>COMPLETION STRATEGY:</span>
                  </div>
                  {activeEventData.completionStrategy}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1 text-[11px]">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">GRAVITY FIELD:</span>
                  <span className="font-bold text-purple-300">
                    {submode.dangerProfile.gravityStrength.toFixed(2)}x EARTH
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">EVENT HORIZON:</span>
                  <span className="font-bold text-white">
                    {submode.dangerProfile.eventHorizonRadius} KM
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">TIDAL FORCE:</span>
                  <span className="font-bold text-amber-300">
                    {(submode.dangerProfile.tidalForce * 100).toFixed(0)}% SHEAR
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">SPACETIME WARP:</span>
                  <span className="font-bold text-cyan-300">
                    {(submode.dangerProfile.distortionStrength * 100).toFixed(0)}% METRIC
                  </span>
                </div>

                <div className="mt-2 text-[10px] text-purple-200/80 leading-relaxed bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/30">
                  <span className="font-bold text-purple-300 block mb-0.5">SUBMODE OBJECTIVE:</span>
                  {submode.objective}
                </div>
              </div>
            )}
          </div>

          {/* Launch Buttons */}
          {onLaunchRace && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  sound.playMenuClick();
                  onLaunchRace(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-ui font-black uppercase text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>LAUNCH WITH WHOLE BLACK HOLE VIEW</span>
              </button>

              <button
                onClick={() => {
                  sound.playMenuClick();
                  onLaunchRace(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white font-mono text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LAUNCH WITH STANDARD CHASE CAM</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
