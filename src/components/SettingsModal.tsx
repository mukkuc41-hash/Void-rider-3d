import React, { useState } from 'react';
import { Volume2, VolumeX, Eye, Sparkles, X, RotateCcw, Monitor, Camera, ShieldAlert, Zap } from 'lucide-react';
import { sound } from '../game/audio';
import { CameraMode, GraphicsQuality, PlayerCollisionConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  cameraShakeEnabled: boolean;
  onToggleCameraShake: (enabled: boolean) => void;
  graphicsQuality: GraphicsQuality;
  onSelectGraphicsQuality: (quality: GraphicsQuality) => void;
  collisionConfig?: PlayerCollisionConfig;
  onUpdateCollisionConfig?: (config: Partial<PlayerCollisionConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentCameraMode,
  onSelectCameraMode,
  cameraShakeEnabled,
  onToggleCameraShake,
  graphicsQuality,
  onSelectGraphicsQuality,
  collisionConfig,
  onUpdateCollisionConfig,
}) => {
  const [sfxVolume, setSfxVolume] = useState<number>(Math.round(sound.sfxVolume * 100));
  const [musicVolume, setMusicVolume] = useState<number>(Math.round(sound.musicVolume * 100));
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  if (!isOpen) return null;

  const handleSfxChange = (val: number) => {
    setSfxVolume(val);
    sound.setSFXVolume(val / 100);
  };

  const handleMusicChange = (val: number) => {
    setMusicVolume(val);
    sound.setMusicVolume(val / 100);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.toggleMute(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div>
            <h2 className="text-xl sm:text-2xl font-ui font-black uppercase tracking-wider text-white">
              COSMIC FLIGHT TELEMETRY
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Configure optics, acoustic output, and graphics fidelity
            </p>
          </div>
          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* Audio Systems */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> ACOUSTIC SYNTHESIZER
              </span>
              <button
                onClick={handleToggleMute}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 border border-rose-400 text-rose-300'
                    : 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                }`}
              >
                {isMuted ? 'UNMUTE ALL' : 'MUTE ALL'}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">SFX & THRUSTER RESONANCE</span>
                <span className="text-cyan-400 font-bold">{sfxVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sfxVolume}
                onChange={e => handleSfxChange(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">SYNTHWAVE & COSMIC HARMONICS</span>
                <span className="text-cyan-400 font-bold">{musicVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={musicVolume}
                onChange={e => handleMusicChange(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Camera System Mode */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" /> FLIGHT PERSPECTIVE & CAMERA
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {(['CHASE_NEAR', 'CHASE_FAR', 'COCKPIT'] as CameraMode[]).map(mode => {
                const isSel = currentCameraMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      sound.playMenuClick();
                      onSelectCameraMode(mode);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      isSel
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_#00f0ff]'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-ui font-black uppercase">
                      {mode.replace('_', ' ')}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-mono text-slate-300">CAMERA SHAKE FX</span>
                <span className="text-[10px] text-slate-400">Dynamic G-force vibrations on boost & impacts</span>
              </div>
              <button
                onClick={() => {
                  sound.playMenuClick();
                  onToggleCameraShake(!cameraShakeEnabled);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  cameraShakeEnabled
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                }`}
              >
                {cameraShakeEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Graphics Fidelity */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> GRAPHICS FIDELITY & RESOLUTION
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map(qual => {
                const isSel = graphicsQuality === qual;
                return (
                  <button
                    key={qual}
                    onClick={() => {
                      sound.playMenuClick();
                      onSelectGraphicsQuality(qual);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      isSel
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_#00f0ff]'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-ui font-black uppercase">{qual}</div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                      {qual === 'LOW' ? '1.0x RES' : qual === 'MEDIUM' ? '1.25x RES' : 'RETINA 2.0x'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player & AI Spacecraft Collision Dynamics */}
          {collisionConfig && onUpdateCollisionConfig && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-1 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-pink-400" /> SPACECRAFT COLLISION DYNAMICS
              </span>
              <p className="text-[10px] text-slate-400 mb-3">
                Dedicated Player & AI physical collision response, knockback torque, and crash thresholds.
              </p>

              {/* Crash Threshold Preset */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1.5">
                  <span>CRASH THRESHOLD</span>
                  <span className="text-pink-400 font-bold">{collisionConfig.crashThreshold.toFixed(1)} FORCE</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'CASUAL', value: 12.0, sub: 'Rare Crashes' },
                    { label: 'ARCADE', value: 8.0, sub: 'Balanced' },
                    { label: 'HARDCORE', value: 5.5, sub: 'Punishing' },
                  ].map(preset => {
                    const isSel = Math.abs(collisionConfig.crashThreshold - preset.value) < 0.5;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          sound.playMenuClick();
                          onUpdateCollisionConfig({ crashThreshold: preset.value });
                        }}
                        className={`py-2 px-2 rounded-xl border text-center transition-all ${
                          isSel
                            ? 'border-pink-500 bg-pink-950/40 text-pink-300 shadow-[0_0_10px_rgba(255,0,128,0.3)]'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] font-ui font-black uppercase">{preset.label}</div>
                        <div className="text-[8px] font-mono text-slate-400">{preset.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Knockback Impulse Multiplier */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1.5">
                  <span>KNOCKBACK IMPULSE</span>
                  <span className="text-cyan-400 font-bold">{collisionConfig.knockbackMultiplier.toFixed(2)}x</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'LIGHT', val: 0.75 },
                    { label: 'BALANCED', val: 1.0 },
                    { label: 'HEAVY', val: 1.35 },
                  ].map(kb => {
                    const isSel = Math.abs(collisionConfig.knockbackMultiplier - kb.val) < 0.1;
                    return (
                      <button
                        key={kb.label}
                        onClick={() => {
                          sound.playMenuClick();
                          onUpdateCollisionConfig({ knockbackMultiplier: kb.val });
                        }}
                        className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
                          isSel
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_#00f0ff]'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px] font-ui font-black uppercase">{kb.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={() => {
              sound.playMenuClick();
              onClose();
            }}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-ui font-black text-xs uppercase tracking-widest shadow-[0_0_20px_#00f0ff] transition-all"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
