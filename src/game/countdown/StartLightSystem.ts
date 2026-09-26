import * as THREE from 'three';
import { GameMode } from '../../types';

export type StartLightState = 'OFF' | 'RED' | 'YELLOW' | 'RED_YELLOW' | 'GREEN' | 'GO';

export class StartLightSystem {
  public group: THREE.Group = new THREE.Group();
  private scene: THREE.Scene;
  private mode: GameMode = 'NEON_CIRCUIT';
  private currentState: StartLightState = 'OFF';

  // Light meshes
  private redLightMesh: THREE.Mesh | null = null;
  private yellowLightMesh: THREE.Mesh | null = null;
  private greenLightMesh: THREE.Mesh | null = null;

  // Emissive materials
  private redMat: THREE.MeshStandardMaterial | null = null;
  private yellowMat: THREE.MeshStandardMaterial | null = null;
  private greenMat: THREE.MeshStandardMaterial | null = null;

  // Point lights for track illumination
  private redPointLight: THREE.PointLight | null = null;
  private yellowPointLight: THREE.PointLight | null = null;
  private greenPointLight: THREE.PointLight | null = null;

  // 3D holographic countdown number mesh / sprite
  private countdownGroup: THREE.Group = new THREE.Group();
  private countdownCanvas: HTMLCanvasElement;
  private countdownContext: CanvasRenderingContext2D | null;
  private countdownTexture: THREE.CanvasTexture | null = null;
  private countdownSprite: THREE.Sprite | null = null;
  private currentDisplayedNumber: number | null = null;

  // Animation timers
  private pulseTimer: number = 0;
  private isGoActive: boolean = false;
  private goScale: number = 1.0;
  private particlesGroup: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group.name = 'start_light_system_3d';
    this.countdownGroup.name = 'start_light_countdown_3d';
    this.particlesGroup.name = 'start_light_particles';

    // Canvas for sharp 3D holographic projection
    this.countdownCanvas = document.createElement('canvas');
    this.countdownCanvas.width = 512;
    this.countdownCanvas.height = 512;
    this.countdownContext = this.countdownCanvas.getContext('2d');
  }

  public buildForMode(
    mode: GameMode,
    anchorPos: THREE.Vector3,
    tangent: THREE.Vector3,
    normal: THREE.Vector3,
    binormal: THREE.Vector3
  ) {
    this.cleanup();
    this.mode = mode;

    this.group = new THREE.Group();
    this.group.name = `start_light_${mode}`;

    // Base frame structure
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0c101d,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Emissive bulb materials
    this.redMat = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0x000000,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });

    this.yellowMat = new THREE.MeshStandardMaterial({
      color: 0x332200,
      emissive: 0x000000,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });

    this.greenMat = new THREE.MeshStandardMaterial({
      color: 0x003311,
      emissive: 0x000000,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });

    // Point lights
    this.redPointLight = new THREE.PointLight(0xff0033, 0, 35);
    this.yellowPointLight = new THREE.PointLight(0xffbb00, 0, 35);
    this.greenPointLight = new THREE.PointLight(0x00ff66, 0, 45);

    // Build mode-specific physical housing (48.11)
    this.buildHousingForMode(mode, frameMat);

    // Build 3D Holographic Countdown Sprite
    this.buildCountdownSprite();

    // Position and orient the entire assembly
    const rotMatrix = new THREE.Matrix4();
    rotMatrix.makeBasis(binormal, normal, tangent);
    this.group.setRotationFromMatrix(rotMatrix);

    // Mount above track at start gate
    const gantryHeight = 15;
    const gantryForward = 2;
    const finalPos = anchorPos
      .clone()
      .addScaledVector(normal, gantryHeight)
      .addScaledVector(tangent, gantryForward);
    this.group.position.copy(finalPos);

    this.scene.add(this.group);
    this.scene.add(this.particlesGroup);

    // Initial state: OFF
    this.setLightState('OFF');
  }

  private buildHousingForMode(mode: GameMode, frameMat: THREE.Material) {
    const housingGroup = new THREE.Group();
    const lightRadius = 1.25;

    // Default vertical housing box
    let boxWidth = 5.5;
    let boxHeight = 14;
    let boxDepth = 2.4;

    switch (mode) {
      case 'NEON_CIRCUIT': {
        // Floating holographic neon tower with cyan/magenta accents
        const housingGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const housingMesh = new THREE.Mesh(housingGeo, frameMat);
        housingGroup.add(housingMesh);

        // Neon side rails
        const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const leftRail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, boxHeight + 2, 8), railMat);
        leftRail.position.set(-boxWidth / 2 - 0.4, 0, 0);
        housingGroup.add(leftRail);

        const rightRail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, boxHeight + 2, 8), railMat);
        rightRail.position.set(boxWidth / 2 + 0.4, 0, 0);
        housingGroup.add(rightRail);
        break;
      }

      case 'ASTEROID_RUN': {
        // Industrial race-control beacon with hazard stripes
        const housingGeo = new THREE.BoxGeometry(6.5, boxHeight, 3.2);
        const housingMesh = new THREE.Mesh(housingGeo, frameMat);
        housingGroup.add(housingMesh);

        // Steel protective cage ribs
        const cageMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.3 });
        for (let i = -1; i <= 1; i++) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.18, 6, 16), cageMat);
          rib.position.set(0, i * 4.2, 0);
          housingGroup.add(rib);
        }
        break;
      }

      case 'WORMHOLE_EXPRESS': {
        // Suspended energy rings inside the wormhole
        const housingGeo = new THREE.CylinderGeometry(2.8, 3.2, boxHeight, 16);
        const housingMesh = new THREE.Mesh(housingGeo, frameMat);
        housingGroup.add(housingMesh);

        // Swirling tachyon ring
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x9900ff });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.25, 8, 24), ringMat);
        ring.position.set(0, 0, 0);
        housingGroup.add(ring);
        break;
      }

      case 'SOLAR_STORM': {
        // Orbital station solar launch lights with solar sail wings
        const housingGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const housingMesh = new THREE.Mesh(housingGeo, frameMat);
        housingGroup.add(housingMesh);

        // Gold solar collector panels on both sides
        const solarMat = new THREE.MeshStandardMaterial({ color: 0xff7700, roughness: 0.1, metalness: 0.95 });
        const leftSail = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.3), solarMat);
        leftSail.position.set(-6, 0, 0);
        housingGroup.add(leftSail);

        const rightSail = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.3), solarMat);
        rightSail.position.set(6, 0, 0);
        housingGroup.add(rightSail);
        break;
      }

      case 'GRAVITY_FREE': {
        // Floating zero-G gyroscopic light cluster
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
        for (let r = 0; r < 2; r++) {
          const gyroRing = new THREE.Mesh(new THREE.TorusGeometry(4.5 + r * 1.5, 0.18, 8, 24), ringMat);
          gyroRing.rotation.x = (r * Math.PI) / 3;
          gyroRing.rotation.y = (r * Math.PI) / 4;
          housingGroup.add(gyroRing);
        }
        break;
      }

      case 'PLASMA_STORM': {
        // Electrical plasma light structure with high-voltage arc coils
        const housingMesh = new THREE.Mesh(new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth), frameMat);
        housingGroup.add(housingMesh);

        const coilMat = new THREE.MeshBasicMaterial({ color: 0xcc00ff });
        for (let i = 0; i < 4; i++) {
          const coil = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.15, 6, 16), coilMat);
          coil.position.set(0, -4.5 + i * 3, 0);
          housingGroup.add(coil);
        }
        break;
      }

      case 'SKYLINE_RUSH': {
        // Giant skyscraper starting signal gantry
        const housingMesh = new THREE.Mesh(new THREE.BoxGeometry(boxWidth * 1.3, boxHeight, boxDepth), frameMat);
        housingGroup.add(housingMesh);

        const neonSpireMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.6, 6, 8), neonSpireMat);
        spire.position.set(0, boxHeight / 2 + 3, 0);
        housingGroup.add(spire);
        break;
      }

      case 'RING_RUNNER': {
        // Orbital ring-mounted lights
        const arcMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const arc = new THREE.Mesh(new THREE.TorusGeometry(12, 0.4, 8, 32, Math.PI), arcMat);
        arc.position.set(0, -4, 0);
        housingGroup.add(arc);
        break;
      }

      case 'HYPERSPACE_SPRINT': {
        // Acceleration chamber launch indicators
        const housingMesh = new THREE.Mesh(new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth), frameMat);
        housingGroup.add(housingMesh);

        const injectorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        for (let side of [-1, 1]) {
          const fin = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5, 4), injectorMat);
          fin.position.set(side * 4, 0, 0);
          fin.rotation.z = side * (Math.PI / 4);
          housingGroup.add(fin);
        }
        break;
      }

      case 'RIVAL_DUEL': {
        // Two opposing launch towers
        const leftTower = new THREE.Mesh(new THREE.BoxGeometry(3, boxHeight, 2), frameMat);
        leftTower.position.set(-6, 0, 0);
        housingGroup.add(leftTower);

        const rightTower = new THREE.Mesh(new THREE.BoxGeometry(3, boxHeight, 2), frameMat);
        rightTower.position.set(6, 0, 0);
        housingGroup.add(rightTower);

        // Cross-beam laser connector
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
        beam.rotation.z = Math.PI / 2;
        beam.position.set(0, boxHeight / 2, 0);
        housingGroup.add(beam);
        break;
      }

      case 'VOID_CHAMPIONSHIP': {
        // Massive championship stadium starting-light tower
        const housingMesh = new THREE.Mesh(new THREE.BoxGeometry(8, boxHeight + 4, 3.5), frameMat);
        housingGroup.add(housingMesh);

        // Gold stadium crown
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xffe600, metalness: 0.9, roughness: 0.2 });
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 4.5, 2.5, 8), crownMat);
        crown.position.set(0, (boxHeight + 4) / 2 + 1.25, 0);
        housingGroup.add(crown);
        break;
      }

      default: {
        // High-tech universal standard housing
        const housingGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const housingMesh = new THREE.Mesh(housingGeo, frameMat);
        housingGroup.add(housingMesh);
        break;
      }
    }

    // Three Lights: Top (RED), Middle (YELLOW), Bottom (GREEN)
    const bulbGeo = new THREE.SphereGeometry(lightRadius, 24, 24);
    const bulbZ = boxDepth / 2 + 0.3;

    // RED BULB (Top: y = 4)
    this.redLightMesh = new THREE.Mesh(bulbGeo, this.redMat!);
    this.redLightMesh.position.set(0, 4, bulbZ);
    housingGroup.add(this.redLightMesh);
    if (this.redPointLight) {
      this.redLightMesh.add(this.redPointLight);
    }

    // YELLOW BULB (Middle: y = 0)
    this.yellowLightMesh = new THREE.Mesh(bulbGeo, this.yellowMat!);
    this.yellowLightMesh.position.set(0, 0, bulbZ);
    housingGroup.add(this.yellowLightMesh);
    if (this.yellowPointLight) {
      this.yellowLightMesh.add(this.yellowPointLight);
    }

    // GREEN BULB (Bottom: y = -4)
    this.greenLightMesh = new THREE.Mesh(bulbGeo, this.greenMat!);
    this.greenLightMesh.position.set(0, -4, bulbZ);
    housingGroup.add(this.greenLightMesh);
    if (this.greenPointLight) {
      this.greenLightMesh.add(this.greenPointLight);
    }

    this.group.add(housingGroup);
  }

  private buildCountdownSprite() {
    this.countdownTexture = new THREE.CanvasTexture(this.countdownCanvas);
    this.countdownTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.countdownTexture,
      transparent: true,
      depthWrite: false,
    });

    this.countdownSprite = new THREE.Sprite(spriteMat);
    // Position floating in front of and slightly below the lights
    this.countdownSprite.position.set(0, 0, 7);
    this.countdownSprite.scale.set(16, 16, 1);
    this.countdownSprite.visible = false;

    this.countdownGroup.add(this.countdownSprite);
    this.group.add(this.countdownGroup);
  }

  /**
   * Sets the 3D traffic light state
   */
  public setLightState(state: StartLightState) {
    this.currentState = state;

    if (!this.redMat || !this.yellowMat || !this.greenMat) return;

    // Reset all to unlit base
    this.redMat.emissive.setHex(0x000000);
    this.redMat.emissiveIntensity = 0.15;
    this.yellowMat.emissive.setHex(0x000000);
    this.yellowMat.emissiveIntensity = 0.15;
    this.greenMat.emissive.setHex(0x000000);
    this.greenMat.emissiveIntensity = 0.15;

    if (this.redPointLight) this.redPointLight.intensity = 0;
    if (this.yellowPointLight) this.yellowPointLight.intensity = 0;
    if (this.greenPointLight) this.greenPointLight.intensity = 0;

    switch (state) {
      case 'OFF':
        break;

      case 'RED':
        this.redMat.emissive.setHex(0xff0033);
        this.redMat.emissiveIntensity = 2.8;
        if (this.redPointLight) this.redPointLight.intensity = 4.5;
        break;

      case 'YELLOW':
        this.yellowMat.emissive.setHex(0xffbb00);
        this.yellowMat.emissiveIntensity = 3.2;
        if (this.yellowPointLight) this.yellowPointLight.intensity = 5.0;
        break;

      case 'RED_YELLOW':
        // 48.8 FINAL RED/YELLOW STATE (Anticipation)
        this.redMat.emissive.setHex(0xff0033);
        this.redMat.emissiveIntensity = 2.8;
        this.yellowMat.emissive.setHex(0xffbb00);
        this.yellowMat.emissiveIntensity = 3.2;
        if (this.redPointLight) this.redPointLight.intensity = 4.0;
        if (this.yellowPointLight) this.yellowPointLight.intensity = 4.0;
        break;

      case 'GREEN':
      case 'GO':
        this.greenMat.emissive.setHex(0x00ff66);
        this.greenMat.emissiveIntensity = 3.8;
        if (this.greenPointLight) this.greenPointLight.intensity = 7.0;
        if (state === 'GO') {
          this.triggerGoBlast();
        }
        break;
    }
  }

  /**
   * Renders the 3D holographic countdown number or GO!
   */
  public setCountdownNumber(num: number | null, mode: GameMode) {
    this.currentDisplayedNumber = num;
    if (num === null) {
      if (this.countdownSprite) this.countdownSprite.visible = false;
      return;
    }

    if (!this.countdownContext || !this.countdownSprite) return;

    this.countdownSprite.visible = true;
    const ctx = this.countdownContext;
    ctx.clearRect(0, 0, 512, 512);

    const isGo = num === 0;
    const text = isGo ? 'GO!' : num.toString();

    // Palette based on countdown state & mode
    let mainColor = '#00f0ff';
    let glowColor = '#00f0ff';
    if (num === 3) {
      mainColor = '#ff2244';
      glowColor = '#ff0033';
    } else if (num === 2) {
      mainColor = '#ffbb00';
      glowColor = '#ffaa00';
    } else if (num === 1) {
      mainColor = '#ffee33';
      glowColor = '#ffcc00';
    } else if (isGo) {
      mainColor = '#00ff66';
      glowColor = '#39ff14';
    }

    // Draw futuristic holographic radial ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(256, 256, 190, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 10;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 35;
    ctx.stroke();

    // Draw inner dashed ring
    ctx.beginPath();
    ctx.setLineDash([16, 12]);
    ctx.arc(256, 256, 215, 0, Math.PI * 2);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw big 3D number with layered glow
    ctx.font = isGo ? '900 160px "Chakra Petch", "Rajdhani", monospace' : '900 240px "Chakra Petch", "Rajdhani", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Layer 1: Glow drop shadow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 45;
    ctx.fillStyle = mainColor;
    ctx.fillText(text, 256, 256);

    // Layer 2: Sharp white core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 256, 256);

    // Sublabel
    ctx.font = '700 26px "Share Tech Mono", monospace';
    ctx.fillStyle = mainColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor;
    const sub = isGo ? 'SYSTEMS ENGAGED' : `GRID PREPARATION // SEC ${num}`;
    ctx.fillText(sub, 256, 420);

    ctx.restore();

    if (this.countdownTexture) {
      this.countdownTexture.needsUpdate = true;
    }

    // Scale pop-in
    this.countdownSprite.scale.set(isGo ? 20 : 16, isGo ? 20 : 16, 1);
  }

  private triggerGoBlast() {
    this.isGoActive = true;
    this.goScale = 1.0;

    // Spawn 24 launch burst spark particles around the starting light
    for (let i = 0; i < 24; i++) {
      const pGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const p = new THREE.Mesh(pGeo, pMat);

      p.position.copy(this.group.position);
      const angle = (i / 24) * Math.PI * 2;
      const speed = 15 + Math.random() * 20;

      p.userData = {
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.2) * speed * 0.8,
          Math.sin(angle) * speed
        ),
        life: 0.85,
        maxLife: 0.85,
      };

      this.particlesGroup.add(p);
    }
  }

  public update(dt: number) {
    this.pulseTimer += dt;

    // Pulse active lights
    if (this.currentState === 'YELLOW' && this.yellowMat && this.yellowPointLight) {
      const pulse = 0.5 + 0.5 * Math.sin(this.pulseTimer * 12);
      this.yellowMat.emissiveIntensity = 2.5 + pulse * 1.5;
      this.yellowPointLight.intensity = 4.0 + pulse * 2.0;
    }

    if (this.currentState === 'RED_YELLOW' && this.redMat && this.yellowMat) {
      const pulse = 0.5 + 0.5 * Math.sin(this.pulseTimer * 18);
      this.redMat.emissiveIntensity = 2.5 + pulse * 1.0;
      this.yellowMat.emissiveIntensity = 2.8 + pulse * 1.2;
    }

    if (this.currentState === 'GREEN' && this.greenMat && this.greenPointLight) {
      const pulse = 0.85 + 0.15 * Math.sin(this.pulseTimer * 8);
      this.greenMat.emissiveIntensity = 3.5 * pulse;
      this.greenPointLight.intensity = 6.5 * pulse;
    }

    // Animate GO pop & fade
    if (this.isGoActive && this.countdownSprite) {
      this.goScale += dt * 4.5;
      const alpha = Math.max(0, 1.0 - (this.goScale - 1.0) / 1.5);
      this.countdownSprite.scale.set(20 * this.goScale, 20 * this.goScale, 1);
      (this.countdownSprite.material as THREE.SpriteMaterial).opacity = alpha;

      if (alpha <= 0.01) {
        this.countdownSprite.visible = false;
        this.isGoActive = false;
      }
    }

    // Update burst particles
    for (let i = this.particlesGroup.children.length - 1; i >= 0; i--) {
      const p = this.particlesGroup.children[i] as THREE.Mesh;
      if (!p.userData) continue;

      p.userData.life -= dt;
      if (p.userData.life <= 0) {
        this.particlesGroup.remove(p);
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      } else {
        p.position.addScaledVector(p.userData.vel, dt);
        const ratio = p.userData.life / p.userData.maxLife;
        p.scale.set(ratio, ratio, ratio);
      }
    }
  }

  public cleanup() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    if (this.particlesGroup.parent) {
      this.particlesGroup.parent.remove(this.particlesGroup);
    }

    // Clear particles
    while (this.particlesGroup.children.length > 0) {
      const p = this.particlesGroup.children[0] as THREE.Mesh;
      this.particlesGroup.remove(p);
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    }

    if (this.countdownTexture) {
      this.countdownTexture.dispose();
    }

    this.group.clear();
  }
}
