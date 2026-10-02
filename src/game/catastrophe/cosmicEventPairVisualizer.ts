import * as THREE from 'three';
import { sound } from '../audio';
import {
  COSMIC_40_EVENT_PAIRS,
  CosmicEventElement,
  CosmicEventPairData,
} from './cosmicEventElementsCatalog';

export interface CosmicPairLiveTelemetry {
  eventIndex: number;
  element1: CosmicEventElement;
  element2: CosmicEventElement;
  element1Pos: THREE.Vector3;
  element2Pos: THREE.Vector3;
  distanceBetweenElements: number;
  revolutionAngle: number;
  spaghettificationProgress: number; // 0 to 1
  isColliding: boolean;
  shockwaveActive: boolean;
  completionHint: string;
}

export class CosmicEventPairVisualizer {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private blackHoleCenter: THREE.Vector3;

  private currentEventIndex = -1;
  private activePairData: CosmicEventPairData | null = null;
  private elapsedEventTimer = 0;

  // 3D Visual Elements
  private element1Group: THREE.Group;
  private element2Group: THREE.Group;
  private element1Mesh: THREE.Mesh | null = null;
  private element2Mesh: THREE.Mesh | null = null;

  // Collision Shockwave
  private shockwaveMesh: THREE.Mesh | null = null;
  private shockwaveTimer = 0;
  private hasTriggeredCollisionSound = false;

  // Spaghettified Particle Systems
  private particles1: THREE.Points | null = null;
  private particles2: THREE.Points | null = null;
  private particlePositions1: Float32Array = new Float32Array(0);
  private particleVelocities1: THREE.Vector3[] = [];
  private particlePositions2: Float32Array = new Float32Array(0);
  private particleVelocities2: THREE.Vector3[] = [];

  constructor(scene: THREE.Scene, blackHoleCenter = new THREE.Vector3(0, 180, -3500)) {
    this.scene = scene;
    this.blackHoleCenter = blackHoleCenter.clone();
    this.group = new THREE.Group();
    this.group.name = 'CosmicEventPairVisualizer';

    this.element1Group = new THREE.Group();
    this.element1Group.name = 'Pair_Element_1';
    this.element2Group = new THREE.Group();
    this.element2Group.name = 'Pair_Element_2';

    this.group.add(this.element1Group);
    this.group.add(this.element2Group);

    this.buildShockwaveMesh();
    this.scene.add(this.group);
  }

  private buildShockwaveMesh(): void {
    const geo = new THREE.RingGeometry(20, 35, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.shockwaveMesh = new THREE.Mesh(geo, mat);
    this.shockwaveMesh.visible = false;
    this.group.add(this.shockwaveMesh);
  }

  /**
   * Loads and builds the 3D meshes for a specific event from the 40 events
   */
  public setEvent(eventIndex: number): void {
    if (this.currentEventIndex === eventIndex && this.activePairData) return;

    this.currentEventIndex = eventIndex;
    this.activePairData = COSMIC_40_EVENT_PAIRS[eventIndex] || COSMIC_40_EVENT_PAIRS[1];
    this.elapsedEventTimer = 0;
    this.hasTriggeredCollisionSound = false;

    // Clean old meshes
    this.disposeCurrentMeshes();

    // Build new pair meshes
    this.element1Mesh = this.createElementMesh(this.activePairData.element1);
    this.element2Mesh = this.createElementMesh(this.activePairData.element2);

    this.element1Group.add(this.element1Mesh);
    this.element2Group.add(this.element2Mesh);

    // Build Spaghettified Particle Systems
    this.buildParticleSystems(this.activePairData.element1, this.activePairData.element2);
  }

  private createElementMesh(elem: CosmicEventElement): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    let mat: THREE.Material;

    const r = Math.max(15, elem.radius * 0.7);

    switch (elem.type) {
      case 'PLANET':
      case 'PROTOPLANET': {
        geo = new THREE.SphereGeometry(r, 28, 20);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          roughness: 0.65,
          metalness: 0.25,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.45,
        });
        break;
      }
      case 'MOON': {
        geo = new THREE.SphereGeometry(r, 22, 16);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          roughness: 0.85,
          metalness: 0.1,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.25,
        });
        break;
      }
      case 'STATION':
      case 'STRUCTURE': {
        // High-tech angular lattice / cylinder
        geo = new THREE.CylinderGeometry(r * 0.4, r * 0.8, r * 2.2, 12);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          roughness: 0.35,
          metalness: 0.85,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.6,
        });
        break;
      }
      case 'RING_SEGMENT': {
        geo = new THREE.TorusGeometry(r * 1.5, r * 0.25, 8, 24, Math.PI * 0.85);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          roughness: 0.4,
          metalness: 0.7,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.5,
        });
        break;
      }
      case 'PLASMA_JET':
      case 'GAS_CLOUD': {
        geo = new THREE.SphereGeometry(r * 1.2, 20, 16);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          transparent: true,
          opacity: 0.7,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.9,
          blending: THREE.AdditiveBlending,
        });
        break;
      }
      case 'COMET': {
        geo = new THREE.ConeGeometry(r * 0.6, r * 3.5, 16);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          roughness: 0.5,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.8,
        });
        break;
      }
      case 'CORE_REMNANT': {
        geo = new THREE.IcosahedronGeometry(r, 2);
        mat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.2,
          metalness: 0.95,
          emissive: elem.emissiveColor,
          emissiveIntensity: 1.0,
        });
        break;
      }
      case 'ASTEROID':
      default: {
        geo = new THREE.DodecahedronGeometry(r, 1);
        mat = new THREE.MeshStandardMaterial({
          color: elem.color,
          roughness: 0.9,
          metalness: 0.15,
          emissive: elem.emissiveColor,
          emissiveIntensity: 0.3,
          flatShading: true,
        });
        break;
      }
    }

    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  private buildParticleSystems(elem1: CosmicEventElement, elem2: CosmicEventElement): void {
    // Particles for Element 1
    const count1 = Math.min(220, elem1.particleCount);
    const geo1 = new THREE.BufferGeometry();
    this.particlePositions1 = new Float32Array(count1 * 3);
    this.particleVelocities1 = [];

    for (let i = 0; i < count1; i++) {
      this.particlePositions1[i * 3] = (Math.random() - 0.5) * elem1.radius * 2;
      this.particlePositions1[i * 3 + 1] = (Math.random() - 0.5) * elem1.radius * 2;
      this.particlePositions1[i * 3 + 2] = (Math.random() - 0.5) * elem1.radius * 2;
      this.particleVelocities1.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        )
      );
    }
    geo1.setAttribute('position', new THREE.BufferAttribute(this.particlePositions1, 3));
    this.particles1 = new THREE.Points(
      geo1,
      new THREE.PointsMaterial({
        color: elem1.particleColor,
        size: 7.5,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.element1Group.add(this.particles1);

    // Particles for Element 2
    const count2 = Math.min(220, elem2.particleCount);
    const geo2 = new THREE.BufferGeometry();
    this.particlePositions2 = new Float32Array(count2 * 3);
    this.particleVelocities2 = [];

    for (let i = 0; i < count2; i++) {
      this.particlePositions2[i * 3] = (Math.random() - 0.5) * elem2.radius * 2;
      this.particlePositions2[i * 3 + 1] = (Math.random() - 0.5) * elem2.radius * 2;
      this.particlePositions2[i * 3 + 2] = (Math.random() - 0.5) * elem2.radius * 2;
      this.particleVelocities2.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        )
      );
    }
    geo2.setAttribute('position', new THREE.BufferAttribute(this.particlePositions2, 3));
    this.particles2 = new THREE.Points(
      geo2,
      new THREE.PointsMaterial({
        color: elem2.particleColor,
        size: 7.5,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    this.element2Group.add(this.particles2);
  }

  /**
   * Main per-frame simulation:
   * 1. Keplerian orbit around black hole
   * 2. Mutual revolution of the 2 elements
   * 3. Collision impact shockwave
   * 4. Tidal spaghettification stretching along gravitational vector
   * 5. Spaghettified particle filaments streaming into black hole
   */
  public update(dt: number, activeEventIndex: number): CosmicPairLiveTelemetry | null {
    if (this.currentEventIndex !== activeEventIndex) {
      this.setEvent(activeEventIndex);
    }

    if (!this.activePairData) return null;

    const delta = Math.max(0, Math.min(dt, 0.15));
    this.elapsedEventTimer += delta;

    const elem1 = this.activePairData.element1;
    const elem2 = this.activePairData.element2;

    // Normalised event cycle time (0 to 1 across 30 seconds nominal phase)
    const cycleDuration = 30.0;
    const cycleTime = (this.elapsedEventTimer % cycleDuration) / cycleDuration;

    // 1. Barycenter Keplerian Orbit around Black Hole
    // Kept at a majestic background distance (X: 500-1800, Y: 150-600, Z: -2200 to -3200) framing the black hole
    const barycenterOrbitRadius = 1800;
    const barycenterOrbitAngle = this.elapsedEventTimer * 0.08 + activeEventIndex * 0.35;
    const barycenterPos = new THREE.Vector3(
      this.blackHoleCenter.x + Math.sin(barycenterOrbitAngle) * barycenterOrbitRadius * 0.9,
      this.blackHoleCenter.y + 240 + Math.cos(barycenterOrbitAngle * 0.5) * 180,
      this.blackHoleCenter.z + 800 + Math.cos(barycenterOrbitAngle) * 600
    );

    // 2. Mutual Revolution of the 2 Elements around each other
    const revolutionSpeed = 0.5 + activeEventIndex * 0.03;
    const revAngle = this.elapsedEventTimer * revolutionSpeed;

    // Dynamic distance between elements:
    // Approaches closest point at collisionTimeRatio, then collides or rebounds, and spaghettifies
    const distToCollision = Math.abs(cycleTime - elem1.collisionTimeRatio);
    const mutualSeparation = 80 + distToCollision * 450;

    const elem1LocalPos = new THREE.Vector3(
      Math.cos(revAngle) * mutualSeparation * 0.55,
      Math.sin(revAngle * 0.7) * (mutualSeparation * 0.25),
      Math.sin(revAngle) * mutualSeparation * 0.55
    );

    const elem2LocalPos = new THREE.Vector3(
      -Math.cos(revAngle) * mutualSeparation * 0.55,
      -Math.sin(revAngle * 0.7) * (mutualSeparation * 0.25),
      -Math.sin(revAngle) * mutualSeparation * 0.55
    );

    const pos1 = barycenterPos.clone().add(elem1LocalPos);
    const pos2 = barycenterPos.clone().add(elem2LocalPos);

    this.element1Group.position.copy(pos1);
    this.element2Group.position.copy(pos2);

    // 3. Collision and Shockwave Detection
    const isColliding = distToCollision < 0.06;
    let shockwaveActive = false;

    if (isColliding) {
      this.shockwaveTimer += delta * 2.5;
      shockwaveActive = true;
      if (this.shockwaveMesh) {
        this.shockwaveMesh.visible = true;
        this.shockwaveMesh.position.copy(barycenterPos);
        this.shockwaveMesh.lookAt(this.blackHoleCenter);
        const s = 1.0 + this.shockwaveTimer * 14.0;
        this.shockwaveMesh.scale.set(s, s, s);
        if (this.shockwaveMesh.material instanceof THREE.MeshBasicMaterial) {
          this.shockwaveMesh.material.opacity = Math.max(0, 0.85 - this.shockwaveTimer * 0.6);
        }
      }

      if (!this.hasTriggeredCollisionSound) {
        this.hasTriggeredCollisionSound = true;
        sound.playPlanetaryCollision();
        sound.playHeavyImpact();
      }
    } else {
      this.shockwaveTimer = 0;
      if (this.shockwaveMesh) {
        this.shockwaveMesh.visible = false;
      }
      if (distToCollision > 0.2) {
        this.hasTriggeredCollisionSound = false;
      }
    }

    // 4. Tidal Spaghettification (Tensile Elongation along vector to Black Hole)
    const spaghettificationProgress = Math.min(1.0, (cycleTime / 0.85) * elem1.spaghettificationRate * 1.3);

    // Stretch Element 1
    if (this.element1Mesh) {
      const stretchZ = 1.0 + spaghettificationProgress * 2.8;
      const compressXY = 1.0 / Math.sqrt(stretchZ);
      this.element1Mesh.scale.set(compressXY, compressXY, stretchZ);
      this.element1Mesh.lookAt(this.blackHoleCenter);
      this.element1Mesh.rotation.y += delta * 0.8;
    }

    // Stretch Element 2
    if (this.element2Mesh) {
      const stretchZ = 1.0 + spaghettificationProgress * 2.8;
      const compressXY = 1.0 / Math.sqrt(stretchZ);
      this.element2Mesh.scale.set(compressXY, compressXY, stretchZ);
      this.element2Mesh.lookAt(this.blackHoleCenter);
      this.element2Mesh.rotation.y += delta * 0.8;
    }

    // 5. Spaghettified Particle Stream: Particles stream along curved geodesics into black hole
    this.updateParticleStream(delta, this.particlePositions1, this.particleVelocities1, this.particles1, pos1, spaghettificationProgress);
    this.updateParticleStream(delta, this.particlePositions2, this.particleVelocities2, this.particles2, pos2, spaghettificationProgress);

    return {
      eventIndex: this.currentEventIndex,
      element1: elem1,
      element2: elem2,
      element1Pos: pos1,
      element2Pos: pos2,
      distanceBetweenElements: Math.round(pos1.distanceTo(pos2)),
      revolutionAngle: revAngle,
      spaghettificationProgress,
      isColliding,
      shockwaveActive,
      completionHint: elem1.completionGuidance,
    };
  }

  private updateParticleStream(
    dt: number,
    positions: Float32Array,
    velocities: THREE.Vector3[],
    points: THREE.Points | null,
    emitterPos: THREE.Vector3,
    spaghettificationProgress: number
  ): void {
    if (!points || positions.length === 0) return;

    const count = positions.length / 3;
    const toBH = new THREE.Vector3().subVectors(this.blackHoleCenter, emitterPos).normalize();

    // As spaghettification increases, particle stream becomes faster and more drawn into black hole
    const streamSpeed = 40 + spaghettificationProgress * 120;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const vel = velocities[i];

      // Accelerate particle along geodesic toward black hole
      vel.addScaledVector(toBH, dt * streamSpeed * 0.5);

      positions[idx] += vel.x * dt;
      positions[idx + 1] += vel.y * dt;
      positions[idx + 2] += vel.z * dt;

      // Reset particle if it drifts too far toward the black hole
      const currentPos = new THREE.Vector3(positions[idx], positions[idx + 1], positions[idx + 2]);
      if (currentPos.length() > 650) {
        positions[idx] = (Math.random() - 0.5) * 20;
        positions[idx + 1] = (Math.random() - 0.5) * 20;
        positions[idx + 2] = (Math.random() - 0.5) * 20;
        vel.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );
      }
    }

    const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    if (posAttr) {
      posAttr.needsUpdate = true;
    }

    if (points.material instanceof THREE.PointsMaterial) {
      points.material.opacity = Math.min(0.9, 0.35 + spaghettificationProgress * 0.55);
    }
  }

  private disposeCurrentMeshes(): void {
    if (this.element1Mesh) {
      this.element1Group.remove(this.element1Mesh);
      this.element1Mesh.geometry.dispose();
      if (this.element1Mesh.material instanceof THREE.Material) {
        this.element1Mesh.material.dispose();
      }
      this.element1Mesh = null;
    }

    if (this.element2Mesh) {
      this.element2Group.remove(this.element2Mesh);
      this.element2Mesh.geometry.dispose();
      if (this.element2Mesh.material instanceof THREE.Material) {
        this.element2Mesh.material.dispose();
      }
      this.element2Mesh = null;
    }

    if (this.particles1) {
      this.element1Group.remove(this.particles1);
      this.particles1.geometry.dispose();
      if (this.particles1.material instanceof THREE.Material) {
        this.particles1.material.dispose();
      }
      this.particles1 = null;
    }

    if (this.particles2) {
      this.element2Group.remove(this.particles2);
      this.particles2.geometry.dispose();
      if (this.particles2.material instanceof THREE.Material) {
        this.particles2.material.dispose();
      }
      this.particles2 = null;
    }
  }

  public dispose(): void {
    this.disposeCurrentMeshes();
    if (this.shockwaveMesh) {
      this.shockwaveMesh.geometry.dispose();
      if (this.shockwaveMesh.material instanceof THREE.Material) {
        this.shockwaveMesh.material.dispose();
      }
      this.shockwaveMesh = null;
    }
    this.scene.remove(this.group);
  }
}
