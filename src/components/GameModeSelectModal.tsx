import React, { useState, useMemo } from 'react';
import {
  Layers,
  X,
  Play,
  Timer,
  Radio,
  Skull,
  Crosshair,
  Compass,
  Orbit,
  Flame,
  Zap,
  Shield,
  Activity,
  Radar,
  Trophy,
  Gauge,
  Sparkles,
  Target,
  AlertTriangle,
  RotateCcw,
  Flag,
} from 'lucide-react';
import { GameMode, TrackId, AIDifficulty, GAME_MODE_CONFIGS } from '../types';
import { sound } from '../game/audio';

export interface ModeLaunchConfig {
  mode: GameMode;
  trackId: TrackId;
  laps: number;
  difficulty: AIDifficulty;
  botCount: number;
}
export type GameModeConfig = ModeLaunchConfig;

interface GameModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode?: (mode: GameMode) => void;
  onStartConfiguredRace?: (config: ModeLaunchConfig) => void;
}

interface ProtocolDef {
  id: GameMode;
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  badgeColor: string;
  category: 'SINGULARITY' | 'CIRCUIT' | 'SURVIVAL' | 'ANOMALY' | 'SPECIAL';
  icon: any;
  defaultBots: number;
  defaultLaps: number;
  defaultTrack: TrackId;
  isBlackHole?: boolean;
}

export const TWENTY_PROTOCOLS: ProtocolDef[] = [
  {
    id: 'SINGULARITY_RUN',
    num: '01',
    title: 'Singularity Run',
    subtitle: 'The Black-Hole Core Gauntlet',
    desc: 'The only black hole mode. Race around a massive central black hole, execute gravitational slingshots, navigate gravity surges, and reach the emergency escape portal before collapse.',
    badge: 'BLACK HOLE CORE',
    badgeColor: 'border-purple-500/70 bg-purple-950/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    category: 'SINGULARITY',
    icon: Orbit,
    defaultBots: 4,
    defaultLaps: 2,
    defaultTrack: 'circuit_alpha',
    isBlackHole: true,
  },
  {
    id: 'NEON_CIRCUIT',
    num: '02',
    title: 'Neon Circuit',
    subtitle: 'High-Velocity Megacity Grand Prix',
    desc: 'High-speed 3-lane circuit floating above a neon metropolis. Master sharp banked turns, boost pads, holographic energy gates, and elevated jump ramps.',
    badge: 'CIRCUIT PRO',
    badgeColor: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300',
    category: 'CIRCUIT',
    icon: Play,
    defaultBots: 5,
    defaultLaps: 3,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'ASTEROID_RUN',
    num: '03',
    title: 'Asteroid Run',
    subtitle: 'Deep Mining Field Weaving',
    desc: 'Dense asteroid field with tumbling debris clusters. Weave through narrow gaps or destroy threatening rocks using your ship destruction beam for drift and combat bonuses.',
    badge: 'COMBAT HAZARD',
    badgeColor: 'border-amber-500/50 bg-amber-950/60 text-amber-300',
    category: 'SURVIVAL',
    icon: Target,
    defaultBots: 4,
    defaultLaps: 2,
    defaultTrack: 'asteroid_run',
  },
  {
    id: 'WORMHOLE_EXPRESS',
    num: '04',
    title: 'Wormhole Express',
    subtitle: 'Spatial Teleportation Transit',
    desc: 'Navigate an unstable spatial route linked by 4 sequential wormholes. Choose the correct portals to trigger instantaneous hyperspace jumps without losing velocity.',
    badge: 'WARP TRANSIT',
    badgeColor: 'border-blue-500/50 bg-blue-950/60 text-blue-300',
    category: 'ANOMALY',
    icon: Sparkles,
    defaultBots: 4,
    defaultLaps: 2,
    defaultTrack: 'quantum_highway',
  },
  {
    id: 'SOLAR_STORM',
    num: '05',
    title: 'Solar Storm',
    subtitle: 'Coronal Mass Ejection Race',
    desc: 'Race under violent coronal mass ejections. Watch your ship Heat Meter—overheating locks your boost and cuts engine power. Dive into asteroid shadow zones to cool your core.',
    badge: 'THERMAL CRISIS',
    badgeColor: 'border-orange-500/50 bg-orange-950/60 text-orange-300',
    category: 'ANOMALY',
    icon: Flame,
    defaultBots: 4,
    defaultLaps: 2,
    defaultTrack: 'void_rift',
  },
  {
    id: 'GRAVITY_FREE',
    num: '06',
    title: 'Gravity Free',
    subtitle: 'Zero-G Stunt & Aerobatics Trial',
    desc: 'Zero-gravity acrobatics mode. Perform barrel rolls, 360 spins, and high-altitude flips in 3D space to chain stunt multipliers and build maximum score.',
    badge: 'FREESTYLE',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
    category: 'SPECIAL',
    icon: RotateCcw,
    defaultBots: 2,
    defaultLaps: 2,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'PLASMA_STORM',
    num: '07',
    title: 'Plasma Storm',
    subtitle: 'Frontier Storm Wall Evacuation',
    desc: 'An advancing lethal plasma storm wall pursues the fleet from behind! Maintain high forward velocity, collect temporary plasma shield bubbles, and escape to extraction.',
    badge: 'EVACUATION',
    badgeColor: 'border-fuchsia-500/50 bg-fuchsia-950/60 text-fuchsia-300',
    category: 'SURVIVAL',
    icon: Zap,
    defaultBots: 5,
    defaultLaps: 2,
    defaultTrack: 'quantum_highway',
  },
  {
    id: 'SKYLINE_RUSH',
    num: '08',
    title: 'Skyline Rush',
    subtitle: 'Orbital Spire Canyon Sprint',
    desc: 'Thread tight skyscraper corridors and vertical rooftop drops above the orbital station. Dodge automated drone traffic and jump between illuminated skyscraper pads.',
    badge: 'VERTICAL RUSH',
    badgeColor: 'border-teal-500/50 bg-teal-950/60 text-teal-300',
    category: 'CIRCUIT',
    icon: Gauge,
    defaultBots: 5,
    defaultLaps: 3,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'DEBRIS_SURVIVAL',
    num: '09',
    title: 'Debris Survival',
    subtitle: 'Endless Orbital Junkyard Gauntlet',
    desc: 'Endless procedural debris stream that escalates in speed and obstacle density. Earn survival points for near misses, laser demolitions, and endurance time.',
    badge: 'ENDLESS GAUNTLET',
    badgeColor: 'border-rose-500/50 bg-rose-950/60 text-rose-300',
    category: 'SURVIVAL',
    icon: Radio,
    defaultBots: 3,
    defaultLaps: 99,
    defaultTrack: 'asteroid_run',
  },
  {
    id: 'QUANTUM_TIME_TRIAL',
    num: '10',
    title: 'Quantum Time Trial',
    subtitle: 'Gold / Silver / Bronze Speed Trial',
    desc: 'Solo precision time attack. Shave milliseconds through apex lines, target Gold (45.0s), Silver (52.0s), and Bronze (60.0s) split checkpoints.',
    badge: 'PRECISION TRIAL',
    badgeColor: 'border-yellow-500/50 bg-yellow-950/60 text-yellow-300',
    category: 'CIRCUIT',
    icon: Timer,
    defaultBots: 0,
    defaultLaps: 2,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'ENERGY_HEIST',
    num: '11',
    title: 'Energy Heist',
    subtitle: 'Volatile Core Collection & Extraction',
    desc: 'Retrieve 8 energy cores scattered across the track. Each collected core adds mass and aerodynamic drag to your ship—balance speed and cargo to extract before time expires.',
    badge: 'TACTICAL HEIST',
    badgeColor: 'border-lime-500/50 bg-lime-950/60 text-lime-300',
    category: 'SPECIAL',
    icon: Activity,
    defaultBots: 3,
    defaultLaps: 2,
    defaultTrack: 'quantum_highway',
  },
  {
    id: 'DRONE_ASSAULT',
    num: '12',
    title: 'Drone Assault',
    subtitle: 'Autonomous Combat Interception',
    desc: 'Waves of hostile combat drones patrol the circuit. Fire your front destruction beam to blast down drone squadrons while maintaining podium race position.',
    badge: 'ARCADE COMBAT',
    badgeColor: 'border-red-500/50 bg-red-950/60 text-red-300',
    category: 'SURVIVAL',
    icon: Crosshair,
    defaultBots: 4,
    defaultLaps: 2,
    defaultTrack: 'void_rift',
  },
  {
    id: 'COLLAPSING_TRACK',
    num: '13',
    title: 'Collapsing Track',
    subtitle: 'Disintegrating Track Segments',
    desc: 'Track platforms disintegrate into the void behind you. Maintain continuous forward speed and execute emergency boost jumps over disappearing bridges.',
    badge: 'DISINTEGRATION',
    badgeColor: 'border-amber-600/50 bg-amber-950/60 text-amber-300',
    category: 'ANOMALY',
    icon: AlertTriangle,
    defaultBots: 4,
    defaultLaps: 2,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'RING_RUNNER',
    num: '14',
    title: 'Ring Runner',
    subtitle: 'Rotating Orbital Accelerator Rings',
    desc: 'Thread 12 colossal rotating orbital rings spinning at high angular velocity. Align your ship with rotating apertures to trigger massive kinetic speed boosts.',
    badge: 'PRECISION RINGS',
    badgeColor: 'border-indigo-500/50 bg-indigo-950/60 text-indigo-300',
    category: 'ANOMALY',
    icon: Shield,
    defaultBots: 3,
    defaultLaps: 2,
    defaultTrack: 'quantum_highway',
  },
  {
    id: 'HYPERSPACE_SPRINT',
    num: '15',
    title: 'Hyperspace Sprint',
    subtitle: '500+ KM/H Warp Corridor',
    desc: 'Extreme straight-line warp velocity mode. Pass through hyperspace gates, hit maximum boost, and experience relativistic star-stretching speed lines.',
    badge: 'EXTREME WARP',
    badgeColor: 'border-sky-500/50 bg-sky-950/60 text-sky-300',
    category: 'CIRCUIT',
    icon: Zap,
    defaultBots: 5,
    defaultLaps: 2,
    defaultTrack: 'void_rift',
  },
  {
    id: 'RIVAL_DUEL',
    num: '16',
    title: 'Rival Duel',
    subtitle: '1v1 Ace Clash vs "Zer0"',
    desc: 'Head-to-head grudge match against legendary ace pilot Zer0. Exploit slipstream drafting, defensive maneuvers, and branching routes in a fierce two-ship battle.',
    badge: '1V1 SHOWDOWN',
    badgeColor: 'border-violet-500/50 bg-violet-950/60 text-violet-300',
    category: 'SPECIAL',
    icon: Crosshair,
    defaultBots: 1,
    defaultLaps: 3,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'RELAY_RACE',
    num: '17',
    title: 'Relay Race',
    subtitle: '3-Ship Squad Specialty Swap',
    desc: 'Command a 3-ship squad across 3 legs. Switch automatically between Speed, Handling, and Boost-specialized spacecraft as you cross relay gates.',
    badge: 'TEAM SQUAD',
    badgeColor: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300',
    category: 'SPECIAL',
    icon: Flag,
    defaultBots: 3,
    defaultLaps: 3,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'SURVIVAL_ELIMINATION',
    num: '18',
    title: 'Survival Elimination',
    subtitle: 'Last Place Knockout Clock',
    desc: 'Every 25 seconds, the racer in last place is vaporized by track defense turrets. Fight for track position to be the final surviving pilot.',
    badge: 'KNOCKOUT CLOCK',
    badgeColor: 'border-red-600/60 bg-red-950/70 text-red-300',
    category: 'SURVIVAL',
    icon: Skull,
    defaultBots: 5,
    defaultLaps: 4,
    defaultTrack: 'circuit_alpha',
  },
  {
    id: 'COSMIC_TREASURE_HUNT',
    num: '19',
    title: 'Cosmic Treasure Hunt',
    subtitle: 'Relic Radar Triangulation',
    desc: 'Open orbital sector search. Use the HUD scanner to monitor signal strength, bearing, and distance to discover and extract 3 ancient energy relics.',
    badge: 'RADAR SEARCH',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
    category: 'SPECIAL',
    icon: Radar,
    defaultBots: 2,
    defaultLaps: 2,
    defaultTrack: 'asteroid_run',
  },
  {
    id: 'VOID_CHAMPIONSHIP',
    num: '20',
    title: 'Void Championship',
    subtitle: '6-Stage Premier Championship',
    desc: 'The ultimate 6-stage tournament across planetary orbits. Accumulate championship points (25-18-15) and claim the premier Void Trophy.',
    badge: 'PREMIER TROPHY',
    badgeColor: 'border-amber-400/60 bg-amber-950/70 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    category: 'SPECIAL',
    icon: Trophy,
    defaultBots: 5,
    defaultLaps: 3,
    defaultTrack: 'circuit_alpha',
  },
];

interface SectorDef {
  id: TrackId;
  name: string;
  subtitle: string;
  difficulty: 'STANDARD' | 'EXPERT';
}

const SECTORS: SectorDef[] = [
  {
    id: 'circuit_alpha',
    name: 'Neon Orbit',
    subtitle: 'Ringed Gas Giant & Megacity Spire',
    difficulty: 'STANDARD',
  },
  {
    id: 'asteroid_run',
    name: 'Asteroid Belt',
    subtitle: 'Deep Mining Field & Fractured Clusters',
    difficulty: 'EXPERT',
  },
  {
    id: 'void_rift',
    name: 'Solar Flare / Void Rift',
    subtitle: 'Blistering Stellar Proximity & Plasma Arcs',
    difficulty: 'EXPERT',
  },
  {
    id: 'quantum_highway',
    name: 'Quantum Realm / Highway',
    subtitle: 'Sub-Atomic Warp Tunnels & Dimensional Rifts',
    difficulty: 'STANDARD',
  },
];

export const GameModeSelectModal: React.FC<GameModeSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  onStartConfiguredRace,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('SINGULARITY_RUN');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<TrackId>('circuit_alpha');
  const [lapCount, setLapCount] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('STANDARD');

  const filteredProtocols = useMemo(() => {
    if (filterCategory === 'ALL') return TWENTY_PROTOCOLS;
    return TWENTY_PROTOCOLS.filter(p => p.category === filterCategory);
  }, [filterCategory]);

  if (!isOpen) return null;

  const activeDef = TWENTY_PROTOCOLS.find(p => p.id === selectedMode) || TWENTY_PROTOCOLS[0];

  const handleLaunch = () => {
    sound.playMenuClick();
    if (onStartConfiguredRace) {
      onStartConfiguredRace({
        mode: selectedMode,
        trackId: selectedSector,
        laps: selectedMode === 'DEBRIS_SURVIVAL' ? 99 : lapCount,
        difficulty,
        botCount: activeDef.defaultBots,
      });
    } else if (onSelectMode) {
      onSelectMode(selectedMode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#060c18]/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-cyan-500/20 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)] shrink-0">
              <Layers className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-ui font-black uppercase tracking-wider text-white">
                  VOID-RIDER 3D — 20 GAME MODES
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                  20 PROTOCOLS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Mode 01 features the Black-Hole Singularity system. Modes 02–20 feature distinct non-black-hole gameplay.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playMenuClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 shrink-0 scrollbar-none border-b border-slate-800/80">
          {[
            { id: 'ALL', label: 'ALL MODES (20)' },
            { id: 'SINGULARITY', label: '01 BLACK HOLE (1)' },
            { id: 'CIRCUIT', label: 'CIRCUIT & SPEED (4)' },
            { id: 'SURVIVAL', label: 'COMBAT & SURVIVAL (5)' },
            { id: 'ANOMALY', label: 'ANOMALY HAZARDS (4)' },
            { id: 'SPECIAL', label: 'SPECIALTY & HEIST (6)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playMenuClick();
                setFilterCategory(tab.id);
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all whitespace-nowrap ${
                filterCategory === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area: Split 2-Column on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-3 flex-1 overflow-y-auto pr-1">
          {/* Left Column: Scrollable List of Modes */}
          <div className="lg:col-span-7 space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {filteredProtocols.map(proto => {
              const Icon = proto.icon;
              const isSelected = selectedMode === proto.id;

              return (
                <div
                  key={proto.id}
                  onClick={() => {
                    sound.playMenuClick();
                    setSelectedMode(proto.id);
                    setSelectedSector(proto.defaultTrack);
                    setLapCount(proto.defaultLaps);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? proto.isBlackHole
                        ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_22px_rgba(168,85,247,0.35)]'
                        : 'bg-[#08172c] border-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.25)]'
                      : 'bg-[#060e1b]/80 border-slate-800/90 hover:border-slate-700 hover:bg-[#081222]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? proto.isBlackHole
                              ? 'bg-purple-900/80 border border-purple-400 text-purple-300'
                              : 'bg-cyan-950 border border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-black text-cyan-400/80">
                            {proto.num}
                          </span>
                          <h3 className="text-sm font-ui font-black uppercase tracking-wide text-white">
                            {proto.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {proto.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider shrink-0 border ${proto.badgeColor}`}>
                      {proto.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Mode Details & Launch Configuration */}
          <div className="lg:col-span-5 bg-[#050b14]/90 border border-cyan-500/20 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              {/* Selected Mode Header */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-cyan-400">
                  MODE {activeDef.num}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${activeDef.badgeColor}`}>
                  {activeDef.badge}
                </span>
              </div>
              <h3 className="text-base font-ui font-black uppercase tracking-wider text-white mt-1">
                {activeDef.title}
              </h3>
              <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">
                {activeDef.subtitle}
              </p>

              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed font-sans">
                {activeDef.desc}
              </div>

              {/* Black Hole Exclusivity Notice for Mode 01 */}
              {activeDef.isBlackHole && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-[10px] font-mono text-purple-300 leading-snug">
                  ★ EXCLUSIVE BLACK HOLE CORE: Accretion Disk, Event Horizon Danger Zone, Slingshot Boost Physics & Escape Portal active.
                </div>
              )}

              {/* Mode Specification Matrix */}
              {(() => {
                const config = GAME_MODE_CONFIGS[selectedMode];
                if (!config) return null;
                return (
                  <div className="mt-2.5 space-y-1.5 p-2.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-[10px] font-mono">
                    <div>
                      <span className="text-cyan-400 font-bold">OBJECTIVE: </span>
                      <span className="text-slate-200">{config.objective}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-bold">WIN: </span>
                      <span className="text-slate-300">{config.winCondition}</span>
                    </div>
                    <div>
                      <span className="text-rose-400 font-bold">LOSS: </span>
                      <span className="text-slate-300">{config.lossCondition}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-amber-400 font-bold mr-1">HAZARDS:</span>
                      {config.hazards.map((h, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-600/40 text-[9px] text-amber-300">
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-cyan-400 font-bold mr-1">MECHANICS:</span>
                      {config.mechanics.map((m, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/40 text-[9px] text-cyan-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Race Settings */}
              <div className="mt-3.5 space-y-2.5">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    ORBITAL SECTOR
                  </label>
                  <select
                    value={selectedSector}
                    onChange={e => setSelectedSector(e.target.value as TrackId)}
                    className="w-full bg-[#081220] border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    {SECTORS.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      DIFFICULTY
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as AIDifficulty)}
                      className="w-full bg-[#081220] border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="RECRUIT">RECRUIT</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="ACE">ACE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      CIRCUIT LAPS
                    </label>
                    <select
                      value={lapCount}
                      onChange={e => setLapCount(Number(e.target.value))}
                      className="w-full bg-[#081220] border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="1">1 LAP (SPRINT)</option>
                      <option value="2">2 LAPS (STANDARD)</option>
                      <option value="3">3 LAPS (CHAMPIONSHIP)</option>
                      <option value="5">5 LAPS (ENDURANCE)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={handleLaunch}
                className={`w-full py-2.5 px-4 rounded-xl font-ui font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                  activeDef.isBlackHole
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LAUNCH {activeDef.title.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
