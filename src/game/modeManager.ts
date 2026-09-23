import * as THREE from 'three';
import { GameMode, TrackId } from '../types';

export interface ModeHUDTelemetry {
  mode: GameMode;
  modeName: string;
  objectiveText: string;
  primaryMetricLabel: string;
  primaryMetricValue: string | number;
  secondaryMetricLabel?: string;
  secondaryMetricValue?: string | number;
  progressPercent: number;
  warningAlert?: string | null;
  customOverlayType?:
    | 'SINGULARITY'
    | 'SOLAR_HEAT'
    | 'STUNT_COMBO'
    | 'STORM_WALL'
    | 'TIME_TARGETS'
    | 'HEIST_CORES'
    | 'DRONE_WAVES'
    | 'COLLAPSE_GAP'
    | 'RING_GATES'
    | 'HYPER_WARP'
    | 'RIVAL_GAP'
    | 'RELAY_SHIP'
    | 'ELIMINATION_CLOCK'
    | 'RELIC_RADAR'
    | 'CHAMPIONSHIP_POINTS'
    | 'STANDARD';
  stuntScore?: number;
  heatLevel?: number; // 0-100
  droneCount?: number;
  coresCollected?: number;
  targetCores?: number;
  ringsPassed?: number;
  relicsFound?: number;
  totalRelics?: number;
  radarDistance?: number;
  radarSignal?: number; // 0-100%
  eliminationTimer?: number;
  championshipStage?: number;
  championshipTotalStages?: number;
  championshipScore?: number;
}

export class ModeManager {
  public currentMode: GameMode = 'NEON_CIRCUIT';
  public modeTimer = 0;
  public score = 0;
  public currentTelemetry: ModeHUDTelemetry | null = null;

  // Mode 05: Solar Storm
  public solarHeat = 0; // 0-100%
  public heatWarning = false;

  // Mode 06: Gravity Free Stunt
  public stuntScore = 0;
  public stuntCombo = 1;
  public lastStuntName = '';
  public stuntRotationSum = 0;

  // Mode 07: Plasma Storm
  public stormWallDistance = 350; // meters behind

  // Mode 09: Debris Survival
  public debrisDestroyed = 0;
  public nearMisses = 0;
  public survivalTime = 0;

  // Mode 10: Quantum Time Trial
  public goldTargetMs = 45000;
  public silverTargetMs = 52000;
  public bronzeTargetMs = 60000;

  // Mode 11: Energy Heist
  public coresCollected = 0;
  public targetCores = 8;
  public heistTimer = 90;

  // Mode 12: Drone Assault
  public droneWave = 1;
  public dronesDestroyed = 0;
  public totalDronesInWave = 6;

  // Mode 13: Collapsing Track
  public collapseGap = 120; // meters behind player

  // Mode 14: Ring Runner
  public ringsPassed = 0;
  public totalRings = 12;

  // Mode 15: Hyperspace Sprint
  public warpVelocity = 320;

  // Mode 16: Rival Duel
  public rivalGapMeters = 15;

  // Mode 17: Relay Race
  public currentLeg = 1;
  public totalLegs = 3;
  public legShipSpecialty = 'SPEED';

  // Mode 18: Survival Elimination
  public eliminationTimer = 25;
  public activeRacersCount = 6;

  // Mode 19: Cosmic Treasure Hunt
  public relicsFound = 0;
  public totalRelics = 3;
  public radarDistance = 180;
  public radarSignal = 75;

  // Mode 20: Void Championship
  public championshipStage = 1;
  public totalChampionshipStages = 6;
  public championshipPoints = 0;

  constructor(mode: GameMode = 'NEON_CIRCUIT') {
    this.setMode(mode);
  }

  public setMode(mode: GameMode) {
    this.currentMode = mode;
    this.modeTimer = 0;
    this.score = 0;
    this.solarHeat = 0;
    this.stuntScore = 0;
    this.stuntCombo = 1;
    this.debrisDestroyed = 0;
    this.nearMisses = 0;
    this.survivalTime = 0;
    this.coresCollected = 0;
    this.heistTimer = 90;
    this.droneWave = 1;
    this.dronesDestroyed = 0;
    this.collapseGap = 140;
    this.ringsPassed = 0;
    this.currentLeg = 1;
    this.eliminationTimer = 25;
    this.activeRacersCount = 6;
    this.relicsFound = 0;
    this.championshipPoints = 0;
  }

  public update(dt: number, shipSpeed: number, isBoosting: boolean, isDrifting: boolean): ModeHUDTelemetry {
    const tel = this.computeTelemetry(dt, shipSpeed, isBoosting, isDrifting);
    this.currentTelemetry = tel;
    return tel;
  }

  private computeTelemetry(dt: number, shipSpeed: number, isBoosting: boolean, isDrifting: boolean): ModeHUDTelemetry {
    this.modeTimer += dt;

    switch (this.currentMode) {
      case 'SINGULARITY_RUN':
        return {
          mode: 'SINGULARITY_RUN',
          modeName: '01 — SINGULARITY RUN',
          objectiveText: 'SLINGSHOT PAST EVENT HORIZON & REACH ESCAPE WORMHOLE',
          primaryMetricLabel: 'GRAVITY PULL',
          primaryMetricValue: `${Math.min(99, Math.floor(shipSpeed * 0.25))} m/s²`,
          secondaryMetricLabel: 'SLINGSHOT',
          secondaryMetricValue: isBoosting ? 'SURGE ACTIVE' : 'OPTIMAL ANGLE',
          progressPercent: Math.min(100, (this.modeTimer / 75) * 100),
          customOverlayType: 'SINGULARITY',
        };

      case 'NEON_CIRCUIT':
        return {
          mode: 'NEON_CIRCUIT',
          modeName: '02 — NEON CIRCUIT',
          objectiveText: 'OUTMANEUVER RIVALS & SECURE PODIUM FINISH',
          primaryMetricLabel: 'VELOCITY',
          primaryMetricValue: `${Math.floor(shipSpeed)} KM/H`,
          secondaryMetricLabel: 'LANE STATUS',
          secondaryMetricValue: 'OPTIMAL APEX',
          progressPercent: Math.min(100, (this.modeTimer / 60) * 100),
          customOverlayType: 'STANDARD',
        };

      case 'ASTEROID_RUN':
        return {
          mode: 'ASTEROID_RUN',
          modeName: '03 — ASTEROID RUN',
          objectiveText: 'WEAVE THROUGH DENSE FIELD & DESTROY ASTEROIDS WITH BEAM',
          primaryMetricLabel: 'FIELD DENSITY',
          primaryMetricValue: 'CRITICAL',
          secondaryMetricLabel: 'DEBRIS DESTROYED',
          secondaryMetricValue: this.debrisDestroyed,
          progressPercent: Math.min(100, (this.debrisDestroyed / 15) * 100),
          customOverlayType: 'STANDARD',
        };

      case 'WORMHOLE_EXPRESS':
        return {
          mode: 'WORMHOLE_EXPRESS',
          modeName: '04 — WORMHOLE EXPRESS',
          objectiveText: 'NAVIGATE UNSTABLE SPATIAL WORMHOLE ROUTE CHAIN',
          primaryMetricLabel: 'WORMHOLE PORTALS',
          primaryMetricValue: `${Math.min(4, Math.floor(this.modeTimer / 12) + 1)} / 4`,
          secondaryMetricLabel: 'SPATIAL DISTORTION',
          secondaryMetricValue: 'NOMINAL',
          progressPercent: Math.min(100, (this.modeTimer / 48) * 100),
          customOverlayType: 'STANDARD',
        };

      case 'SOLAR_STORM':
        if (isBoosting) this.solarHeat += dt * 9;
        this.solarHeat = Math.min(100, Math.max(0, this.solarHeat + dt * 2.8 - (shipSpeed < 100 ? dt * 5 : 0)));
        this.heatWarning = this.solarHeat > 80;
        return {
          mode: 'SOLAR_STORM',
          modeName: '05 — SOLAR STORM',
          objectiveText: 'RACE THROUGH SOLAR FLARES WITHOUT OVERHEATING CORE',
          primaryMetricLabel: 'HEAT METER',
          primaryMetricValue: `${Math.floor(this.solarHeat)}%`,
          secondaryMetricLabel: 'CORE STATUS',
          secondaryMetricValue: this.heatWarning ? 'OVERHEAT WARNING!' : 'STABLE',
          progressPercent: this.solarHeat,
          heatLevel: Math.floor(this.solarHeat),
          warningAlert: this.heatWarning ? 'HEAT CRITICAL // DISENGAGE BOOST' : undefined,
          customOverlayType: 'SOLAR_HEAT',
        };

      case 'GRAVITY_FREE':
        if (isDrifting) {
          this.stuntScore += Math.floor(dt * 150 * this.stuntCombo);
        }
        return {
          mode: 'GRAVITY_FREE',
          modeName: '06 — GRAVITY FREE',
          objectiveText: 'PERFORM 3D ROTATIONS, BARREL ROLLS & COMBO STUNTS',
          primaryMetricLabel: 'STUNT SCORE',
          primaryMetricValue: this.stuntScore,
          secondaryMetricLabel: 'MULTIPLIER',
          secondaryMetricValue: `${this.stuntCombo.toFixed(1)}x`,
          progressPercent: Math.min(100, (this.stuntScore / 5000) * 100),
          stuntScore: this.stuntScore,
          customOverlayType: 'STUNT_COMBO',
        };

      case 'PLASMA_STORM':
        this.stormWallDistance = Math.max(15, 350 - (120 - shipSpeed) * this.modeTimer * 0.08);
        return {
          mode: 'PLASMA_STORM',
          modeName: '07 — PLASMA STORM',
          objectiveText: 'OUTRUN THE ADVANCING PLASMA WALL TO EXTRACTION',
          primaryMetricLabel: 'STORM DISTANCE',
          primaryMetricValue: `${Math.floor(this.stormWallDistance)}m`,
          secondaryMetricLabel: 'SURGE VELOCITY',
          secondaryMetricValue: '280 KM/H',
          progressPercent: Math.max(0, 100 - (this.stormWallDistance / 350) * 100),
          warningAlert: this.stormWallDistance < 50 ? 'PLASMA WALL PROXIMITY ALERT!' : undefined,
          customOverlayType: 'STORM_WALL',
        };

      case 'SKYLINE_RUSH':
        return {
          mode: 'SKYLINE_RUSH',
          modeName: '08 — SKYLINE RUSH',
          objectiveText: 'THREAD ORBITAL SKYSCRAPER CANYONS AT MAXIMUM VELOCITY',
          primaryMetricLabel: 'ALTITUDE',
          primaryMetricValue: '1,420M',
          secondaryMetricLabel: 'CORRIDOR FLOW',
          secondaryMetricValue: 'OPTIMAL',
          progressPercent: Math.min(100, (this.modeTimer / 55) * 100),
          customOverlayType: 'STANDARD',
        };

      case 'DEBRIS_SURVIVAL':
        this.survivalTime += dt;
        return {
          mode: 'DEBRIS_SURVIVAL',
          modeName: '09 — DEBRIS SURVIVAL',
          objectiveText: 'ENDLESS DEBRIS SURVIVAL // DESTROY OR DODGE',
          primaryMetricLabel: 'SURVIVAL TIME',
          primaryMetricValue: `${Math.floor(this.survivalTime)}s`,
          secondaryMetricLabel: 'NEAR MISSES',
          secondaryMetricValue: this.nearMisses,
          progressPercent: Math.min(100, (this.survivalTime / 90) * 100),
          customOverlayType: 'STANDARD',
        };

      case 'QUANTUM_TIME_TRIAL':
        return {
          mode: 'QUANTUM_TIME_TRIAL',
          modeName: '10 — QUANTUM TIME TRIAL',
          objectiveText: 'BEAT GOLD (45.0s), SILVER (52.0s), BRONZE (60.0s)',
          primaryMetricLabel: 'LAP TIME',
          primaryMetricValue: `${(this.modeTimer).toFixed(2)}s`,
          secondaryMetricLabel: 'TARGET (GOLD)',
          secondaryMetricValue: '45.00s',
          progressPercent: Math.min(100, (this.modeTimer / 45) * 100),
          customOverlayType: 'TIME_TARGETS',
        };

      case 'ENERGY_HEIST':
        this.heistTimer = Math.max(0, 90 - this.modeTimer);
        return {
          mode: 'ENERGY_HEIST',
          modeName: '11 — ENERGY HEIST',
          objectiveText: 'COLLECT 8 ENERGY CORES & EXTRACT BEFORE TIME RUNS OUT',
          primaryMetricLabel: 'CORES COLLECTED',
          primaryMetricValue: `${this.coresCollected} / ${this.targetCores}`,
          secondaryMetricLabel: 'MASS PENALTY',
          secondaryMetricValue: `+${this.coresCollected * 5}% DRAG`,
          progressPercent: (this.coresCollected / this.targetCores) * 100,
          coresCollected: this.coresCollected,
          targetCores: this.targetCores,
          customOverlayType: 'HEIST_CORES',
        };

      case 'DRONE_ASSAULT':
        return {
          mode: 'DRONE_ASSAULT',
          modeName: '12 — DRONE ASSAULT',
          objectiveText: 'DESTROY HOSTILE DRONE WAVES WITH FRONT DESTRUCTION BEAM',
          primaryMetricLabel: 'WAVE',
          primaryMetricValue: `${this.droneWave} / 3`,
          secondaryMetricLabel: 'DRONES DOWNED',
          secondaryMetricValue: `${this.dronesDestroyed} / ${this.totalDronesInWave}`,
          progressPercent: (this.dronesDestroyed / this.totalDronesInWave) * 100,
          droneCount: this.totalDronesInWave - this.dronesDestroyed,
          customOverlayType: 'DRONE_WAVES',
        };

      case 'COLLAPSING_TRACK':
        this.collapseGap = Math.max(20, 140 - (110 - shipSpeed) * this.modeTimer * 0.1);
        return {
          mode: 'COLLAPSING_TRACK',
          modeName: '13 — COLLAPSING TRACK',
          objectiveText: 'MAINTAIN SPEED // TRACK DISINTEGRATES BEHIND YOU',
          primaryMetricLabel: 'COLLAPSE GAP',
          primaryMetricValue: `${Math.floor(this.collapseGap)}m`,
          secondaryMetricLabel: 'DISINTEGRATION RATE',
          secondaryMetricValue: 'HIGH',
          progressPercent: Math.max(0, 100 - (this.collapseGap / 140) * 100),
          warningAlert: this.collapseGap < 40 ? 'TRACK DISINTEGRATING RAPIDLY!' : undefined,
          customOverlayType: 'COLLAPSE_GAP',
        };

      case 'RING_RUNNER':
        return {
          mode: 'RING_RUNNER',
          modeName: '14 — RING RUNNER',
          objectiveText: 'THREAD SEQUENTIAL ROTATING ORBITAL ACCELERATOR RINGS',
          primaryMetricLabel: 'RINGS CLEARED',
          primaryMetricValue: `${this.ringsPassed} / ${this.totalRings}`,
          secondaryMetricLabel: 'ROTATION FREQ',
          secondaryMetricValue: '1.8 RAD/S',
          progressPercent: (this.ringsPassed / this.totalRings) * 100,
          ringsPassed: this.ringsPassed,
          customOverlayType: 'RING_GATES',
        };

      case 'HYPERSPACE_SPRINT':
        this.warpVelocity = THREE.MathUtils.lerp(this.warpVelocity, isBoosting ? 520 : 380, dt * 2);
        return {
          mode: 'HYPERSPACE_SPRINT',
          modeName: '15 — HYPERSPACE SPRINT',
          objectiveText: 'EXCEED 500 KM/H IN WARP TUNNEL & REACH DESTINATION',
          primaryMetricLabel: 'WARP VELOCITY',
          primaryMetricValue: `${Math.floor(this.warpVelocity)} KM/H`,
          secondaryMetricLabel: 'WARP FACTOR',
          secondaryMetricValue: (this.warpVelocity / 100).toFixed(1),
          progressPercent: Math.min(100, (this.warpVelocity / 500) * 100),
          customOverlayType: 'HYPER_WARP',
        };

      case 'RIVAL_DUEL':
        return {
          mode: 'RIVAL_DUEL',
          modeName: '16 — RIVAL DUEL',
          objectiveText: '1V1 GRUDGE MATCH AGAINST ACE ACE "ZER0"',
          primaryMetricLabel: 'RIVAL GAP',
          primaryMetricValue: `${this.rivalGapMeters > 0 ? '+' : ''}${this.rivalGapMeters.toFixed(1)}m`,
          secondaryMetricLabel: 'OPPONENT',
          secondaryMetricValue: 'ZER0 [ACE]',
          progressPercent: Math.min(100, (this.modeTimer / 50) * 100),
          customOverlayType: 'RIVAL_GAP',
        };

      case 'RELAY_RACE':
        return {
          mode: 'RELAY_RACE',
          modeName: '17 — RELAY RACE',
          objectiveText: 'CONTROL 3-SHIP TEAM // AUTO-SWAP AT RELAY GATES',
          primaryMetricLabel: 'RELAY LEG',
          primaryMetricValue: `${this.currentLeg} / ${this.totalLegs}`,
          secondaryMetricLabel: 'SPECIALTY',
          secondaryMetricValue: this.legShipSpecialty,
          progressPercent: (this.currentLeg / this.totalLegs) * 100,
          customOverlayType: 'RELAY_SHIP',
        };

      case 'SURVIVAL_ELIMINATION':
        this.eliminationTimer = Math.max(0, this.eliminationTimer - dt);
        if (this.eliminationTimer <= 0) {
          this.eliminationTimer = 25;
          this.activeRacersCount = Math.max(1, this.activeRacersCount - 1);
        }
        return {
          mode: 'SURVIVAL_ELIMINATION',
          modeName: '18 — SURVIVAL ELIMINATION',
          objectiveText: 'LAST PLACE ELIMINATED EVERY 25 SECONDS // STAY AHEAD',
          primaryMetricLabel: 'KNOCKOUT CLOCK',
          primaryMetricValue: `${Math.ceil(this.eliminationTimer)}s`,
          secondaryMetricLabel: 'RACERS REMAINING',
          secondaryMetricValue: `${this.activeRacersCount} / 6`,
          progressPercent: ((25 - this.eliminationTimer) / 25) * 100,
          eliminationTimer: Math.ceil(this.eliminationTimer),
          warningAlert: this.eliminationTimer < 5 ? 'ELIMINATION PROTOCOL IMMINENT!' : undefined,
          customOverlayType: 'ELIMINATION_CLOCK',
        };

      case 'COSMIC_TREASURE_HUNT':
        this.radarDistance = Math.max(12, 180 - (this.relicsFound * 50) - (Math.sin(this.modeTimer) * 20));
        this.radarSignal = Math.floor(Math.max(10, 100 - this.radarDistance * 0.5));
        return {
          mode: 'COSMIC_TREASURE_HUNT',
          modeName: '19 — COSMIC TREASURE HUNT',
          objectiveText: 'SCAN RADAR & EXTRACT 3 ANCIENT ENERGY RELICS',
          primaryMetricLabel: 'RELICS FOUND',
          primaryMetricValue: `${this.relicsFound} / ${this.totalRelics}`,
          secondaryMetricLabel: 'RADAR SIGNAL',
          secondaryMetricValue: `${this.radarSignal}%`,
          progressPercent: (this.relicsFound / this.totalRelics) * 100,
          relicsFound: this.relicsFound,
          totalRelics: this.totalRelics,
          radarDistance: Math.floor(this.radarDistance),
          radarSignal: this.radarSignal,
          customOverlayType: 'RELIC_RADAR',
        };

      case 'VOID_CHAMPIONSHIP':
        return {
          mode: 'VOID_CHAMPIONSHIP',
          modeName: '20 — VOID CHAMPIONSHIP',
          objectiveText: '6-STAGE PREMIER TOURNAMENT // ACCUMULATE POINTS',
          primaryMetricLabel: 'STAGE',
          primaryMetricValue: `${this.championshipStage} / ${this.totalChampionshipStages}`,
          secondaryMetricLabel: 'POINTS',
          secondaryMetricValue: `${this.championshipPoints} PTS`,
          progressPercent: (this.championshipStage / this.totalChampionshipStages) * 100,
          championshipStage: this.championshipStage,
          championshipTotalStages: this.totalChampionshipStages,
          championshipScore: this.championshipPoints,
          customOverlayType: 'CHAMPIONSHIP_POINTS',
        };

      default:
        return {
          mode: 'NEON_CIRCUIT',
          modeName: 'NEON CIRCUIT',
          objectiveText: 'RACE TO THE FINISH',
          primaryMetricLabel: 'SPEED',
          primaryMetricValue: `${Math.floor(shipSpeed)} KM/H`,
          progressPercent: 50,
        };
    }
  }

  public recordAsteroidDestroyed() {
    this.debrisDestroyed++;
    this.score += 250;
    if (this.currentMode === 'DEBRIS_SURVIVAL') {
      this.score += 150;
    }
  }

  public recordCoreCollected() {
    if (this.currentMode === 'ENERGY_HEIST') {
      this.coresCollected = Math.min(this.targetCores, this.coresCollected + 1);
      this.score += 500;
    }
  }

  public recordDroneDestroyed() {
    if (this.currentMode === 'DRONE_ASSAULT') {
      this.dronesDestroyed++;
      this.score += 400;
      if (this.dronesDestroyed >= this.totalDronesInWave && this.droneWave < 3) {
        this.droneWave++;
        this.dronesDestroyed = 0;
      }
    }
  }

  public recordRelicFound() {
    if (this.currentMode === 'COSMIC_TREASURE_HUNT') {
      this.relicsFound = Math.min(this.totalRelics, this.relicsFound + 1);
      this.score += 1000;
    }
  }

  public recordRingPassed() {
    if (this.currentMode === 'RING_RUNNER') {
      this.ringsPassed = Math.min(this.totalRings, this.ringsPassed + 1);
      this.score += 300;
    }
  }
}
