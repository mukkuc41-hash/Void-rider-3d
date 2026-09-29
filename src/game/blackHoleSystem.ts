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

// =========================================================================
// MODE 21 — SUBMODE 10: THE FINAL COLLAPSE COSMIC VISUALS
// =========================================================================

/**
 * Supermassive Black Hole 3D Visual Asset:
 * Looming in deep space with event horizon, procedural plasma accretion disk,
 * photon ring, gravitational lensing, and accelerated collapse sequence.
 */
export class SupermassiveBlackHoleVisuals {
  public root: THREE.Group;
  public eventHorizonMesh: THREE.Mesh;
  public accretionMesh: THREE.Mesh;
  public photonRingMesh: THREE.Mesh;
  public gravitationalLensMesh: THREE.Mesh;
  public particles: THREE.Points;
  private accretionMaterial: THREE.ShaderMaterial;
  private rotationSpeed = 0.6;
  public instability = 0;
  public isCollapsing = false;
  private collapseProgress = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, position = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'SupermassiveBlackHole';
    this.root.position.copy(position);

    // 1. Pitch black Event Horizon
    const horizonGeo = new THREE.SphereGeometry(220, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.eventHorizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    this.root.add(this.eventHorizonMesh);

    // 2. High-energy Swirling Accretion Disk
    const diskGeo = new THREE.RingGeometry(240, 950, 80, 12);
    this.accretionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        speed: { value: 1.0 },
        instability: { value: 0.0 },
        innerColor: { value: new THREE.Color(0xff7700) },
        outerColor: { value: new THREE.Color(0x8a2be2) },
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
        uniform float speed;
        uniform float instability;
        uniform vec3 innerColor;
        uniform vec3 outerColor;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv - 0.5;
          float dist = length(p) * 2.0;
          float angle = atan(p.y, p.x);

          float spiral = sin(angle * 6.0 - time * 2.6 * speed + dist * 10.0);
          spiral += sin(angle * 3.0 + dist * 5.0 - time * 1.5 * speed) * 0.5;
          spiral = spiral * 0.5 + 0.5;

          float alpha = smoothstep(0.15, 0.35, dist) * smoothstep(1.0, 0.72, dist);
          alpha *= (0.65 + 0.35 * spiral + instability * 0.5);

          vec3 col = mix(innerColor, outerColor, dist);
          col += vec3(1.0, 0.85, 0.6) * pow(spiral, 2.5) * (0.8 + instability * 1.5);

          gl_FragColor = vec4(col, clamp(alpha * 0.95, 0.0, 1.0));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.accretionMesh = new THREE.Mesh(diskGeo, this.accretionMaterial);
    this.accretionMesh.rotation.x = Math.PI / 2.35;
    this.root.add(this.accretionMesh);

    // 3. Glowing Photon Ring at horizon perimeter
    const ringGeo = new THREE.RingGeometry(220, 245, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.photonRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.photonRingMesh.rotation.x = Math.PI / 2.35;
    this.root.add(this.photonRingMesh);

    // 4. Gravitational Lensing refraction halo
    const lensGeo = new THREE.SphereGeometry(260, 28, 28);
    const lensMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    this.gravitationalLensMesh = new THREE.Mesh(lensGeo, lensMat);
    this.root.add(this.gravitationalLensMesh);

    // 5. Infalling accretion particles
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 250 + Math.random() * 750;
      const theta = Math.random() * Math.PI * 2;
      posArray[i * 3] = Math.cos(theta) * radius;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 30;
      posArray[i * 3 + 2] = Math.sin(theta) * radius;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 7,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(particleGeo, particleMat);
    this.particles.rotation.x = Math.PI / 2.35;
    this.root.add(this.particles);

    scene.add(this.root);
  }

  public setInstability(level: number) {
    this.instability = THREE.MathUtils.clamp(level, 0, 1);
    this.rotationSpeed = 0.6 + this.instability * 3.8;
    this.accretionMaterial.uniforms.speed.value = 1.0 + this.instability * 4.0;
    this.accretionMaterial.uniforms.instability.value = this.instability;
    const pulseScale = 1.0 + this.instability * 0.15;
    this.photonRingMesh.scale.set(pulseScale, pulseScale, pulseScale);
  }

  public triggerCollapse() {
    this.isCollapsing = true;
    this.collapseProgress = 0;
  }

  public update(dt: number) {
    const delta = Math.max(0, dt);
    this.accretionMaterial.uniforms.time.value += delta * this.rotationSpeed;
    this.accretionMesh.rotation.z += delta * 0.25 * this.rotationSpeed;
    this.particles.rotation.z += delta * 0.35 * this.rotationSpeed;

    if (this.isCollapsing) {
      this.collapseProgress += delta * 0.22;
      // Inward collapse of accretion disk and horizon
      const s = Math.max(0.01, 1.0 - this.collapseProgress * 0.85);
      this.accretionMesh.scale.set(s, s, s);
      this.eventHorizonMesh.scale.set(s, s, s);
      this.photonRingMesh.scale.set(s * 1.5, s * 1.5, s * 1.5);
    }
  }

  public dispose() {
    this.scene.remove(this.root);
    this.root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}

/**
 * Background Planetary Collision Visuals:
 * Distant celestial bodies that destabilize, collide, and generate a massive
 * non-graphic cosmic explosion with expanding debris cloud and shockwave ring.
 */
export class PlanetaryCollisionVisuals {
  public root: THREE.Group;
  public planetA: THREE.Mesh; // Gas giant
  public planetB: THREE.Mesh; // Colliding fractured planet
  public flashMesh: THREE.Mesh;
  public shockwaveMesh: THREE.Mesh;
  public debrisPoints: THREE.Points;
  private debrisVelocities: THREE.Vector3[] = [];
  public isCollided = false;
  private collisionTimer = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'PlanetaryCollisionSystem';

    // Planet A: Large Gas giant with rings
    const geoA = new THREE.SphereGeometry(260, 32, 32);
    const matA = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.65,
      metalness: 0.1,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.4,
    });
    this.planetA = new THREE.Mesh(geoA, matA);
    this.planetA.position.set(-1500, 480, -3200);

    const ringGeo = new THREE.RingGeometry(310, 480, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 3;
    this.planetA.add(rings);
    this.root.add(this.planetA);

    // Planet B: Rocky red-hot fractured planet
    const geoB = new THREE.SphereGeometry(170, 24, 24);
    const matB = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0x9a3412,
      emissiveIntensity: 0.6,
    });
    this.planetB = new THREE.Mesh(geoB, matB);
    this.planetB.position.set(-850, 720, -3500);
    this.root.add(this.planetB);

    // Blinding energy flash
    const flashGeo = new THREE.SphereGeometry(60, 24, 24);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.flashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.flashMesh.position.set(-1450, 490, -3250);
    this.root.add(this.flashMesh);

    // Expanding shockwave ring
    const swGeo = new THREE.RingGeometry(40, 75, 64);
    const swMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.shockwaveMesh = new THREE.Mesh(swGeo, swMat);
    this.shockwaveMesh.position.copy(this.flashMesh.position);
    this.root.add(this.shockwaveMesh);

    // 160 Debris explosion dust/rock particles
    const debrisCount = 160;
    const debrisPositions = new Float32Array(debrisCount * 3);
    for (let i = 0; i < debrisCount; i++) {
      debrisPositions[i * 3] = this.flashMesh.position.x;
      debrisPositions[i * 3 + 1] = this.flashMesh.position.y;
      debrisPositions[i * 3 + 2] = this.flashMesh.position.z;

      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(140 + Math.random() * 280);
      this.debrisVelocities.push(dir);
    }
    const debrisGeo = new THREE.BufferGeometry();
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
    const debrisMat = new THREE.PointsMaterial({
      color: 0xfb923c,
      size: 14,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.debrisPoints = new THREE.Points(debrisGeo, debrisMat);
    this.root.add(this.debrisPoints);

    scene.add(this.root);
  }

  public triggerCollision() {
    this.isCollided = true;
    this.collisionTimer = 0;
  }

  public update(dt: number) {
    const delta = Math.max(0, dt);

    if (!this.isCollided) {
      // Gentle orbit drift
      this.planetA.rotation.y += delta * 0.04;
      this.planetB.rotation.y -= delta * 0.06;
    } else {
      this.collisionTimer += delta;

      // Planet B moving rapidly into Planet A
      if (this.collisionTimer < 1.4) {
        this.planetB.position.lerp(new THREE.Vector3(-1440, 500, -3240), delta * 2.5);
      } else {
        // Impact occurs!
        this.planetB.visible = false;
        const progress = (this.collisionTimer - 1.4) / 4.0;

        if (progress <= 1.0) {
          // Flash expansion and fade
          const flashScale = 1.0 + progress * 8.0;
          this.flashMesh.scale.set(flashScale, flashScale, flashScale);
          (this.flashMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - progress * 1.4);

          // Shockwave expands outward
          const swScale = 1.0 + progress * 24.0;
          this.shockwaveMesh.scale.set(swScale, swScale, swScale);
          (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - progress);

          // Debris particles expand outward
          const posAttr = this.debrisPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;
          for (let i = 0; i < this.debrisVelocities.length; i++) {
            posArr[i * 3] += this.debrisVelocities[i].x * delta;
            posArr[i * 3 + 1] += this.debrisVelocities[i].y * delta;
            posArr[i * 3 + 2] += this.debrisVelocities[i].z * delta;
          }
          posAttr.needsUpdate = true;
          (this.debrisPoints.material as THREE.PointsMaterial).opacity = Math.max(0, 1.0 - progress);
        }
      }
    }
  }

  public dispose() {
    this.scene.remove(this.root);
    this.root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}

/**
 * Dynamic Track Destruction & Spaghettification Visuals:
 * Chunks of the race track behind the player crack, stretch into elongated
 * shards toward the singularity vector, and plummet into the void.
 */
export class TrackDestructionVisuals {
  public root: THREE.Group;
  private fragments: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotVelocity: THREE.Vector3;
    active: boolean;
    life: number;
  }[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'TrackDestructionSystem';

    const geo = new THREE.BoxGeometry(16, 2.5, 30);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      metalness: 0.85,
      roughness: 0.25,
    });

    for (let i = 0; i < 36; i++) {
      const mesh = new THREE.Mesh(geo.clone(), mat.clone());
      mesh.visible = false;
      this.root.add(mesh);
      this.fragments.push({
        mesh,
        velocity: new THREE.Vector3(),
        rotVelocity: new THREE.Vector3(),
        active: false,
        life: 0,
      });
    }

    scene.add(this.root);
  }

  public spawnCollapseBehind(playerPos: THREE.Vector3, blackHolePos: THREE.Vector3, count = 2) {
    let spawned = 0;
    for (const f of this.fragments) {
      if (!f.active) {
        f.active = true;
        f.life = 0;
        f.mesh.visible = true;

        // Position 80-160 meters behind player
        f.mesh.position.set(
          playerPos.x + (Math.random() - 0.5) * 40,
          playerPos.y + (Math.random() - 0.5) * 10,
          playerPos.z + 90 + Math.random() * 80
        );

        // Tidal pull toward black hole
        const pullDir = blackHolePos.clone().sub(f.mesh.position).normalize();
        f.velocity.copy(pullDir).multiplyScalar(80 + Math.random() * 60);
        f.velocity.y -= 45; // Gravity drop

        f.rotVelocity.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        );

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public update(dt: number, spaghettification = true) {
    const delta = Math.max(0, dt);
    for (const f of this.fragments) {
      if (f.active) {
        f.life += delta;
        f.mesh.position.addScaledVector(f.velocity, delta);
        f.mesh.rotation.x += f.rotVelocity.x * delta;
        f.mesh.rotation.y += f.rotVelocity.y * delta;
        f.mesh.rotation.z += f.rotVelocity.z * delta;

        // Spaghettification stretching effect!
        if (spaghettification) {
          const stretch = 1.0 + f.life * 1.8;
          f.mesh.scale.set(Math.max(0.2, 1.0 / stretch), Math.max(0.2, 1.0 / stretch), stretch);
        }

        if (f.life > 3.5 || f.mesh.position.y < -300) {
          f.active = false;
          f.mesh.visible = false;
        }
      }
    }
  }

  public dispose() {
    this.scene.remove(this.root);
    this.root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}

/**
 * Holographic Warning System:
 * Physical neon holographic warning panels placed along the escape corridor.
 */
export class HolographicWarningSystem {
  public root: THREE.Group;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'HolographicWarningSigns';
    scene.add(this.root);
  }

  public spawnSign(position: THREE.Vector3, text: string, subtext: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(8, 4, 18, 0.85)';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 10;
      ctx.strokeRect(6, 6, 500, 244);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 88);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(subtext, 256, 160);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(42, 21), signMat);
    signMesh.position.copy(position);
    this.root.add(signMesh);
  }

  public dispose() {
    this.scene.remove(this.root);
    this.root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}
