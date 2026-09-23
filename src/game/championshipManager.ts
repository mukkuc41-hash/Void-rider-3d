import { TrackId } from '../types';
import { GameDifficulty } from './modeConfigs';

export interface ChampionshipStage {
  stageNumber: number;
  title: string;
  subtitle: string;
  trackId: TrackId;
  difficulty: GameDifficulty;
  laps: number;
  description: string;
}

export interface ChampionshipDriverStanding {
  id: string;
  name: string;
  isPlayer: boolean;
  totalPoints: number;
  stageResults: number[]; // finishing positions [1..6]
  stagePoints: number[];  // points earned per stage
  color: string;
}

export const CHAMPIONSHIP_STAGES: ChampionshipStage[] = [
  {
    stageNumber: 1,
    title: 'Stage 1: Neon Orbit',
    subtitle: 'Planetary Rings Proving Ground',
    trackId: 'neon_orbit',
    difficulty: 'NORMAL',
    laps: 2,
    description: 'High-speed sweeping turns through orbital spires. Establish your position on the leaderboard.',
  },
  {
    stageNumber: 2,
    title: 'Stage 2: Asteroid Run',
    subtitle: 'Ore Mine Debris Field',
    trackId: 'asteroid_run',
    difficulty: 'NORMAL',
    laps: 2,
    description: 'Dense kinetic boulders and subterranean lava tubes. Precise collision avoidance required.',
  },
  {
    stageNumber: 3,
    title: 'Stage 3: Cosmic Ring',
    subtitle: 'Solar Corona Gauntlet',
    trackId: 'cosmic_ring',
    difficulty: 'HARD',
    laps: 2,
    description: 'Pulsar megastructure with extreme acceleration rings and aggressive rival drafting.',
  },
  {
    stageNumber: 4,
    title: 'Stage 4: Void Rift',
    subtitle: 'Dark Matter Abyss',
    trackId: 'void_rift',
    difficulty: 'HARD',
    laps: 2,
    description: 'Singularity grav-wells and inverted corkscrews. Navigational discipline under high G-forces.',
  },
  {
    stageNumber: 5,
    title: 'Stage 5: Quantum Highway',
    subtitle: 'Hyper-Tunnel Laser Corridor',
    trackId: 'quantum_highway',
    difficulty: 'EXPERT',
    laps: 2,
    description: 'Supersonic multi-barrier transit gauntlet. Blinding speeds and narrow evasion apertures.',
  },
  {
    stageNumber: 6,
    title: 'Stage 6: Final Circuit Master',
    subtitle: 'Grand Championship Showdown',
    trackId: 'circuit_alpha',
    difficulty: 'MASTER',
    laps: 3,
    description: 'The pinnacle grand prix. Full hazard velocity, lethal AI rivals, and championship victory on the line.',
  },
];

export const CHAMPIONSHIP_POINTS_SCALE = [25, 18, 15, 12, 10, 8];

const STORAGE_KEY = 'void_rider_championship_save_v1';

export class ChampionshipManager {
  public currentStageIndex: number = 0; // 0 to 5
  public standings: ChampionshipDriverStanding[] = [];
  public isCompleted: boolean = false;

  constructor() {
    this.initDefaultStandings();
    this.loadProgress();
  }

  public initDefaultStandings() {
    this.standings = [
      { id: 'player', name: 'YOU (VOID-RIDER)', isPlayer: true, totalPoints: 0, stageResults: [], stagePoints: [], color: '#00f0ff' },
      { id: 'rival_1', name: 'VEX-9 (CHAMPION)', isPlayer: false, totalPoints: 0, stageResults: [], stagePoints: [], color: '#ff0055' },
      { id: 'rival_2', name: 'NOVA-X', isPlayer: false, totalPoints: 0, stageResults: [], stagePoints: [], color: '#ffaa00' },
      { id: 'rival_3', name: 'AURA-7', isPlayer: false, totalPoints: 0, stageResults: [], stagePoints: [], color: '#9d4edd' },
      { id: 'rival_4', name: 'KAI-ZERO', isPlayer: false, totalPoints: 0, stageResults: [], stagePoints: [], color: '#00ffcc' },
      { id: 'rival_5', name: 'PULSE-1', isPlayer: false, totalPoints: 0, stageResults: [], stagePoints: [], color: '#38bdf8' },
    ];
  }

  public getCurrentStage(): ChampionshipStage {
    return CHAMPIONSHIP_STAGES[Math.min(this.currentStageIndex, CHAMPIONSHIP_STAGES.length - 1)];
  }

  public getStandings(): ChampionshipDriverStanding[] {
    return [...this.standings];
  }

  public recordStageFinish(playerFinishPosition: number) {
    const stageIdx = this.currentStageIndex;

    // Award points based on position (1st -> 25, 2nd -> 18, etc.)
    const playerPoints = CHAMPIONSHIP_POINTS_SCALE[Math.min(playerFinishPosition - 1, CHAMPIONSHIP_POINTS_SCALE.length - 1)] || 5;

    // Simulate AI positions relative to player
    const availablePositions = [1, 2, 3, 4, 5, 6].filter(p => p !== playerFinishPosition);
    // Sort AI by current points / skill so top rivals contend for podium
    const sortedAIs = this.standings.filter(s => !s.isPlayer).sort((a, b) => b.totalPoints - a.totalPoints);

    sortedAIs.forEach((ai, idx) => {
      const pos = availablePositions[idx] || (idx + 1);
      const pts = CHAMPIONSHIP_POINTS_SCALE[pos - 1] || 4;
      ai.stageResults[stageIdx] = pos;
      ai.stagePoints[stageIdx] = pts;
      ai.totalPoints += pts;
    });

    const playerStanding = this.standings.find(s => s.isPlayer);
    if (playerStanding) {
      playerStanding.stageResults[stageIdx] = playerFinishPosition;
      playerStanding.stagePoints[stageIdx] = playerPoints;
      playerStanding.totalPoints += playerPoints;
    }

    // Sort standings by total points descending
    this.standings.sort((a, b) => b.totalPoints - a.totalPoints);

    if (this.currentStageIndex < CHAMPIONSHIP_STAGES.length - 1) {
      this.currentStageIndex++;
    } else {
      this.isCompleted = true;
    }

    this.saveProgress();
  }

  public retryCurrentStage() {
    // If replaying current stage, revert points awarded for this stage if recorded
    const stageIdx = this.currentStageIndex;
    this.standings.forEach(s => {
      if (s.stagePoints[stageIdx] !== undefined) {
        s.totalPoints -= s.stagePoints[stageIdx];
        s.stagePoints.splice(stageIdx, 1);
        s.stageResults.splice(stageIdx, 1);
      }
    });
    this.standings.sort((a, b) => b.totalPoints - a.totalPoints);
    this.saveProgress();
  }

  public resetChampionship() {
    this.currentStageIndex = 0;
    this.isCompleted = false;
    this.initDefaultStandings();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  public saveProgress() {
    try {
      const data = {
        currentStageIndex: this.currentStageIndex,
        isCompleted: this.isCompleted,
        standings: this.standings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  public loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.currentStageIndex !== undefined) {
          this.currentStageIndex = parsed.currentStageIndex;
        }
        if (parsed.isCompleted !== undefined) {
          this.isCompleted = parsed.isCompleted;
        }
        if (Array.isArray(parsed.standings) && parsed.standings.length > 0) {
          this.standings = parsed.standings;
        }
      }
    } catch (_) {}
  }
}

export const championshipManager = new ChampionshipManager();
