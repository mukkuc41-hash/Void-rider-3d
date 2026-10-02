import * as THREE from 'three';
import { sound } from '../audio';
import {
  COSMIC_40_EVENTS,
  CosmicEventDefinition,
  PersistentDestructionRegistry,
} from '../catastrophe/cosmicSystems';

/**
 * Visual Scale Tiers:
 * NEAR: 0–500 meters (Full physical detail, active collision, full simulation)
 * ACTIVE: 500m–3km (LOD geometry, instancing, selective collision)
 * FAR: 3km+ (Simplified orbital kinematics, massive visual landmarks)
 */
export type VisualScaleTier = 'NEAR' | 'ACTIVE' | 'FAR';

/**
 * Physical Near-Field Obstacle for collision tracking
 */
export interface PhysicalObstacle {
  mesh: THREE.Object3D;
  boundingRadius: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  damageValue: number;
  environmentIndex: number;
  name: string;
}

/**
 * Master Dynamic Physical Environment Manager for Final Collapse:
 * Houses the 40-Event Continuous Cosmic Catastrophe Chain surrounding the persistent black hole.
 * Enforces zero world resets, continuous world geometry, persistent destruction accumulation,
 * active near-field collision detection, and the exact Event 40 dark implosion climax.
 */
export class DynamicCollapseEnvironmentsManager {
  public root: THREE.Group;
  public scene: THREE.Scene;
  public blackHoleCenter: THREE.Vector3;
  public registry: PersistentDestructionRegistry;

  // Environment Sub-Groups (1 to 40)
  public envGroups: Map<number, THREE.Group> = new Map();

  // Active Near-Field Collidable Obstacles
  private nearObstacles: PhysicalObstacle[] = [];

  // Accumulated Infall Debris Pool (Preserved across all 40 events)
  public accumulatedDebrisGroup: THREE.Group;
  private debrisInstancedMesh!: THREE.InstancedMesh;
  private debrisData: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Euler;
    rotSpeed: THREE.Vector3;
    scale: number;
    initialDistance: number;
  }[] = [];
  private readonly maxAccumulatedDebris = 1600;

  // Celestial Objects
  private planetA!: THREE.Mesh;
  private planetB!: THREE.Mesh;
  private moon1!: THREE.Mesh;
  private moon2!: THREE.Mesh;
  private planetarySatellites: THREE.Group[] = [];

  // Planetary Collision (Event 04)
  private collisionPlanetA!: THREE.Mesh;
  private collisionPlanetB!: THREE.Mesh;
  private collisionShockwaveRing!: THREE.Mesh;
  private collisionMoltenDebris!: THREE.Points;
  private collisionTriggered = false;
  private collisionProgress = 0;

  // Megastructures & Bridges (Event 03, 26, 34)
  private megastructureBridges: THREE.Mesh[] = [];
  private megastructureTowers: THREE.Group[] = [];
  private spineTowers: THREE.Group[] = [];

  // Plasma Energy (Event 05)
  private plasmaClouds: THREE.Points[] = [];
  private plasmaConduits: THREE.Mesh[] = [];
  private plasmaArches: THREE.Group[] = [];

  // Industrial Space Colony (Event 06)
  private industrialStations: THREE.Group[] = [];
  private industrialCargoContainers: THREE.Mesh[] = [];

  // Gravity-Unstable Platforms (Event 07, 33)
  private floatingPlatforms: THREE.Mesh[] = [];

  // Extreme Tidal Corridor (Event 08)
  private tidalCables: THREE.LineSegments[] = [];
  private tidalAsteroidChains: THREE.Group[] = [];

  // Mega Orbital Station (Event 09)
  private megaStationRoot!: THREE.Group;
  private megaStationRing1!: THREE.Mesh;
  private megaStationRing2!: THREE.Mesh;
  private megaStationRing3!: THREE.Mesh;
  private megaStationSpire!: THREE.Mesh;
  private megaStationDecayProgress = 0;

  // Debris Storm & Cascades (Event 10, 19, 27, 36)
  private stormDebrisParticles!: THREE.Points;
  private denseDustVeilPoints!: THREE.Points;

  // Gravitational Lensing & Waves (Event 11, 18)
  private gravitationalLensingArcs: THREE.LineSegments[] = [];
  private gravitationalWavePlanes: THREE.Mesh[] = [];

  // Collapsible Routes (Event 12, 32, 38)
  private collapsibleRouteSegments: {
    group: THREE.Group;
    mesh: THREE.Mesh;
    state: 'SAFE' | 'UNSTABLE' | 'COLLAPSING' | 'DESTROYED' | 'CONSUMED';
    collapseTimer: number;
    fallVelocity: THREE.Vector3;
  }[] = [];

  // Extended Celestial Features (Events 16–35)
  private moonTectonicChunks: THREE.Mesh[] = [];
  private planetaryRingMesh!: THREE.Mesh;
  private fracturedArtificialRing!: THREE.Group;
  private slingshotAsteroids: THREE.Mesh[] = [];
  private atmosphericPlumeMesh!: THREE.Mesh;
  private auroralRibbons: THREE.Mesh[] = [];
  private relativisticStreams: THREE.LineSegments[] = [];
  private toroidalHabitat!: THREE.Group;
  private evacuationBeacons: THREE.Group[] = [];

  // Event 40: Absolute Cosmic End Climax
  public absoluteCollapseProgress = 0;
  public absoluteCollapsePhase:
    | 'IDLE'
    | 'CONVERGENCE'
    | 'MOTION_SLOW'
    | 'NEAR_SILENCE'
    | 'GRAVITATIONAL_DISTORTION'
    | 'DARK_GRAVITATIONAL_PULSE'
    | 'DARK_IMPLOSION'
    | 'DARK_SHOCKWAVE'
    | 'COSMIC_BOOM'
    | 'ALL_COLLAPSED'
    | 'SUDDEN_SILENCE'
    | 'BLACK_SCREEN' = 'IDLE';
  private climaxTimer = 0;
  private darkWaveMesh!: THREE.Mesh;
  private darkImplosionMesh!: THREE.Mesh;

  public currentEventIndex = 1;
  private elapsedSeconds = 0;

  constructor(scene: THREE.Scene, blackHolePosition = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHolePosition.clone();
    this.registry = PersistentDestructionRegistry.getInstance();
    this.root = new THREE.Group();
    this.root.name = 'DynamicCollapseEnvironments_Root';

    this.accumulatedDebrisGroup = new THREE.Group();
    this.accumulatedDebrisGroup.name = 'AccumulatedDebrisGroup';
    this.root.add(this.accumulatedDebrisGroup);

    // Build world geometry across the 40-event continuum
    this.buildAccumulatedDebrisSystem();
    this.buildAsteroidBeltsAndPylons(); // Event 01, 24
    this.buildPlanetaryOrbitalSystem(); // Event 02, 16, 20
    this.buildTitanicMegastructures(); // Event 03, 26, 34
    this.buildPlanetaryCollisionZone(); // Event 04, 23
    this.buildPlasmaEnergyRegion(); // Event 05
    this.buildIndustrialColony(); // Event 06
    this.buildGravityUnstablePlatforms(); // Event 07, 33
    this.buildTidalCorridorAndChains(); // Event 08
    this.buildMegaOrbitalStation(); // Event 09
    this.buildDebrisStormAndDustVeil(); // Event 10, 19, 27, 35
    this.buildGravitationalLensingAndWaves(); // Event 11, 18
    this.buildMultiRouteNetwork(); // Event 12, 32, 38
    this.buildExtendedCelestialAndHabitatStructures(); // Event 17, 21, 22, 28, 29, 30, 31
    this.buildEvacuationSanctuaryCorridor(); // Event 14, 38
    this.buildEvent40AbsoluteCosmicEndClimaxMeshes(); // Event 15, 39, 40

    this.scene.add(this.root);
  }

  /* =========================================================================
     ACCUMULATED DEBRIS SYSTEM (Preserved across all 40 events)
     ========================================================================= */
  private buildAccumulatedDebrisSystem(): void {
    const geo = new THREE.DodecahedronGeometry(3.5, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x667788,
      roughness: 0.85,
      metalness: 0.35,
      flatShading: true,
    });

    this.debrisInstancedMesh = new THREE.InstancedMesh(geo, mat, this.maxAccumulatedDebris);
    this.debrisInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.maxAccumulatedDebris; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 120 + Math.random() * 2400;
      const height = -300 + Math.random() * 850;
      const z = 400 - Math.random() * 4400;

      const pos = new THREE.Vector3(Math.cos(angle) * radius, height, z);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      const s = 0.4 + Math.random() * 2.2;

      this.debrisData.push({
        position: pos,
        velocity: vel,
        rotation: rot,
        rotSpeed,
        scale: s,
        initialDistance: pos.distanceTo(this.blackHoleCenter),
      });

      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.debrisInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.debrisInstancedMesh.instanceMatrix.needsUpdate = true;
    this.accumulatedDebrisGroup.add(this.debrisInstancedMesh);
  }

  /* =========================================================================
     ASTEROIDS & ENERGY PYLONS (Event 01, 24)
     ========================================================================= */
  private buildAsteroidBeltsAndPylons(): void {
    const group = new THREE.Group();
    group.name = 'Env_01_AsteroidOrbital';

    const nearMat = new THREE.MeshStandardMaterial({
      color: 0x778899,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    const nearOffsets = [
      new THREE.Vector3(-45, 12, -220),
      new THREE.Vector3(50, -8, -480),
      new THREE.Vector3(-60, 20, -780),
      new THREE.Vector3(40, 15, -1120),
      new THREE.Vector3(-35, -10, -1450),
      new THREE.Vector3(55, 25, -1820),
      new THREE.Vector3(-48, 8, -2100),
    ];

    nearOffsets.forEach((pos, idx) => {
      const radius = 6.0 + (idx % 4) * 2.5;
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), nearMat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      group.add(mesh);

      this.nearObstacles.push({
        mesh,
        boundingRadius: radius * 1.1,
        position: mesh.position,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 2),
        rotationSpeed: new THREE.Vector3(0.3, 0.5, 0.2),
        damageValue: 20,
        environmentIndex: 1,
        name: `Asteroid_Near_${idx + 1}`,
      });
    });

    // Pylons
    const pylonGeo = new THREE.CylinderGeometry(1.2, 2.0, 36, 8);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x0099ff,
      emissiveIntensity: 0.4,
    });

    for (let z = -200; z > -2200; z -= 350) {
      const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
      leftPylon.position.set(-35, 10, z);
      group.add(leftPylon);

      const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
      rightPylon.position.set(35, 10, z);
      group.add(rightPylon);
    }

    this.envGroups.set(1, group);
    this.root.add(group);
  }

  /* =========================================================================
     PLANETARY ORBITAL SYSTEM (Event 02, 16, 20)
     ========================================================================= */
  private buildPlanetaryOrbitalSystem(): void {
    const group = new THREE.Group();
    group.name = 'Env_02_PlanetaryOrbital';

    const planetGeo = new THREE.SphereGeometry(850, 48, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x2255aa,
      roughness: 0.6,
      metalness: 0.15,
      emissive: 0x001133,
    });
    this.planetA = new THREE.Mesh(planetGeo, planetMat);
    this.planetA.position.set(-2200, 650, -2800);
    group.add(this.planetA);

    // Planet A Atmosphere shell
    const atmoGeo = new THREE.SphereGeometry(885, 32, 24);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x66bbff,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    this.planetA.add(atmo);

    // Moon 1
    const moonGeo1 = new THREE.SphereGeometry(180, 28, 20);
    const moonMat1 = new THREE.MeshStandardMaterial({ color: 0x9999aa, roughness: 0.9 });
    this.moon1 = new THREE.Mesh(moonGeo1, moonMat1);
    this.moon1.position.set(-1350, 950, -2400);
    group.add(this.moon1);

    // Moon 2
    const moonGeo2 = new THREE.SphereGeometry(95, 24, 16);
    const moonMat2 = new THREE.MeshStandardMaterial({ color: 0xbbaacc, roughness: 0.9 });
    this.moon2 = new THREE.Mesh(moonGeo2, moonMat2);
    this.moon2.position.set(-2900, 420, -3200);
    group.add(this.moon2);

    // Satellites
    const satMat = new THREE.MeshStandardMaterial({
      color: 0xddeeff,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x00aaff,
      emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 8; i++) {
      const sat = new THREE.Group();
      sat.add(new THREE.Mesh(new THREE.BoxGeometry(8, 8, 14), satMat));
      sat.position.set(
        -800 + Math.cos(i * 0.8) * 600,
        180 + Math.sin(i * 0.9) * 220,
        -1200 - i * 280
      );
      this.planetarySatellites.push(sat);
      group.add(sat);
    }

    this.envGroups.set(2, group);
    this.root.add(group);
  }

  /* =========================================================================
     TITANIC MEGASTRUCTURES (Event 03, 26, 34)
     ========================================================================= */
  private buildTitanicMegastructures(): void {
    const group = new THREE.Group();
    group.name = 'Env_03_TitanicMegastructures';

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.85, roughness: 0.3 });
    const energyConduitMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.8 });

    // 4 Suspension bridges
    for (let i = 0; i < 4; i++) {
      const zPos = -400 - i * 500;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(650, 12, 38), steelMat);
      bridge.position.set(0, 110 + i * 25, zPos);
      this.megastructureBridges.push(bridge);
      group.add(bridge);

      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 650, 8), energyConduitMat);
      conduit.rotation.z = Math.PI / 2;
      conduit.position.set(0, 7, 0);
      bridge.add(conduit);
    }

    // 2 Giant 600m Energy Towers
    const towerGeo = new THREE.CylinderGeometry(14, 28, 580, 12);
    [-280, 280].forEach(x => {
      const tower = new THREE.Group();
      tower.position.set(x, 240, -1100);
      tower.add(new THREE.Mesh(towerGeo, steelMat));
      this.megastructureTowers.push(tower);
      group.add(tower);
    });

    // Event 34: 2 Civilization Spine Towers
    const spineGeo = new THREE.BoxGeometry(32, 620, 32);
    [-340, 340].forEach(x => {
      const spine = new THREE.Group();
      spine.position.set(x, 260, -1650);
      spine.add(new THREE.Mesh(spineGeo, steelMat));
      this.spineTowers.push(spine);
      group.add(spine);
    });

    this.envGroups.set(3, group);
    this.root.add(group);
  }

  /* =========================================================================
     PLANETARY COLLISION ZONE (Event 04, 23)
     ========================================================================= */
  private buildPlanetaryCollisionZone(): void {
    const group = new THREE.Group();
    group.name = 'Env_04_PlanetaryCollision';

    const planetAGeo = new THREE.SphereGeometry(550, 40, 28);
    const planetAMat = new THREE.MeshStandardMaterial({
      color: 0x118855,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x003311,
    });
    this.collisionPlanetA = new THREE.Mesh(planetAGeo, planetAMat);
    this.collisionPlanetA.position.set(1600, 750, -3200);
    group.add(this.collisionPlanetA);

    const planetBGeo = new THREE.SphereGeometry(440, 36, 24);
    const planetBMat = new THREE.MeshStandardMaterial({
      color: 0xaa3311,
      roughness: 0.75,
      metalness: 0.4,
      emissive: 0xff3300,
      emissiveIntensity: 0.35,
    });
    this.collisionPlanetB = new THREE.Mesh(planetBGeo, planetBMat);
    this.collisionPlanetB.position.set(2850, 680, -3400);
    group.add(this.collisionPlanetB);

    const shockwaveGeo = new THREE.RingGeometry(20, 90, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    this.collisionShockwaveRing = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    this.collisionShockwaveRing.position.set(2100, 715, -3300);
    group.add(this.collisionShockwaveRing);

    const pCount = 600;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = 2100 + (Math.random() - 0.5) * 80;
      pPositions[i * 3 + 1] = 715 + (Math.random() - 0.5) * 80;
      pPositions[i * 3 + 2] = -3300 + (Math.random() - 0.5) * 80;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xff8822,
      size: 14,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.collisionMoltenDebris = new THREE.Points(pGeo, pMat);
    group.add(this.collisionMoltenDebris);

    this.envGroups.set(4, group);
    this.root.add(group);
  }

  /* =========================================================================
     PLASMA ENERGY REGION (Event 05)
     ========================================================================= */
  private buildPlasmaEnergyRegion(): void {
    const group = new THREE.Group();
    group.name = 'Env_05_PlasmaEnergy';

    const cloudCount = 800;
    const cloudGeo = new THREE.BufferGeometry();
    const cloudPos = new Float32Array(cloudCount * 3);
    for (let i = 0; i < cloudCount; i++) {
      cloudPos[i * 3] = (Math.random() - 0.5) * 1200;
      cloudPos[i * 3 + 1] = -50 + Math.random() * 350;
      cloudPos[i * 3 + 2] = -600 - Math.random() * 1600;
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
    const cloudMat = new THREE.PointsMaterial({
      color: 0x00ffee,
      size: 26,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const clouds = new THREE.Points(cloudGeo, cloudMat);
    this.plasmaClouds.push(clouds);
    group.add(clouds);

    const archMat = new THREE.MeshStandardMaterial({
      color: 0x334466,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x00bbff,
      emissiveIntensity: 0.5,
    });
    for (let z = -450; z > -2100; z -= 400) {
      const arch = new THREE.Group();
      arch.position.set(0, 0, z);
      const archMesh = new THREE.Mesh(new THREE.TorusGeometry(65, 4.5, 8, 24, Math.PI), archMat);
      archMesh.position.set(0, 15, 0);
      arch.add(archMesh);
      this.plasmaArches.push(arch);
      group.add(arch);
    }

    const conduitGeo = new THREE.CylinderGeometry(2.5, 2.5, 420, 8);
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0x8800ff,
      emissive: 0xaa00ff,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(conduitGeo, conduitMat);
      c.position.set(-160 + i * 110, 85, -800 - i * 350);
      c.rotation.z = Math.PI / 3;
      this.plasmaConduits.push(c);
      group.add(c);
    }

    this.envGroups.set(5, group);
    this.root.add(group);
  }

  /* =========================================================================
     INDUSTRIAL COLONY (Event 06)
     ========================================================================= */
  private buildIndustrialColony(): void {
    const group = new THREE.Group();
    group.name = 'Env_06_IndustrialColony';

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x777788, metalness: 0.8, roughness: 0.4 });
    const containerMat = new THREE.MeshStandardMaterial({ color: 0xcc7722, roughness: 0.5, metalness: 0.3 });

    for (let i = 0; i < 4; i++) {
      const station = new THREE.Group();
      station.position.set((i % 2 === 0 ? -1 : 1) * (260 + i * 30), 70 + i * 20, -700 - i * 450);
      station.add(new THREE.Mesh(new THREE.BoxGeometry(90, 45, 120), steelMat));
      this.industrialStations.push(station);
      group.add(station);
    }

    for (let i = 0; i < 12; i++) {
      const container = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 22), containerMat);
      container.position.set((Math.random() - 0.5) * 140, 15 + (Math.random() - 0.5) * 35, -500 - i * 140);
      container.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.industrialCargoContainers.push(container);
      group.add(container);

      this.nearObstacles.push({
        mesh: container,
        boundingRadius: 10.0,
        position: container.position,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, -2),
        rotationSpeed: new THREE.Vector3(0.4, 0.6, 0.3),
        damageValue: 22,
        environmentIndex: 6,
        name: `CargoContainer_${i + 1}`,
      });
    }

    this.envGroups.set(6, group);
    this.root.add(group);
  }

  /* =========================================================================
     GRAVITY-UNSTABLE PLATFORMS (Event 07, 33)
     ========================================================================= */
  private buildGravityUnstablePlatforms(): void {
    const group = new THREE.Group();
    group.name = 'Env_07_GravityUnstableField';

    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x556677,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xaa44ff,
      emissiveIntensity: 0.25,
    });

    for (let i = 0; i < 16; i++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(32 + Math.random() * 20, 4, 45 + Math.random() * 25), slabMat);
      slab.position.set((Math.random() - 0.5) * 320, -20 + Math.random() * 120, -300 - i * 120);
      slab.userData = {
        baseX: slab.position.x,
        baseY: slab.position.y,
        baseZ: slab.position.z,
        phase: Math.random() * Math.PI * 2,
        freq: 0.8 + Math.random() * 1.2,
      };
      this.floatingPlatforms.push(slab);
      group.add(slab);
    }

    this.envGroups.set(7, group);
    this.root.add(group);
  }

  /* =========================================================================
     EXTREME TIDAL CORRIDOR & ASTEROID CHAINS (Event 08)
     ========================================================================= */
  private buildTidalCorridorAndChains(): void {
    const group = new THREE.Group();
    group.name = 'Env_08_ExtremeTidalCorridor';

    const chainMat = new THREE.MeshStandardMaterial({ color: 0x886677, roughness: 0.85, flatShading: true });
    for (let c = 0; c < 4; c++) {
      const chainGroup = new THREE.Group();
      chainGroup.position.set((c - 1.5) * 220, 110, -800 - c * 400);

      for (let i = 0; i < 9; i++) {
        const bead = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), chainMat);
        bead.position.set(0, 0, (i - 4) * 36);
        bead.scale.set(0.6, 0.6, 2.2);
        chainGroup.add(bead);
      }
      this.tidalAsteroidChains.push(chainGroup);
      group.add(chainGroup);
    }

    this.envGroups.set(8, group);
    this.root.add(group);
  }

  /* =========================================================================
     MEGA ORBITAL STATION (Event 09)
     ========================================================================= */
  private buildMegaOrbitalStation(): void {
    const group = new THREE.Group();
    group.name = 'Env_09_MegaOrbitalStation';
    this.megaStationRoot = group;
    group.position.set(0, 320, -1700);

    const stationMat = new THREE.MeshStandardMaterial({
      color: 0x446688,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0066aa,
      emissiveIntensity: 0.4,
    });

    this.megaStationSpire = new THREE.Mesh(new THREE.CylinderGeometry(28, 48, 700, 16), stationMat);
    group.add(this.megaStationSpire);

    this.megaStationRing1 = new THREE.Mesh(new THREE.TorusGeometry(220, 16, 12, 36), stationMat);
    this.megaStationRing1.rotation.x = Math.PI / 2;
    group.add(this.megaStationRing1);

    this.megaStationRing2 = new THREE.Mesh(new THREE.TorusGeometry(420, 20, 12, 48), stationMat);
    this.megaStationRing2.rotation.x = Math.PI / 2;
    group.add(this.megaStationRing2);

    this.megaStationRing3 = new THREE.Mesh(new THREE.TorusGeometry(680, 24, 12, 64), stationMat);
    this.megaStationRing3.rotation.x = Math.PI / 2;
    group.add(this.megaStationRing3);

    this.envGroups.set(9, group);
    this.root.add(group);
  }

  /* =========================================================================
     DEBRIS STORM & DUST VEIL (Event 10, 19, 27, 35)
     ========================================================================= */
  private buildDebrisStormAndDustVeil(): void {
    const group = new THREE.Group();
    group.name = 'Env_10_DebrisStorm';

    const pCount = 1400;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 800;
      pPos[i * 3 + 1] = -40 + Math.random() * 260;
      pPos[i * 3 + 2] = -200 - Math.random() * 2400;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.stormDebrisParticles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xff7733,
        size: 16,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );
    group.add(this.stormDebrisParticles);

    // Event 35: Cosmic Dust Veil
    const dustCount = 1000;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 1600;
      dustPos[i * 3 + 1] = -80 + Math.random() * 400;
      dustPos[i * 3 + 2] = 200 - Math.random() * 3200;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.denseDustVeilPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0x887766,
        size: 28,
        transparent: true,
        opacity: 0.0, // Fades in at Event 35
        blending: THREE.NormalBlending,
      })
    );
    group.add(this.denseDustVeilPoints);

    this.envGroups.set(10, group);
    this.root.add(group);
  }

  /* =========================================================================
     GRAVITATIONAL LENSING & WAVES (Event 11, 18)
     ========================================================================= */
  private buildGravitationalLensingAndWaves(): void {
    const group = new THREE.Group();
    group.name = 'Env_11_GravitationalCorridor';

    const arcMat = new THREE.LineBasicMaterial({ color: 0x9955ff, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 12; i++) {
      const radius = 350 + i * 90;
      const arcGeo = new THREE.TorusGeometry(radius, 1.2, 4, 48, Math.PI * 0.7);
      const arcMesh = new THREE.LineSegments(arcGeo, arcMat);
      arcMesh.position.copy(this.blackHoleCenter);
      arcMesh.position.z += 800 + i * 150;
      arcMesh.rotation.z = i * 0.4;
      this.gravitationalLensingArcs.push(arcMesh);
      group.add(arcMesh);
    }

    // Event 18: Gravitational Wave metric planes
    for (let w = 0; w < 3; w++) {
      const waveMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1200, 1200, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x331166, wireframe: true, transparent: true, opacity: 0.25 })
      );
      waveMesh.position.set(0, 50, -600 - w * 600);
      waveMesh.rotation.x = Math.PI / 2;
      this.gravitationalWavePlanes.push(waveMesh);
      group.add(waveMesh);
    }

    this.envGroups.set(11, group);
    this.root.add(group);
  }

  /* =========================================================================
     MULTI-ROUTE PHYSICAL NETWORK (Event 12, 32, 38)
     ========================================================================= */
  private buildMultiRouteNetwork(): void {
    const group = new THREE.Group();
    group.name = 'Env_12_MultiRouteCollapse';

    const routeMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x00ddff,
      emissiveIntensity: 0.3,
    });

    for (let s = 0; s < 6; s++) {
      const segGroup = new THREE.Group();
      const zPos = -400 - s * 320;
      const xPos = (s % 2 === 0 ? 1 : -1) * 75;

      segGroup.position.set(xPos, 22, zPos);
      const segMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 180), routeMat);
      segGroup.add(segMesh);

      this.collapsibleRouteSegments.push({
        group: segGroup,
        mesh: segMesh,
        state: 'SAFE',
        collapseTimer: 0,
        fallVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          -40 - Math.random() * 30,
          (Math.random() - 0.5) * 20
        ),
      });

      group.add(segGroup);
    }

    this.envGroups.set(12, group);
    this.root.add(group);
  }

  /* =========================================================================
     EXTENDED CELESTIAL STRUCTURES (Event 17, 20, 21, 22, 28, 29, 30, 31)
     ========================================================================= */
  private buildExtendedCelestialAndHabitatStructures(): void {
    const group = new THREE.Group();
    group.name = 'Env_Extended_16to35';

    // Event 20: Planetary Ring Plane
    const ringGeo = new THREE.RingGeometry(1100, 1600, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x5599bb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    this.planetaryRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.planetaryRingMesh.position.set(-2200, 650, -2800);
    this.planetaryRingMesh.rotation.x = Math.PI / 2.3;
    group.add(this.planetaryRingMesh);

    // Event 21: Fractured Moon Tectonic Chunks
    const chunkMat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.9, flatShading: true });
    for (let m = 0; m < 3; m++) {
      const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(70, 1), chunkMat);
      chunk.position.set(-1350 + (m - 1) * 90, 950 + (m === 1 ? 40 : -30), -2400);
      this.moonTectonicChunks.push(chunk);
      group.add(chunk);
    }

    // Event 22: Fractured Megastructure Artificial Ring
    this.fracturedArtificialRing = new THREE.Group();
    this.fracturedArtificialRing.position.set(0, 380, -2000);
    const ringSegGeo = new THREE.TorusGeometry(850, 16, 8, 24, Math.PI * 0.4);
    const ringSegMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.85 });
    const ringArch1 = new THREE.Mesh(ringSegGeo, ringSegMat);
    this.fracturedArtificialRing.add(ringArch1);
    group.add(this.fracturedArtificialRing);

    // Event 24: Slingshot Asteroids
    for (let a = 0; a < 4; a++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(12, 1),
        new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.9 })
      );
      rock.position.set(-200 + a * 130, 45, -700 - a * 300);
      this.slingshotAsteroids.push(rock);
      group.add(rock);

      this.nearObstacles.push({
        mesh: rock,
        boundingRadius: 13.0,
        position: rock.position,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4, -18),
        rotationSpeed: new THREE.Vector3(0.8, 1.2, 0.5),
        damageValue: 28,
        environmentIndex: 24,
        name: `SlingshotAsteroid_${a + 1}`,
      });
    }

    // Event 28: Atmospheric Plume Mesh
    const plumeGeo = new THREE.ConeGeometry(320, 1200, 24, 1, true);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x3388cc,
      transparent: true,
      opacity: 0.0, // Fades in at Event 28
      side: THREE.DoubleSide,
    });
    this.atmosphericPlumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
    this.atmosphericPlumeMesh.position.set(-2200, 650, -2800);
    this.atmosphericPlumeMesh.rotation.z = Math.PI / 2.5;
    group.add(this.atmosphericPlumeMesh);

    // Event 29: Auroral Ribbons
    const ribbonGeo = new THREE.PlaneGeometry(800, 140, 16, 4);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    for (let r = 0; r < 2; r++) {
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(-600 + r * 1200, 200, -1400);
      ribbon.rotation.x = Math.PI / 3;
      this.auroralRibbons.push(ribbon);
      group.add(ribbon);
    }

    // Event 31: Toroidal Orbital Habitat
    this.toroidalHabitat = new THREE.Group();
    this.toroidalHabitat.position.set(450, 220, -1300);
    const torusHabitatGeo = new THREE.TorusGeometry(120, 14, 12, 32);
    const habitatMat = new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      metalness: 0.8,
      emissive: 0x3388ff,
      emissiveIntensity: 0.3,
    });
    this.toroidalHabitat.add(new THREE.Mesh(torusHabitatGeo, habitatMat));
    group.add(this.toroidalHabitat);

    this.envGroups.set(16, group);
    this.root.add(group);
  }

  /* =========================================================================
     EVACUATION SANCTUARY CORRIDOR (Event 14, 38)
     ========================================================================= */
  private buildEvacuationSanctuaryCorridor(): void {
    const group = new THREE.Group();
    group.name = 'Env_14_EvacuationCorridor';

    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.8 });

    for (let z = -650; z > -960; z -= 45) {
      [-22, 22].forEach(x => {
        const beacon = new THREE.Group();
        beacon.position.set(x, 6, z);
        beacon.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 10, 8), pylonMat));
        const light = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8), beaconMat);
        light.position.set(0, 5.5, 0);
        beacon.add(light);
        this.evacuationBeacons.push(beacon);
        group.add(beacon);
      });
    }

    this.envGroups.set(14, group);
    this.root.add(group);
  }

  /* =========================================================================
     EVENT 40: ABSOLUTE COSMIC END CLIMAX MESHES
     ========================================================================= */
  private buildEvent40AbsoluteCosmicEndClimaxMeshes(): void {
    const group = new THREE.Group();
    group.name = 'Env_40_AbsoluteCosmicEnd';

    const waveGeo = new THREE.SphereGeometry(180, 48, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x050014,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.darkWaveMesh = new THREE.Mesh(waveGeo, waveMat);
    this.darkWaveMesh.position.copy(this.blackHoleCenter);
    group.add(this.darkWaveMesh);

    const implosionGeo = new THREE.SphereGeometry(420, 32, 24);
    const implosionMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.0,
    });
    this.darkImplosionMesh = new THREE.Mesh(implosionGeo, implosionMat);
    this.darkImplosionMesh.position.copy(this.blackHoleCenter);
    group.add(this.darkImplosionMesh);

    this.envGroups.set(40, group);
    this.root.add(group);
  }

  /* =========================================================================
     MASTER PER-FRAME UPDATE LOOP ACROSS 40 EVENTS
     ========================================================================= */
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeedMps: number,
    cameraPos: THREE.Vector3,
    activeEventIndex: number,
    eventPhase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' | null,
    isEvacuationActive: boolean
  ): {
    collisionEvent: { hit: boolean; damage: number; impulse: THREE.Vector3; name: string } | null;
    blackScreenActive: boolean;
    cameraShakeIntensity: number;
  } {
    const delta = Math.max(0, Math.min(dt, 0.15));
    this.elapsedSeconds += delta;
    this.currentEventIndex = activeEventIndex;

    let cameraShake = 0;
    let blackScreen = false;

    // 1. Infalling Accumulated Debris
    this.updateAccumulatedDebris(delta, activeEventIndex);

    // 2. Celestial and Planetary Dynamics
    this.updatePlanetaryAndOrbitalDynamics(delta, activeEventIndex);

    // 3. Megastructure Oscillations and Chain Fractures
    this.updateMegastructuresAndTowers(delta, activeEventIndex);

    // 4. Plasma Clouds and Conduits
    this.updatePlasmaAndIndustrial(delta, activeEventIndex);

    // 5. Gravitational Waves and Lensing
    this.updateWavesAndLensing(delta, activeEventIndex);

    // 6. Multi-Route Progressive Collapses
    this.updateMultiRouteCollapses(delta, activeEventIndex);

    // 7. Dust Veil and Atmosphere
    this.updateAtmosphereAndDustVeil(delta, activeEventIndex);

    // 8. Event 40 Climax
    if (activeEventIndex >= 40) {
      const climaxResult = this.updateEvent40AbsoluteCosmicEndClimax(delta);
      cameraShake = Math.max(cameraShake, climaxResult.cameraShake);
      blackScreen = climaxResult.blackScreen;
    }

    // 9. Near-field Physical Collisions against player ship
    const collisionEvent = this.checkNearFieldCollisions(playerPos, 4.2);

    return {
      collisionEvent,
      blackScreenActive: blackScreen,
      cameraShakeIntensity: cameraShake,
    };
  }

  /* -------------------------------------------------------------------------
     Subsystem Updaters
     ------------------------------------------------------------------------- */
  private updateAccumulatedDebris(dt: number, activeEvent: number): void {
    if (!this.debrisInstancedMesh) return;
    const dummy = new THREE.Object3D();
    const speedMult = 1.0 + Math.max(0, activeEvent - 1) * 0.18;

    for (let i = 0; i < this.debrisData.length; i++) {
      const d = this.debrisData[i];
      const toBH = new THREE.Vector3().subVectors(this.blackHoleCenter, d.position);
      const dist = toBH.length();
      toBH.normalize();

      const gravPull = Math.min(65, (2800 / Math.max(200, dist)) * 14 * (activeEvent >= 10 ? 2.2 : 1.0));
      d.velocity.addScaledVector(toBH, gravPull * dt * 0.4);
      d.position.addScaledVector(d.velocity, dt * speedMult);
      d.rotation.x += d.rotSpeed.x * dt;
      d.rotation.y += d.rotSpeed.y * dt;
      d.rotation.z += d.rotSpeed.z * dt;

      if (dist < 320) {
        d.position.set(
          this.blackHoleCenter.x + (Math.random() - 0.5) * 1600,
          this.blackHoleCenter.y + 200 + Math.random() * 500,
          this.blackHoleCenter.z + 1800 + Math.random() * 1200
        );
        d.velocity.set(0, 0, 0);
      }

      dummy.position.copy(d.position);
      dummy.rotation.copy(d.rotation);
      dummy.scale.set(d.scale, d.scale, d.scale);
      dummy.updateMatrix();
      this.debrisInstancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.debrisInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  private updatePlanetaryAndOrbitalDynamics(dt: number, activeEvent: number): void {
    if (this.planetA) {
      this.planetA.rotation.y += dt * 0.02;
      if (activeEvent >= 2) {
        this.planetA.position.y += Math.sin(this.elapsedSeconds * 0.8) * dt * (activeEvent * 2.2);
      }
    }
    if (this.moon1) {
      this.moon1.position.x += Math.cos(this.elapsedSeconds * 0.15) * dt * 25;
      this.moon1.position.z += Math.sin(this.elapsedSeconds * 0.15) * dt * 25;
    }
    if (this.moon2) {
      this.moon2.position.x -= Math.sin(this.elapsedSeconds * 0.2) * dt * 35;
    }
    if (activeEvent >= 20 && this.planetaryRingMesh) {
      // Ring particle disruption
      this.planetaryRingMesh.rotation.z += dt * 0.04;
    }
    if (activeEvent >= 21) {
      // Moon tectonic separation
      this.moonTectonicChunks.forEach((c, idx) => {
        c.position.x += dt * (idx - 1) * 18;
        c.rotation.y += dt * 0.1;
      });
    }

    // Event 04 Planetary Collision
    if (activeEvent >= 4 && this.collisionPlanetA && this.collisionPlanetB) {
      this.collisionProgress += dt * 0.15;
      if (this.collisionPlanetA.position.distanceTo(this.collisionPlanetB.position) > 750) {
        this.collisionPlanetA.position.x += dt * 55;
        this.collisionPlanetB.position.x -= dt * 65;
      } else if (!this.collisionTriggered) {
        this.collisionTriggered = true;
        sound.playPlanetaryCollision();
        sound.playHeavyImpact();
      }

      if (this.collisionTriggered) {
        const curScale = this.collisionShockwaveRing.scale.x;
        const newScale = curScale + dt * 28;
        this.collisionShockwaveRing.scale.set(newScale, newScale, newScale);
        if (this.collisionShockwaveRing.material instanceof THREE.MeshBasicMaterial) {
          this.collisionShockwaveRing.material.opacity = Math.max(0, 0.85 - (newScale / 80) * 0.85);
        }
        if (this.collisionMoltenDebris.material instanceof THREE.PointsMaterial) {
          this.collisionMoltenDebris.material.opacity = Math.min(0.8, this.collisionMoltenDebris.material.opacity + dt * 0.4);
        }
      }
    }
  }

  private updateMegastructuresAndTowers(dt: number, activeEvent: number): void {
    if (activeEvent < 3) return;

    // Bridge oscillation and bending
    const bend = Math.min(0.25, (activeEvent - 2) * 0.02);
    this.megastructureBridges.forEach((b, idx) => {
      b.rotation.z = Math.sin(this.elapsedSeconds * 0.6 + idx) * bend;
    });

    // Towers leaning
    this.megastructureTowers.forEach((t, idx) => {
      t.rotation.z = (idx === 0 ? -1 : 1) * bend * 0.7;
    });

    // Event 26: Structural Resonance
    if (activeEvent >= 26) {
      this.spineTowers.forEach((st, idx) => {
        st.rotation.x = Math.sin(this.elapsedSeconds * 4.0 + idx) * 0.08;
      });
    }

    // Event 31: Torus habitat deformation
    if (activeEvent >= 31 && this.toroidalHabitat) {
      this.toroidalHabitat.rotation.z += dt * 0.15;
      this.toroidalHabitat.scale.set(1.0 + Math.sin(this.elapsedSeconds * 2.0) * 0.25, 1.0, 1.0);
    }
  }

  private updatePlasmaAndIndustrial(dt: number, activeEvent: number): void {
    const pulse = 0.5 + Math.sin(this.elapsedSeconds * 4.0) * 0.5;
    this.plasmaConduits.forEach(c => {
      if (c.material instanceof THREE.MeshStandardMaterial) {
        c.material.emissiveIntensity = 0.5 + pulse * 0.8;
      }
    });

    this.industrialCargoContainers.forEach((box, idx) => {
      box.rotation.x += dt * 0.3;
      box.rotation.y += dt * 0.5;
      if (activeEvent >= 6) {
        box.position.z -= dt * (25 + idx * 2);
      }
    });
  }

  private updateWavesAndLensing(dt: number, activeEvent: number): void {
    if (activeEvent >= 11) {
      this.gravitationalLensingArcs.forEach((arc, idx) => {
        arc.rotation.z += dt * (0.05 + idx * 0.02);
      });
    }
    if (activeEvent >= 18) {
      this.gravitationalWavePlanes.forEach((plane, idx) => {
        plane.position.y = 50 + Math.sin(this.elapsedSeconds * 3.5 + idx) * 35;
      });
    }
  }

  private updateMultiRouteCollapses(dt: number, activeEvent: number): void {
    if (activeEvent < 12) return;

    this.collapsibleRouteSegments.forEach((seg, idx) => {
      if (activeEvent >= 12 + idx * 0.4) {
        if (seg.state === 'SAFE') {
          seg.state = 'COLLAPSING';
          sound.playStructureCreak();
        }
      }

      if (seg.state === 'COLLAPSING') {
        seg.group.position.addScaledVector(seg.fallVelocity, dt);
        seg.group.rotation.x += dt * 0.5;
        if (seg.group.position.y < -350) {
          seg.state = 'CONSUMED';
        }
      }
    });
  }

  private updateAtmosphereAndDustVeil(dt: number, activeEvent: number): void {
    if (activeEvent >= 28 && this.atmosphericPlumeMesh) {
      if (this.atmosphericPlumeMesh.material instanceof THREE.MeshBasicMaterial) {
        this.atmosphericPlumeMesh.material.opacity = Math.min(0.45, (activeEvent - 27) * 0.12);
      }
    }
    if (activeEvent >= 29) {
      this.auroralRibbons.forEach((rib, idx) => {
        if (rib.material instanceof THREE.MeshBasicMaterial) {
          rib.material.opacity = Math.min(0.55, (activeEvent - 28) * 0.15);
        }
        rib.rotation.y += dt * 0.08 * (idx % 2 === 0 ? 1 : -1);
      });
    }
    if (activeEvent >= 35 && this.denseDustVeilPoints) {
      if (this.denseDustVeilPoints.material instanceof THREE.PointsMaterial) {
        this.denseDustVeilPoints.material.opacity = Math.min(0.65, (activeEvent - 34) * 0.15);
      }
    }
  }

  /* =========================================================================
     EVENT 40: ABSOLUTE COSMIC END CLIMAX SEQUENCE
     Sequence as mandated:
     planetary fragments accelerate -> stations fragment -> orbital rings break ->
     megastructures collapse -> route sections detach -> debris converges ->
     stars become heavily distorted -> remaining civilization fragments inward ->
     motion briefly slows -> near silence -> extreme gravitational distortion ->
     dark gravitational pulse -> massive cosmic implosion -> dark shockwave ->
     enormous cosmic BOOM -> environmental convergence -> silence -> black screen.
     NO WHITE FLASH. NO NORMAL FIREBALL. NO CONVENTIONAL SUPERNOVA. NO ARCADE EXPLOSION.
     ========================================================================= */
  private updateEvent40AbsoluteCosmicEndClimax(dt: number): {
    blackScreen: boolean;
    cameraShake: number;
  } {
    this.climaxTimer += dt;
    const t = this.climaxTimer;
    let cameraShake = 1.0;
    let blackScreen = false;

    // Environmental inward convergence
    for (const [idx, group] of this.envGroups) {
      if (idx !== 40) {
        const toBH = new THREE.Vector3().subVectors(this.blackHoleCenter, group.position).normalize();
        group.position.addScaledVector(toBH, dt * (220 + idx * 15));
        group.scale.multiplyScalar(Math.max(0.01, 1.0 - dt * 0.05));
      }
    }

    if (t < 4.0) {
      this.absoluteCollapsePhase = 'CONVERGENCE';
      cameraShake = 2.2;
    } else if (t < 6.5) {
      // 1. Motion briefly slows
      this.absoluteCollapsePhase = 'MOTION_SLOW';
      cameraShake = 0.5;
    } else if (t < 8.0) {
      // 2. Near silence
      this.absoluteCollapsePhase = 'NEAR_SILENCE';
      cameraShake = 0.2;
    } else if (t < 10.5) {
      // 3. Extreme gravitational distortion
      this.absoluteCollapsePhase = 'GRAVITATIONAL_DISTORTION';
      cameraShake = 3.5;
    } else if (t < 13.0) {
      // 4. Dark gravitational pulse
      if (this.absoluteCollapsePhase !== 'DARK_GRAVITATIONAL_PULSE') {
        sound.playDarkGravitationalShockwave();
      }
      this.absoluteCollapsePhase = 'DARK_GRAVITATIONAL_PULSE';
      cameraShake = 4.2;
      if (this.darkWaveMesh) {
        const s = this.darkWaveMesh.scale.x + dt * 50;
        this.darkWaveMesh.scale.set(s, s, s);
        if (this.darkWaveMesh.material instanceof THREE.MeshBasicMaterial) {
          this.darkWaveMesh.material.opacity = Math.min(0.95, (t - 10.5) * 0.4);
        }
      }
    } else if (t < 15.5) {
      // 5. Massive cosmic implosion
      if (this.absoluteCollapsePhase !== 'DARK_IMPLOSION') {
        sound.playSubBassGravitationalImplosion();
      }
      this.absoluteCollapsePhase = 'DARK_IMPLOSION';
      cameraShake = 3.8;
      if (this.darkImplosionMesh) {
        const s = Math.max(0.1, 12.0 - (t - 13.0) * 4.5);
        this.darkImplosionMesh.scale.set(s, s, s);
        if (this.darkImplosionMesh.material instanceof THREE.MeshBasicMaterial) {
          this.darkImplosionMesh.material.opacity = Math.min(1.0, (t - 13.0) * 0.5);
        }
      }
    } else if (t < 18.0) {
      // 6. Enormous cosmic BOOM & Dark Shockwave
      if (this.absoluteCollapsePhase !== 'COSMIC_BOOM') {
        sound.playDeepCosmicBoom();
      }
      this.absoluteCollapsePhase = 'COSMIC_BOOM';
      cameraShake = 5.5;
    } else if (t < 20.5) {
      // 7. Environmental convergence
      this.absoluteCollapsePhase = 'ALL_COLLAPSED';
      cameraShake = 1.8;
    } else if (t < 22.5) {
      // 8. Sudden silence
      this.absoluteCollapsePhase = 'SUDDEN_SILENCE';
      cameraShake = 0.0;
    } else {
      // 9. Black screen
      this.absoluteCollapsePhase = 'BLACK_SCREEN';
      blackScreen = true;
      cameraShake = 0.0;
    }

    return { blackScreen, cameraShake };
  }

  /* =========================================================================
     NEAR-FIELD PHYSICAL COLLISION TEST:
     Tests player ship bounding sphere against real world obstacles.
     ========================================================================= */
  public checkNearFieldCollisions(
    playerPos: THREE.Vector3,
    playerRadius = 4.2
  ): { hit: boolean; damage: number; impulse: THREE.Vector3; name: string } | null {
    for (const obs of this.nearObstacles) {
      if (!obs.mesh.visible) continue;
      const d = playerPos.distanceTo(obs.position);
      if (d < playerRadius + obs.boundingRadius) {
        const normal = new THREE.Vector3().subVectors(playerPos, obs.position).normalize();
        const impulse = normal.multiplyScalar(35.0);

        sound.playCollision();
        sound.playScrapeSparks();

        return {
          hit: true,
          damage: obs.damageValue,
          impulse,
          name: obs.name,
        };
      }
    }
    return null;
  }

  /* =========================================================================
     CLEANUP / DISPOSAL
     ========================================================================= */
  public dispose(): void {
    this.scene.remove(this.root);
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.LineSegments) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    this.envGroups.clear();
    this.nearObstacles = [];
    this.collapsibleRouteSegments = [];
  }
}
