import * as THREE from 'three';

export type SingularityPhase =
  | 'RACING'
  | 'GRAVITY_SURGE'
  | 'SINGULARITY_INSTABILITY'
  | 'COLLAPSE'
  | 'ESCAPE'
  | 'FINISH';

export interface SingularityTelemetry {
  phase: SingularityPhase;
  distanceToHorizon: number;
  gravityPull: number;
  slingshotActive: boolean;
  slingshotMultiplier: number;
  escapePortalActive: boolean;
  escapePortalDistance: number;
  timeRemaining: number;
  warningAlert: string | null;
}

/**
 * 01 — SINGULARITY RUN
 * Exclusive Black Hole Systems:
 * - BlackHoleManager
 * - GravityFieldManager
 * - EventHorizonManager
 * - GravityWaveManager
 * - SlingshotManager
 * - GravityZoneManager
 * - GravityShieldManager
 * - AccretionDiskManager
 * - BlackHoleHazardManager
 * - BlackHoleRespawnManager
 * 
 * NOTE: These systems are ONLY active during Mode 01 (SINGULARITY_RUN).
 */

export class AccretionDiskManager {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private rotationSpeed = 0.8;

  constructor(scene: THREE.Scene, radius: number = 380) {
    const geom = new THREE.RingGeometry(radius * 0.45, radius * 1.5, 64, 8);
    // Custom swirling accretion disk shader
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        innerColor: { value: new THREE.Color(0xff6600) },
        outerColor: { value: new THREE.Color(0x9900ff) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 innerColor;
        uniform vec3 outerColor;
        varying vec2 vUv;
        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float spiral = sin(angle * 6.0 + dist * 10.0 - time * 3.0) * 0.5 + 0.5;
          float alpha = smoothstep(0.1, 0.4, dist) * smoothstep(1.0, 0.6, dist) * (0.6 + 0.4 * spiral);
          vec3 col = mix(innerColor, outerColor, dist);
          col += vec3(1.0, 0.8, 0.3) * pow(spiral, 3.0) * 0.8;
          gl_FragColor = vec4(col, alpha * 0.85);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.rotation.x = Math.PI / 2.3;
    scene.add(this.mesh);
  }

  public update(dt: number) {
    this.material.uniforms.time.value += dt * this.rotationSpeed;
    this.mesh.rotation.z += dt * 0.25;
  }

  public setIntensity(instability: number) {
    this.rotationSpeed = 0.8 + instability * 1.8;
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

export class EventHorizonManager {
  public mesh: THREE.Mesh;
  public horizonRadius: number;
  private pulseTimer = 0;

  constructor(scene: THREE.Scene, radius: number = 140) {
    this.horizonRadius = radius;
    const geom = new THREE.SphereGeometry(radius, 48, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: false,
    });
    this.mesh = new THREE.Mesh(geom, mat);

    // Glow boundary aura
    const auraGeom = new THREE.SphereGeometry(radius * 1.05, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x9900ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const aura = new THREE.Mesh(auraGeom, auraMat);
    this.mesh.add(aura);

    scene.add(this.mesh);
  }

  public update(dt: number, phase: SingularityPhase) {
    this.pulseTimer += dt;
    const scale = 1.0 + Math.sin(this.pulseTimer * 3) * (phase === 'COLLAPSE' ? 0.08 : 0.02);
    this.mesh.scale.set(scale, scale, scale);
  }

  public isConsumed(shipPos: THREE.Vector3, center: THREE.Vector3): boolean {
    return shipPos.distanceTo(center) < this.horizonRadius;
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
  }
}

export class GravityFieldManager {
  public center: THREE.Vector3;
  public baseG: number;

  constructor(center: THREE.Vector3 = new THREE.Vector3(0, -60, 0), baseG: number = 450) {
    this.center = center;
    this.baseG = baseG;
  }

  public calculatePull(shipPos: THREE.Vector3, phaseMultiplier: number = 1.0): THREE.Vector3 {
    const toCenter = this.center.clone().sub(shipPos);
    const dist = Math.max(120, toCenter.length());
    const force = (this.baseG * phaseMultiplier * 1000) / (dist * dist);
    return toCenter.normalize().multiplyScalar(Math.min(force, 38));
  }
}

export class GravityWaveManager {
  private waves: THREE.Mesh[] = [];
  private waveTimer = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(dt: number, center: THREE.Vector3, surgeActive: boolean) {
    this.waveTimer += dt;
    if (surgeActive && this.waveTimer > 2.5) {
      this.waveTimer = 0;
      this.spawnWave(center);
    }

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.scale.addScalar(dt * 3.5);
      const mat = wave.material as THREE.MeshBasicMaterial;
      mat.opacity -= dt * 0.45;
      if (mat.opacity <= 0) {
        this.scene.remove(wave);
        wave.geometry.dispose();
        mat.dispose();
        this.waves.splice(i, 1);
      }
    }
  }

  private spawnWave(center: THREE.Vector3) {
    const geom = new THREE.RingGeometry(140, 160, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const wave = new THREE.Mesh(geom, mat);
    wave.position.copy(center);
    wave.rotation.x = Math.PI / 2;
    this.scene.add(wave);
    this.waves.push(wave);
  }

  public dispose() {
    this.waves.forEach(w => {
      this.scene.remove(w);
      w.geometry.dispose();
    });
    this.waves = [];
  }
}

export class SlingshotManager {
  public slingshotActive = false;
  public slingshotMultiplier = 1.0;
  private alignmentBonusTimer = 0;

  public evaluateSlingshot(
    shipVelocity: THREE.Vector3,
    toSingularity: THREE.Vector3,
    tangentVelocity: number
  ): number {
    // Slingshot occurs when ship slings around the gravity curve tangentially
    const angle = shipVelocity.angleTo(toSingularity);
    const isPerpendicular = Math.abs(angle - Math.PI / 2) < 0.35;

    if (isPerpendicular && tangentVelocity > 180) {
      this.slingshotActive = true;
      this.slingshotMultiplier = 1.45;
      this.alignmentBonusTimer = 1.5;
      return 1.45;
    }

    if (this.alignmentBonusTimer > 0) {
      this.alignmentBonusTimer -= 0.016;
      return 1.25;
    }

    this.slingshotActive = false;
    this.slingshotMultiplier = 1.0;
    return 1.0;
  }
}

export class GravityZoneManager {
  public zones: { radius: number; color: number; label: string }[] = [
    { radius: 600, color: 0x00f0ff, label: 'OUTER GRAVITATIONAL SHELF' },
    { radius: 400, color: 0xffaa00, label: 'ACCRETION DRAG ZONE' },
    { radius: 240, color: 0xff0055, label: 'EVENT HORIZON PERIMETER' },
  ];

  public getCurrentZone(distance: number): string {
    for (const z of this.zones) {
      if (distance < z.radius) return z.label;
    }
    return 'STABLE SPACE';
  }
}

export class GravityShieldManager {
  public shieldActive = true;
  public shieldCharge = 100;

  public update(dt: number, pullForce: number) {
    if (pullForce > 20) {
      this.shieldCharge = Math.max(0, this.shieldCharge - dt * 8);
    } else {
      this.shieldCharge = Math.min(100, this.shieldCharge + dt * 12);
    }
  }
}

export class BlackHoleHazardManager {
  private hazards: THREE.Mesh[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnInstabilityDebris(center: THREE.Vector3, count: number = 24) {
    for (let i = 0; i < count; i++) {
      const geom = new THREE.DodecahedronGeometry(3 + Math.random() * 5);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x221133,
        emissive: 0x660099,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geom, mat);
      const angle = (i / count) * Math.PI * 2;
      const r = 260 + Math.random() * 180;
      mesh.position.set(
        center.x + Math.cos(angle) * r,
        center.y + (Math.random() - 0.5) * 40,
        center.z + Math.sin(angle) * r
      );
      this.scene.add(mesh);
      this.hazards.push(mesh);
    }
  }

  public update(dt: number) {
    this.hazards.forEach(h => {
      h.rotation.x += dt * 0.5;
      h.rotation.y += dt * 0.8;
    });
  }

  public dispose() {
    this.hazards.forEach(h => {
      this.scene.remove(h);
      h.geometry.dispose();
    });
    this.hazards = [];
  }
}

export class BlackHoleRespawnManager {
  public findSafeRespawnPosition(center: THREE.Vector3, safeRadius: number = 420): THREE.Vector3 {
    return new THREE.Vector3(center.x + safeRadius, center.y + 10, center.z);
  }
}

/**
 * Master Controller for Mode 01 (SINGULARITY_RUN)
 */
export class BlackHoleManager {
  public scene: THREE.Scene;
  public accretionDisk: AccretionDiskManager;
  public eventHorizon: EventHorizonManager;
  public gravityField: GravityFieldManager;
  public gravityWaves: GravityWaveManager;
  public slingshot: SlingshotManager;
  public gravityZone: GravityZoneManager;
  public gravityShield: GravityShieldManager;
  public hazardManager: BlackHoleHazardManager;
  public respawnManager: BlackHoleRespawnManager;

  public currentPhase: SingularityPhase = 'RACING';
  public phaseTimer = 0;
  public escapePortal: THREE.Mesh | null = null;
  public escapePortalPosition = new THREE.Vector3(0, 0, -850);
  public isEscapeOpen = false;

  constructor(scene: THREE.Scene, center = new THREE.Vector3(0, -40, 0)) {
    this.scene = scene;
    this.gravityField = new GravityFieldManager(center);
    this.eventHorizon = new EventHorizonManager(scene, 130);
    this.accretionDisk = new AccretionDiskManager(scene, 420);
    this.gravityWaves = new GravityWaveManager(scene);
    this.slingshot = new SlingshotManager();
    this.gravityZone = new GravityZoneManager();
    this.gravityShield = new GravityShieldManager();
    this.hazardManager = new BlackHoleHazardManager(scene);
    this.respawnManager = new BlackHoleRespawnManager();

    this.createEscapePortal();
  }

  private createEscapePortal() {
    const geom = new THREE.TorusGeometry(32, 4, 24, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
    });
    this.escapePortal = new THREE.Mesh(geom, mat);
    this.escapePortal.position.copy(this.escapePortalPosition);
    this.escapePortal.visible = false;
    this.scene.add(this.escapePortal);
  }

  public update(dt: number, shipPos: THREE.Vector3, currentSpeed: number): {
    gravityForce: THREE.Vector3;
    slingshotMult: number;
    telemetry: SingularityTelemetry;
    isConsumed: boolean;
    escaped: boolean;
  } {
    this.phaseTimer += dt;
    const center = this.gravityField.center;
    const distToCenter = shipPos.distanceTo(center);
    const distToHorizon = distToCenter - this.eventHorizon.horizonRadius;

    // Phase Progression
    if (this.phaseTimer < 18) {
      this.currentPhase = 'RACING';
    } else if (this.phaseTimer < 34) {
      this.currentPhase = 'GRAVITY_SURGE';
    } else if (this.phaseTimer < 52) {
      this.currentPhase = 'SINGULARITY_INSTABILITY';
      if (this.phaseTimer - dt < 34) {
        this.hazardManager.spawnInstabilityDebris(center, 28);
      }
    } else if (this.phaseTimer < 68) {
      this.currentPhase = 'COLLAPSE';
      this.isEscapeOpen = true;
      if (this.escapePortal) this.escapePortal.visible = true;
    } else {
      this.currentPhase = 'ESCAPE';
    }

    // Instability intensity
    const inst = this.currentPhase === 'COLLAPSE' ? 1.0 : this.currentPhase === 'SINGULARITY_INSTABILITY' ? 0.6 : 0.2;
    this.accretionDisk.setIntensity(inst);
    this.accretionDisk.update(dt);
    this.eventHorizon.update(dt, this.currentPhase);
    this.gravityWaves.update(dt, center, this.currentPhase === 'GRAVITY_SURGE' || this.currentPhase === 'COLLAPSE');
    this.hazardManager.update(dt);

    if (this.escapePortal && this.escapePortal.visible) {
      this.escapePortal.rotation.z += dt * 1.5;
    }

    // Gravity calculation
    const mult = this.currentPhase === 'COLLAPSE' ? 1.6 : this.currentPhase === 'GRAVITY_SURGE' ? 1.3 : 1.0;
    const gravityForce = this.gravityField.calculatePull(shipPos, mult);
    this.gravityShield.update(dt, gravityForce.length());

    // Slingshot evaluation
    const toCenter = center.clone().sub(shipPos).normalize();
    const slingshotMult = this.slingshot.evaluateSlingshot(new THREE.Vector3(0, 0, 1), toCenter, currentSpeed);

    // Escape trigger
    const escaped = !!(this.isEscapeOpen && this.escapePortal && shipPos.distanceTo(this.escapePortal.position) < 45);
    const isConsumed = this.eventHorizon.isConsumed(shipPos, center);

    const telemetry: SingularityTelemetry = {
      phase: this.currentPhase,
      distanceToHorizon: Math.max(0, Math.floor(distToHorizon)),
      gravityPull: Math.floor(gravityForce.length() * 10),
      slingshotActive: this.slingshot.slingshotActive,
      slingshotMultiplier: this.slingshot.slingshotMultiplier,
      escapePortalActive: this.isEscapeOpen,
      escapePortalDistance: this.escapePortal ? Math.floor(shipPos.distanceTo(this.escapePortal.position)) : 0,
      timeRemaining: Math.max(0, Math.floor(90 - this.phaseTimer)),
      warningAlert:
        isConsumed
          ? 'EVENT HORIZON CONSUMPTION IMMINENT!'
          : distToHorizon < 80
          ? 'CRITICAL GRAVITATIONAL PULL // ENGAGE THRUSTERS'
          : null,
    };

    return { gravityForce, slingshotMult, telemetry, isConsumed, escaped };
  }

  public dispose() {
    this.accretionDisk.dispose(this.scene);
    this.eventHorizon.dispose(this.scene);
    this.gravityWaves.dispose();
    this.hazardManager.dispose();
    if (this.escapePortal) {
      this.scene.remove(this.escapePortal);
      this.escapePortal.geometry.dispose();
    }
  }
}


/**
 * Final Collapse support for Mode 21 / Submode 10 (THE FINAL COLLAPSE).
 *
 * This controller is intentionally additive: the existing Singularity Run
 * systems above are preserved unchanged. It provides the state/timing and
 * non-destructive collapse-front data needed by the Mode 21 integration.
 */
export type FinalCollapsePhase =
  | 'FIVE_MINUTE_RACE'
  | 'SINGULARITY_FAILURE'
  | 'CRITICAL_GRAVITATIONAL_INSTABILITY'
  | 'EVACUATION_PROTOCOL'
  | 'TRACK_COLLAPSE'
  | 'SPAGHETTIFICATION'
  | 'PLANETARY_COLLISION'
  | 'DESTRUCTION_FRONT'
  | 'EMERGENCY_ROUTE'
  | 'TOWER_ENTRY'
  | 'TOWER_SEALED'
  | 'FINAL_COLLAPSE'
  | 'SURVIVED';

export interface FinalCollapseTelemetry {
  phase: FinalCollapsePhase;
  raceTimeRemaining: number;
  collapseProgress: number;
  destructionFrontDistance: number;
  safeZoneActive: boolean;
  towerEntryActive: boolean;
  towerSealed: boolean;
  objective: string;
  warning: string | null;
}

export interface FinalCollapsePhysicalState {
  towerRoot: THREE.Group | null;
  towerEntrance: THREE.Mesh | null;
  blastDoor: THREE.Mesh | null;
  collapseFront: THREE.Mesh | null;
  safeZoneCenter: THREE.Vector3;
  safeZoneRadius: number;
  towerEntryRadius: number;
  towerSealed: boolean;
}

export class FinalCollapseManager {
  public phase: FinalCollapsePhase = 'FIVE_MINUTE_RACE';
  public elapsed = 0;
  public readonly raceDuration = 300;
  public collapseProgress = 0;
  public destructionFrontDistance = Number.POSITIVE_INFINITY;
  public safeZoneActive = false;
  public towerEntryActive = false;
  public towerSealed = false;

  private phaseTimer = 0;
  private physicalState: FinalCollapsePhysicalState = {
    towerRoot: null,
    towerEntrance: null,
    blastDoor: null,
    collapseFront: null,
    safeZoneCenter: new THREE.Vector3(0, 0, -900),
    safeZoneRadius: 18,
    towerEntryRadius: 28,
    towerSealed: false,
  };


  /**
   * Creates the physical Final Collapse shelter once. This is deliberately
   * disabled until Submode 10 explicitly calls initializePhysicalShelter().
   */
  public initializePhysicalShelter(scene: THREE.Scene, safeZoneCenter: THREE.Vector3): void {
    this.disposePhysicalShelter(scene);

    const root = new THREE.Group();
    root.name = 'FinalCollapse_EvacuationTower';
    root.position.copy(safeZoneCenter);

    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x17243a,
      emissive: 0x07101c,
      metalness: 0.85,
      roughness: 0.3,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2e8ca8,
      emissive: 0x063746,
      metalness: 0.9,
      roughness: 0.2,
    });

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(34, 42, 120, 12), towerMat);
    tower.position.y = 60;
    root.add(tower);

    const entrance = new THREE.Mesh(new THREE.BoxGeometry(34, 12, 20), frameMat);
    entrance.position.set(0, 6, 34);
    root.add(entrance);

    const basement = new THREE.Mesh(new THREE.BoxGeometry(28, 10, 34), towerMat);
    basement.position.set(0, 5, 20);
    root.add(basement);

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x10151e,
      emissive: 0x2a0610,
      metalness: 0.95,
      roughness: 0.22,
    });
    const blastDoor = new THREE.Mesh(new THREE.BoxGeometry(30, 9, 2.5), doorMat);
    blastDoor.position.set(0, 5, 30);
    root.add(blastDoor);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 18, 16),
      new THREE.MeshBasicMaterial({ color: 0x00eaff })
    );
    beacon.position.y = 129;
    root.add(beacon);

    scene.add(root);

    this.physicalState.towerRoot = root;
    this.physicalState.towerEntrance = entrance;
    this.physicalState.blastDoor = blastDoor;
    this.physicalState.safeZoneCenter.copy(safeZoneCenter);
    this.physicalState.towerSealed = false;
  }

  /** Returns true while the player is physically inside the tower basement. */
  public isPlayerInsideSafeZone(playerPosition: THREE.Vector3): boolean {
    const c = this.physicalState.safeZoneCenter;
    return Math.hypot(playerPosition.x - c.x, playerPosition.z - (c.z + 20)) <= this.physicalState.safeZoneRadius
      && playerPosition.y >= -2 && playerPosition.y <= 18;
  }

  /** Closes the physical blast door after the player reaches the basement. */
  public sealPhysicalShelter(): void {
    this.physicalState.towerSealed = true;
    const door = this.physicalState.blastDoor;
    if (door) door.position.z = 30;
  }

  public getPhysicalState(): FinalCollapsePhysicalState {
    return { ...this.physicalState };
  }

  public disposePhysicalShelter(scene: THREE.Scene): void {
    const root = this.physicalState.towerRoot;
    if (!root) return;
    scene.remove(root);
    root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => material.dispose());
      }
    });
    this.physicalState.towerRoot = null;
    this.physicalState.towerEntrance = null;
    this.physicalState.blastDoor = null;
  }

  public start() {
    this.phase = 'FIVE_MINUTE_RACE';
    this.elapsed = 0;
    this.phaseTimer = 0;
    this.collapseProgress = 0;
    this.destructionFrontDistance = Number.POSITIVE_INFINITY;
    this.safeZoneActive = false;
    this.towerEntryActive = false;
    this.towerSealed = false;
    this.physicalState.towerSealed = false;
  }

  /**
   * Advance the five-minute race clock. The catastrophe starts only when the
   * full 300-second race window has elapsed; no early automatic destruction
   * is introduced here.
   */
  public update(dt: number) {
    if (this.phase === 'SURVIVED') return;

    const delta = Math.max(0, dt);
    this.elapsed += delta;
    this.phaseTimer += delta;

    if (this.phase === 'FIVE_MINUTE_RACE' && this.elapsed >= this.raceDuration) {
      this.phase = 'SINGULARITY_FAILURE';
      this.phaseTimer = 0;
    }

    if (this.phase !== 'FIVE_MINUTE_RACE') {
      this.collapseProgress = THREE.MathUtils.clamp(
        this.collapseProgress + delta / 120,
        0,
        1
      );
    }

    if (this.phase === 'SINGULARITY_FAILURE' && this.phaseTimer >= 2) {
      this.phase = 'CRITICAL_GRAVITATIONAL_INSTABILITY';
      this.phaseTimer = 0;
    } else if (this.phase === 'CRITICAL_GRAVITATIONAL_INSTABILITY' && this.phaseTimer >= 2) {
      this.phase = 'EVACUATION_PROTOCOL';
      this.phaseTimer = 0;
    }
  }

  public beginTrackCollapse() {
    this.phase = 'TRACK_COLLAPSE';
    this.phaseTimer = 0;
  }

  public beginSpaghettification() {
    this.phase = 'SPAGHETTIFICATION';
    this.phaseTimer = 0;
  }

  public beginPlanetaryCollision() {
    this.phase = 'PLANETARY_COLLISION';
    this.phaseTimer = 0;
  }

  public beginDestructionFront(distance: number) {
    this.phase = 'DESTRUCTION_FRONT';
    this.phaseTimer = 0;
    this.destructionFrontDistance = Math.max(0, distance);
  }

  public updateDestructionFront(distance: number) {
    this.destructionFrontDistance = Math.max(0, distance);
  }

  public beginEmergencyRoute() {
    this.phase = 'EMERGENCY_ROUTE';
    this.phaseTimer = 0;
    this.safeZoneActive = true;
  }

  public beginTowerEntry() {
    this.phase = 'TOWER_ENTRY';
    this.phaseTimer = 0;
    this.safeZoneActive = true;
    this.towerEntryActive = true;
  }

  public sealTower() {
    this.phase = 'TOWER_SEALED';
    this.phaseTimer = 0;
    this.towerEntryActive = false;
    this.towerSealed = true;
    this.safeZoneActive = true;
    this.sealPhysicalShelter();
  }

  public beginFinalCollapse() {
    this.phase = 'FINAL_COLLAPSE';
    this.phaseTimer = 0;
    this.safeZoneActive = true;
    this.towerEntryActive = false;
    this.towerSealed = true;
  }

  public markSurvived() {
    this.phase = 'SURVIVED';
    this.phaseTimer = 0;
    this.safeZoneActive = true;
    this.towerEntryActive = false;
    this.towerSealed = true;
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.raceDuration - this.elapsed);
  }

  public getObjective(): string {
    if (this.phase === 'FIVE_MINUTE_RACE') return 'SURVIVE THE FIVE-MINUTE RACE';
    if (this.phase === 'SINGULARITY_FAILURE') return 'PREPARE FOR SINGULARITY FAILURE';
    if (this.phase === 'CRITICAL_GRAVITATIONAL_INSTABILITY') return 'ESCAPE THE GRAVITATIONAL INSTABILITY';
    if (this.phase === 'EVACUATION_PROTOCOL') return 'ALL RACERS — EVACUATE';
    if (this.phase === 'TOWER_ENTRY' || this.phase === 'EMERGENCY_ROUTE') return 'REACH THE SAFE ZONE';
    if (this.phase === 'TOWER_SEALED' || this.phase === 'FINAL_COLLAPSE' || this.phase === 'SURVIVED') return 'SAFE ZONE SECURED';
    return 'REACH THE SAFE ZONE';
  }

  public getWarning(): string | null {
    if (this.phase === 'SINGULARITY_FAILURE') return 'SINGULARITY FAILURE';
    if (this.phase === 'CRITICAL_GRAVITATIONAL_INSTABILITY') return 'CRITICAL GRAVITATIONAL INSTABILITY';
    if (this.phase === 'EVACUATION_PROTOCOL') return 'EVACUATION PROTOCOL ACTIVATED';
    if (this.phase === 'DESTRUCTION_FRONT') return 'DESTRUCTION FRONT APPROACHING';
    if (this.phase === 'FINAL_COLLAPSE') return 'THE FINAL COLLAPSE';
    return null;
  }

  public getTelemetry(): FinalCollapseTelemetry {
    return {
      phase: this.phase,
      raceTimeRemaining: Math.floor(this.getTimeRemaining()),
      collapseProgress: this.collapseProgress,
      destructionFrontDistance: this.destructionFrontDistance,
      safeZoneActive: this.safeZoneActive,
      towerEntryActive: this.towerEntryActive,
      towerSealed: this.towerSealed,
      objective: this.getObjective(),
      warning: this.getWarning(),
    };
  }
}
