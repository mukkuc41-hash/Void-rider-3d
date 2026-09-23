import * as THREE from 'three';
import { GameMode } from '../types';
import { sound } from './audio';
import { ModeManager } from './modeManager';

export interface RelicEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  collected: boolean;
  pulseTimer: number;
}

export interface DroneEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  t: number;
  health: number;
  destroyed: boolean;
  hoverOffset: number;
}

export interface EnergyCoreEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  t: number;
  collected: boolean;
  rotationSpeed: number;
}

export interface OrbitalRingEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  t: number;
  rotationSpeed: number;
  cleared: boolean;
  clearedCooldown: number;
}

export interface WormholeEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  t: number;
  swirlSpeed: number;
}

export interface PlasmaShieldEntity {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  t: number;
  collected: boolean;
}

export class ModeEntitySystem {
  private scene: THREE.Scene;
  private modeManager: ModeManager;
  private rootGroup: THREE.Group;

  // Active Entities
  public wormholes: WormholeEntity[] = [];
  public energyCores: EnergyCoreEntity[] = [];
  public drones: DroneEntity[] = [];
  public orbitalRings: OrbitalRingEntity[] = [];
  public relics: RelicEntity[] = [];
  public plasmaShields: PlasmaShieldEntity[] = [];

  // Mode 07: Plasma Storm Wall Mesh
  public plasmaWallMesh: THREE.Mesh | null = null;

  // Mode 10: Quantum Ghost Ship
  public ghostShip: THREE.Group | null = null;
  public quantumGates: THREE.Mesh[] = [];

  // Mode 13: Collapsing Track Visuals
  public collapseBoundaryMesh: THREE.Mesh | null = null;

  // Mode 17: Relay Gates
  public relayGates: THREE.Group[] = [];

  // Track reference
  private trackSpline: THREE.CatmullRomCurve3 | null = null;

  constructor(scene: THREE.Scene, modeManager: ModeManager) {
    this.scene = scene;
    this.modeManager = modeManager;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'mode_entities_root';
    this.scene.add(this.rootGroup);
  }

  public initModeEntities(
    mode: GameMode,
    trackSpline: THREE.CatmullRomCurve3 | null,
    densityMultiplier: number = 1.0
  ) {
    this.clear();
    this.trackSpline = trackSpline;

    if (!trackSpline) return;

    switch (mode) {
      case 'WORMHOLE_EXPRESS':
        this.spawnWormholes();
        break;

      case 'SOLAR_STORM':
        // Solar storm uses thermal shaders & ambient particle effects
        break;

      case 'GRAVITY_FREE':
        // Gravity free uses aerobatic stunt combo tracking
        break;

      case 'PLASMA_STORM':
        this.spawnPlasmaStormSystem();
        break;

      case 'QUANTUM_TIME_TRIAL':
        this.spawnQuantumTimeTrialSystem();
        break;

      case 'ENERGY_HEIST':
        this.spawnEnergyCores(densityMultiplier);
        break;

      case 'DRONE_ASSAULT':
        this.spawnCombatDrones(densityMultiplier);
        break;

      case 'COLLAPSING_TRACK':
        this.spawnCollapsingTrackSystem();
        break;

      case 'RING_RUNNER':
        this.spawnOrbitalRings(densityMultiplier);
        break;

      case 'RELAY_RACE':
        this.spawnRelayGates();
        break;

      case 'COSMIC_TREASURE_HUNT':
        this.spawnAncientRelics(densityMultiplier);
        break;

      default:
        break;
    }
  }

  // ==========================================
  // MODE 04: WORMHOLE EXPRESS
  // ==========================================
  private spawnWormholes() {
    if (!this.trackSpline) return;
    const wormholeTs = [0.22, 0.46, 0.68, 0.88];

    wormholeTs.forEach((t, i) => {
      const pos = this.trackSpline!.getPointAt(t);
      const tangent = this.trackSpline!.getTangentAt(t).normalize();

      const group = new THREE.Group();
      group.position.copy(pos);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Outer glowing torus
      const ringGeo = new THREE.TorusGeometry(14, 1.2, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xbf00ff,
        wireframe: true,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      group.add(ringMesh);

      // Inner event horizon disk
      const diskGeo = new THREE.CircleGeometry(13.2, 32);
      const diskMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x0033aa : 0x440066,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const diskMesh = new THREE.Mesh(diskGeo, diskMat);
      group.add(diskMesh);

      this.rootGroup.add(group);
      this.wormholes.push({
        id: i,
        mesh: group,
        position: pos,
        t,
        swirlSpeed: 2.5 + i * 0.4,
      });
    });
  }

  // ==========================================
  // MODE 07: PLASMA STORM
  // ==========================================
  private spawnPlasmaStormSystem() {
    // Gigantic pursuing plasma storm wall
    const wallGeo = new THREE.CylinderGeometry(80, 80, 12, 32, 1, true, 0, Math.PI);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x9900ff,
      transparent: true,
      opacity: 0.65,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    this.plasmaWallMesh = new THREE.Mesh(wallGeo, wallMat);
    this.plasmaWallMesh.rotation.x = Math.PI / 2;
    this.rootGroup.add(this.plasmaWallMesh);

    // Spawn 3 protective plasma shield orbs along track
    if (!this.trackSpline) return;
    const shieldTs = [0.25, 0.55, 0.8];
    shieldTs.forEach((t, idx) => {
      const pos = this.trackSpline!.getPointAt(t);
      const group = new THREE.Group();
      group.position.copy(pos).add(new THREE.Vector3(0, 3, 0));

      const sphereGeo = new THREE.SphereGeometry(3.5, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x00ffea,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      group.add(sphere);

      this.rootGroup.add(group);
      this.plasmaShields.push({
        id: idx,
        mesh: group,
        position: group.position,
        t,
        collected: false,
      });
    });
  }

  // ==========================================
  // MODE 10: QUANTUM TIME TRIAL
  // ==========================================
  private spawnQuantumTimeTrialSystem() {
    if (!this.trackSpline) return;

    // Ghost Ship (translucent silhouette)
    const ghostGroup = new THREE.Group();
    const hullGeo = new THREE.ConeGeometry(2, 6, 4);
    hullGeo.rotateX(Math.PI / 2);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
    });
    const hull = new THREE.Mesh(hullGeo, ghostMat);
    ghostGroup.add(hull);
    this.ghostShip = ghostGroup;
    this.rootGroup.add(ghostGroup);

    // 5 Precision Quantum Speed Gates that shave 0.5s off the clock
    const gateTs = [0.15, 0.35, 0.55, 0.75, 0.92];
    gateTs.forEach((t, i) => {
      const pos = this.trackSpline!.getPointAt(t);
      const tangent = this.trackSpline!.getTangentAt(t).normalize();

      const gateGeo = new THREE.TorusGeometry(8, 0.5, 8, 24);
      const gateMat = new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true });
      const gateMesh = new THREE.Mesh(gateGeo, gateMat);
      gateMesh.position.copy(pos);
      gateMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      this.rootGroup.add(gateMesh);
      this.quantumGates.push(gateMesh);
    });
  }

  // ==========================================
  // MODE 11: ENERGY HEIST
  // ==========================================
  private spawnEnergyCores(densityMultiplier: number = 1.0) {
    if (!this.trackSpline) return;
    const count = Math.max(6, Math.floor(10 * densityMultiplier));
    const coreTs = Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));

    coreTs.forEach((t, i) => {
      const pos = this.trackSpline!.getPointAt(t);
      const tangent = this.trackSpline!.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Alternate lanes left and right
      const laneOffset = ((i % 2 === 0 ? 1 : -1) * 7);
      const corePos = pos.clone().addScaledVector(binormal, laneOffset).add(new THREE.Vector3(0, 2.5, 0));

      const group = new THREE.Group();
      group.position.copy(corePos);

      // Glowing central power core (Icosahedron)
      const coreGeo = new THREE.IcosahedronGeometry(2.2, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        wireframe: true,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // Outer rotating containment ring
      const ringGeo = new THREE.TorusGeometry(3.6, 0.3, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        wireframe: true,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      group.add(ringMesh);

      this.rootGroup.add(group);
      this.energyCores.push({
        id: i,
        mesh: group,
        position: corePos,
        t,
        collected: false,
        rotationSpeed: 2.0 + (i % 3) * 0.5,
      });
    });
  }

  // ==========================================
  // MODE 12: DRONE ASSAULT
  // ==========================================
  private spawnCombatDrones(densityMultiplier: number = 1.0) {
    if (!this.trackSpline) return;
    const count = Math.max(6, Math.floor(8 * densityMultiplier));
    const droneTs = Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));

    droneTs.forEach((t, i) => {
      const pos = this.trackSpline!.getPointAt(t);
      const tangent = this.trackSpline!.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const offset = ((i % 3) - 1) * 6;
      const dronePos = pos.clone().addScaledVector(binormal, offset).add(new THREE.Vector3(0, 4.0, 0));

      const group = new THREE.Group();
      group.position.copy(dronePos);

      // Drone Chassis (Octahedron + Rotors)
      const bodyGeo = new THREE.OctahedronGeometry(2.5);
      const bodyMat = new THREE.MeshBasicMaterial({
        color: 0xff0044,
        wireframe: true,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(bodyMesh);

      // Targeting Eye
      const eyeGeo = new THREE.SphereGeometry(0.8, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
      eyeMesh.position.set(0, 0, 1.8);
      group.add(eyeMesh);

      this.rootGroup.add(group);
      this.drones.push({
        id: i,
        mesh: group,
        position: dronePos,
        basePosition: dronePos.clone(),
        t,
        health: 100,
        destroyed: false,
        hoverOffset: Math.random() * Math.PI * 2,
      });
    });
  }

  // ==========================================
  // MODE 13: COLLAPSING TRACK
  // ==========================================
  private spawnCollapsingTrackSystem() {
    // Red pulsing disintegration threshold boundary behind player
    const boundGeo = new THREE.RingGeometry(8, 20, 16);
    const boundMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    this.collapseBoundaryMesh = new THREE.Mesh(boundGeo, boundMat);
    this.rootGroup.add(this.collapseBoundaryMesh);
  }

  // ==========================================
  // MODE 14: RING RUNNER
  // ==========================================
  private spawnOrbitalRings(densityMultiplier: number = 1.0) {
    if (!this.trackSpline) return;
    const ringCount = Math.max(8, Math.floor(12 * densityMultiplier));

    for (let i = 0; i < ringCount; i++) {
      const t = (i + 1) / (ringCount + 1);
      const pos = this.trackSpline.getPointAt(t);
      const tangent = this.trackSpline.getTangentAt(t).normalize();

      const group = new THREE.Group();
      group.position.copy(pos);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Large orbital accelerator ring
      const ringGeo = new THREE.TorusGeometry(15, 1.4, 12, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4f46e5,
        wireframe: true,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      group.add(ringMesh);

      // Chevron boost chevrons on inner perimeter
      const innerGeo = new THREE.TorusGeometry(12, 0.4, 8, 12);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      group.add(innerMesh);

      this.rootGroup.add(group);
      this.orbitalRings.push({
        id: i,
        mesh: group,
        position: pos,
        t,
        rotationSpeed: 1.4 + i * 0.15,
        cleared: false,
        clearedCooldown: 0,
      });
    }
  }

  // ==========================================
  // MODE 17: RELAY RACE
  // ==========================================
  private spawnRelayGates() {
    if (!this.trackSpline) return;
    const relayTs = [0.33, 0.66];

    relayTs.forEach((t, i) => {
      const pos = this.trackSpline!.getPointAt(t);
      const tangent = this.trackSpline!.getTangentAt(t).normalize();

      const group = new THREE.Group();
      group.position.copy(pos);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      const frameGeo = new THREE.BoxGeometry(28, 16, 2);
      const frameMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xffaa00 : 0x00f0ff,
        wireframe: true,
      });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      group.add(frame);

      this.rootGroup.add(group);
      this.relayGates.push(group);
    });
  }

  // ==========================================
  // MODE 19: COSMIC TREASURE HUNT
  // ==========================================
  private spawnAncientRelics(densityMultiplier: number = 1.0) {
    if (!this.trackSpline) return;
    const relicCount = Math.max(3, Math.floor(4 * densityMultiplier));
    const relicTs = Array.from({ length: relicCount }, (_, i) => (i + 1) / (relicCount + 1));

    relicTs.forEach((t, i) => {
      const pos = this.trackSpline!.getPointAt(t);
      const tangent = this.trackSpline!.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Perched higher and off-track in the cosmic ruins
      const offset = (i === 1 ? -14 : 14);
      const relicPos = pos.clone().addScaledVector(binormal, offset).add(new THREE.Vector3(0, 9, 0));

      const group = new THREE.Group();
      group.position.copy(relicPos);

      // Ancient Dodecahedron
      const geo = new THREE.DodecahedronGeometry(3.5, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);

      // Energy aura
      const auraGeo = new THREE.SphereGeometry(5.0, 12, 12);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      group.add(auraMesh);

      this.rootGroup.add(group);
      this.relics.push({
        id: i,
        mesh: group,
        position: relicPos,
        collected: false,
        pulseTimer: 0,
      });
    });
  }

  // ==========================================
  // UPDATE LOOP FOR ALL 19 MODES
  // ==========================================
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeed: number,
    playerSplineT: number,
    onPlayerSpeedBoost: (amount: number) => void,
    onPlayerTeleport: (newT: number) => void,
    onShipSpecialtySwap?: (specialty: 'SPEED' | 'HANDLING' | 'BOOST') => void
  ) {
    const currentMode = this.modeManager.currentMode;

    // 04: Wormhole Express Update
    if (currentMode === 'WORMHOLE_EXPRESS') {
      this.wormholes.forEach(wh => {
        wh.mesh.rotation.z += dt * wh.swirlSpeed;
        const dist = playerPos.distanceTo(wh.position);
        if (dist < 13) {
          // Instant warp leap along spline (+0.12)
          sound.playWormholeWarp();
          onPlayerTeleport((wh.t + 0.12) % 1.0);
          onPlayerSpeedBoost(60);
          wh.mesh.scale.set(1.5, 1.5, 1.5);
          setTimeout(() => wh.mesh.scale.set(1, 1, 1), 500);
        }
      });
    }

    // 05: Solar Storm Update (Core Thermal Mechanics)
    if (currentMode === 'SOLAR_STORM') {
      // Check if player is near track shadow (y < 2)
      const inShadow = playerPos.y < 3;
      if (inShadow) {
        this.modeManager.solarHeat = Math.max(0, this.modeManager.solarHeat - dt * 16);
      }
      if (this.modeManager.solarHeat > 85) {
        // Overheat penalty: reduce speed
        onPlayerSpeedBoost(-dt * 45);
      }
    }

    // 07: Plasma Storm Update
    if (currentMode === 'PLASMA_STORM') {
      if (this.plasmaWallMesh && this.trackSpline) {
        const wallT = Math.max(0, (playerSplineT - (this.modeManager.stormWallDistance / 800) + 1.0) % 1.0);
        const wallPos = this.trackSpline.getPointAt(wallT);
        this.plasmaWallMesh.position.copy(wallPos);
        this.plasmaWallMesh.rotation.z += dt * 3;

        // Collect plasma shields
        this.plasmaShields.forEach(ps => {
          if (!ps.collected) {
            ps.mesh.rotation.y += dt * 2.5;
            if (playerPos.distanceTo(ps.position) < 8) {
              ps.collected = true;
              ps.mesh.visible = false;
              sound.playShieldActivate();
              this.modeManager.stormWallDistance = Math.min(450, this.modeManager.stormWallDistance + 80);
            }
          }
        });

        if (this.modeManager.stormWallDistance <= 20) {
          sound.playAlarmAlert();
        }
      }
    }

    // 10: Quantum Time Trial
    if (currentMode === 'QUANTUM_TIME_TRIAL') {
      if (this.ghostShip && this.trackSpline) {
        // Ghost leads slightly on optimal pacing
        const ghostT = (this.modeManager.modeTimer * 0.022) % 1.0;
        const gPos = this.trackSpline.getPointAt(ghostT);
        const gTan = this.trackSpline.getTangentAt(ghostT).normalize();
        this.ghostShip.position.copy(gPos);
        this.ghostShip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), gTan);
      }

      this.quantumGates.forEach(gate => {
        gate.rotation.z += dt * 2.0;
        if (playerPos.distanceTo(gate.position) < 9) {
          sound.playBoostPad();
          onPlayerSpeedBoost(30);
          gate.scale.set(1.4, 1.4, 1.4);
          setTimeout(() => gate.scale.set(1, 1, 1), 300);
        }
      });
    }

    // 11: Energy Heist Update
    if (currentMode === 'ENERGY_HEIST') {
      this.energyCores.forEach(core => {
        if (!core.collected) {
          core.mesh.rotation.y += dt * core.rotationSpeed;
          core.mesh.rotation.x += dt * 1.2;

          if (playerPos.distanceTo(core.position) < 7) {
            core.collected = true;
            core.mesh.visible = false;
            sound.playCreditPickup();
            this.modeManager.coresCollected = Math.min(
              this.modeManager.targetCores,
              this.modeManager.coresCollected + 1
            );
            // Mass penalty per core: -4% speed
            onPlayerSpeedBoost(-15);
          }
        }
      });
    }

    // 12: Drone Assault Update
    if (currentMode === 'DRONE_ASSAULT') {
      this.drones.forEach(drone => {
        if (!drone.destroyed) {
          drone.hoverOffset += dt * 3;
          drone.mesh.position.y = drone.basePosition.y + Math.sin(drone.hoverOffset) * 1.5;
          drone.mesh.rotation.y += dt * 1.8;

          // Player ramming or shooting drone
          if (playerPos.distanceTo(drone.mesh.position) < 9) {
            drone.destroyed = true;
            drone.mesh.visible = false;
            sound.playExplosion();
            this.modeManager.dronesDestroyed++;
            onPlayerSpeedBoost(25);
          }
        }
      });
    }

    // 13: Collapsing Track Update
    if (currentMode === 'COLLAPSING_TRACK') {
      if (this.collapseBoundaryMesh && this.trackSpline) {
        const collapseT = Math.max(0, (playerSplineT - (this.modeManager.collapseGap / 900) + 1.0) % 1.0);
        const bPos = this.trackSpline.getPointAt(collapseT);
        this.collapseBoundaryMesh.position.copy(bPos);
        this.collapseBoundaryMesh.rotation.z += dt * 4;

        if (this.modeManager.collapseGap < 35) {
          sound.playAlarmAlert();
        }
      }
    }

    // 14: Ring Runner Update
    if (currentMode === 'RING_RUNNER') {
      this.orbitalRings.forEach(ring => {
        ring.mesh.rotation.z += dt * ring.rotationSpeed;

        if (ring.clearedCooldown > 0) {
          ring.clearedCooldown -= dt;
        } else if (playerPos.distanceTo(ring.position) < 13) {
          ring.cleared = true;
          ring.clearedCooldown = 4.0;
          sound.playBoostPad();
          onPlayerSpeedBoost(40);
          this.modeManager.ringsPassed = Math.min(
            this.modeManager.totalRings,
            this.modeManager.ringsPassed + 1
          );
          ring.mesh.scale.set(1.3, 1.3, 1.3);
          setTimeout(() => ring.mesh.scale.set(1, 1, 1), 350);
        }
      });
    }

    // 15: Hyperspace Sprint Update
    if (currentMode === 'HYPERSPACE_SPRINT') {
      // Warp speed acceleration continuously active
      if (playerSpeed < 480) {
        onPlayerSpeedBoost(dt * 30);
      }
    }

    // 17: Relay Race Handover Update
    if (currentMode === 'RELAY_RACE') {
      this.relayGates.forEach((gate, idx) => {
        gate.rotation.z += dt * 0.8;
        if (playerPos.distanceTo(gate.position) < 14) {
          const nextLeg = idx + 2;
          if (this.modeManager.currentLeg < nextLeg) {
            this.modeManager.currentLeg = nextLeg;
            sound.playUpgradeUnlock();
            const specialty = nextLeg === 2 ? 'HANDLING' : 'BOOST';
            this.modeManager.legShipSpecialty = specialty;
            if (onShipSpecialtySwap) {
              onShipSpecialtySwap(specialty);
            }
          }
        }
      });
    }

    // 19: Cosmic Treasure Hunt (Relic Radar & Recovery)
    if (currentMode === 'COSMIC_TREASURE_HUNT') {
      let nearestDist = 999;
      this.relics.forEach(relic => {
        if (!relic.collected) {
          relic.pulseTimer += dt * 2.5;
          relic.mesh.rotation.y += dt * 1.5;
          relic.mesh.rotation.z += dt * 0.9;
          const d = playerPos.distanceTo(relic.position);
          if (d < nearestDist) nearestDist = d;

          // Extract relic on proximity
          if (d < 14) {
            relic.collected = true;
            relic.mesh.visible = false;
            sound.playUpgradeUnlock();
            this.modeManager.relicsFound = Math.min(
              this.modeManager.totalRelics,
              this.modeManager.relicsFound + 1
            );
          }
        }
      });

      this.modeManager.radarDistance = Math.floor(nearestDist);
      this.modeManager.radarSignal = Math.floor(Math.max(10, 100 - nearestDist * 0.6));
    }
  }

  public clear() {
    while (this.rootGroup.children.length > 0) {
      const child = this.rootGroup.children[0];
      this.rootGroup.remove(child);
      child.traverse(c => {
        if (c instanceof THREE.Mesh) {
          c.geometry?.dispose();
          if (Array.isArray(c.material)) {
            c.material.forEach(m => m.dispose());
          } else {
            c.material?.dispose();
          }
        }
      });
    }

    this.wormholes = [];
    this.energyCores = [];
    this.drones = [];
    this.orbitalRings = [];
    this.relics = [];
    this.plasmaShields = [];
    this.plasmaWallMesh = null;
    this.ghostShip = null;
    this.quantumGates = [];
    this.collapseBoundaryMesh = null;
    this.relayGates = [];
  }

  public dispose() {
    this.clear();
    this.scene.remove(this.rootGroup);
  }
}
