import * as THREE from 'three';
import { ModeIntroConfig, StartingGridType } from './cinematicTypes';
import { CosmicTrack } from '../trackData';
import { CinematicCamera } from './cinematicCamera';
import { sound } from '../audio';

export interface GridSlot {
  racerId: string;
  splineT: number;
  lateralOffset: number;
  worldPos: THREE.Vector3;
  targetSplineT: number;
  targetLateral: number;
}

export class StartingGridManager {
  private config: ModeIntroConfig;
  private track: CosmicTrack;
  private scene: THREE.Scene;
  private gridGroup: THREE.Group | null = null;
  private startingGateMesh: THREE.Group | null = null;
  private gridSlots: Map<string, GridSlot> = new Map();
  private formationElapsed: number = 0;
  private formationDuration: number = 2.4;
  private isFormationComplete: boolean = false;
  private cinematicCamera: CinematicCamera;

  constructor(
    config: ModeIntroConfig,
    track: CosmicTrack,
    scene: THREE.Scene,
    cinematicCamera: CinematicCamera
  ) {
    this.config = config;
    this.track = track;
    this.scene = scene;
    this.cinematicCamera = cinematicCamera;
  }

  public buildStartingGridStructure(startT: number = 0) {
    this.cleanup();

    this.gridGroup = new THREE.Group();
    this.gridGroup.name = 'cinematic_starting_grid_group';

    const sample = this.track.getSampleAt(startT);
    const pos = sample.point;
    const tangent = sample.tangent.clone().normalize();
    const normal = sample.normal.clone().normalize();
    const binormal = sample.binormal.clone().normalize();

    // 1. Build Physical Starting Gate Arch
    this.startingGateMesh = new THREE.Group();
    this.startingGateMesh.name = 'starting_gate_arch';

    const gateWidth = 32;
    const gateHeight = 18;
    const pillarRadius = 1.2;

    // Materials based on mode countdown primary & secondary colors
    const primaryHex = parseInt(this.config.countdownEffects.primaryColor.replace('#', '0x')) || 0x00f0ff;
    const secondaryHex = parseInt(this.config.countdownEffects.secondaryColor.replace('#', '0x')) || 0xff00e5;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x060b18,
    });

    const neonMat = new THREE.MeshBasicMaterial({
      color: primaryHex,
    });

    // Left Pillar
    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.3, gateHeight, 16), frameMat);
    leftPillar.position.set(-gateWidth / 2, gateHeight / 2, 0);
    this.startingGateMesh.add(leftPillar);

    // Right Pillar
    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.3, gateHeight, 16), frameMat);
    rightPillar.position.set(gateWidth / 2, gateHeight / 2, 0);
    this.startingGateMesh.add(rightPillar);

    // Crossbar
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(gateWidth + 2, 2.2, 3), frameMat);
    crossbar.position.set(0, gateHeight, 0);
    this.startingGateMesh.add(crossbar);

    // Neon Accent Rings
    const neonLeft = new THREE.Mesh(new THREE.TorusGeometry(pillarRadius * 1.2, 0.2, 8, 16), neonMat);
    neonLeft.position.set(-gateWidth / 2, gateHeight * 0.7, 0);
    neonLeft.rotation.x = Math.PI / 2;
    this.startingGateMesh.add(neonLeft);

    const neonRight = new THREE.Mesh(new THREE.TorusGeometry(pillarRadius * 1.2, 0.2, 8, 16), neonMat);
    neonRight.position.set(gateWidth / 2, gateHeight * 0.7, 0);
    neonRight.rotation.x = Math.PI / 2;
    this.startingGateMesh.add(neonRight);

    // Holographic Energy Barrier Screen (dissipates at race start)
    const barrierGeo = new THREE.PlaneGeometry(gateWidth - 2, gateHeight - 2);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    barrierMesh.name = 'starting_energy_barrier';
    barrierMesh.position.set(0, gateHeight / 2, 0);
    this.startingGateMesh.add(barrierMesh);

    // 2. Mode Landmark Visual Accent
    const landmarkGroup = new THREE.Group();
    landmarkGroup.name = 'landmark_accent';

    if (this.config.startingLocation.landmarkMeshType === 'OBSERVATION_PLATFORM') {
      // Large circular observation dish hovering above the gate
      const dish = new THREE.Mesh(
        new THREE.CylinderGeometry(20, 24, 3, 24),
        new THREE.MeshStandardMaterial({ color: 0x1a2035, metalness: 0.8, roughness: 0.3 })
      );
      dish.position.set(0, gateHeight + 12, -20);
      landmarkGroup.add(dish);
    } else if (this.config.startingLocation.landmarkMeshType === 'CHAMPIONSHIP_STADIUM_ARCHES') {
      // Stadium Arch Rings
      for (let i = 0; i < 3; i++) {
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(26 + i * 6, 1.2, 8, 32, Math.PI),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffaa00 : 0x00f0ff })
        );
        arch.position.set(0, 0, -10 - i * 15);
        landmarkGroup.add(arch);
      }
    } else if (this.config.startingLocation.landmarkMeshType === 'WARP_PORTAL_GATE') {
      // Swirling portal halo
      const portalRing = new THREE.Mesh(
        new THREE.TorusGeometry(22, 1.6, 16, 48),
        new THREE.MeshBasicMaterial({ color: 0x9900ff })
      );
      portalRing.position.set(0, gateHeight / 2, -30);
      landmarkGroup.add(portalRing);
    }

    this.gridGroup.add(landmarkGroup);

    // Orient gate to match track tangent and normal
    const rotMatrix = new THREE.Matrix4();
    rotMatrix.makeBasis(binormal, normal, tangent);
    this.startingGateMesh.setRotationFromMatrix(rotMatrix);
    this.startingGateMesh.position.copy(pos);

    this.gridGroup.add(this.startingGateMesh);
    this.scene.add(this.gridGroup);
  }

  public setupGridFormation(
    playerShipId: string,
    aiRacers: Array<{ id: string; name: string; isRival?: boolean }>,
    startT: number = 0
  ) {
    this.gridSlots.clear();
    this.formationElapsed = 0;
    this.isFormationComplete = false;

    const totalRacers = 1 + aiRacers.length;
    const formationType = this.config.gridFormation.type;
    const rowSpacingM = this.config.gridFormation.rowSpacing;
    const colSpacingM = this.config.gridFormation.colSpacing;

    // Convert meters to approximate spline delta T
    const approxTrackLength = this.track.totalLength || 3200;
    const deltaTPerRow = rowSpacingM / approxTrackLength;

    // Slot 0 is the Player (Pole Position or Row 1)
    const playerTargetLateral = formationType === 'SIDE_BY_SIDE' ? -colSpacingM / 2 : formationType === 'HIGHWAY_LANES' ? 0 : -3.5;
    const playerTargetT = startT;

    this.gridSlots.set('player', {
      racerId: 'player',
      splineT: (startT - deltaTPerRow * 2 + 1.0) % 1.0, // approaches from behind
      lateralOffset: playerTargetLateral,
      worldPos: new THREE.Vector3(),
      targetSplineT: playerTargetT,
      targetLateral: playerTargetLateral,
    });

    // Slots for AI racers based on formation pattern
    aiRacers.forEach((ai, idx) => {
      let targetLateral = 0;
      let targetRow = Math.floor((idx + 1) / 2);

      switch (formationType) {
        case 'SIDE_BY_SIDE':
          // Match side-by-side with rival
          targetLateral = colSpacingM / 2;
          targetRow = 0;
          break;
        case 'HIGHWAY_LANES':
          // 3 lanes (-colSpacing, 0, +colSpacing)
          const laneIdx = (idx + 1) % 3;
          targetLateral = (laneIdx - 1) * colSpacingM;
          targetRow = Math.floor((idx + 1) / 3);
          break;
        case 'ARENA_RING':
          // Radial lateral offsets
          const angle = ((idx + 1) / totalRacers) * Math.PI * 2;
          targetLateral = Math.sin(angle) * (colSpacingM * 1.5);
          targetRow = Math.abs(Math.cos(angle)) * 1.2;
          break;
        case 'ECHELON':
          // Diagonal stair-step
          targetLateral = (idx + 1) * 3.2 - 8;
          targetRow = idx + 1;
          break;
        case 'WEDGE':
          // Inverted V
          const sign = (idx + 1) % 2 === 0 ? 1 : -1;
          const wedgeRow = Math.ceil((idx + 1) / 2);
          targetLateral = sign * (wedgeRow * colSpacingM * 0.7);
          targetRow = wedgeRow;
          break;
        case 'STAGGERED_DUAL':
        default:
          const isRight = (idx + 1) % 2 === 1;
          targetLateral = isRight ? 3.5 : -3.5;
          targetRow = Math.floor((idx + 1) / 2);
          break;
      }

      const targetT = (startT - targetRow * deltaTPerRow + 1.0) % 1.0;
      const initialT = (startT - (targetRow + 2.5) * deltaTPerRow + 1.0) % 1.0;

      this.gridSlots.set(ai.id, {
        racerId: ai.id,
        splineT: initialT,
        lateralOffset: targetLateral,
        worldPos: new THREE.Vector3(),
        targetSplineT: targetT,
        targetLateral,
      });
    });
  }

  public update(dt: number): { isComplete: boolean; slots: Map<string, GridSlot> } {
    if (!this.isFormationComplete) {
      this.formationElapsed += dt;
      const progress = Math.min(1.0, this.formationElapsed / this.formationDuration);
      // Smooth deceleration curve as racers glide into their grid blocks
      const ease = 1 - Math.pow(1 - progress, 2.5);

      this.gridSlots.forEach(slot => {
        // Interpolate splineT
        slot.splineT = THREE.MathUtils.lerp(slot.splineT, slot.targetSplineT, ease);
        slot.lateralOffset = THREE.MathUtils.lerp(slot.lateralOffset, slot.targetLateral, ease);

        // Update world position
        const sample = this.track.getSampleAt(slot.splineT);
        slot.worldPos
          .copy(sample.point)
          .addScaledVector(sample.binormal, slot.lateralOffset)
          .addScaledVector(sample.normal, 1.2);
      });

      if (progress >= 1.0) {
        this.isFormationComplete = true;
      }
    }

    return {
      isComplete: this.isFormationComplete,
      slots: this.gridSlots,
    };
  }

  public getSlot(racerId: string): GridSlot | undefined {
    return this.gridSlots.get(racerId);
  }

  public getAllSlots(): Map<string, GridSlot> {
    return this.gridSlots;
  }

  public openGate(reaction: 'RETRACT' | 'DISSIPATE' | 'OPEN' | 'FLASH') {
    if (!this.startingGateMesh) return;

    const barrier = this.startingGateMesh.getObjectByName('starting_energy_barrier') as THREE.Mesh;
    if (barrier) {
      if (reaction === 'DISSIPATE' || reaction === 'FLASH') {
        barrier.visible = false;
      } else if (reaction === 'OPEN') {
        barrier.scale.set(0.01, 1, 1);
      } else if (reaction === 'RETRACT') {
        barrier.position.y -= 25;
      }
    }

    // Gate pillar lights flash
    sound.playGatePowerUp?.();
  }

  public cleanup() {
    if (this.gridGroup && this.gridGroup.parent) {
      this.scene.remove(this.gridGroup);
      this.gridGroup = null;
      this.startingGateMesh = null;
    }
    this.gridSlots.clear();
  }
}
