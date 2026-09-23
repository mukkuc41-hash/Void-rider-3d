import React, { useState } from 'react';
import { Bot, Play, X, Zap, Shield, Flame, Gauge, Sparkles } from 'lucide-react';
import { AIDifficulty, AIRaceConfig, TrackId } from '../types';
import { TRACK_CONFIGS } from '../game/trackData';

interface AIRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAIRace: (config: AIRaceConfig) => void;
}

export const AIRaceModal: React.FC<AIRaceModalProps> = ({ isOpen, onClose, onStartAIRace }) => {
  const [difficulty, setDifficulty] = useState<AIDifficulty>('NORMAL');
  const [trackId, setTrackId] = useState<TrackId>('circuit_alpha');
  const [botCount, setBotCount] = useState<number>(5);
  const [laps, setLaps] = useState<number>(2);

  if (!isOpen) return null;

  const handleLaunch = () => {
    onStartAIRace({
      difficulty,
      trackId,
      botCount,
      laps,
    });
  };

  const difficultyList: {
    id: AIDifficulty;
    label: string;
    desc: string;
    color: string;
    icon: any;
    bonus: string;
  }[] = [
    {
      id: 'EASY',
      label: '1. EASY',
      desc: 'Slow reaction, gentle steering, rare overtaking, avoids collisions, rarely uses missiles.',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
      icon: Shield,
      bonus: '+0% XP',
    },
    {
      id: 'NORMAL',
      label: '2. NORMAL',
      desc: 'Balanced racing, moderate overtakes, reacts to hazards, occasional missiles, human mistakes.',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
      icon: Gauge,
      bonus: '+25% XP',
    },
    {
      id: 'HARD',
      label: '3. HARD',
      desc: 'Fast reactions, aggressive acceleration & drift, strategic missiles, defensive line blocking.',
      color: 'border-blue-500/40 text-blue-400 bg-blue-950/20',
      icon: Zap,
      bonus: '+50% XP',
    },
    {
      id: 'EXPERT',
      label: '4. EXPERT',
      desc: 'Highly competitive, predictive movement, shortcuts, tactical ramming & lethal missile timing.',
      color: 'border-fuchsia-500/40 text-fuchsia-400 bg-fuchsia-950/20',
      icon: Flame,
      bonus: '+75% XP',
    },
    {
      id: 'MASTER',
      label: '5. MASTER',
      desc: 'Elite racing intelligence, dynamic counter-overtakes, advanced path blocking, realistic mistakes.',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      icon: Sparkles,
      bonus: '+100% XP',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_#00f0ff]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-ui font-black uppercase tracking-wider text-white">
                Solo AI Battle Mode
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Compete against procedural neural-network AI pilots offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* Difficulty Tier */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-2">
              AI Difficulty Protocol
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {difficultyList.map(item => {
                const isSel = difficulty === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSel
                        ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="font-ui font-black tracking-wider text-sm text-white">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300">
                        {item.bonus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Track Selection */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-2">
              Cosmic Track
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(TRACK_CONFIGS).map(([id, tConfig]) => {
                const isSel = trackId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTrackId(id as TrackId)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSel
                        ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-ui font-black uppercase tracking-wider text-white">
                      {tConfig.name}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
                      {tConfig.length}m // {tConfig.laps} LAPS
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                      {tConfig.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Size & Laps Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-slate-300">AI OPPONENT COUNT</span>
                <span className="text-cyan-400 font-bold">{botCount} RACERS</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={botCount}
                onChange={e => setBotCount(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>1 Duel</span>
                <span>5 Full Grid</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-slate-300">LAP LENGTH</span>
                <span className="text-cyan-400 font-bold">{laps} LAPS</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={laps}
                onChange={e => setLaps(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>1 Sprint</span>
                <span>5 Endurance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-mono text-xs hover:border-slate-500 transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-ui font-black text-sm uppercase tracking-widest shadow-[0_0_25px_#00f0ff] transition-all flex items-center justify-center gap-2 group"
          >
            <Play className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition-transform" />
            ENGAGE AI RACE
          </button>
        </div>
      </div>
    </div>
  );
};
