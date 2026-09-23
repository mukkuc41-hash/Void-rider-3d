import * as THREE from 'three';
import { MissileTelemetry, MissileTargetInfo, MissileState } from '../types';
import { sound } from './audio';

// Centralized Balance Constants
export const MISSILE_CONFIG = {
  MISSILE_DAMAGE: 45,
  MISSILE_SPEED: 420,
  MISSILE_RANGE: 500,
  MISSILE_EXPLOSION_RADIUS: 18,
  MISSILE_LIFETIME: 6.0,
  MISSILE_COOLDOWN: 60.0, // Exactly 60 seconds
  HOMING_TURN_RATE: 5.5, // Radians per sec tracking arc
  TARGETING_MAX_ANGLE_COS: 0.25, // ~75-degree cone
  POOL_SIZE: 12,
  EXPLOSION_PARTICLE_COUNT: 45,
};

export interface MissileTargetCandidate {
  id: string;
  name: string;
  isAI: boolean;
  isTeammate: boolean;
  isDestroyed: boolean;
  position: THREE.Vector3;
  meshGroup: THREE.Group;
  shield: number;
  hull: number;
  applyDamage: (shieldDmg: number, hullDmg: number, impactForce: number) => void;
  triggerCrash?: (reason: string) => void;
}

export interface MissileProjectile {
  id: number;
  active: boolean;
  ownerId: string;
  targetId: string | null;
  targetRef: MissileTargetCandidate | null;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  direction: THREE.Vector3;
  distanceTraveled: number;
  lifeTimer: number;
  group: THREE.Group;
  trailPoints: THREE.Vector3[];
  trailLine: THREE.Line;
  pointLight: THREE.PointLight;
}

export interface MissileExplosion {
  active: boolean;
  position: THREE.Vector3;
  lifeTimer: number;
  maxLife: number;
  shockwaveMesh: THREE.Mesh;
  particles: THREE.Points;
  particleVelocities: THREE.Vector3[];
  light: THREE.PointLight;
}

export class MissileManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  public friendlyFire: boolean = false;

  // Real-time Cooldown (60.0s)
  public missileCooldownTimer: number = 0; // 0 = ready, > 0 = reloading
  private lastFireAttemptTime: number = 0;
  private feedbackText: string = '';
  private feedbackTimer: number = 0;

  // Active Target Lock
  public currentTarget: MissileTargetCandidate | null = null;
  private hadTargetLastFrame: boolean = false;

  // Projectile Object Pool
  private missilePool: MissileProjectile[] = [];
  private explosionPool: MissileExplosion[] = [];

  // Reusable Math Objects for Zero Garbage Collection
  private _forwardVec = new THREE.Vector3();
  private _toTargetVec = new THREE.Vector3();
  private _projScreenPos = new THREE.Vector3();
  private _upVec = new THREE.Vector3(0, 1, 0);

  // Callbacks
  private onCameraShake?: (intensity: number) => void;
  private onFovPulse?: (amount: number) => void;
  private onImpactFeedback?: (title: string, detail: string) => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    callbacks?: {
      onCameraShake?: (intensity: number) => void;
      onFovPulse?: (amount: number) => void;
      onImpactFeedback?: (title: string, detail: string) => void;
    }
  ) {
    this.scene = scene;
    this.camera = camera;
    this.onCameraShake = callbacks?.onCameraShake;
    this.onFovPulse = callbacks?.onFovPulse;
    this.onImpactFeedback = callbacks?.onImpactFeedback;

    this.initMissilePool();
    this.initExplosionPool();
  }

  // ==========================================
  // INITIALIZE OBJECT POOLS
  // ==========================================
  private initMissilePool() {
    for (let i = 0; i < MISSILE_CONFIG.POOL_SIZE; i++) {
      const group = new THREE.Group();
      group.name = `missile_projectile_${i}`;
      group.visible = false;

      // Aerodynamic missile fuselage
      const bodyGeo = new THREE.CylinderGeometry(0.3, 0.42, 3.2, 12);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x111c2e,
        roughness: 0.3,
        metalness: 0.85,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.35,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(bodyMesh);

      // Glowing warhead nosecone
      const noseGeo = new THREE.ConeGeometry(0.35, 1.1, 12);
      noseGeo.rotateX(-Math.PI / 2);
      const noseMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
      });
      const noseMesh = new THREE.Mesh(noseGeo, noseMat);
      noseMesh.position.z = -1.9;
      group.add(noseMesh);

      // 4 Stabilizer fins
      const finGeo = new THREE.BoxGeometry(0.08, 1.4, 0.7);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        metalness: 0.9,
        roughness: 0.2,
      });
      const fin1 = new THREE.Mesh(finGeo, finMat);
      fin1.position.z = 1.0;
      const fin2 = new THREE.Mesh(finGeo, finMat);
      fin2.position.z = 1.0;
      fin2.rotation.z = Math.PI / 2;
      group.add(fin1, fin2);

      // Blazing thruster exhaust flame
      const exhaustGeo = new THREE.ConeGeometry(0.45, 1.8, 12);
      exhaustGeo.rotateX(Math.PI / 2);
      const exhaustMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.95,
      });
      const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat);
      exhaustMesh.position.z = 2.1;
      group.add(exhaustMesh);

      // Dynamic missile propulsion light
      const pointLight = new THREE.PointLight(0xff0055, 3.5, 18);
      pointLight.position.set(0, 0, 0.5);
      group.add(pointLight);

      // Trail line
      const maxTrailPoints = 14;
      const trailPoints: THREE.Vector3[] = [];
      const trailPositions = new Float32Array(maxTrailPoints * 3);
      for (let p = 0; p < maxTrailPoints; p++) {
        trailPoints.push(new THREE.Vector3());
      }
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.85,
        linewidth: 2,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      trailLine.frustumCulled = false;
      this.scene.add(trailLine);
      trailLine.visible = false;

      this.scene.add(group);

      this.missilePool.push({
        id: i,
        active: false,
        ownerId: '',
        targetId: null,
        targetRef: null,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(0, 0, -1),
        distanceTraveled: 0,
        lifeTimer: 0,
        group,
        trailPoints,
        trailLine,
        pointLight,
      });
    }
  }

  private initExplosionPool() {
    for (let i = 0; i < 6; i++) {
      // Expanding shockwave ring
      const ringGeo = new THREE.RingGeometry(0.5, 1.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3366,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
      shockwaveMesh.visible = false;
      this.scene.add(shockwaveMesh);

      // Concussive particle debris
      const particleCount = MISSILE_CONFIG.EXPLOSION_PARTICLE_COUNT;
      const particleGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);
      const pColors = new Float32Array(particleCount * 3);
      const particleVelocities: THREE.Vector3[] = [];

      for (let p = 0; p < particleCount; p++) {
        pPositions[p * 3] = 0;
        pPositions[p * 3 + 1] = 0;
        pPositions[p * 3 + 2] = 0;

        // Vivid fiery explosion sparks
        const isCyan = Math.random() > 0.7;
        pColors[p * 3] = isCyan ? 0.0 : 1.0;
        pColors[p * 3 + 1] = isCyan ? 0.94 : Math.random() * 0.5;
        pColors[p * 3 + 2] = isCyan ? 1.0 : 0.2;

        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 55,
          (Math.random() - 0.5) * 55,
          (Math.random() - 0.5) * 55
        );
        particleVelocities.push(vel);
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(particleGeo, particleMat);
      particles.visible = false;
      this.scene.add(particles);

      const light = new THREE.PointLight(0xff3366, 8, 35);
      light.visible = false;
      this.scene.add(light);

      this.explosionPool.push({
        active: false,
        position: new THREE.Vector3(),
        lifeTimer: 0,
        maxLife: 0.65,
        shockwaveMesh,
        particles,
        particleVelocities,
        light,
      });
    }
  }

  // ==========================================
  // TARGETING SYSTEM
  // ==========================================
  public scanForTargets(
    playerPos: THREE.Vector3,
    playerQuat: THREE.Quaternion,
    candidates: MissileTargetCandidate[]
  ): MissileTargetCandidate | null {
    this._forwardVec.set(0, 0, -1).applyQuaternion(playerQuat).normalize();

    let bestTarget: MissileTargetCandidate | null = null;
    let closestDist = MISSILE_CONFIG.MISSILE_RANGE;

    for (const cand of candidates) {
      if (cand.isDestroyed) continue;
      if (!this.friendlyFire && cand.isTeammate) continue;

      this._toTargetVec.subVectors(cand.position, playerPos);
      const dist = this._toTargetVec.length();

      if (dist <= 0.1 || dist > MISSILE_CONFIG.MISSILE_RANGE) continue;

      this._toTargetVec.normalize();
      const dot = this._forwardVec.dot(this._toTargetVec);

      // Must be inside forward targeting cone
      if (dot < MISSILE_CONFIG.TARGETING_MAX_ANGLE_COS) continue;

      // Prefer closer valid target along race trajectory
      if (dist < closestDist) {
        closestDist = dist;
        bestTarget = cand;
      }
    }

    if (bestTarget && !this.hadTargetLastFrame) {
      sound.playTargetLock();
    }
    this.hadTargetLastFrame = !!bestTarget;
    this.currentTarget = bestTarget;

    return bestTarget;
  }

  // ==========================================
  // LAUNCH MISSILE WEAPON
  // ==========================================
  public fireMissile(
    ownerId: string,
    playerPos: THREE.Vector3,
    playerQuat: THREE.Quaternion,
    candidates: MissileTargetCandidate[]
  ): { success: boolean; reason?: string } {
    const now = performance.now();

    // 1. Debounce rapid spam
    if (now - this.lastFireAttemptTime < 250) {
      return { success: false, reason: 'DEBOUNCE' };
    }
    this.lastFireAttemptTime = now;

    // 2. Check 60s cooldown
    if (this.missileCooldownTimer > 0) {
      const remainingSec = Math.ceil(this.missileCooldownTimer);
      const msg = `RELOADING 00:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
      this.setFeedback(msg, 1.5);
      return { success: false, reason: 'RELOADING' };
    }

    // 3. Scan for target ahead of player
    const target = this.scanForTargets(playerPos, playerQuat, candidates);
    if (!target) {
      this.setFeedback('NO TARGET', 2.0);
      return { success: false, reason: 'NO_TARGET' };
    }

    // 4. Find available pooled projectile
    const projectile = this.missilePool.find(m => !m.active);
    if (!projectile) {
      return { success: false, reason: 'POOL_EXHAUSTED' };
    }

    // 5. Calculate initial trajectory
    this._forwardVec.set(0, 0, -1).applyQuaternion(playerQuat).normalize();
    const spawnPos = playerPos.clone().addScaledVector(this._forwardVec, 3.5);

    projectile.active = true;
    projectile.ownerId = ownerId;
    projectile.targetId = target.id;
    projectile.targetRef = target;
    projectile.position.copy(spawnPos);
    projectile.direction.copy(this._forwardVec);
    projectile.velocity.copy(this._forwardVec).multiplyScalar(MISSILE_CONFIG.MISSILE_SPEED);
    projectile.distanceTraveled = 0;
    projectile.lifeTimer = 0;

    projectile.group.position.copy(spawnPos);
    projectile.group.quaternion.copy(playerQuat);
    projectile.group.visible = true;

    // Initialize trail points
    for (let p = 0; p < projectile.trailPoints.length; p++) {
      projectile.trailPoints[p].copy(spawnPos);
    }
    projectile.trailLine.visible = true;

    // Audio and cooldown activation
    sound.playMissileLaunch();
    this.missileCooldownTimer = MISSILE_CONFIG.MISSILE_COOLDOWN; // Exactly 60s
    this.setFeedback('MISSILE LAUNCHED', 2.0);

    return { success: true };
  }

  /**
   * Fires a homing missile launched by an AI racer or non-player entity
   */
  public launchMissileFromEntity(
    ownerId: string,
    originPos: THREE.Vector3,
    originQuat: THREE.Quaternion,
    target: MissileTargetCandidate,
    accuracyVariance: number = 0
  ): boolean {
    const projectile = this.missilePool.find(m => !m.active);
    if (!projectile) return false;

    this._forwardVec.set(0, 0, -1).applyQuaternion(originQuat).normalize();
    if (accuracyVariance > 0.001) {
      this._forwardVec.x += (Math.random() - 0.5) * accuracyVariance;
      this._forwardVec.y += (Math.random() - 0.5) * accuracyVariance;
      this._forwardVec.normalize();
    }

    const spawnPos = originPos.clone().addScaledVector(this._forwardVec, 3.2);

    projectile.active = true;
    projectile.ownerId = ownerId;
    projectile.targetId = target.id;
    projectile.targetRef = target;
    projectile.position.copy(spawnPos);
    projectile.direction.copy(this._forwardVec);
    projectile.velocity.copy(this._forwardVec).multiplyScalar(MISSILE_CONFIG.MISSILE_SPEED);
    projectile.distanceTraveled = 0;
    projectile.lifeTimer = 0;

    projectile.group.position.copy(spawnPos);
    projectile.group.quaternion.copy(originQuat);
    projectile.group.visible = true;

    for (let p = 0; p < projectile.trailPoints.length; p++) {
      projectile.trailPoints[p].copy(spawnPos);
    }
    projectile.trailLine.visible = true;

    sound.playMissileLaunch();
    return true;
  }

  // ==========================================
  // UPDATE LOOP (FLIGHT, HOMING, COLLISIONS)
  // ==========================================
  public update(dt: number, isPaused: boolean = false) {
    if (isPaused) return;

    // Decrement 60s Cooldown based on real elapsed time
    if (this.missileCooldownTimer > 0) {
      const prevVal = this.missileCooldownTimer;
      this.missileCooldownTimer = Math.max(0, this.missileCooldownTimer - dt);

      // Trigger ready chime when reaching exactly 0
      if (prevVal > 0 && this.missileCooldownTimer <= 0) {
        sound.playMissileReloadReady();
        this.setFeedback('MISSILE READY', 2.0);
      }
    }

    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
      if (this.feedbackTimer <= 0) {
        this.feedbackText = '';
      }
    }

    // Update active missile projectiles
    for (const m of this.missilePool) {
      if (!m.active) continue;

      m.lifeTimer += dt;

      // Lifetime & range expiration
      if (
        m.lifeTimer > MISSILE_CONFIG.MISSILE_LIFETIME ||
        m.distanceTraveled > MISSILE_CONFIG.MISSILE_RANGE
      ) {
        this.deactivateMissile(m);
        continue;
      }

      // Homing guidance toward target
      let hasValidTarget = false;
      if (m.targetRef && !m.targetRef.isDestroyed) {
        this._toTargetVec.subVectors(m.targetRef.position, m.position);
        const distToTarget = this._toTargetVec.length();

        // Impact detection
        if (distToTarget < 5.0) {
          this.triggerImpact(m, m.targetRef);
          continue;
        }

        hasValidTarget = true;
        this._toTargetVec.normalize();

        // Smooth spherical interpolation (Slerp / turn rate)
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          this._toTargetVec
        );

        const maxAngle = MISSILE_CONFIG.HOMING_TURN_RATE * dt;
        m.group.quaternion.rotateTowards(targetQuat, maxAngle);

        m.direction.set(0, 0, -1).applyQuaternion(m.group.quaternion).normalize();
        m.velocity.copy(m.direction).multiplyScalar(MISSILE_CONFIG.MISSILE_SPEED);
      }

      // Step position
      const stepDist = MISSILE_CONFIG.MISSILE_SPEED * dt;
      m.position.addScaledVector(m.direction, stepDist);
      m.distanceTraveled += stepDist;
      m.group.position.copy(m.position);

      // Rotate missile slightly along roll axis for aerodynamic realism
      m.group.rotateZ(dt * 12);

      // Shift trail points
      for (let p = m.trailPoints.length - 1; p > 0; p--) {
        m.trailPoints[p].copy(m.trailPoints[p - 1]);
      }
      m.trailPoints[0].copy(m.position);

      const posAttr = m.trailLine.geometry.attributes.position as THREE.BufferAttribute;
      for (let p = 0; p < m.trailPoints.length; p++) {
        posAttr.setXYZ(p, m.trailPoints[p].x, m.trailPoints[p].y, m.trailPoints[p].z);
      }
      posAttr.needsUpdate = true;
    }

    // Update active explosions
    for (const exp of this.explosionPool) {
      if (!exp.active) continue;

      exp.lifeTimer += dt;
      const progress = exp.lifeTimer / exp.maxLife;

      if (progress >= 1.0) {
        exp.active = false;
        exp.shockwaveMesh.visible = false;
        exp.particles.visible = false;
        exp.light.visible = false;
        continue;
      }

      // Expand shockwave ring
      const scale = 1.0 + progress * 24.0;
      exp.shockwaveMesh.scale.set(scale, scale, scale);
      (exp.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - progress);

      // Expand explosion particles
      const posAttr = exp.particles.geometry.attributes.position as THREE.BufferAttribute;
      for (let p = 0; p < MISSILE_CONFIG.EXPLOSION_PARTICLE_COUNT; p++) {
        const vel = exp.particleVelocities[p];
        const curX = posAttr.getX(p) + vel.x * dt;
        const curY = posAttr.getY(p) + vel.y * dt;
        const curZ = posAttr.getZ(p) + vel.z * dt;
        posAttr.setXYZ(p, curX, curY, curZ);
      }
      posAttr.needsUpdate = true;
      (exp.particles.material as THREE.PointsMaterial).opacity = Math.max(0, 1.0 - progress * 1.2);

      // Fade light
      exp.light.intensity = 8.0 * (1.0 - progress);
    }
  }

  // ==========================================
  // IMPACT & DAMAGE RESOLUTION
  // ==========================================
  private triggerImpact(missile: MissileProjectile, target: MissileTargetCandidate) {
    const impactPos = missile.position.clone();
    this.deactivateMissile(missile);

    // Audio
    sound.playMissileExplosion();

    // Spawn 3D Explosion
    this.spawnExplosion(impactPos);

    // FX: Camera shake and FOV pulse
    this.onCameraShake?.(1.4);
    this.onFovPulse?.(6.0);

    // Calculate damage through existing shield & hull systems
    const totalDmg = MISSILE_CONFIG.MISSILE_DAMAGE;
    const currentShield = target.shield ?? 0;
    const shieldDmg = Math.min(currentShield, totalDmg);
    const hullDmg = Math.max(0, totalDmg - shieldDmg);

    // Apply damage to target
    target.applyDamage(shieldDmg, hullDmg, 65);

    // Feedback
    const detailMsg = shieldDmg > 0 && hullDmg > 0
      ? `SHIELD -${Math.round(shieldDmg)} | HULL -${Math.round(hullDmg)}`
      : shieldDmg > 0
      ? `SHIELD -${Math.round(shieldDmg)} (ABSORBED)`
      : `HULL -${Math.round(hullDmg)} (DIRECT HIT)`;

    this.onImpactFeedback?.(`MISSILE IMPACT → ${target.name.toUpperCase()}`, detailMsg);
    this.setFeedback(`HIT ${target.name.toUpperCase()}!`, 2.5);

    // If hull destroyed, trigger crash sequence
    if (target.hull - hullDmg <= 0) {
      target.triggerCrash?.(`DESTROYED BY MISSILE STRIKE`);
    }
  }

  private spawnExplosion(pos: THREE.Vector3) {
    const exp = this.explosionPool.find(e => !e.active);
    if (!exp) return;

    exp.active = true;
    exp.lifeTimer = 0;
    exp.position.copy(pos);

    exp.shockwaveMesh.position.copy(pos);
    exp.shockwaveMesh.lookAt(this.camera.position);
    exp.shockwaveMesh.scale.set(1, 1, 1);
    exp.shockwaveMesh.visible = true;
    (exp.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;

    exp.particles.position.copy(pos);
    const posAttr = exp.particles.geometry.attributes.position as THREE.BufferAttribute;
    for (let p = 0; p < MISSILE_CONFIG.EXPLOSION_PARTICLE_COUNT; p++) {
      posAttr.setXYZ(p, 0, 0, 0);
    }
    posAttr.needsUpdate = true;
    exp.particles.visible = true;
    (exp.particles.material as THREE.PointsMaterial).opacity = 1.0;

    exp.light.position.copy(pos);
    exp.light.intensity = 8.0;
    exp.light.visible = true;
  }

  private deactivateMissile(m: MissileProjectile) {
    m.active = false;
    m.group.visible = false;
    m.trailLine.visible = false;
    m.targetRef = null;
    m.targetId = null;
  }

  private setFeedback(text: string, duration: number) {
    this.feedbackText = text;
    this.feedbackTimer = duration;
  }

  // ==========================================
  // RESET / RESTART SYSTEM
  // ==========================================
  public reset() {
    this.missileCooldownTimer = 0; // Fresh race = READY
    this.currentTarget = null;
    this.hadTargetLastFrame = false;
    this.feedbackText = '';
    this.feedbackTimer = 0;

    for (const m of this.missilePool) {
      this.deactivateMissile(m);
    }
    for (const e of this.explosionPool) {
      e.active = false;
      e.shockwaveMesh.visible = false;
      e.particles.visible = false;
      e.light.visible = false;
    }
  }

  // ==========================================
  // TELEMETRY PROJECTION
  // ==========================================
  public getTelemetry(playerPos: THREE.Vector3): MissileTelemetry {
    let status: MissileState = 'READY';

    if (this.missileCooldownTimer > 0) {
      status = 'RELOADING';
    } else if (this.currentTarget) {
      status = 'LOCKED';
    } else if (this.feedbackText === 'NO TARGET') {
      status = 'NO_TARGET';
    }

    let targetInfo: MissileTargetInfo | null = null;
    if (this.currentTarget) {
      const dist = playerPos.distanceTo(this.currentTarget.position);

      // Project target world pos to 2D screen coordinate (0-100%)
      this._projScreenPos.copy(this.currentTarget.position).project(this.camera);
      const screenX = (this._projScreenPos.x * 0.5 + 0.5) * 100;
      const screenY = (-(this._projScreenPos.y * 0.5) + 0.5) * 100;
      const isInFront = this._projScreenPos.z < 1.0;

      targetInfo = {
        id: this.currentTarget.id,
        name: this.currentTarget.name,
        position: {
          x: this.currentTarget.position.x,
          y: this.currentTarget.position.y,
          z: this.currentTarget.position.z,
        },
        distance: Math.round(dist),
        screenX: isInFront ? Math.max(5, Math.min(95, screenX)) : undefined,
        screenY: isInFront ? Math.max(5, Math.min(95, screenY)) : undefined,
        isLocked: true,
        hull: this.currentTarget.hull,
        shield: this.currentTarget.shield,
      };
    }

    const missilesInFlight = this.missilePool.filter(m => m.active).length;

    return {
      status,
      cooldownRemaining: Math.max(0, this.missileCooldownTimer),
      totalCooldown: MISSILE_CONFIG.MISSILE_COOLDOWN,
      hasTarget: !!this.currentTarget,
      target: targetInfo,
      missilesInFlight,
      friendlyFire: this.friendlyFire,
      feedbackText: this.feedbackText,
    };
  }

  public dispose() {
    this.reset();
    for (const m of this.missilePool) {
      this.scene.remove(m.group);
      this.scene.remove(m.trailLine);
    }
    for (const e of this.explosionPool) {
      this.scene.remove(e.shockwaveMesh);
      this.scene.remove(e.particles);
      this.scene.remove(e.light);
    }
  }
}
