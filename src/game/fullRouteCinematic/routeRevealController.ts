import * as THREE from 'three';
import { CosmicTrack } from '../trackData';
import { ExtendedPathConfig } from '../extendedPath/extendedPathTypes';

export class RouteRevealController {
  private scene: THREE.Scene;
  private ribbonGroup: THREE.Group = new THREE.Group();
  private markerSprites: THREE.Sprite[] = [];
  private pulseUniforms: { time: { value: number } } = { time: { value: 0 } };
  private energyRibbon: THREE.Line | null = null;
  private checkpointRings: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.ribbonGroup.name = 'route_cinematic_highlights';
    this.scene.add(this.ribbonGroup);
  }

  public buildRouteHighlights(track: CosmicTrack, config: ExtendedPathConfig) {
    this.clear();

    // 1. Build Glowing Track Centerline Energy Line
    const sampleCount = 180;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const s = track.getSampleAt(t);
      points.push(s.point.clone().addScaledVector(s.normal, 1.2));
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.energyRibbon = new THREE.Line(lineGeo, lineMat);
    this.ribbonGroup.add(this.energyRibbon);

    // 2. Build Sector Gate Visuals & 3D Waypoint Labels
    const sectorCount = config.sectors.length;
    config.sectors.forEach((sec, idx) => {
      const sample = track.getSampleAt(sec.startT);
      const gateGroup = this.createSectorGateMesh(sec.name, sec.environment, sample);
      this.ribbonGroup.add(gateGroup);

      const labelSprite = this.createSectorLabelSprite(
        `SECTOR 0${idx + 1}`,
        sec.name,
        sec.environment
      );
      labelSprite.position.copy(sample.point).addScaledVector(sample.normal, 18);
      this.ribbonGroup.add(labelSprite);
      this.markerSprites.push(labelSprite);
    });

    // 3. Highlight Branch Junctions
    config.branches.forEach((br, idx) => {
      const junctionSample = track.getSampleAt(br.entryT);
      const branchSprite = this.createSectorLabelSprite(
        'ALT ROUTE JUNCTION',
        br.name,
        'BRANCH'
      );
      branchSprite.position.copy(junctionSample.point).addScaledVector(junctionSample.normal, 12);
      this.ribbonGroup.add(branchSprite);
      this.markerSprites.push(branchSprite);
    });

    // 4. Highlight Checkpoint Rings
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const sample = track.getSampleAt(t);
      const ringGeo = new THREE.TorusGeometry(12, 0.4, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xffea00 : 0x00f0ff,
        transparent: true,
        opacity: 0.6,
        wireframe: true,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(sample.point);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);
      this.ribbonGroup.add(ring);
      this.checkpointRings.push(ring);
    }
  }

  private createSectorGateMesh(
    name: string,
    envType: string,
    sample: { point: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3 }
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.copy(sample.point);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sample.tangent);

    const archGeo = new THREE.TorusGeometry(18, 0.6, 8, 24, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = -Math.PI / 2;
    group.add(arch);

    return group;
  }

  private createSectorLabelSprite(prefix: string, name: string, type: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(5, 12, 24, 0.88)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, 364, 124, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 20px "Orbitron", sans-serif';
      ctx.fillText(prefix.toUpperCase(), 24, 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Orbitron", sans-serif';
      ctx.fillText(name.toUpperCase(), 24, 82);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`STATUS: ACTIVE // ${type}`, 24, 114);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(24, 8.8, 1);
    return sprite;
  }

  public update(dt: number) {
    this.pulseUniforms.time.value += dt;

    // Pulse checkpoint rings
    const pulse = 1.0 + Math.sin(this.pulseUniforms.time.value * 3.0) * 0.1;
    this.checkpointRings.forEach(ring => {
      ring.scale.set(pulse, pulse, pulse);
    });
  }

  public setVisible(visible: boolean) {
    this.ribbonGroup.visible = visible;
  }

  public clear() {
    while (this.ribbonGroup.children.length > 0) {
      const obj = this.ribbonGroup.children[0];
      this.ribbonGroup.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Sprite) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    }
    this.markerSprites = [];
    this.checkpointRings = [];
    this.energyRibbon = null;
  }

  public dispose() {
    this.clear();
    this.scene.remove(this.ribbonGroup);
  }
}
