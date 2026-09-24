import * as THREE from 'three';

export type CollisionCategory = 'PLAYER' | 'AI_PLAYER' | 'AI_RACER' | 'REMOTE_PLAYER';

export interface PlayerCollisionConfig {
  baseImpactForce: number;
  maxImpactForce: number;
  knockbackMultiplier: number;
  rotationMultiplier: number;
  shieldDamageMultiplier: number;
  hullDamageMultiplier: number;
  crashThreshold: number;
  collisionCooldown: number;
  recoveryTime: number;
  boostMultiplier: number;
  maxKnockback: number;
  maxAngularVelocity: number;
}

export const PLAYER_COLLISION_CONFIG: PlayerCollisionConfig = {
  baseImpactForce: 1.0,
  maxImpactForce: 10.0,
  knockbackMultiplier: 1.0,
  rotationMultiplier: 0.75,
  shieldDamageMultiplier: 0.5,
  hullDamageMultiplier: 0.25,
  crashThreshold: 8.0,
  collisionCooldown: 0.35,
  recoveryTime: 0.8,
  boostMultiplier: 1.4,
  maxKnockback: 25.0,
  maxAngularVelocity: 4.5,
};

export type CollisionEffectType =
  | 'PlayerCollisionImpact'
  | 'ShieldImpact'
  | 'HeavyCollisionImpact'
  | 'BoostCollisionImpact'
  | 'CriticalCollisionImpact'
  | 'ShipCrashExplosion'
  | 'RecoveryEffect';

export interface CollisionEventFeedback {
  id: string;
  type: 'IMPACT' | 'HEAVY_IMPACT' | 'RIVAL_CRASHED' | 'CRITICAL_CRASH';
  title: string;
  detail?: string;
  shieldDelta?: number;
  hullDelta?: number;
  impactForce: number;
  timestamp: number;
}

export interface CollisionParticipant {
  id: string;
  category: CollisionCategory;
  name: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number; // m/s
  direction: THREE.Vector3; // heading tangent
  radius: number; // collision sphere radius (m)
  mass: number; // spacecraft mass factor (0.8 - 1.6)
  shield: number; // 0 - 100
  hull: number; // 0 - 100
  isBoosting: boolean;
  collisionCooldown: number;
  recoveryTimer: number;
  angularVelocity: number; // spin rate (rad/s)
  angularDisplacement: number; // visual spin yaw offset (rad)
  lateralOffset: number; // offset from track center line
  splineT: number;
  invulnerableTimer: number;
  isDestroyed: boolean;
  meshGroup?: THREE.Group;
  applyDamage?: (shieldLoss: number, hullLoss: number, impactForce: number) => void;
  onCrash?: (reason: string) => void;
}

interface SparkParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

interface ShockwaveRing {
  mesh: THREE.Mesh;
  active: boolean;
  life: number;
  maxLife: number;
  initialRadius: number;
  maxRadius: number;
}

interface ShieldRipple {
  mesh: THREE.Mesh;
  active: boolean;
  life: number;
  maxLife: number;
}

interface DebrisParticle {
  mesh: THREE.Mesh;
  active: boolean;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
}

/**
 * High-performance object pooling for 3D arcade collision effects
 */
export class CollisionEffectsPool {
  private scene: THREE.Scene;
  private sparksPoints: THREE.Points;
  private sparksGeometry: THREE.BufferGeometry;
  private sparksPositions: Float32Array;
  private sparksColors: Float32Array;
  private sparks: SparkParticle[] = [];
  private readonly MAX_SPARKS = 160;

  private shockwaves: ShockwaveRing[] = [];
  private readonly MAX_SHOCKWAVES = 8;

  private shieldRipples: ShieldRipple[] = [];
  private readonly MAX_SHIELD_RIPPLES = 6;

  private debrisList: DebrisParticle[] = [];
  private readonly MAX_DEBRIS = 24;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Directional Spark Particles System (Cyan / Amber / White)
    this.sparksGeometry = new THREE.BufferGeometry();
    this.sparksPositions = new Float32Array(this.MAX_SPARKS * 3);
    this.sparksColors = new Float32Array(this.MAX_SPARKS * 3);

    for (let i = 0; i < this.MAX_SPARKS; i++) {
      this.sparks.push({
        pos: new THREE.Vector3(0, -9999, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.3,
        color: new THREE.Color(0x00f0ff),
        size: 2.5,
      });
      this.sparksPositions[i * 3] = 0;
      this.sparksPositions[i * 3 + 1] = -9999;
      this.sparksPositions[i * 3 + 2] = 0;
      this.sparksColors[i * 3] = 0;
      this.sparksColors[i * 3 + 1] = 1;
      this.sparksColors[i * 3 + 2] = 1;
    }

    this.sparksGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparksPositions, 3));
    this.sparksGeometry.setAttribute('color', new THREE.BufferAttribute(this.sparksColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparksPoints = new THREE.Points(this.sparksGeometry, sparkMat);
    this.sparksPoints.frustumCulled = false;
    this.scene.add(this.sparksPoints);

    // 2. Expanding Energy Shockwave Rings
    const ringGeo = new THREE.RingGeometry(0.2, 0.65, 32);
    for (let i = 0; i < this.MAX_SHOCKWAVES; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.shockwaves.push({
        mesh,
        active: false,
        life: 0,
        maxLife: 0.35,
        initialRadius: 0.5,
        maxRadius: 6.5,
      });
    }

    // 3. Shield Ripple Domes
    const domeGeo = new THREE.SphereGeometry(2.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
    for (let i = 0; i < this.MAX_SHIELD_RIPPLES; i++) {
      const domeMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
        wireframe: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(domeGeo, domeMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.shieldRipples.push({
        mesh,
        active: false,
        life: 0,
        maxLife: 0.28,
      });
    }

    // 4. Directional Debris Fragments
    const debrisGeo = new THREE.BoxGeometry(0.3, 0.08, 0.3);
    for (let i = 0; i < this.MAX_DEBRIS; i++) {
      const debrisMat = new THREE.MeshBasicMaterial({
        color: 0x99ccff,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(debrisGeo, debrisMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.debrisList.push({
        mesh,
        active: false,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.6,
      });
    }
  }

  /**
   * Spawns a cinematic energy collision burst with directional sparks & optional shockwave
   */
  public triggerImpactEffect(
    type: CollisionEffectType,
    contactPoint: THREE.Vector3,
    normal: THREE.Vector3,
    impactForce: number,
    colorHex: number = 0x00f0ff
  ) {
    const isHeavy = type === 'HeavyCollisionImpact' || type === 'CriticalCollisionImpact';
    const isBoost = type === 'BoostCollisionImpact';
    const sparkCount = isHeavy ? 36 : isBoost ? 28 : 18;
    const sparkSpeed = 12 + impactForce * 2.8;

    let spawned = 0;
    for (let i = 0; i < this.sparks.length && spawned < sparkCount; i++) {
      const s = this.sparks[i];
      if (s.life <= 0) {
        s.pos.copy(contactPoint);
        // Tangent spread + normal reflection
        const tangentDir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize();
        s.vel
          .copy(normal)
          .multiplyScalar((Math.random() * 0.6 + 0.4) * sparkSpeed)
          .add(tangentDir.multiplyScalar(Math.random() * sparkSpeed * 0.8));

        s.life = 0.2 + Math.random() * 0.22;
        s.maxLife = s.life;
        s.color.setHex(Math.random() > 0.35 ? colorHex : 0xffffff);
        spawned++;
      }
    }

    // Spawn Shockwave
    for (const sw of this.shockwaves) {
      if (!sw.active) {
        sw.active = true;
        sw.life = isHeavy ? 0.36 : 0.24;
        sw.maxLife = sw.life;
        sw.initialRadius = 0.8;
        sw.maxRadius = 3.5 + impactForce * 0.6;
        sw.mesh.position.copy(contactPoint);
        sw.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
        sw.mesh.scale.set(1, 1, 1);
        (sw.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
        sw.mesh.visible = true;
        break;
      }
    }

    // Shield Ripple if Shield Impact
    if (type === 'ShieldImpact' || type === 'BoostCollisionImpact') {
      for (const sr of this.shieldRipples) {
        if (!sr.active) {
          sr.active = true;
          sr.life = 0.28;
          sr.maxLife = 0.28;
          sr.mesh.position.copy(contactPoint);
          sr.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize());
          (sr.mesh.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
          (sr.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
          sr.mesh.visible = true;
          break;
        }
      }
    }

    // Directional Debris
    const debrisCount = isHeavy ? 6 : 3;
    let debrisSpawned = 0;
    for (const d of this.debrisList) {
      if (!d.active && debrisSpawned < debrisCount) {
        d.active = true;
        d.life = 0.45 + Math.random() * 0.3;
        d.maxLife = d.life;
        d.mesh.position.copy(contactPoint);
        d.vel
          .copy(normal)
          .multiplyScalar(8 + Math.random() * 10)
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 8
            )
          );
        d.rotVel.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );
        (d.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
        d.mesh.visible = true;
        debrisSpawned++;
      }
    }
  }

  /**
   * Updates all pooled collision effects
   */
  public update(dt: number) {
    // 1. Sparks Update
    let activeSparks = 0;
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      if (s.life > 0) {
        s.life -= dt;
        s.pos.addScaledVector(s.vel, dt);
        s.vel.multiplyScalar(0.94); // Air/plasma drag

        const alpha = Math.max(0, s.life / s.maxLife);
        this.sparksPositions[i * 3] = s.pos.x;
        this.sparksPositions[i * 3 + 1] = s.pos.y;
        this.sparksPositions[i * 3 + 2] = s.pos.z;

        this.sparksColors[i * 3] = s.color.r * alpha;
        this.sparksColors[i * 3 + 1] = s.color.g * alpha;
        this.sparksColors[i * 3 + 2] = s.color.b * alpha;
        activeSparks++;
      } else {
        this.sparksPositions[i * 3 + 1] = -9999;
      }
    }

    if (activeSparks > 0) {
      this.sparksGeometry.attributes.position.needsUpdate = true;
      this.sparksGeometry.attributes.color.needsUpdate = true;
    }

    // 2. Shockwaves Update
    for (const sw of this.shockwaves) {
      if (sw.active) {
        sw.life -= dt;
        if (sw.life <= 0) {
          sw.active = false;
          sw.mesh.visible = false;
        } else {
          const progress = 1 - sw.life / sw.maxLife;
          const currentRadius = THREE.MathUtils.lerp(sw.initialRadius, sw.maxRadius, progress);
          sw.mesh.scale.set(currentRadius, currentRadius, currentRadius);
          const mat = sw.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = (1 - progress) * 0.85;
        }
      }
    }

    // 3. Shield Ripples Update
    for (const sr of this.shieldRipples) {
      if (sr.active) {
        sr.life -= dt;
        if (sr.life <= 0) {
          sr.active = false;
          sr.mesh.visible = false;
        } else {
          const progress = 1 - sr.life / sr.maxLife;
          const scale = 1.0 + progress * 0.4;
          sr.mesh.scale.set(scale, scale, scale);
          const mat = sr.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = (1 - progress) * 0.8;
        }
      }
    }

    // 4. Debris Update
    for (const d of this.debrisList) {
      if (d.active) {
        d.life -= dt;
        if (d.life <= 0) {
          d.active = false;
          d.mesh.visible = false;
        } else {
          d.mesh.position.addScaledVector(d.vel, dt);
          d.mesh.rotation.x += d.rotVel.x * dt;
          d.mesh.rotation.y += d.rotVel.y * dt;
          d.mesh.rotation.z += d.rotVel.z * dt;
          const mat = d.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, d.life / d.maxLife);
        }
      }
    }
  }

  public dispose() {
    this.scene.remove(this.sparksPoints);
    this.sparksGeometry.dispose();
    (this.sparksPoints.material as THREE.Material).dispose();

    this.shockwaves.forEach(sw => {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
    });

    this.shieldRipples.forEach(sr => {
      this.scene.remove(sr.mesh);
      sr.mesh.geometry.dispose();
      (sr.mesh.material as THREE.Material).dispose();
    });

    this.debrisList.forEach(d => {
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose();
      (d.mesh.material as THREE.Material).dispose();
    });
  }
}

// Preallocated scratch vectors for zero-allocation GC-free collision mathematics
const _deltaVec = new THREE.Vector3();
const _normVec = new THREE.Vector3();
const _pushAVec = new THREE.Vector3();
const _pushBVec = new THREE.Vector3();
const _relVelVec = new THREE.Vector3();
const _contactPoint = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _crossVec = new THREE.Vector3();

/**
 * Dedicated Player-to-Player & AI Spacecraft Collision Manager
 * Uses broad-phase spline spatial binning and optimized 3D narrow-phase resolution.
 */
export class PlayerCollisionSystem {
  public config: PlayerCollisionConfig = { ...PLAYER_COLLISION_CONFIG };
  public effectsPool: CollisionEffectsPool;
  private participants: Map<string, CollisionParticipant> = new Map();

  // Spatial partitioning buckets along track spline (32 bins around track loop)
  private readonly NUM_BINS = 32;
  private spatialBins: string[][] = [];

  // Callbacks for engine integration
  public onCollisionFeedback?: (feedback: CollisionEventFeedback) => void;
  public onCameraShakeRequest?: (intensity: number) => void;
  public onCameraFovPunch?: (amountDegrees: number) => void;
  public onSoundTrigger?: (soundType: 'COLLISION' | 'HEAVY_IMPACT' | 'SHIELD_IMPACT' | 'SCRAPE') => void;

  constructor(scene: THREE.Scene, config?: Partial<PlayerCollisionConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.effectsPool = new CollisionEffectsPool(scene);
    for (let i = 0; i < this.NUM_BINS; i++) {
      this.spatialBins.push([]);
    }
  }

  /**
   * Registers or updates a collision participant
   */
  public registerParticipant(participant: CollisionParticipant) {
    this.participants.set(participant.id, participant);
  }

  /**
   * Unregisters a collision participant
   */
  public unregisterParticipant(id: string) {
    this.participants.delete(id);
  }

  public getParticipant(id: string): CollisionParticipant | undefined {
    return this.participants.get(id);
  }

  /**
   * Main collision update step:
   * 1. Broad-phase spatial binning along spline T
   * 2. Narrow-phase sphere-capsule intersection testing
   * 3. Collision physics, knockback, rotational torque impulse, and stabilization
   * 4. Shield & hull damage distribution
   * 5. Arcade impact feel & camera reactions
   */
  public update(dt: number) {
    this.effectsPool.update(dt);

    // Update individual participant recovery & spin stabilization
    for (const p of this.participants.values()) {
      if (p.collisionCooldown > 0) {
        p.collisionCooldown = Math.max(0, p.collisionCooldown - dt);
      }
      if (p.recoveryTimer > 0) {
        p.recoveryTimer = Math.max(0, p.recoveryTimer - dt);
      }

      // Automatic spin stabilization
      if (Math.abs(p.angularVelocity) > 0.001 || Math.abs(p.angularDisplacement) > 0.001) {
        p.angularDisplacement += p.angularVelocity * dt;
        p.angularVelocity *= Math.exp(-dt * 7.5);
        p.angularDisplacement *= Math.exp(-dt * 5.0);
      } else {
        p.angularVelocity = 0;
        p.angularDisplacement = 0;
      }
    }

    // Broad-phase: Clear & populate spatial bins
    for (let i = 0; i < this.NUM_BINS; i++) {
      this.spatialBins[i].length = 0;
    }

    for (const p of this.participants.values()) {
      if (p.isDestroyed) continue;
      const binIdx = Math.min(
        this.NUM_BINS - 1,
        Math.max(0, Math.floor(((p.splineT % 1.0 + 1.0) % 1.0) * this.NUM_BINS))
      );
      this.spatialBins[binIdx].push(p.id);
    }

    // Narrow-phase: Check pairs cleanly without allocating Sets or spreading arrays
    for (let b = 0; b < this.NUM_BINS; b++) {
      const currentBin = this.spatialBins[b];
      const count = currentBin.length;
      if (count === 0) continue;

      // 1. Pairs within same bin
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const shipA = this.participants.get(currentBin[i]);
          const shipB = this.participants.get(currentBin[j]);
          if (!shipA || !shipB || shipA.isDestroyed || shipB.isDestroyed) continue;
          this.resolveShipPair(shipA, shipB, dt);
        }
      }

      // 2. Pairs between current bin and adjacent bin
      const nextBin = this.spatialBins[(b + 1) % this.NUM_BINS];
      const nextCount = nextBin.length;
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < nextCount; j++) {
          const shipA = this.participants.get(currentBin[i]);
          const shipB = this.participants.get(nextBin[j]);
          if (!shipA || !shipB || shipA.isDestroyed || shipB.isDestroyed) continue;
          this.resolveShipPair(shipA, shipB, dt);
        }
      }
    }
  }

  /**
   * Narrow-phase collision test and resolution between two spacecraft
   */
  private resolveShipPair(shipA: CollisionParticipant, shipB: CollisionParticipant, dt: number) {
    // Check invulnerability after respawn (allows smooth pass-through / reduced force)
    const isAInvulnerable = shipA.invulnerableTimer > 0;
    const isBInvulnerable = shipB.invulnerableTimer > 0;

    const minRadius = shipA.radius + shipB.radius;
    _deltaVec.subVectors(shipA.position, shipB.position);
    const dist = _deltaVec.length();

    // No intersection
    if (dist >= minRadius) return;

    // Normal separation direction
    if (dist > 0.0001) {
      _normVec.copy(_deltaVec).divideScalar(dist);
    } else {
      _normVec.set(1, 0, 0);
    }
    const penetration = minRadius - dist;

    // 1. Ship Physical Separation (Anti-Stuck Failsafe)
    // Displace proportionally to inverse mass
    const invMassA = 1.0 / Math.max(0.2, shipA.mass);
    const invMassB = 1.0 / Math.max(0.2, shipB.mass);
    const totalInvMass = invMassA + invMassB;

    _pushAVec.copy(_normVec).multiplyScalar(penetration * (invMassA / totalInvMass));
    _pushBVec.copy(_normVec).multiplyScalar(-penetration * (invMassB / totalInvMass));

    shipA.position.add(_pushAVec);
    shipB.position.add(_pushBVec);

    // Also adjust lateral offsets to maintain track-bound physics
    _crossVec.crossVectors(shipA.direction, _upAxis);
    const lateralNormalA = _normVec.dot(_crossVec);
    const lateralPush = Math.sign(lateralNormalA) || (Math.random() > 0.5 ? 1 : -1);
    shipA.lateralOffset += lateralPush * penetration * 0.45;
    shipB.lateralOffset -= lateralPush * penetration * 0.45;

    // If both ships are on collision cooldown, don't re-trigger damage & shockwaves
    if (shipA.collisionCooldown > 0 && shipB.collisionCooldown > 0) {
      return;
    }

    // Set cooldown to prevent damage stacking while still physically separating
    shipA.collisionCooldown = this.config.collisionCooldown;
    shipB.collisionCooldown = this.config.collisionCooldown;

    // 2. Relative Velocity & Impact Force Calculation
    _relVelVec.subVectors(shipA.velocity, shipB.velocity);
    const closingSpeed = Math.max(0, -_relVelVec.dot(_normVec));

    // Collision angle classification
    const headingDot = shipA.direction.dot(shipB.direction);
    const isSideCollision = headingDot > 0.45;
    const isHeadOnCollision = headingDot < -0.3;

    // Mass factor
    const massFactor = (shipA.mass + shipB.mass) * 0.5;

    // Boost factor
    const isAnyBoosting = shipA.isBoosting || shipB.isBoosting;
    const boostMult = isAnyBoosting ? this.config.boostMultiplier : 1.0;

    // Speed factor
    const avgSpeed = (shipA.speed + shipB.speed) * 0.5;
    const speedFactor = 0.5 + Math.min(2.0, avgSpeed / 50);

    // Calculate normalized impact force
    let rawImpact = (this.config.baseImpactForce + closingSpeed * 0.14) * massFactor * speedFactor * boostMult;
    if (isSideCollision) {
      rawImpact *= 0.65; // Side swipes preserve forward race momentum!
    } else if (isHeadOnCollision) {
      rawImpact *= 1.45; // Front collisions hit hard!
    }

    const impactForce = Math.min(this.config.maxImpactForce, Math.max(0.8, rawImpact));
    const isHeavy = impactForce > 4.5;
    const isCritical = impactForce >= this.config.crashThreshold;

    // Contact Midpoint for effects
    _contactPoint.addVectors(shipA.position, shipB.position).multiplyScalar(0.5);

    // 3. Arcade Spin / Rotational Impulse & Knockback
    const knockbackMag = Math.min(this.config.maxKnockback, impactForce * this.config.knockbackMultiplier * 2.8);

    // Apply knockback to speeds
    if (isSideCollision) {
      // Preserve forward speed mostly, just shave 6-12%
      shipA.speed = Math.max(12, shipA.speed * 0.92);
      shipB.speed = Math.max(12, shipB.speed * 0.92);
    } else {
      // Heavy head-on / front impact shaves more speed
      const speedLossFactor = Math.max(0.4, 0.88 - impactForce * 0.05);
      shipA.speed = Math.max(8, shipA.speed * speedLossFactor);
      shipB.speed = Math.max(8, shipB.speed * speedLossFactor);
    }

    // Rotational torque impulse
    const torqueDirA = Math.sign(lateralPush) || 1;
    const spinTorque = Math.min(
      this.config.maxAngularVelocity,
      impactForce * this.config.rotationMultiplier * 0.75
    );

    shipA.angularVelocity += torqueDirA * spinTorque;
    shipB.angularVelocity -= torqueDirA * spinTorque;

    shipA.recoveryTimer = this.config.recoveryTime;
    shipB.recoveryTimer = this.config.recoveryTime;

    // 4. Damage Distribution (Shield First, then Hull)
    let shieldDmgA = 0;
    let hullDmgA = 0;
    let shieldDmgB = 0;
    let hullDmgB = 0;

    if (!isAInvulnerable) {
      const dmgAmt = impactForce * (isSideCollision ? 3.0 : 5.5);
      if (shipA.shield > 0) {
        shieldDmgA = Math.min(shipA.shield, dmgAmt * this.config.shieldDamageMultiplier);
        shipA.shield = Math.max(0, shipA.shield - shieldDmgA);
        const excess = dmgAmt - shieldDmgA;
        if (excess > 0) {
          hullDmgA = excess * this.config.hullDamageMultiplier;
          shipA.hull = Math.max(0, shipA.hull - hullDmgA);
        }
      } else {
        hullDmgA = dmgAmt * this.config.hullDamageMultiplier;
        shipA.hull = Math.max(0, shipA.hull - hullDmgA);
      }
      shipA.applyDamage?.(shieldDmgA, hullDmgA, impactForce);
    }

    if (!isBInvulnerable) {
      const dmgAmt = impactForce * (isSideCollision ? 3.0 : 5.5);
      if (shipB.shield > 0) {
        shieldDmgB = Math.min(shipB.shield, dmgAmt * this.config.shieldDamageMultiplier);
        shipB.shield = Math.max(0, shipB.shield - shieldDmgB);
        const excess = dmgAmt - shieldDmgB;
        if (excess > 0) {
          hullDmgB = excess * this.config.hullDamageMultiplier;
          shipB.hull = Math.max(0, shipB.hull - hullDmgB);
        }
      } else {
        hullDmgB = dmgAmt * this.config.hullDamageMultiplier;
        shipB.hull = Math.max(0, shipB.hull - hullDmgB);
      }
      shipB.applyDamage?.(shieldDmgB, hullDmgB, impactForce);
    }

    // 5. Crash Threshold Check:
    // With shields intact, ships absorb and deflect impacts with spin and knockback!
    // A crash is only sustained if hull is reduced to 0 OR if the impact is an overwhelming catastrophic smash (e.g. 1.6x crashThreshold AND shields are depleted).
    let shipACrashed = false;
    let shipBCrashed = false;

    const catastrophicThreshold = this.config.crashThreshold * 1.6;
    const canACrash = !isAInvulnerable && (shipA.hull <= 0 || (isCritical && shipA.shield <= 0) || impactForce >= catastrophicThreshold);
    const canBCrash = !isBInvulnerable && (shipB.hull <= 0 || (isCritical && shipB.shield <= 0) || impactForce >= catastrophicThreshold);

    if (canACrash) {
      shipACrashed = true;
      shipA.isDestroyed = true;
      shipA.onCrash?.('CRITICAL COLLISION IMPACT');
    }
    if (canBCrash) {
      shipBCrashed = true;
      shipB.isDestroyed = true;
      shipB.onCrash?.('CRITICAL COLLISION IMPACT');
    }

    // 6. Visual Effects Trigger
    let effectType: CollisionEffectType = 'PlayerCollisionImpact';
    if (shipACrashed || shipBCrashed) {
      effectType = 'CriticalCollisionImpact';
    } else if (isAnyBoosting) {
      effectType = 'BoostCollisionImpact';
    } else if (isHeavy) {
      effectType = 'HeavyCollisionImpact';
    } else if (shipA.shield > 0 || shipB.shield > 0) {
      effectType = 'ShieldImpact';
    }

    const effectColor =
      shipACrashed || shipBCrashed
        ? 0xff0055
        : isAnyBoosting
        ? 0xffaa00
        : shipA.shield > 0 || shipB.shield > 0
        ? 0x00f0ff
        : 0xffffff;

    this.effectsPool.triggerImpactEffect(effectType, _contactPoint, _normVec, impactForce, effectColor);

    // 7. Audio & Camera Reactions
    const involvesLocalPlayer = shipA.category === 'PLAYER' || shipB.category === 'PLAYER';

    if (involvesLocalPlayer) {
      // Sound
      if (shipACrashed || shipBCrashed || isHeavy) {
        this.onSoundTrigger?.('HEAVY_IMPACT');
      } else if (shipA.shield > 0 || shipB.shield > 0) {
        this.onSoundTrigger?.('SHIELD_IMPACT');
      } else if (isSideCollision) {
        this.onSoundTrigger?.('SCRAPE');
      } else {
        this.onSoundTrigger?.('COLLISION');
      }

      // Camera Shake
      const shakeIntensity = Math.min(1.4, 0.25 + impactForce * 0.12);
      this.onCameraShakeRequest?.(shakeIntensity);

      // Camera FOV Pulse
      const fovPulse = Math.min(8.0, 2.5 + impactForce * 0.6);
      this.onCameraFovPunch?.(fovPulse);

      // HUD Feedback
      const isPlayerA = shipA.category === 'PLAYER';
      const playerShieldLoss = Math.round(isPlayerA ? shieldDmgA : shieldDmgB);
      const playerHullLoss = Math.round(isPlayerA ? hullDmgA : hullDmgB);
      const otherShip = isPlayerA ? shipB : shipA;
      const otherCrashed = isPlayerA ? shipBCrashed : shipACrashed;

      if (otherCrashed) {
        this.onCollisionFeedback?.({
          id: `feedback_${Date.now()}`,
          type: 'RIVAL_CRASHED',
          title: 'RIVAL CRASHED!',
          detail: `${otherShip.name.toUpperCase()} KNOCKED OUT`,
          impactForce,
          timestamp: Date.now(),
        });
      } else if (isCritical || (isPlayerA ? shipACrashed : shipBCrashed)) {
        this.onCollisionFeedback?.({
          id: `feedback_${Date.now()}`,
          type: 'CRITICAL_CRASH',
          title: 'CRITICAL IMPACT!',
          detail: 'HULL BREACHED - RESPAWNING',
          impactForce,
          timestamp: Date.now(),
        });
      } else if (isHeavy) {
        this.onCollisionFeedback?.({
          id: `feedback_${Date.now()}`,
          type: 'HEAVY_IMPACT',
          title: 'HEAVY IMPACT!',
          detail:
            playerShieldLoss > 0
              ? `SHIELD -${playerShieldLoss}%`
              : playerHullLoss > 0
              ? `HULL -${playerHullLoss}%`
              : undefined,
          shieldDelta: playerShieldLoss,
          hullDelta: playerHullLoss,
          impactForce,
          timestamp: Date.now(),
        });
      } else {
        this.onCollisionFeedback?.({
          id: `feedback_${Date.now()}`,
          type: 'IMPACT',
          title: 'IMPACT!',
          detail:
            playerShieldLoss > 0
              ? `SHIELD -${playerShieldLoss}%`
              : playerHullLoss > 0
              ? `HULL -${playerHullLoss}%`
              : undefined,
          shieldDelta: playerShieldLoss,
          hullDelta: playerHullLoss,
          impactForce,
          timestamp: Date.now(),
        });
      }
    } else {
      // AI vs AI sound if within hearing distance of camera/player
      this.onSoundTrigger?.('SCRAPE');
    }
  }

  public dispose() {
    this.effectsPool.dispose();
    this.participants.clear();
  }
}
