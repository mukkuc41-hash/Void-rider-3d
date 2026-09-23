import * as THREE from 'three';
import { GameMode } from '../types';
import { GameDifficulty, getModeConfig, getDifficultyProfile, ModeHazardProfile } from './modeConfigs';
import { sound } from './audio';

export interface ActiveHazardInstance {
  id: string;
  type: string;
  name: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  damage: number;
  splineT: number;
  color: string;
  avoidanceWindow: string;
  mesh?: THREE.Object3D;
  isWarningActive: boolean;
  warningTimer: number;
  safeLane: 'left' | 'center' | 'right';
  phase: number;
  isCollapsed?: boolean;
}

export interface HazardWarningState {
  active: boolean;
  hazardName: string;
  distanceMeters: number;
  avoidanceAdvice: string;
  warningColor: string;
  timeRemainingSec: number;
}

export class HazardManager {
  private scene: THREE.Scene;
  public hazards: ActiveHazardInstance[] = [];
  public hazardGroup: THREE.Group = new THREE.Group();
  public currentMode: GameMode = 'NEON_CIRCUIT';
  public currentDifficulty: GameDifficulty = 'NORMAL';
  public currentWarning: HazardWarningState | null = null;
  private lastWarningAudioTime: number = 0;
  private playerInvulnerableCooldown: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.hazardGroup.name = 'hazard_manager_root';
    this.scene.add(this.hazardGroup);
  }

  public initForMode(mode: GameMode, difficulty: GameDifficulty, trackSpline: THREE.CatmullRomCurve3 | null) {
    this.clear();
    this.currentMode = mode;
    this.currentDifficulty = difficulty;

    if (!trackSpline) return;

    const modeConfig = getModeConfig(mode);
    const scaling = getDifficultyProfile(mode, difficulty);

    const baseProfiles = modeConfig.hazards;
    if (!baseProfiles || baseProfiles.length === 0) return;

    // Distribute hazards along track spline based on difficulty density
    baseProfiles.forEach((profile, pIdx) => {
      const hazardCount = Math.max(
        4,
        Math.floor(8 * profile.densityMultiplier * scaling.hazardDensity)
      );

      const lanes: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

      for (let i = 0; i < hazardCount; i++) {
        const baseT = (i / hazardCount + (pIdx * 0.17)) % 1.0;
        // Don't spawn within 0.05 of start grid (0.00 - 0.05) to give player safe launch
        const t = baseT < 0.05 ? baseT + 0.06 : baseT;
        const pt = trackSpline.getPointAt(t);
        const tangent = trackSpline.getTangentAt(t).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();

        const lane = lanes[(i + pIdx) % lanes.length];
        const lateralOffset = lane === 'left' ? -6 : lane === 'right' ? 6 : 0;
        const pos = pt.clone().add(binormal.clone().multiplyScalar(lateralOffset));
        pos.y += 2.0;

        const mesh = this.createHazardMesh(profile.type, profile.color);
        mesh.position.copy(pos);
        this.hazardGroup.add(mesh);

        this.hazards.push({
          id: `hazard_${mode}_${pIdx}_${i}`,
          type: profile.type,
          name: profile.name,
          position: pos,
          velocity: new THREE.Vector3(0, 0, 0),
          radius: 3.5,
          damage: Math.round(profile.damage * scaling.damageMultiplier),
          splineT: t,
          color: profile.color,
          avoidanceWindow: profile.avoidanceWindow,
          mesh,
          isWarningActive: false,
          warningTimer: 0,
          safeLane: lane === 'left' ? 'right' : 'left', // safe lane is adjacent
          phase: i * 0.8,
        });
      }
    });
  }

  private createHazardMesh(type: string, colorHex: string): THREE.Group {
    const group = new THREE.Group();
    const colorNum = parseInt(colorHex.replace('#', '0x'), 16) || 0xff0055;

    if (type.includes('MINE') || type.includes('ASTEROID') || type.includes('BOULDER')) {
      const geo = new THREE.DodecahedronGeometry(2.5, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: colorNum,
        emissive: colorNum,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        wireframe: true,
      });
      group.add(new THREE.Mesh(geo, mat));
    } else if (type.includes('WALL') || type.includes('BARRIER') || type.includes('GRID')) {
      const geo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: colorNum, transparent: true, opacity: 0.85 });
      const pylon1 = new THREE.Mesh(geo, mat);
      pylon1.position.set(-8, 4, 0);
      const pylon2 = new THREE.Mesh(geo, mat);
      pylon2.position.set(8, 4, 0);

      const beamGeo = new THREE.BoxGeometry(16, 0.4, 0.4);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 4, 0);

      group.add(pylon1, pylon2, beam);
    } else {
      // General energy anomaly hazard
      const geo = new THREE.OctahedronGeometry(2.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: colorNum,
        emissive: colorNum,
        emissiveIntensity: 1.5,
      });
      group.add(new THREE.Mesh(geo, mat));
    }

    return group;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSplineT: number,
    playerSpeed: number,
    onTakeDamage?: (dmg: number, hazardName: string) => void
  ): HazardWarningState | null {
    if (this.playerInvulnerableCooldown > 0) {
      this.playerInvulnerableCooldown -= dt;
    }

    let mostUrgentWarning: HazardWarningState | null = null;
    let minDistance = 99999;
    const now = Date.now();

    for (const h of this.hazards) {
      if (h.mesh) {
        h.mesh.rotation.y += dt * 1.5;
        h.mesh.rotation.x += dt * 0.8;
      }

      // Calculate distance along spline and euclidean distance
      const deltaT = (h.splineT - playerSplineT + 1.0) % 1.0;
      const dist = playerPos.distanceTo(h.position);

      // Warning Trigger: approaching hazard within 2.5 seconds at current speed (or ~150 meters)
      const warningWindowM = Math.max(60, Math.min(220, playerSpeed * 1.8));
      if (deltaT > 0 && deltaT < 0.08 && dist < warningWindowM) {
        h.isWarningActive = true;
        if (dist < minDistance) {
          minDistance = dist;
          const timeRemaining = Math.max(0.2, dist / Math.max(30, playerSpeed));
          mostUrgentWarning = {
            active: true,
            hazardName: h.name,
            distanceMeters: Math.round(dist),
            avoidanceAdvice: h.avoidanceWindow,
            warningColor: h.color,
            timeRemainingSec: parseFloat(timeRemaining.toFixed(1)),
          };
        }
      } else {
        h.isWarningActive = false;
      }

      // Collision Check with controlled damage rules and fair invulnerability cooldown
      if (dist < h.radius + 2.2) {
        if (this.playerInvulnerableCooldown <= 0) {
          this.playerInvulnerableCooldown = 1.6; // 1.6s safe grace window
          sound.playShieldHit();
          if (onTakeDamage) {
            onTakeDamage(h.damage, h.name);
          }
        }
      }
    }

    // Audio warning alert (beeps every 0.65s while warning is active)
    if (mostUrgentWarning && now - this.lastWarningAudioTime > 650) {
      this.lastWarningAudioTime = now;
      sound.playHazardWarning();
    }

    this.currentWarning = mostUrgentWarning;
    return mostUrgentWarning;
  }

  public clear() {
    while (this.hazardGroup.children.length > 0) {
      const child = this.hazardGroup.children[0];
      this.hazardGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }
    this.hazards = [];
    this.currentWarning = null;
    this.playerInvulnerableCooldown = 0;
  }
}
