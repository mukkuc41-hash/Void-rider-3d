import * as THREE from 'three';
import {
  BeamCustomization,
  BeamUpgrades,
  BeamStatus,
  BeamTelemetry,
  TargetLockInfo,
  GameMode,
  ModeBeamConfig,
} from '../types';
import { Obstacle } from './trackData';
import { sound } from './audio';

// Default Customization Preset
export const DEFAULT_BEAM_CUSTOMIZATION: BeamCustomization = {
  type: 'STANDARD',
  coreShape: 'STANDARD',
  coreColor: '#ffffff',
  outerColor: '#00f0ff',
  particleColor: '#00e5ff',
  impactPreset: 'ENERGY_BURST',
  soundPreset: 'HIGH_ENERGY_PULSE',
  trailLength: 1.0,
  trailWidth: 1.0,
  particleDensity: 1.0,
  energyStreaks: true,
  outerGlow: 1.0,
  coreBrightness: 1.2,
  pulseSpeed: 1.0,
  noiseMovement: true,
  shockwaveEnabled: true,
};

export const DEFAULT_BEAM_UPGRADES: BeamUpgrades = {
  power: 0,
  range: 0,
  energyCapacity: 0,
  rechargeRate: 0,
  fireRate: 0,
  cooling: 0,
  impactForce: 0,
  targeting: 0,
};

// Mode-Specific Beam Rules
export const MODE_BEAM_CONFIGS: Partial<Record<GameMode, ModeBeamConfig>> & { STANDARD: ModeBeamConfig } = {
  STANDARD: {
    beamEnabled: true,
    beamDamageMultiplier: 1.0,
    beamEnergyMultiplier: 1.0,
    beamCooldown: 3.0,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  GRAND_PRIX: {
    beamEnabled: true,
    beamDamageMultiplier: 1.0,
    beamEnergyMultiplier: 1.0,
    beamCooldown: 3.0,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  TIME_TRIAL: {
    beamEnabled: true,
    beamDamageMultiplier: 1.1,
    beamEnergyMultiplier: 1.0,
    beamCooldown: 2.8,
    allowedTargets: ['ASTEROID', 'DEBRIS'],
  },
  SURVIVAL: {
    beamEnabled: true,
    beamDamageMultiplier: 1.35,
    beamEnergyMultiplier: 0.85, // Lower consumption for high hazard density
    beamCooldown: 2.2,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  ELIMINATION: {
    beamEnabled: true,
    beamDamageMultiplier: 1.15,
    beamEnergyMultiplier: 0.9,
    beamCooldown: 2.5,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  ELIMINATOR: {
    beamEnabled: true,
    beamDamageMultiplier: 1.15,
    beamEnergyMultiplier: 0.9,
    beamCooldown: 2.5,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  ENDURANCE: {
    beamEnabled: true,
    beamDamageMultiplier: 1.2,
    beamEnergyMultiplier: 0.8,
    beamCooldown: 2.4,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  DUEL: {
    beamEnabled: true,
    beamDamageMultiplier: 1.1,
    beamEnergyMultiplier: 1.0,
    beamCooldown: 2.8,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  CHALLENGE: {
    beamEnabled: true,
    beamDamageMultiplier: 1.25,
    beamEnergyMultiplier: 0.95,
    beamCooldown: 2.5,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
  FREE_RIDE: {
    beamEnabled: true,
    beamDamageMultiplier: 1.5,
    beamEnergyMultiplier: 0.5,
    beamCooldown: 1.5,
    allowedTargets: ['ASTEROID', 'DEBRIS', 'BARRIER'],
  },
};

// Rock Fragment in pooled particle group
interface PooledFragment {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

// Shockwave Ring in pool
interface PooledShockwave {
  mesh: THREE.Mesh;
  scale: number;
  maxScale: number;
  opacity: number;
  active: boolean;
}

export class BeamSystem {
  public customization: BeamCustomization;
  public upgrades: BeamUpgrades;
  public modeConfig: ModeBeamConfig;

  // Energy & Heat System
  public energy: number = 100;
  public maxEnergy: number = 100;
  public heat: number = 0;
  public isOverheated: boolean = false;
  private overheatCooldownTimer: number = 0;
  private fireTickTimer: number = 0;
  private isFiring: boolean = false;

  // 3D Scene Components
  public containerGroup: THREE.Group;
  private innerCoreMesh!: THREE.Mesh;
  private outerGlowMesh!: THREE.Mesh;
  private spiralMesh!: THREE.Mesh;
  private muzzleFlashMesh!: THREE.Mesh;
  private impactPointMesh!: THREE.Mesh;
  private secondaryCoreMeshLeft!: THREE.Mesh;
  private secondaryCoreMeshRight!: THREE.Mesh;
  private secondaryGlowMeshLeft!: THREE.Mesh;
  private secondaryGlowMeshRight!: THREE.Mesh;

  // Material References
  private innerCoreMaterial!: THREE.MeshBasicMaterial;
  private outerGlowMaterial!: THREE.MeshBasicMaterial;
  private spiralMaterial!: THREE.MeshBasicMaterial;
  private muzzleFlashMaterial!: THREE.MeshBasicMaterial;
  private impactPointMaterial!: THREE.MeshBasicMaterial;

  // Particle System (Sparks & Energy Streaks)
  private sparkPoints!: THREE.Points;
  private sparkGeo!: THREE.BufferGeometry;
  private sparkPositions!: Float32Array;
  private sparkVelocities!: Float32Array;
  private sparkLifetimes!: Float32Array;
  private readonly MAX_SPARKS = 140;

  // Fragment Mesh Pool (for shattered asteroids)
  private fragmentPool: PooledFragment[] = [];
  private shockwavePool: PooledShockwave[] = [];

  // Targeting & Locks
  public currentTargetLock: TargetLockInfo | null = null;
  public lockedObstacle: Obstacle | null = null;
  private lastLockedId: number | null = null;

  // Combo & Streak Tracker
  public comboCount: number = 0;
  public comboMultiplier: number = 1.0;
  public comboTimer: number = 0;

  // Recoil offset applied to ship
  public recoilOffset: THREE.Vector3 = new THREE.Vector3();
  public screenShakeIntensity: number = 0;

  // Sound hum state
  private isHummingAudio: boolean = false;

  constructor(
    customization?: BeamCustomization,
    upgrades?: BeamUpgrades,
    mode: GameMode = 'STANDARD'
  ) {
    this.customization = customization ? { ...customization } : { ...DEFAULT_BEAM_CUSTOMIZATION };
    this.upgrades = upgrades ? { ...upgrades } : { ...DEFAULT_BEAM_UPGRADES };
    this.modeConfig = MODE_BEAM_CONFIGS[mode] || MODE_BEAM_CONFIGS.STANDARD;

    this.applyUpgrades();

    this.containerGroup = new THREE.Group();
    this.containerGroup.name = 'beam_system_container';

    this.buildBeamMeshes();
    this.buildSparkParticleSystem();
    this.buildFragmentAndShockwavePool();
    this.applyCustomization();
  }

  public setMode(mode: GameMode) {
    this.modeConfig = MODE_BEAM_CONFIGS[mode] || MODE_BEAM_CONFIGS.STANDARD;
  }

  public updateCustomization(cust: Partial<BeamCustomization>) {
    this.customization = { ...this.customization, ...cust };
    this.applyCustomization();
  }

  public updateUpgrades(upgrades: Partial<BeamUpgrades>) {
    this.upgrades = { ...this.upgrades, ...upgrades };
    this.applyUpgrades();
  }

  private applyUpgrades() {
    // Upgrades:
    // energyCapacity: 0 to 5 -> 100 to 175 max energy
    this.maxEnergy = 100 + this.upgrades.energyCapacity * 15;
    this.energy = Math.min(this.energy, this.maxEnergy);
  }

  public getEffectiveRange(): number {
    // Base 160m + 20m per range upgrade level (up to 260m)
    return 160 + this.upgrades.range * 20;
  }

  public getBaseDamage(): number {
    // Base 45 + 16 per power upgrade level, multiplied by mode multiplier
    const rawDamage = 48 + this.upgrades.power * 16;
    return rawDamage * this.modeConfig.beamDamageMultiplier;
  }

  // Build the 3D Beam Geometry and Visual Sheaths
  private buildBeamMeshes() {
    // 1. Inner Core Cylinder (Length normalized to 1, scaled dynamically along Z)
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 10, 1, false).rotateX(Math.PI / 2);
    // Center alignment: align base at 0, extends along -Z
    coreGeo.translate(0, 0, -0.5);

    this.innerCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.innerCoreMesh = new THREE.Mesh(coreGeo, this.innerCoreMaterial);
    this.innerCoreMesh.visible = false;
    this.containerGroup.add(this.innerCoreMesh);

    // Secondary cores for DOUBLE and TRIPLE beam shapes
    this.secondaryCoreMeshLeft = new THREE.Mesh(coreGeo.clone(), this.innerCoreMaterial);
    this.secondaryCoreMeshLeft.visible = false;
    this.containerGroup.add(this.secondaryCoreMeshLeft);

    this.secondaryCoreMeshRight = new THREE.Mesh(coreGeo.clone(), this.innerCoreMaterial);
    this.secondaryCoreMeshRight.visible = false;
    this.containerGroup.add(this.secondaryCoreMeshRight);

    // 2. Outer Glow Cylinder
    const outerGeo = new THREE.CylinderGeometry(0.38, 0.48, 1, 12, 1, false).rotateX(Math.PI / 2);
    outerGeo.translate(0, 0, -0.5);

    this.outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.outerGlowMesh = new THREE.Mesh(outerGeo, this.outerGlowMaterial);
    this.outerGlowMesh.visible = false;
    this.containerGroup.add(this.outerGlowMesh);

    this.secondaryGlowMeshLeft = new THREE.Mesh(outerGeo.clone(), this.outerGlowMaterial);
    this.secondaryGlowMeshLeft.visible = false;
    this.containerGroup.add(this.secondaryGlowMeshLeft);

    this.secondaryGlowMeshRight = new THREE.Mesh(outerGeo.clone(), this.outerGlowMaterial);
    this.secondaryGlowMeshRight.visible = false;
    this.containerGroup.add(this.secondaryGlowMeshRight);

    // 3. Spiral / Energy Helix Strands
    const spiralGeo = new THREE.CylinderGeometry(0.52, 0.65, 1, 8, 1, true).rotateX(Math.PI / 2);
    spiralGeo.translate(0, 0, -0.5);

    this.spiralMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: true,
    });
    this.spiralMesh = new THREE.Mesh(spiralGeo, this.spiralMaterial);
    this.spiralMesh.visible = false;
    this.containerGroup.add(this.spiralMesh);

    // 4. Muzzle Flash Flare
    const muzzleGeo = new THREE.PlaneGeometry(1.6, 1.6);
    this.muzzleFlashMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.muzzleFlashMesh = new THREE.Mesh(muzzleGeo, this.muzzleFlashMaterial);
    this.muzzleFlashMesh.visible = false;
    this.containerGroup.add(this.muzzleFlashMesh);

    // 5. Impact Point Flash & Glow
    const impactGeo = new THREE.SphereGeometry(0.8, 12, 12);
    this.impactPointMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.impactPointMesh = new THREE.Mesh(impactGeo, this.impactPointMaterial);
    this.impactPointMesh.visible = false;
    this.containerGroup.add(this.impactPointMesh);
  }

  // Instanced / Pooled Particle System for Beam Sparks
  private buildSparkParticleSystem() {
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.MAX_SPARKS * 3);
    this.sparkVelocities = new Float32Array(this.MAX_SPARKS * 3);
    this.sparkLifetimes = new Float32Array(this.MAX_SPARKS); // > 0 means active

    // Place offscreen initially
    for (let i = 0; i < this.MAX_SPARKS; i++) {
      this.sparkPositions[i * 3 + 1] = -9999;
      this.sparkLifetimes[i] = 0;
    }

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.55,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, sparkMat);
    this.containerGroup.add(this.sparkPoints);
  }

  // Fragment Pool for Asteroid Shatter
  private buildFragmentAndShockwavePool() {
    // 36 pooled rock fragment meshes
    const fragGeo = new THREE.DodecahedronGeometry(0.7, 0);
    const fragMat = new THREE.MeshStandardMaterial({
      color: 0x3d4554,
      roughness: 0.85,
      metalness: 0.25,
      emissive: 0x112233,
    });

    for (let i = 0; i < 36; i++) {
      const mesh = new THREE.Mesh(fragGeo.clone(), fragMat.clone());
      mesh.position.set(0, -9999, 0);
      mesh.visible = false;
      this.containerGroup.add(mesh);
      this.fragmentPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        rotVelocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.2,
        active: false,
      });
    }

    // 8 pooled expanding shockwave rings
    const ringGeo = new THREE.RingGeometry(0.6, 1.2, 32);
    for (let i = 0; i < 8; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.set(0, -9999, 0);
      mesh.visible = false;
      this.containerGroup.add(mesh);
      this.shockwavePool.push({
        mesh,
        scale: 1,
        maxScale: 14,
        opacity: 0.8,
        active: false,
      });
    }
  }

  // Apply colors and shape styles from user's customization
  public applyCustomization() {
    let coreColor = new THREE.Color(this.customization.coreColor);
    let outerColor = new THREE.Color(this.customization.outerColor);
    const partColor = new THREE.Color(this.customization.particleColor);

    // Style adjustments based on Beam Type
    switch (this.customization.type) {
      case 'VOID':
        // Dark central core surrounded by intense violet glow
        coreColor = new THREE.Color('#0a0214');
        break;
      case 'PHOTON':
        // Blinding white core
        coreColor = new THREE.Color('#ffffff');
        break;
      case 'LASER':
        // Concentrated laser
        break;
      case 'ARC':
        // Electric arc
        break;
      case 'PLASMA':
        // Superheated plasma
        break;
    }

    this.innerCoreMaterial.color = coreColor;
    this.outerGlowMaterial.color = outerColor;
    this.spiralMaterial.color = outerColor;
    this.muzzleFlashMaterial.color = outerColor;
    this.impactPointMaterial.color = outerColor;

    if (this.sparkPoints.material instanceof THREE.PointsMaterial) {
      this.sparkPoints.material.color = partColor;
    }

    // Shape radius adjustments
    let coreRadius = 0.12 * this.customization.trailWidth;
    let outerRadius = 0.42 * this.customization.outerGlow;

    switch (this.customization.coreShape) {
      case 'THIN':
        coreRadius *= 0.55;
        outerRadius *= 0.65;
        break;
      case 'WIDE':
        coreRadius *= 1.7;
        outerRadius *= 1.5;
        break;
      case 'DOUBLE':
      case 'TRIPLE':
        coreRadius *= 0.9;
        outerRadius *= 1.0;
        break;
      case 'PULSING':
      case 'SPIRAL':
      case 'SEGMENTED':
        outerRadius *= 1.4;
        break;
    }

    this.innerCoreMesh.scale.set(coreRadius, coreRadius, 1);
    this.outerGlowMesh.scale.set(outerRadius, outerRadius, 1);
    this.spiralMesh.scale.set(outerRadius * 1.3, outerRadius * 1.3, 1);

    if (this.secondaryCoreMeshLeft) {
      this.secondaryCoreMeshLeft.scale.set(coreRadius * 0.85, coreRadius * 0.85, 1);
      this.secondaryCoreMeshRight.scale.set(coreRadius * 0.85, coreRadius * 0.85, 1);
      this.secondaryGlowMeshLeft.scale.set(outerRadius * 0.85, outerRadius * 0.85, 1);
      this.secondaryGlowMeshRight.scale.set(outerRadius * 0.85, outerRadius * 0.85, 1);
    }
  }

  // Detect and update target lock within forward ray/cone
  public updateTargeting(
    emitterWorldPos: THREE.Vector3,
    shipForward: THREE.Vector3,
    obstacles: Obstacle[]
  ): TargetLockInfo | null {
    const maxRange = this.getEffectiveRange();
    // Targeting cone angle widens with upgrade level: 14 deg up to 26 deg
    const maxAngleRad = THREE.MathUtils.degToRad(14 + this.upgrades.targeting * 2.4);

    let closestDist = maxRange;
    let bestObstacle: Obstacle | null = null;

    const toObstacle = new THREE.Vector3();

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.isDestroyed || obs.health <= 0) continue;

      toObstacle.subVectors(obs.position, emitterWorldPos);
      const dist = toObstacle.length();

      // Outside maximum weapon range or behind ship
      if (dist > maxRange || dist < 2) continue;

      toObstacle.normalize();
      const dot = shipForward.dot(toObstacle);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

      if (angle <= maxAngleRad) {
        if (dist < closestDist) {
          closestDist = dist;
          bestObstacle = obs;
        }
      }
    }

    if (bestObstacle) {
      this.lockedObstacle = bestObstacle;
      this.currentTargetLock = {
        hasTarget: true,
        targetId: bestObstacle.id,
        targetType: bestObstacle.type,
        health: Math.max(0, bestObstacle.health),
        maxHealth: bestObstacle.maxHealth,
        distance: Math.round(closestDist),
      };

      // Play lock tone if newly locked
      if (this.lastLockedId !== bestObstacle.id) {
        this.lastLockedId = bestObstacle.id;
        sound.playTargetLocked();
      }
    } else {
      this.lockedObstacle = null;
      this.currentTargetLock = null;
      this.lastLockedId = null;
    }

    return this.currentTargetLock;
  }

  // Trigger beam firing cycle (called when user presses E / RMB / Mobile ⚡ button)
  public fireBeam(
    emitterWorldPos: THREE.Vector3,
    shipForward: THREE.Vector3,
    dt: number,
    onAsteroidDestroyed?: (obstacle: Obstacle, points: number, credits: number) => void
  ) {
    if (this.isOverheated) {
      return;
    }

    if (this.energy <= 4) {
      this.isFiring = false;
      return;
    }

    this.isFiring = true;

    // Energy drain: 22 energy/sec scaled by mode multiplier
    const drainRate = 22 * this.modeConfig.beamEnergyMultiplier;
    this.energy = Math.max(0, this.energy - drainRate * dt);

    // Heat accumulation: 20 heat/sec
    this.heat = Math.min(100, this.heat + 20 * dt);

    if (this.heat >= 100) {
      this.isOverheated = true;
      this.overheatCooldownTimer = 3.5;
      this.isFiring = false;
      sound.playBeamOverheat();
      this.stopHum();
      return;
    }

    // Audio hum & fire pulse
    if (!this.isHummingAudio) {
      sound.startBeamHum(this.customization.soundPreset);
      sound.playBeamFire(this.customization.type, this.customization.soundPreset);
      this.isHummingAudio = true;
    }

    // Recoil kickback on ship
    this.recoilOffset.set(0, 0, 0.08 + Math.random() * 0.04);
    this.screenShakeIntensity = Math.min(0.25, this.screenShakeIntensity + 0.06);

    // Raycast target hit calculation
    const maxRange = this.getEffectiveRange();
    let hitDistance = maxRange;
    let hitPoint = emitterWorldPos.clone().add(shipForward.clone().multiplyScalar(maxRange));

    if (this.lockedObstacle && !this.lockedObstacle.isDestroyed) {
      hitDistance = emitterWorldPos.distanceTo(this.lockedObstacle.position);
      hitPoint.copy(this.lockedObstacle.position);

      // Apply damage tick (scaled by fireRate upgrade)
      const damageTickCadence = 0.08 / (1 + this.upgrades.fireRate * 0.15);
      this.fireTickTimer += dt;

      if (this.fireTickTimer >= damageTickCadence) {
        this.fireTickTimer = 0;
        const damage = (this.getBaseDamage() * damageTickCadence);
        this.lockedObstacle.health -= damage;
        this.lockedObstacle.crackLevel = Math.min(
          1.0,
          1.0 - this.lockedObstacle.health / this.lockedObstacle.maxHealth
        );
        this.lockedObstacle.hitFlashTimer = 0.12;

        // Sound impact
        sound.playBeamImpact(this.customization.impactPreset);
        sound.playAsteroidHitCrack();

        // Spawn hit sparks
        this.spawnSparks(hitPoint, shipForward, 6);

        // Check destruction
        if (this.lockedObstacle.health <= 0 && !this.lockedObstacle.isDestroyed) {
          this.destroyObstacle(this.lockedObstacle, onAsteroidDestroyed);
        }
      }
    } else {
      // Free firing into space: spawn ambient beam discharge sparks along path
      if (Math.random() < 0.4) {
        const midPoint = emitterWorldPos
          .clone()
          .add(shipForward.clone().multiplyScalar(hitDistance * Math.random()));
        this.spawnSparks(midPoint, shipForward, 2);
      }
    }

    // Update 3D Beam Geometry
    this.renderActiveBeam(emitterWorldPos, shipForward, hitDistance, hitPoint);
  }

  // Cease beam firing
  public ceaseFire() {
    this.isFiring = false;
    this.stopHum();
    this.innerCoreMesh.visible = false;
    this.outerGlowMesh.visible = false;
    this.spiralMesh.visible = false;
    this.muzzleFlashMesh.visible = false;
    this.impactPointMesh.visible = false;
    if (this.secondaryCoreMeshLeft) {
      this.secondaryCoreMeshLeft.visible = false;
      this.secondaryCoreMeshRight.visible = false;
      this.secondaryGlowMeshLeft.visible = false;
      this.secondaryGlowMeshRight.visible = false;
    }
  }

  private stopHum() {
    if (this.isHummingAudio) {
      sound.stopBeamHum();
      this.isHummingAudio = false;
    }
  }

  // Update loop for energy recharge, heat dissipation, particles, fragments, and recoil
  public update(dt: number) {
    // 1. Heat Dissipation
    if (this.heat > 0 && !this.isFiring) {
      // Cooling upgrade accelerates cooldown: 28 to 58/sec
      const coolingRate = 28 + this.upgrades.cooling * 6;
      this.heat = Math.max(0, this.heat - coolingRate * dt);
    }

    // 2. Overheat Recovery Lockout
    if (this.isOverheated) {
      this.overheatCooldownTimer -= dt;
      if (this.overheatCooldownTimer <= 0 && this.heat <= 15) {
        this.isOverheated = false;
        sound.playBeamCooldownReady();
      }
    }

    // 3. Energy Recharge
    if (!this.isFiring && this.energy < this.maxEnergy) {
      // Recharge rate: 30 to 60 energy/sec with upgrades
      const rechargeRate = 30 + this.upgrades.rechargeRate * 6;
      this.energy = Math.min(this.maxEnergy, this.energy + rechargeRate * dt);
    }

    // 4. Combo Timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
      }
    }

    // 5. Dampen Recoil & Screen Shake
    this.recoilOffset.multiplyScalar(Math.pow(0.1, dt * 5));
    this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - dt * 1.8);

    // 6. Update Sparks
    this.updateSparks(dt);

    // 7. Update Shattered Asteroid Fragments
    this.updateFragments(dt);

    // 8. Update Shockwaves
    this.updateShockwaves(dt);
  }

  // Align and scale the beam meshes from weapon emitter to impact point
  private renderActiveBeam(
    emitterPos: THREE.Vector3,
    forward: THREE.Vector3,
    distance: number,
    hitPoint: THREE.Vector3
  ) {
    this.innerCoreMesh.visible = true;
    this.outerGlowMesh.visible = true;
    this.spiralMesh.visible = this.customization.energyStreaks;
    this.muzzleFlashMesh.visible = true;
    this.impactPointMesh.visible = this.lockedObstacle !== null;

    // Position container at emitter
    this.innerCoreMesh.position.copy(emitterPos);
    this.outerGlowMesh.position.copy(emitterPos);
    this.spiralMesh.position.copy(emitterPos);
    this.muzzleFlashMesh.position.copy(emitterPos);

    // Orient toward hit point
    this.innerCoreMesh.lookAt(hitPoint);
    this.outerGlowMesh.lookAt(hitPoint);
    this.spiralMesh.lookAt(hitPoint);
    this.muzzleFlashMesh.lookAt(hitPoint);

    // Lateral beam offsets for DOUBLE and TRIPLE shapes
    const isDouble = this.customization.coreShape === 'DOUBLE';
    const isTriple = this.customization.coreShape === 'TRIPLE';

    if (this.secondaryCoreMeshLeft && this.secondaryGlowMeshLeft) {
      if (isDouble || isTriple) {
        const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.innerCoreMesh.quaternion);
        const offsetDist = isDouble ? 0.28 : 0.38;

        this.secondaryCoreMeshLeft.visible = true;
        this.secondaryGlowMeshLeft.visible = true;
        this.secondaryCoreMeshLeft.position.copy(emitterPos).add(rightVec.clone().multiplyScalar(-offsetDist));
        this.secondaryGlowMeshLeft.position.copy(this.secondaryCoreMeshLeft.position);
        this.secondaryCoreMeshLeft.quaternion.copy(this.innerCoreMesh.quaternion);
        this.secondaryGlowMeshLeft.quaternion.copy(this.outerGlowMesh.quaternion);
        this.secondaryCoreMeshLeft.scale.z = distance;
        this.secondaryGlowMeshLeft.scale.z = distance;

        if (isTriple) {
          this.secondaryCoreMeshRight.visible = true;
          this.secondaryGlowMeshRight.visible = true;
          this.secondaryCoreMeshRight.position.copy(emitterPos).add(rightVec.clone().multiplyScalar(offsetDist));
          this.secondaryGlowMeshRight.position.copy(this.secondaryCoreMeshRight.position);
          this.secondaryCoreMeshRight.quaternion.copy(this.innerCoreMesh.quaternion);
          this.secondaryGlowMeshRight.quaternion.copy(this.outerGlowMesh.quaternion);
          this.secondaryCoreMeshRight.scale.z = distance;
          this.secondaryGlowMeshRight.scale.z = distance;
        } else {
          this.secondaryCoreMeshRight.visible = false;
          this.secondaryGlowMeshRight.visible = false;
        }
      } else {
        this.secondaryCoreMeshLeft.visible = false;
        this.secondaryCoreMeshRight.visible = false;
        this.secondaryGlowMeshLeft.visible = false;
        this.secondaryGlowMeshRight.visible = false;
      }
    }

    // Scale length along Z
    this.innerCoreMesh.scale.z = distance;
    this.outerGlowMesh.scale.z = distance;
    this.spiralMesh.scale.z = distance;

    // Spiral rotation animation
    if (this.customization.noiseMovement) {
      const rotDelta = this.customization.type === 'ARC'
        ? (Math.random() - 0.5) * 1.8
        : 0.25 * this.customization.pulseSpeed;
      this.spiralMesh.rotation.z += rotDelta;
    }

    // Pulsing brightness / scale effect
    const pulseFactor = 1.0 + Math.sin(Date.now() * 0.02 * this.customization.pulseSpeed) * 0.15;
    this.innerCoreMaterial.opacity = 0.95 * pulseFactor;
    this.outerGlowMaterial.opacity = 0.55 * pulseFactor;

    // Impact Point Mesh
    if (this.impactPointMesh.visible) {
      this.impactPointMesh.position.copy(hitPoint);
      const impactScale = (0.7 + Math.random() * 0.5) * this.customization.outerGlow;
      this.impactPointMesh.scale.set(impactScale, impactScale, impactScale);
    }
  }

  // Destroy asteroid sequence
  private destroyObstacle(
    obstacle: Obstacle,
    onAsteroidDestroyed?: (obstacle: Obstacle, points: number, credits: number) => void
  ) {
    obstacle.isDestroyed = true;
    obstacle.health = 0;

    // Sound destruction
    sound.playAsteroidDestroy(obstacle.type);

    // Trigger Camera Shake
    this.screenShakeIntensity = obstacle.type === 'LARGE' ? 0.45 : 0.3;

    // Award VC & Points
    let points = 250;
    let credits = 100;

    switch (obstacle.type) {
      case 'SMALL':
        points = 200;
        credits = 75;
        break;
      case 'MEDIUM':
        points = 350;
        credits = 125;
        break;
      case 'LARGE':
        points = 600;
        credits = 250;
        break;
      case 'ARMORED':
        points = 800;
        credits = 350;
        break;
      case 'ENERGY':
        points = 500;
        credits = 200;
        // Energy asteroid restores 40 beam energy!
        this.energy = Math.min(this.maxEnergy, this.energy + 40);
        sound.playBeamCooldownReady();
        break;
    }

    // Update Combo Tracker
    this.comboCount++;
    this.comboMultiplier = Math.min(4.0, 1.0 + (this.comboCount - 1) * 0.25);
    this.comboTimer = 3.5;
    const finalPoints = Math.round(points * this.comboMultiplier);
    const finalCredits = Math.round(credits * (1.0 + (this.comboCount - 1) * 0.15));

    // Shatter into fragments
    this.spawnFragments(obstacle.position, obstacle.radius, obstacle.type);

    // Spawn expanding shockwave ring
    if (this.customization.shockwaveEnabled) {
      this.spawnShockwave(obstacle.position, obstacle.radius);
    }

    // Callback to HUD & Player stats
    onAsteroidDestroyed?.(obstacle, finalPoints, finalCredits);
  }

  // Spawn rock fragments from pool
  private spawnFragments(
    center: THREE.Vector3,
    radius: number,
    type: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ARMORED' | 'ENERGY'
  ) {
    const fragmentCount = type === 'LARGE' ? 12 : type === 'MEDIUM' ? 8 : 5;
    const forceMultiplier = 1.0 + this.upgrades.impactForce * 0.2;

    let spawned = 0;
    for (let i = 0; i < this.fragmentPool.length && spawned < fragmentCount; i++) {
      const frag = this.fragmentPool[i];
      if (!frag.active) {
        frag.active = true;
        frag.life = 0;
        frag.maxLife = 1.2 + Math.random() * 0.6;
        frag.mesh.visible = true;
        frag.mesh.position.copy(center);

        // Scale fragment based on asteroid radius
        const scale = (0.3 + Math.random() * 0.5) * (radius / 3.0);
        frag.mesh.scale.set(scale, scale, scale);

        // Random outward velocity
        frag.velocity.set(
          (Math.random() - 0.5) * 28 * forceMultiplier,
          (Math.random() - 0.5) * 22 * forceMultiplier,
          (Math.random() - 0.5) * 28 * forceMultiplier
        );

        // Tumble rotation
        frag.rotVelocity.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        );

        // Special color for Energy asteroids
        if (type === 'ENERGY' && frag.mesh.material instanceof THREE.MeshStandardMaterial) {
          frag.mesh.material.emissive.setHex(0x00f0ff);
        } else if (frag.mesh.material instanceof THREE.MeshStandardMaterial) {
          frag.mesh.material.emissive.setHex(0x112233);
        }

        spawned++;
      }
    }
  }

  // Spawn expanding shockwave
  private spawnShockwave(center: THREE.Vector3, radius: number) {
    for (let i = 0; i < this.shockwavePool.length; i++) {
      const sw = this.shockwavePool[i];
      if (!sw.active) {
        sw.active = true;
        sw.scale = 0.5;
        sw.maxScale = radius * 3.8;
        sw.opacity = 0.85;
        sw.mesh.visible = true;
        sw.mesh.position.copy(center);
        sw.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        break;
      }
    }
  }

  // Spawn spark particles from pool
  private spawnSparks(origin: THREE.Vector3, dir: THREE.Vector3, count: number) {
    let spawned = 0;
    for (let i = 0; i < this.MAX_SPARKS && spawned < count; i++) {
      if (this.sparkLifetimes[i] <= 0) {
        this.sparkPositions[i * 3] = origin.x + (Math.random() - 0.5) * 0.6;
        this.sparkPositions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.6;
        this.sparkPositions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.6;

        this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 16 - dir.x * 4;
        this.sparkVelocities[i * 3 + 1] = (Math.random() - 0.5) * 16 - dir.y * 4;
        this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 16 - dir.z * 4;

        this.sparkLifetimes[i] = 0.35 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  // Update active sparks
  private updateSparks(dt: number) {
    let needsUpdate = false;
    for (let i = 0; i < this.MAX_SPARKS; i++) {
      if (this.sparkLifetimes[i] > 0) {
        this.sparkLifetimes[i] -= dt;

        this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * dt;
        this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
        this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * dt;

        if (this.sparkLifetimes[i] <= 0) {
          this.sparkPositions[i * 3 + 1] = -9999;
        }
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.sparkGeo.attributes.position.needsUpdate = true;
    }
  }

  // Update active rock fragments
  private updateFragments(dt: number) {
    for (let i = 0; i < this.fragmentPool.length; i++) {
      const frag = this.fragmentPool[i];
      if (frag.active) {
        frag.life += dt;
        if (frag.life >= frag.maxLife) {
          frag.active = false;
          frag.mesh.visible = false;
          frag.mesh.position.set(0, -9999, 0);
          continue;
        }

        // Apply velocity & rotation
        frag.mesh.position.addScaledVector(frag.velocity, dt);
        frag.mesh.rotation.x += frag.rotVelocity.x * dt;
        frag.mesh.rotation.y += frag.rotVelocity.y * dt;
        frag.mesh.rotation.z += frag.rotVelocity.z * dt;

        // Fade out
        const alpha = Math.max(0, 1.0 - frag.life / frag.maxLife);
        if (frag.mesh.material instanceof THREE.MeshStandardMaterial) {
          frag.mesh.material.opacity = alpha;
          frag.mesh.material.transparent = true;
        }
      }
    }
  }

  // Update active shockwaves
  private updateShockwaves(dt: number) {
    for (let i = 0; i < this.shockwavePool.length; i++) {
      const sw = this.shockwavePool[i];
      if (sw.active) {
        sw.scale += (sw.maxScale - sw.scale) * (8 * dt);
        sw.mesh.scale.set(sw.scale, sw.scale, sw.scale);

        sw.opacity = Math.max(0, sw.opacity - 1.6 * dt);
        if (sw.mesh.material instanceof THREE.MeshBasicMaterial) {
          sw.mesh.material.opacity = sw.opacity;
        }

        if (sw.opacity <= 0.05 || sw.scale >= sw.maxScale * 0.95) {
          sw.active = false;
          sw.mesh.visible = false;
          sw.mesh.position.set(0, -9999, 0);
        }
      }
    }
  }

  // Telemetry packet for HUD
  public getTelemetry(): BeamTelemetry {
    let status: BeamStatus = 'READY';
    if (this.isOverheated) {
      status = 'OVERHEATED';
    } else if (this.isFiring) {
      status = 'FIRING';
    } else if (this.energy <= 10) {
      status = 'DEPLETED';
    } else if (this.energy < 25) {
      status = 'LOW_ENERGY';
    } else if (this.energy < this.maxEnergy) {
      status = 'RECHARGING';
    }

    return {
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      heat: this.heat,
      isOverheated: this.isOverheated,
      status,
      targetLock: this.currentTargetLock,
      activeBeam: this.isFiring,
      isFiring: this.isFiring,
      cooldownRemaining: Math.max(0, this.overheatCooldownTimer),
      hasTargetLock: this.currentTargetLock !== null,
      targetHealth: this.currentTargetLock ? this.currentTargetLock.health : 0,
      targetMaxHealth: this.currentTargetLock ? this.currentTargetLock.maxHealth : 100,
      targetDistance: this.currentTargetLock ? this.currentTargetLock.distance : 0,
      targetType: this.currentTargetLock ? this.currentTargetLock.targetType : '',
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      comboTimeRemaining: Math.max(0, this.comboTimer),
    };
  }

  // Dispose all 3D geometries and materials
  public dispose() {
    this.stopHum();
    this.innerCoreGeoDispose();
  }

  private innerCoreGeoDispose() {
    this.innerCoreMesh?.geometry?.dispose();
    this.innerCoreMaterial?.dispose();
    this.secondaryCoreMeshLeft?.geometry?.dispose();
    this.secondaryCoreMeshRight?.geometry?.dispose();
    this.outerGlowMesh?.geometry?.dispose();
    this.outerGlowMaterial?.dispose();
    this.secondaryGlowMeshLeft?.geometry?.dispose();
    this.secondaryGlowMeshRight?.geometry?.dispose();
    this.spiralMesh?.geometry?.dispose();
    this.spiralMaterial?.dispose();
    this.muzzleFlashMesh?.geometry?.dispose();
    this.muzzleFlashMaterial?.dispose();
    this.impactPointMesh?.geometry?.dispose();
    this.impactPointMaterial?.dispose();
    this.sparkGeo?.dispose();
  }
}
