import * as THREE from 'three';
import { EnvironmentZone, EnvironmentType } from './extendedPathTypes';

export class EnvironmentManager {
  private scene: THREE.Scene;
  private zones: EnvironmentZone[] = [];

  // 3 Depth Layer Groups
  public nearGroup: THREE.Group;
  public midGroup: THREE.Group;
  public farGroup: THREE.Group;

  // Lighting References
  private ambientLight: THREE.AmbientLight | null = null;
  private dirLight: THREE.DirectionalLight | null = null;

  // Active Blended Properties
  private currentFogColor = new THREE.Color(0x050515);
  private currentFogDensity = 0.0005;
  private currentAmbientColor = new THREE.Color(0x223366);
  private currentSunColor = new THREE.Color(0x00f0ff);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nearGroup = new THREE.Group();
    this.nearGroup.name = 'env_layer_near';
    this.midGroup = new THREE.Group();
    this.midGroup.name = 'env_layer_mid';
    this.farGroup = new THREE.Group();
    this.farGroup.name = 'env_layer_far';

    this.scene.add(this.nearGroup);
    this.scene.add(this.midGroup);
    this.scene.add(this.farGroup);

    // Locate or create scene lights
    this.scene.traverse(child => {
      if (child instanceof THREE.AmbientLight && !this.ambientLight) {
        this.ambientLight = child;
      } else if (child instanceof THREE.DirectionalLight && !this.dirLight) {
        this.dirLight = child;
      }
    });

    if (!this.ambientLight) {
      this.ambientLight = new THREE.AmbientLight(0x223366, 1.2);
      this.scene.add(this.ambientLight);
    }
    if (!this.dirLight) {
      this.dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
      this.dirLight.position.set(200, 350, 150);
      this.scene.add(this.dirLight);
    }
  }

  public initEnvironment(zones: EnvironmentZone[], curve: THREE.Curve<THREE.Vector3>) {
    this.disposeProps();
    this.zones = zones;

    if (zones.length > 0) {
      const first = zones[0];
      this.currentFogColor.setHex(first.fogColor);
      this.currentFogDensity = first.fogDensity;
      this.currentAmbientColor.setHex(first.ambientColor);
      this.currentSunColor.setHex(first.sunColor);
    }

    this.buildLayerProps(curve);
  }

  private buildLayerProps(curve: THREE.Curve<THREE.Vector3>) {
    // 1. NEAR LAYER: Holographic route pylons along track
    const pylonGeo = new THREE.CylinderGeometry(0.3, 0.5, 9, 6);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9,
    });
    const beaconGeo = new THREE.SphereGeometry(0.7, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const pylonCount = 20;
    for (let i = 0; i < pylonCount; i++) {
      const t = (i / pylonCount) % 1.0;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const bin = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const pylonLeft = new THREE.Mesh(pylonGeo, pylonMat);
      pylonLeft.position.copy(pt).addScaledVector(bin, -16).add(new THREE.Vector3(0, 4, 0));
      const beaconL = new THREE.Mesh(beaconGeo, beaconMat);
      beaconL.position.set(0, 4.8, 0);
      pylonLeft.add(beaconL);
      this.nearGroup.add(pylonLeft);

      const pylonRight = new THREE.Mesh(pylonGeo, pylonMat);
      pylonRight.position.copy(pt).addScaledVector(bin, 16).add(new THREE.Vector3(0, 4, 0));
      const beaconR = new THREE.Mesh(beaconGeo, beaconMat);
      beaconR.position.set(0, 4.8, 0);
      pylonRight.add(beaconR);
      this.nearGroup.add(pylonRight);
    }

    // 2. MID LAYER: Space station modules & giant asteroid formations
    const stationGeo = new THREE.TorusGeometry(60, 8, 12, 32);
    const stationMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8,
    });

    for (let i = 0; i < 4; i++) {
      const t = (0.15 + i * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      const ringMesh = new THREE.Mesh(stationGeo, stationMat);
      ringMesh.position.copy(pt).add(new THREE.Vector3((i % 2 === 0 ? 1 : -1) * 180, 70, (i - 2) * 120));
      ringMesh.rotation.set(0.4 * i, 0.7 * i, 0.2);
      this.midGroup.add(ringMesh);
    }

    // 3. FAR LAYER: Colossal celestial body (Gas giant / Dyson ring)
    const planetGeo = new THREE.SphereGeometry(600, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(0, -500, -2800);
    this.farGroup.add(planetMesh);

    // Planetary ring
    const ringGeo = new THREE.RingGeometry(850, 1400, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const planetRing = new THREE.Mesh(ringGeo, ringMat);
    planetRing.rotation.x = Math.PI * 0.38;
    planetRing.position.copy(planetMesh.position);
    this.farGroup.add(planetRing);
  }

  /**
   * Update active lighting, fog, and celestial rotation based on player progress
   */
  public update(dt: number, playerSplineT: number) {
    if (this.zones.length === 0) return;

    // Find current zone
    let activeZone = this.zones[0];
    let nextZone = this.zones[0];
    let zoneBlend = 0;

    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (playerSplineT >= z.startT && playerSplineT <= z.endT) {
        activeZone = z;
        nextZone = this.zones[(i + 1) % this.zones.length];
        const span = Math.max(0.001, z.endT - z.startT);
        zoneBlend = Math.max(0, (playerSplineT - (z.endT - span * 0.25)) / (span * 0.25));
        break;
      }
    }

    // Smoothly interpolate colors
    const targetFogCol = new THREE.Color(activeZone.fogColor).lerp(new THREE.Color(nextZone.fogColor), zoneBlend);
    const targetFogDens = THREE.MathUtils.lerp(activeZone.fogDensity, nextZone.fogDensity, zoneBlend);
    const targetAmbCol = new THREE.Color(activeZone.ambientColor).lerp(new THREE.Color(nextZone.ambientColor), zoneBlend);
    const targetSunCol = new THREE.Color(activeZone.sunColor).lerp(new THREE.Color(nextZone.sunColor), zoneBlend);

    this.currentFogColor.lerp(targetFogCol, dt * 2.0);
    this.currentFogDensity = THREE.MathUtils.lerp(this.currentFogDensity, targetFogDens, dt * 2.0);
    this.currentAmbientColor.lerp(targetAmbCol, dt * 2.0);
    this.currentSunColor.lerp(targetSunCol, dt * 2.0);

    // Apply to scene fog & lights
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.density = this.currentFogDensity;
    }
    if (this.ambientLight) {
      this.ambientLight.color.copy(this.currentAmbientColor);
    }
    if (this.dirLight) {
      this.dirLight.color.copy(this.currentSunColor);
    }

    // Slow celestial rotation
    this.farGroup.rotation.y += dt * 0.008;
    this.midGroup.rotation.y += dt * 0.003;
  }

  public disposeProps() {
    [this.nearGroup, this.midGroup, this.farGroup].forEach(grp => {
      while (grp.children.length > 0) {
        const obj = grp.children[0];
        grp.remove(obj);
        obj.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
      }
    });
  }
}
