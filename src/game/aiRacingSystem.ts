import * as THREE from 'three';
import {
  AIDifficulty,
  AIPersonality,
  AIOvertakeState,
  AIDefensiveState,
  AIOvertakeType,
  AIRacerDebugInfo,
  AIDebugTelemetry,
} from '../types';
import { SamplePoint, TrackData, EnergyBarrier } from './trackData';
import { sound } from './audio';
import { MissileManager, MissileTargetCandidate } from './missileSystem';

// ==========================================
// DIFFICULTY CONFIGURATION & PARAMETERS
// ==========================================
export interface AIDifficultyParameters {
  difficulty: AIDifficulty;
  aggressionLevel: number; // 0.0 to 1.0
  reactionTime: number; // Seconds (lower = faster)
  riskTolerance: number; // 0.0 to 1.0
  brakingSkill: number; // 0.0 to 1.0 (corner entry skill)
  steeringAccuracy: number; // 0.0 to 1.0
  recoverySkill: number; // 0.0 to 1.0
  decisionInterval: number; // Seconds between tactical evaluations
  speedMultiplier: number; // Baseline speed scaling
  lateralSpeedMultiplier: number;
  overtakeAggression: number; // Tendency to commit to passes
  missileCooldownBase: number; // 60.0s standard
  missileUseChance: number; // 0.0 to 1.0
  shieldCooldownBase: number; // 60.0s standard
  shieldUseChance: number; // 0.0 to 1.0
  rammingAllowed: boolean;
  blockingAllowed: boolean;
  mistakeRate: number; // Chance of minor human-like apex slip
}

export const AI_DIFFICULTY_PROFILES: Record<string, AIDifficultyParameters> = {
  EASY: {
    difficulty: 'EASY',
    aggressionLevel: 0.15,
    reactionTime: 0.65,
    riskTolerance: 0.12,
    brakingSkill: 0.45,
    steeringAccuracy: 0.60,
    recoverySkill: 0.50,
    decisionInterval: 0.35,
    speedMultiplier: 0.74,
    lateralSpeedMultiplier: 2.8,
    overtakeAggression: 0.15,
    missileCooldownBase: 60.0,
    missileUseChance: 0.15,
    shieldCooldownBase: 60.0,
    shieldUseChance: 0.20,
    rammingAllowed: false,
    blockingAllowed: false,
    mistakeRate: 0.22,
  },
  NORMAL: {
    difficulty: 'NORMAL',
    aggressionLevel: 0.40,
    reactionTime: 0.38,
    riskTolerance: 0.38,
    brakingSkill: 0.68,
    steeringAccuracy: 0.76,
    recoverySkill: 0.70,
    decisionInterval: 0.22,
    speedMultiplier: 0.90,
    lateralSpeedMultiplier: 4.2,
    overtakeAggression: 0.45,
    missileCooldownBase: 60.0,
    missileUseChance: 0.45,
    shieldCooldownBase: 60.0,
    shieldUseChance: 0.50,
    rammingAllowed: false,
    blockingAllowed: true,
    mistakeRate: 0.10,
  },
  HARD: {
    difficulty: 'HARD',
    aggressionLevel: 0.72,
    reactionTime: 0.20,
    riskTolerance: 0.68,
    brakingSkill: 0.86,
    steeringAccuracy: 0.88,
    recoverySkill: 0.85,
    decisionInterval: 0.14,
    speedMultiplier: 1.05,
    lateralSpeedMultiplier: 5.6,
    overtakeAggression: 0.75,
    missileCooldownBase: 60.0,
    missileUseChance: 0.75,
    shieldCooldownBase: 60.0,
    shieldUseChance: 0.80,
    rammingAllowed: true,
    blockingAllowed: true,
    mistakeRate: 0.04,
  },
  EXPERT: {
    difficulty: 'EXPERT',
    aggressionLevel: 0.88,
    reactionTime: 0.12,
    riskTolerance: 0.86,
    brakingSkill: 0.95,
    steeringAccuracy: 0.95,
    recoverySkill: 0.92,
    decisionInterval: 0.08,
    speedMultiplier: 1.16,
    lateralSpeedMultiplier: 6.8,
    overtakeAggression: 0.90,
    missileCooldownBase: 60.0,
    missileUseChance: 0.90,
    shieldCooldownBase: 60.0,
    shieldUseChance: 0.92,
    rammingAllowed: true,
    blockingAllowed: true,
    mistakeRate: 0.02,
  },
  MASTER: {
    difficulty: 'MASTER',
    aggressionLevel: 0.96,
    reactionTime: 0.07,
    riskTolerance: 0.94,
    brakingSkill: 0.98,
    steeringAccuracy: 0.98,
    recoverySkill: 0.97,
    decisionInterval: 0.05,
    speedMultiplier: 1.24,
    lateralSpeedMultiplier: 7.6,
    overtakeAggression: 0.98,
    missileCooldownBase: 60.0,
    missileUseChance: 0.96,
    shieldCooldownBase: 60.0,
    shieldUseChance: 0.96,
    rammingAllowed: true,
    blockingAllowed: true,
    mistakeRate: 0.012,
  },
};

/**
 * Normalizes any historical difficulty string into one of the 5 canonical levels
 */
export function normalizeAIDifficulty(diff: AIDifficulty | string): AIDifficulty {
  switch (diff) {
    case 'RECRUIT':
    case 'EASY':
      return 'EASY';
    case 'STANDARD':
    case 'NORMAL':
      return 'NORMAL';
    case 'VETERAN':
    case 'HARD':
      return 'HARD';
    case 'ACE':
    case 'EXPERT':
      return 'EXPERT';
    case 'ELITE':
    case 'MASTER':
      return 'MASTER';
    default:
      return 'NORMAL';
  }
}

/**
 * Normalizes any historical personality string into one of the 5 canonical personalities
 */
export function normalizeAIPersonality(pers: AIPersonality | string): AIPersonality {
  switch (pers) {
    case 'AGGRESSIVE':
    case 'AGGRESSOR':
      return 'AGGRESSOR';
    case 'DEFENSIVE':
    case 'DEFENDER':
      return 'DEFENDER';
    case 'TECHNICAL':
    case 'TACTICIAN':
      return 'TACTICIAN';
    case 'RISK_TAKER':
    case 'SPEEDSTER':
      return 'SPEEDSTER';
    case 'BALANCED':
    default:
      return 'BALANCED';
  }
}

// ==========================================
// AI RACER RUNTIME STATE & DATA
// ==========================================
export interface AIRacerCombatState {
  missileCooldown: number; // 60s countdown
  missileTargetId: string | null;
  shieldCooldown: number; // 60s countdown
  shieldActiveTimer: number; // 6.0s duration when active
  isShieldActive: boolean;
  shieldMesh: THREE.Mesh | null;
}

export interface AIRacerTacticalState {
  params: AIDifficultyParameters;
  decisionTimer: number;
  reactionTimer: number;
  racingLineOffset: number; // Ideal apex lateral offset
  mistakeTimer: number;
  mistakeOffset: number;
  isDrifting: boolean;
  driftTimer: number;
  cornerBrakingFactor: number; // 0.0 (no brake) to 0.4 (heavy brake)
  collisionRisk: number; // 0.0 to 1.0
  hazardWarningDistance: number;
  // Overtaking State Machine
  overtakeState: AIOvertakeState;
  overtakeType: AIOvertakeType | null;
  overtakeTargetId: string | null;
  overtakeSide: 'left' | 'right' | 'slipstream' | null;
  overtakeTimer: number;
  slipstreamSurge: number; // Bonus speed while drafting
  // Defensive / Blocking State Machine
  defensiveState: AIDefensiveState;
  blockingTargetId: string | null;
  defensiveTimer: number;
}

// Reusable math objects for zero garbage collection
const _aiFwdVec = new THREE.Vector3();
const _aiTargetVec = new THREE.Vector3();
const _aiTempQuat = new THREE.Quaternion();

/**
 * Creates a glowing 3D active shield sphere for an AI racer
 */
export function createAIShieldMesh(colorHex: string = '#00f0ff'): THREE.Mesh {
  const geo = new THREE.SphereGeometry(3.2, 16, 12);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.45,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  return mesh;
}

// ==========================================
// ADVANCED AI RACING INTELLIGENCE ENGINE
// ==========================================
export class AIRacingIntelligenceSystem {
  private track: TrackData;
  private scene: THREE.Scene;
  public isDebugActive: boolean = false;

  constructor(track: TrackData, scene: THREE.Scene) {
    this.track = track;
    this.scene = scene;
  }

  public setTrack(newTrack: TrackData) {
    this.track = newTrack;
  }

  /**
   * Initializes or updates tactical state for an AI racer
   */
  public createTacticalState(
    difficulty: AIDifficulty,
    personality: AIPersonality,
    initialLane: number
  ): AIRacerTacticalState {
    const normDiff = normalizeAIDifficulty(difficulty);
    const normPers = normalizeAIPersonality(personality);
    const baseParams = { ...AI_DIFFICULTY_PROFILES[normDiff] };

    // Apply personality modifiers
    if (normPers === 'AGGRESSOR') {
      baseParams.aggressionLevel = Math.min(1.0, baseParams.aggressionLevel + 0.22);
      baseParams.riskTolerance = Math.min(1.0, baseParams.riskTolerance + 0.20);
      baseParams.rammingAllowed = true;
      baseParams.overtakeAggression = Math.min(1.0, baseParams.overtakeAggression + 0.25);
    } else if (normPers === 'DEFENDER') {
      baseParams.blockingAllowed = true;
      baseParams.riskTolerance = Math.max(0.1, baseParams.riskTolerance - 0.25);
      baseParams.shieldUseChance = Math.min(1.0, baseParams.shieldUseChance + 0.25);
    } else if (normPers === 'TACTICIAN') {
      baseParams.steeringAccuracy = Math.min(1.0, baseParams.steeringAccuracy + 0.08);
      baseParams.brakingSkill = Math.min(1.0, baseParams.brakingSkill + 0.08);
      baseParams.missileUseChance = Math.min(1.0, baseParams.missileUseChance + 0.25);
    } else if (normPers === 'SPEEDSTER') {
      baseParams.speedMultiplier *= 1.05;
      baseParams.riskTolerance = Math.min(1.0, baseParams.riskTolerance + 0.15);
      baseParams.brakingSkill = Math.max(0.3, baseParams.brakingSkill - 0.10);
    }

    return {
      params: baseParams,
      decisionTimer: Math.random() * baseParams.decisionInterval,
      reactionTimer: 0,
      racingLineOffset: initialLane,
      mistakeTimer: 3 + Math.random() * 8,
      mistakeOffset: 0,
      isDrifting: false,
      driftTimer: 0,
      cornerBrakingFactor: 0,
      collisionRisk: 0,
      hazardWarningDistance: 35 + baseParams.steeringAccuracy * 35,
      overtakeState: 'APPROACHING',
      overtakeType: null,
      overtakeTargetId: null,
      overtakeSide: null,
      overtakeTimer: 0,
      slipstreamSurge: 0,
      defensiveState: 'NORMAL_RACING',
      blockingTargetId: null,
      defensiveTimer: 0,
    };
  }

  /**
   * Initializes combat state for an AI racer
   */
  public createCombatState(shipGroup: THREE.Group, colorHex: string): AIRacerCombatState {
    const shieldMesh = createAIShieldMesh(colorHex);
    shipGroup.add(shieldMesh);

    return {
      missileCooldown: 10 + Math.random() * 30, // Stagger initial cooldown so bots don't all fire at second 60
      missileTargetId: null,
      shieldCooldown: 8 + Math.random() * 25,
      shieldActiveTimer: 0,
      isShieldActive: false,
      shieldMesh,
    };
  }

  /**
   * Main AI decision cycle: Evaluates racing line, overtaking, blocking, hazards, drift, missiles, and shields
   */
  public updateAIRacerTactics(
    ai: {
      id: string;
      name: string;
      t: number;
      speed: number;
      targetSpeed: number;
      currentLateral: number;
      targetLateral: number;
      lateralSpeed: number;
      isBoosting: boolean;
      boostCooldown: number;
      boostDuration: number;
      shield?: number;
      hull?: number;
      group: THREE.Group;
      difficulty: AIDifficulty;
      personality: AIPersonality;
      isDestroyed?: boolean;
    },
    tactical: AIRacerTacticalState,
    combat: AIRacerCombatState,
    playerInfo: {
      t: number;
      speed: number;
      lateral: number;
      position: THREE.Vector3;
      isDestroyed: boolean;
      shield: number;
      hull: number;
    },
    otherAIs: {
      id: string;
      name: string;
      t: number;
      speed: number;
      lateral: number;
      position: THREE.Vector3;
      isDestroyed?: boolean;
      shield?: number;
      hull?: number;
    }[],
    missileManager: MissileManager | null,
    dt: number,
    isRacing: boolean
  ) {
    if (ai.isDestroyed) {
      if (combat.shieldMesh) combat.shieldMesh.visible = false;
      return;
    }

    const params = tactical.params;
    tactical.decisionTimer -= dt;
    tactical.mistakeTimer -= dt;
    tactical.reactionTimer = Math.max(0, tactical.reactionTimer - dt);

    // Update combat timers (strict 60s cooldowns)
    if (combat.shieldActiveTimer > 0) {
      combat.shieldActiveTimer -= dt;
      combat.isShieldActive = combat.shieldActiveTimer > 0;
      if (combat.shieldMesh) {
        combat.shieldMesh.visible = combat.isShieldActive;
        if (combat.isShieldActive) {
          combat.shieldMesh.rotateY(dt * 3.5);
          combat.shieldMesh.rotateZ(dt * 2.0);
          const s = 1.0 + Math.sin(Date.now() * 0.008) * 0.08;
          combat.shieldMesh.scale.set(s, s, s);
        }
      }
      if (!combat.isShieldActive) {
        combat.shieldCooldown = params.shieldCooldownBase; // 60.0s
      }
    } else if (combat.shieldCooldown > 0) {
      combat.shieldCooldown = Math.max(0, combat.shieldCooldown - dt);
    }

    if (combat.missileCooldown > 0) {
      combat.missileCooldown = Math.max(0, combat.missileCooldown - dt);
    }

    // Occasional realistic driver mistake (wandering slightly off optimal apex)
    if (tactical.mistakeTimer <= 0) {
      if (Math.random() < params.mistakeRate) {
        tactical.mistakeOffset = (Math.random() - 0.5) * 2.8;
      } else {
        tactical.mistakeOffset = 0;
      }
      tactical.mistakeTimer = 4.0 + Math.random() * 8.0;
    }

    // 1. DYNAMIC RACING LINE & TRACK CURVATURE EVALUATION
    const trackLen = this.track.totalLength || 4600;
    const lookAheadDelta = 0.035;
    const currentSample = this.track.getSampleAt(ai.t);
    const aheadSample = this.track.getSampleAt((ai.t + lookAheadDelta) % 1.0);

    // Curvature approximation: dot product between current tangent and ahead tangent
    const curveDot = currentSample.tangent.dot(aheadSample.tangent);
    const isSharpTurn = curveDot < 0.94;
    const isMediumTurn = curveDot < 0.985;

    // Corner entry braking skill
    if (isSharpTurn) {
      tactical.cornerBrakingFactor = (1.0 - curveDot) * (1.2 - params.brakingSkill * 0.5) * 8.0;
      tactical.cornerBrakingFactor = Math.min(0.42, tactical.cornerBrakingFactor);
    } else if (isMediumTurn) {
      tactical.cornerBrakingFactor = (1.0 - curveDot) * 2.5;
    } else {
      tactical.cornerBrakingFactor = 0;
    }

    // Drifting through technical turns
    if (isSharpTurn && ai.speed > 45 && params.aggressionLevel > 0.4) {
      tactical.isDrifting = true;
      tactical.driftTimer = 0.5;
    } else if (tactical.driftTimer > 0) {
      tactical.driftTimer -= dt;
      if (tactical.driftTimer <= 0) tactical.isDrifting = false;
    }

    // Smooth racing line apex calculation (inside apex of corner)
    const turnCross = currentSample.tangent.clone().cross(aheadSample.tangent);
    const turnDirection = turnCross.y; // > 0 = turning right, < 0 = turning left
    let optimalApex = 0;
    if (Math.abs(turnDirection) > 0.001) {
      optimalApex = turnDirection > 0 ? 3.5 : -3.5;
    }
    tactical.racingLineOffset = optimalApex * params.steeringAccuracy;

    // 2. HAZARD & ENERGY BARRIER DETECTION
    let hazardEvading = false;
    let desiredLateral = tactical.racingLineOffset + tactical.mistakeOffset;

    if (this.track.energyBarriers && this.track.energyBarriers.length > 0) {
      for (const b of this.track.energyBarriers) {
        const deltaT = (b.t - ai.t + 1.0) % 1.0;
        if (deltaT > 0 && deltaT < 0.035) {
          const targetLane = b.gapLane === 'left' ? -6.0 : b.gapLane === 'right' ? 6.0 : 0.0;
          desiredLateral = targetLane;
          hazardEvading = true;

          // If AI is slow to react, delay committing to gap
          if (tactical.params.reactionTime > 0.4 && Math.random() < 0.3) {
            desiredLateral = 0;
          }
          break;
        }
      }
    }

    // Obstacle avoidance (asteroids & pylons)
    if (!hazardEvading && this.track.obstacles) {
      for (const obs of this.track.obstacles) {
        const dist = currentSample.point.distanceTo(obs.position);
        if (dist < tactical.hazardWarningDistance) {
          const lateralSafe = obs.position.x > currentSample.point.x ? -5.5 : 5.5;
          desiredLateral = lateralSafe;
          hazardEvading = true;

          // Emergency shield deployment on imminent obstacle impact
          if (dist < 22 && combat.shieldCooldown <= 0 && !combat.isShieldActive && isRacing) {
            if (Math.random() < params.shieldUseChance) {
              combat.shieldActiveTimer = 6.0;
              combat.isShieldActive = true;
              sound.playShieldActivate();
            }
          }
          break;
        }
      }
    }

    // 3. TACTICAL OVERTAKING & BLOCKING STATE MACHINES (Runs on decision interval)
    if (tactical.decisionTimer <= 0 && isRacing) {
      tactical.decisionTimer = params.decisionInterval;

      // Identify leading and trailing ships
      const candidates: { id: string; name: string; deltaT: number; lateral: number; speed: number; isPlayer: boolean; isVulnerable: boolean }[] = [];

      // Check player
      if (!playerInfo.isDestroyed) {
        const pDeltaT = (playerInfo.t - ai.t + 1.0) % 1.0;
        const normDelta = pDeltaT > 0.5 ? pDeltaT - 1.0 : pDeltaT; // > 0 = ahead, < 0 = behind
        candidates.push({
          id: 'player',
          name: 'Player',
          deltaT: normDelta,
          lateral: playerInfo.lateral,
          speed: playerInfo.speed,
          isPlayer: true,
          isVulnerable: playerInfo.shield <= 5,
        });
      }

      // Check other AI racers
      for (const other of otherAIs) {
        if (other.id === ai.id || other.isDestroyed) continue;
        const oDeltaT = (other.t - ai.t + 1.0) % 1.0;
        const normDelta = oDeltaT > 0.5 ? oDeltaT - 1.0 : oDeltaT;
        candidates.push({
          id: other.id,
          name: other.name,
          deltaT: normDelta,
          lateral: other.lateral,
          speed: other.speed,
          isPlayer: false,
          isVulnerable: (other.shield ?? 100) <= 5,
        });
      }

      // Slower ship ahead in passing cone?
      const targetAhead = candidates
        .filter(c => c.deltaT > 0.002 && c.deltaT < 0.045)
        .sort((a, b) => a.deltaT - b.deltaT)[0];

      // Slower ship trailing behind attempting to overtake?
      const pursuerBehind = candidates
        .filter(c => c.deltaT < -0.001 && c.deltaT > -0.035 && c.speed > ai.speed * 0.95)
        .sort((a, b) => b.deltaT - a.deltaT)[0];

      // A. ADVANCED OVERTAKING STATE MACHINE
      if (targetAhead && !hazardEvading && Math.random() < params.overtakeAggression) {
        tactical.overtakeTargetId = targetAhead.id;
        const latDiff = targetAhead.lateral - ai.currentLateral;

        switch (tactical.overtakeState) {
          case 'APPROACHING':
            tactical.overtakeState = 'ANALYZING';
            break;

          case 'ANALYZING': {
            // Check left lane clearance vs right lane clearance
            const canPassLeft = targetAhead.lateral < 4.5 && ai.currentLateral > -6.0;
            const canPassRight = targetAhead.lateral > -4.5 && ai.currentLateral < 6.0;

            if (canPassLeft && (!canPassRight || Math.abs(ai.currentLateral - (targetAhead.lateral - 4.5)) < Math.abs(ai.currentLateral - (targetAhead.lateral + 4.5)))) {
              tactical.overtakeSide = 'left';
            } else if (canPassRight) {
              tactical.overtakeSide = 'right';
            } else {
              tactical.overtakeSide = 'slipstream';
            }
            tactical.overtakeState = 'SELECTING_SIDE';
            break;
          }

          case 'SELECTING_SIDE':
            tactical.overtakeState = 'OVERTAKING';
            tactical.overtakeTimer = 2.5;
            // Deploy tactical boost if available
            if (ai.boostCooldown <= 0 && params.aggressionLevel > 0.5) {
              ai.isBoosting = true;
              ai.boostDuration = 2.2;
              tactical.overtakeType = 'BOOST';
            } else if (tactical.overtakeSide === 'slipstream') {
              tactical.overtakeType = 'SLIPSTREAM';
            } else {
              tactical.overtakeType = tactical.overtakeSide === 'left' ? 'LEFT' : 'RIGHT';
            }
            break;

          case 'OVERTAKING':
            tactical.overtakeTimer -= params.decisionInterval;
            if (tactical.overtakeSide === 'left') {
              desiredLateral = Math.max(-6.5, targetAhead.lateral - 4.2);
            } else if (tactical.overtakeSide === 'right') {
              desiredLateral = Math.min(6.5, targetAhead.lateral + 4.2);
            } else {
              // Slipstream: draft directly behind, then slingshot
              desiredLateral = targetAhead.lateral;
              tactical.slipstreamSurge = 12.0;
            }

            if (targetAhead.deltaT < 0.005) {
              tactical.overtakeState = 'PASSING';
            } else if (tactical.overtakeTimer <= 0) {
              tactical.overtakeState = 'ABORTING';
            }
            break;

          case 'PASSING':
            // Maintain clearance until clean
            if (targetAhead.deltaT < 0) {
              tactical.overtakeState = 'RETURNING_TO_LINE';
              tactical.slipstreamSurge = 0;
            }
            break;

          case 'RETURNING_TO_LINE':
            desiredLateral = tactical.racingLineOffset;
            tactical.overtakeState = 'APPROACHING';
            tactical.overtakeTargetId = null;
            break;

          case 'ABORTING':
            tactical.overtakeState = 'RECOVERING';
            break;

          case 'RECOVERING':
            tactical.overtakeState = 'APPROACHING';
            tactical.overtakeTargetId = null;
            break;
        }
      } else if (!targetAhead) {
        tactical.overtakeState = 'APPROACHING';
        tactical.overtakeTargetId = null;
        tactical.slipstreamSurge = 0;
      }

      // B. DEFENSIVE AND OFFENSIVE BLOCKING STATE MACHINE
      if (pursuerBehind && params.blockingAllowed && !hazardEvading) {
        tactical.blockingTargetId = pursuerBehind.id;
        const pursuerLat = pursuerBehind.lateral;

        switch (tactical.defensiveState) {
          case 'NORMAL_RACING':
            tactical.defensiveState = 'THREAT_DETECTED';
            break;

          case 'THREAT_DETECTED':
            tactical.defensiveState = 'DEFENDING_LINE';
            tactical.defensiveTimer = 3.0;
            break;

          case 'DEFENDING_LINE':
          case 'BLOCKING_LANE':
            tactical.defensiveTimer -= params.decisionInterval;
            // Intercept pursuer's lane smoothly (with fair margin so player can still juke)
            const interceptTarget = THREE.MathUtils.clamp(pursuerLat, -5.8, 5.8);
            desiredLateral = THREE.MathUtils.lerp(desiredLateral, interceptTarget, params.aggressionLevel * 0.7);

            if (tactical.defensiveTimer <= 0 || pursuerBehind.deltaT > 0) {
              tactical.defensiveState = 'COUNTER_OVERTAKE';
            }
            break;

          case 'COUNTER_OVERTAKE':
            tactical.defensiveState = 'RETURNING_TO_RACING_LINE';
            break;

          case 'RETURNING_TO_RACING_LINE':
            desiredLateral = tactical.racingLineOffset;
            tactical.defensiveState = 'NORMAL_RACING';
            tactical.blockingTargetId = null;
            break;

          case 'DEFENSIVE_RECOVERY':
            tactical.defensiveState = 'NORMAL_RACING';
            break;
        }
      } else if (!pursuerBehind) {
        tactical.defensiveState = 'NORMAL_RACING';
        tactical.blockingTargetId = null;
      }

      // C. TACTICAL RAMMING DECISION (HARD / EXPERT / MASTER / AGGRESSOR)
      if (params.rammingAllowed && targetAhead && Math.abs(targetAhead.deltaT) < 0.01) {
        const sideDistance = Math.abs(targetAhead.lateral - ai.currentLateral);
        if (sideDistance < 3.2 && Math.random() < params.aggressionLevel * 0.4) {
          // Deliver a controlled tactical side-nudge
          desiredLateral = THREE.MathUtils.lerp(desiredLateral, targetAhead.lateral, 0.45);
        }
      }

      // D. MISSILE TARGETING & FIRING SUBSYSTEM
      if (combat.missileCooldown <= 0 && missileManager && isRacing) {
        const potentialTargets = candidates.filter(
          c => c.deltaT > 0.005 && c.deltaT < 0.08 && Math.abs(c.lateral - ai.currentLateral) < 6.5
        );

        if (potentialTargets.length > 0 && Math.random() < params.missileUseChance) {
          // Target priority scoring
          const bestTarget = potentialTargets.sort((a, b) => {
            const scoreA = (a.isVulnerable ? 20 : 0) + (a.isPlayer ? 10 : 5) - a.deltaT * 100;
            const scoreB = (b.isVulnerable ? 20 : 0) + (b.isPlayer ? 10 : 5) - b.deltaT * 100;
            return scoreB - scoreA;
          })[0];

          if (bestTarget) {
            combat.missileTargetId = bestTarget.id;
            // Fire missile from this AI racer!
            const fired = this.launchAIMissile(ai, combat, bestTarget.id, playerInfo, otherAIs, missileManager);
            if (fired) {
              combat.missileCooldown = params.missileCooldownBase; // Strict 60s cooldown
            }
          }
        }
      }

      // E. SHIELD DEFENSE AGAINST INCOMING THREATS
      if (combat.shieldCooldown <= 0 && !combat.isShieldActive && isRacing) {
        let shouldShield = false;
        // If an opponent is aggressively close or ramming
        if (targetAhead && Math.abs(targetAhead.deltaT) < 0.004 && Math.abs(targetAhead.lateral - ai.currentLateral) < 2.2) {
          shouldShield = Math.random() < params.shieldUseChance;
        }

        if (shouldShield) {
          combat.shieldActiveTimer = 6.0;
          combat.isShieldActive = true;
          sound.playShieldActivate();
        }
      }
    }

    // 4. APPLY BOUNDS & STEERING SPEED
    desiredLateral = THREE.MathUtils.clamp(desiredLateral, -6.8, 6.8);
    ai.targetLateral = desiredLateral;

    // Apply lateral movement smoothly (no teleportation)
    const effectiveLatSpeed = params.lateralSpeedMultiplier * (tactical.isDrifting ? 1.3 : 1.0);
    ai.currentLateral = THREE.MathUtils.lerp(ai.currentLateral, ai.targetLateral, effectiveLatSpeed * dt);

    // 5. ACCELERATION, CORNER BRAKING, AND BOOST PROPULSION
    let baseSpeed = (ai.targetSpeed * params.speedMultiplier) / 3.6;
    if (tactical.slipstreamSurge > 0) {
      baseSpeed += tactical.slipstreamSurge;
    }
    // Apply corner braking
    const brakeLoss = baseSpeed * tactical.cornerBrakingFactor;
    const finalDesiredSpeed = Math.max(20, baseSpeed - brakeLoss + (ai.isBoosting ? 24 : 0));

    // Smooth speed lerp
    ai.speed = THREE.MathUtils.lerp(ai.speed, finalDesiredSpeed, 2.5 * dt);

    // Boost timer management
    if (ai.isBoosting) {
      ai.boostDuration -= dt;
      if (ai.boostDuration <= 0) {
        ai.isBoosting = false;
        ai.boostCooldown = 4.0 + (1.0 - params.aggressionLevel) * 6.0 + Math.random() * 4.0;
      }
    } else {
      ai.boostCooldown -= dt;
      // Auto-boost on long straights if difficulty allows
      if (ai.boostCooldown <= 0 && !isSharpTurn && !isMediumTurn && isRacing) {
        if (Math.random() < params.aggressionLevel * 0.7) {
          ai.isBoosting = true;
          ai.boostDuration = 2.4;
        }
      }
    }
  }

  /**
   * Fires a homing missile from an AI racer toward its chosen target
   */
  private launchAIMissile(
    ai: { id: string; name: string; group: THREE.Group; difficulty: AIDifficulty },
    combat: AIRacerCombatState,
    targetId: string,
    playerInfo: { position: THREE.Vector3; isDestroyed: boolean; shield: number; hull: number },
    otherAIs: { id: string; name: string; position: THREE.Vector3; isDestroyed?: boolean; shield?: number; hull?: number; group: THREE.Group }[],
    missileManager: MissileManager
  ): boolean {
    const aiPos = ai.group.position;
    const aiQuat = ai.group.quaternion;

    // Build missile candidate targets
    const candidates: MissileTargetCandidate[] = [];

    // Player candidate
    candidates.push({
      id: 'player',
      name: 'Player',
      isAI: false,
      isTeammate: false,
      isDestroyed: playerInfo.isDestroyed,
      position: playerInfo.position,
      meshGroup: null as any,
      shield: playerInfo.shield,
      hull: playerInfo.hull,
      applyDamage: (shieldLoss, hullLoss) => {
        // Will be applied via PlayerCollisionSystem or direct callback in engine
      },
    });

    // Other AI candidates
    for (const other of otherAIs) {
      if (other.id === ai.id) continue;
      candidates.push({
        id: other.id,
        name: other.name,
        isAI: true,
        isTeammate: false,
        isDestroyed: !!other.isDestroyed,
        position: other.position,
        meshGroup: other.group,
        shield: other.shield ?? 100,
        hull: other.hull ?? 100,
        applyDamage: () => {},
      });
    }

    const targetCandidate = candidates.find(c => c.id === targetId);
    if (!targetCandidate || targetCandidate.isDestroyed) return false;

    // Launch missile from AI ship
    return missileManager.launchMissileFromEntity(
      ai.id,
      aiPos,
      aiQuat,
      targetCandidate,
      (1.0 - AI_DIFFICULTY_PROFILES[normalizeAIDifficulty(ai.difficulty)].steeringAccuracy) * 0.2
    );
  }

  /**
   * Generates live debug telemetry for HUD overlay
   */
  public generateDebugTelemetry(
    racers: {
      id: string;
      name: string;
      speed: number;
      currentLateral: number;
      targetLateral: number;
      difficulty: AIDifficulty;
      personality: AIPersonality;
      rank: number;
      tactical: AIRacerTacticalState;
      combat: AIRacerCombatState;
    }[]
  ): AIDebugTelemetry {
    return {
      enabled: this.isDebugActive,
      difficulty: racers[0]?.difficulty ?? 'NORMAL',
      racers: racers.map(r => ({
        id: r.id,
        name: r.name,
        difficulty: normalizeAIDifficulty(r.difficulty),
        personality: normalizeAIPersonality(r.personality),
        speed: Math.round(r.speed * 3.6),
        currentLateral: Number(r.currentLateral.toFixed(1)),
        targetLateral: Number(r.targetLateral.toFixed(1)),
        overtakeState: r.tactical.overtakeState,
        defensiveState: r.tactical.defensiveState,
        targetedOpponent: r.combat.missileTargetId,
        missileCooldown: Math.max(0, Math.ceil(r.combat.missileCooldown)),
        shieldCooldown: Math.max(0, Math.ceil(r.combat.shieldCooldown)),
        isShieldActive: r.combat.isShieldActive,
        currentRoute: 'OPTIMAL_SPLINE',
        collisionRisk: Number(r.tactical.collisionRisk.toFixed(2)),
        reactionTime: Number(r.tactical.params.reactionTime.toFixed(2)),
        aggression: Number(r.tactical.params.aggressionLevel.toFixed(2)),
        rank: r.rank,
      })),
    };
  }
}
