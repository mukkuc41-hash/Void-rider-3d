import * as THREE from 'three';

/**
 * Quality levels for the Massive Black Hole Environment
 */
export type BlackHoleQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'MOBILE';

export interface BlackHoleEnvironmentOptions {
  position?: THREE.Vector3;
  scale?: number;
  quality?: BlackHoleQuality;
  submode10Optimized?: boolean;
}

/**
 * MASSIVE SUPERMASSIVE BLACK HOLE ENVIRONMENT
 * 
 * Reusable, ultra-realistic 3D environment landmark for Void-Rider 3D:
 * - Pure pitch-black event horizon shadow (Schwarzschild radius)
 * - Relativistic accretion disk with multi-octave striated plasma streams
 * - Upper and lower gravitational lensing arcs (Einstein ring / warped back-disk)
 * - Razor-sharp photon sphere ring with blazing white-gold luminescence
 * - Subtle inner ISCO blue/violet gravitational redshift fringe
 * - Relativistic Doppler beaming (approaching side significantly hotter & brighter)
 * - Volumetric accretion coronal haze and turbulent cosmic gas wisps
 * - Infalling high-energy orbital plasma sparks and relativistic streamers
 * - Multi-layered foreground and midground cosmic dust/floating embers for 3D parallax
 * - Deep-space dark starfield with spectral temperature distribution and faint nebulae
 * - Dynamic environmental lighting radiating warm fiery plasma illumination onto nearby space & ships
 * - Scalable performance tiers (LOW, MEDIUM, HIGH, ULTRA, MOBILE) with zero FPS degradation
 */
export class MassiveBlackHoleEnvironment {
  public root: THREE.Group;
  public eventHorizonMesh: THREE.Mesh;
  public equatorialDiskMesh: THREE.Mesh;
  public upperLensedArcMesh: THREE.Mesh;
  public lowerLensedArcMesh: THREE.Mesh;
  public photonRingMesh: THREE.Mesh;
  public iscoGlowMesh: THREE.Mesh;
  public gravitationalLensMesh: THREE.Mesh;
  public coronaHazeGroup: THREE.Group;
  public orbitalPlasmaPoints: THREE.Points;
  public foregroundEmbersPoints: THREE.Points;
  public deepSpaceStarsPoints: THREE.Points;
  public distantGalaxiesGroup: THREE.Group;
  public coreLight: THREE.PointLight;
  public rimLight: THREE.DirectionalLight;

  private scene: THREE.Scene;
  private quality: BlackHoleQuality;
  private instability = 0.0;
  private isCollapsing = false;
  private collapseProgress = 0.0;
  private baseRotationSpeed = 0.55;
  private timeUniform = { value: 0.0 };

  private diskMaterial!: THREE.ShaderMaterial;
  private lensedArcMaterial!: THREE.ShaderMaterial;
  private photonRingMaterial!: THREE.ShaderMaterial;
  private iscoMaterial!: THREE.ShaderMaterial;
  private coronaMaterial!: THREE.ShaderMaterial;
  private lensDistortionMaterial!: THREE.ShaderMaterial;
  private plasmaParticlesMaterial!: THREE.PointsMaterial;
  private embersMaterial!: THREE.PointsMaterial;

  // Particle positions & velocities for animated infalling embers
  private plasmaParticlePositions!: Float32Array;
  private plasmaParticleRadii!: Float32Array;
  private plasmaParticleAngles!: Float32Array;
  private plasmaParticleSpeeds!: Float32Array;
  private plasmaCount = 2000;

  private embersPositions!: Float32Array;
  private embersVelocities!: Float32Array;
  private embersCount = 800;

  constructor(scene: THREE.Scene, options: BlackHoleEnvironmentOptions = {}) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'MassiveBlackHoleEnvironment';

    // Auto-detect mobile environment if not explicitly set
    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.quality = options.quality ?? (isMobileDevice ? 'MOBILE' : 'HIGH');

    // Default position: towering in the deep space forward-upper vista
    const initialPos = options.position ?? new THREE.Vector3(0, 260, -3600);
    this.root.position.copy(initialPos);

    const baseScale = options.scale ?? 1.0;
    this.root.scale.set(baseScale, baseScale, baseScale);

    // Dynamic diagonal composition matching reference image
    // Tilted around X (~68°) and Z (~-18°) for commanding diagonal cross-section
    this.root.rotation.x = 0.32;
    this.root.rotation.z = -0.14;

    // Apply performance profile
    this.configureQualityCounts();

    // 1. Core Environmental Lighting (Plasma Illumination on World)
    this.coreLight = new THREE.PointLight(0xff7722, 4.5, 4500, 1.2);
    this.coreLight.position.set(0, 0, 0);
    this.root.add(this.coreLight);

    this.rimLight = new THREE.DirectionalLight(0xffaa44, 2.0);
    this.rimLight.position.set(-600, 300, 800);
    this.root.add(this.rimLight);

    // 2. Pure Pitch-Black Event Horizon (Zero surface reflection, absorbs all light)
    const horizonRadius = 310;
    const horizonGeo = new THREE.SphereGeometry(
      horizonRadius,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 32 : 64,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 24 : 48
    );
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      fog: false,
    });
    this.eventHorizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    this.eventHorizonMesh.renderOrder = 2; // Renders after back disk, before front disk
    this.root.add(this.eventHorizonMesh);

    // 3. Innermost Stable Circular Orbit (ISCO) Gravitational Blue/Violet Fringe
    const iscoGeo = new THREE.RingGeometry(horizonRadius * 1.002, horizonRadius * 1.08, 64);
    this.iscoMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uColorViolet: { value: new THREE.Color(0x38bdf8) },
        uColorDeep: { value: new THREE.Color(0x4c1d95) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorViolet;
        uniform vec3 uColorDeep;
        varying vec2 vUv;

        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float pulse = 0.5 + 0.5 * sin(angle * 4.0 - uTime * 3.0);
          float alpha = smoothstep(0.0, 0.4, dist) * smoothstep(1.0, 0.5, dist);
          vec3 col = mix(uColorDeep, uColorViolet, pulse);
          gl_FragColor = vec4(col, alpha * 0.75);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.iscoGlowMesh = new THREE.Mesh(iscoGeo, this.iscoMaterial);
    this.iscoGlowMesh.rotation.x = Math.PI / 2;
    this.root.add(this.iscoGlowMesh);

    // 4. Razor-Sharp Photon Sphere Ring
    const photonRingGeo = new THREE.RingGeometry(horizonRadius * 1.02, horizonRadius * 1.14, 96);
    this.photonRingMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uInstability: { value: 0.0 },
        uColorInner: { value: new THREE.Color(0xffffff) },
        uColorOuter: { value: new THREE.Color(0xffaa22) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uInstability;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;
        varying vec2 vUv;

        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          float ring = smoothstep(0.1, 0.55, dist) * smoothstep(1.0, 0.65, dist);
          float shimmer = 0.8 + 0.2 * sin(atan(vUv.y - 0.5, vUv.x - 0.5) * 8.0 - uTime * 4.0);
          vec3 col = mix(uColorInner, uColorOuter, dist);
          col += vec3(1.0) * pow(shimmer, 3.0) * (0.5 + uInstability);
          gl_FragColor = vec4(col, ring * shimmer * 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.photonRingMesh = new THREE.Mesh(photonRingGeo, this.photonRingMaterial);
    this.photonRingMesh.rotation.x = Math.PI / 2;
    this.root.add(this.photonRingMesh);

    // 5. Equatorial Primary Relativistic Accretion Disk
    const innerRadius = horizonRadius * 1.15;
    const outerRadius = horizonRadius * 6.8; // Huge expanse
    const diskSegments = this.quality === 'LOW' || this.quality === 'MOBILE' ? 64 : 128;
    const diskRings = this.quality === 'LOW' || this.quality === 'MOBILE' ? 16 : 32;
    const diskGeo = new THREE.RingGeometry(innerRadius, outerRadius, diskSegments, diskRings);

    this.diskMaterial = this.createRelativisticAccretionMaterial(false);
    this.equatorialDiskMesh = new THREE.Mesh(diskGeo, this.diskMaterial);
    // Tilted equatorial plane crossing right across the black hole center
    this.equatorialDiskMesh.rotation.x = Math.PI / 2.45;
    this.equatorialDiskMesh.renderOrder = 3;
    this.root.add(this.equatorialDiskMesh);

    // 6. Upper & Lower Gravitational Lensing Arches (Iconic Einstein Halo)
    // In relativistic ray-tracing, light from behind the black hole is bent
    // over the top and under the bottom into sweeping circular halos!
    const arcRadiusInner = horizonRadius * 1.04;
    const arcRadiusOuter = horizonRadius * 2.85;
    const arcGeo = new THREE.RingGeometry(arcRadiusInner, arcRadiusOuter, diskSegments, 16);

    this.lensedArcMaterial = this.createRelativisticAccretionMaterial(true);
    this.upperLensedArcMesh = new THREE.Mesh(arcGeo, this.lensedArcMaterial);
    // Facing the camera, slightly rotated to produce the asymmetric lensed crest
    this.upperLensedArcMesh.rotation.x = 0.08;
    this.upperLensedArcMesh.position.z = -12; // Just behind horizon
    this.upperLensedArcMesh.renderOrder = 1;
    this.root.add(this.upperLensedArcMesh);

    this.lowerLensedArcMesh = new THREE.Mesh(arcGeo.clone(), this.lensedArcMaterial);
    this.lowerLensedArcMesh.rotation.x = -0.15;
    this.lowerLensedArcMesh.rotation.z = Math.PI;
    this.lowerLensedArcMesh.scale.set(0.92, 0.72, 1.0);
    this.lowerLensedArcMesh.position.z = -14;
    this.lowerLensedArcMesh.renderOrder = 1;
    this.root.add(this.lowerLensedArcMesh);

    // 7. Volumetric Accretion Corona & Nebular Gas Wisps
    this.coronaHazeGroup = new THREE.Group();
    this.createVolumetricCorona(horizonRadius);
    this.root.add(this.coronaHazeGroup);

    // 8. Gravitational Lensing Refraction Shell
    const lensShellGeo = new THREE.SphereGeometry(
      horizonRadius * 1.6,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 24 : 48,
      this.quality === 'LOW' || this.quality === 'MOBILE' ? 16 : 32
    );
    this.lensDistortionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uInstability: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uInstability;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = 1.0 - abs(dot(normal, viewDir));
          fresnel = pow(fresnel, 2.8);

          // Ethereal relativistic chromatic ring
          vec3 lensColor = vec3(0.12, 0.45, 0.95) * (1.0 - fresnel * 0.5) + vec3(0.95, 0.45, 0.1) * fresnel;
          float alpha = fresnel * (0.28 + uInstability * 0.35);

          gl_FragColor = vec4(lensColor, clamp(alpha, 0.0, 0.8));
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.gravitationalLensMesh = new THREE.Mesh(lensShellGeo, this.lensDistortionMaterial);
    this.root.add(this.gravitationalLensMesh);

    // 9. Infalling High-Energy Orbital Plasma Sparks
    this.orbitalPlasmaPoints = this.createOrbitalPlasmaParticles(horizonRadius);
    this.root.add(this.orbitalPlasmaPoints);

    // 10. Foreground Cosmic Embers & Debris (Dynamic Parallax)
    this.foregroundEmbersPoints = this.createForegroundEmbers();
    this.root.add(this.foregroundEmbersPoints);

    // 11. Deep Space High-Density Starfield & Distant Galaxies
    this.deepSpaceStarsPoints = this.createDeepSpaceStars();
    this.root.add(this.deepSpaceStarsPoints);

    this.distantGalaxiesGroup = new THREE.Group();
    this.createDistantGalaxies();
    this.root.add(this.distantGalaxiesGroup);

    // Add to main scene
    scene.add(this.root);
  }

  /**
   * Sets particle counts based on quality tier for high performance
   */
  private configureQualityCounts(): void {
    switch (this.quality) {
      case 'MOBILE':
        this.plasmaCount = 450;
        this.embersCount = 180;
        break;
      case 'LOW':
        this.plasmaCount = 650;
        this.embersCount = 280;
        break;
      case 'MEDIUM':
        this.plasmaCount = 1200;
        this.embersCount = 500;
        break;
      case 'ULTRA':
        this.plasmaCount = 3500;
        this.embersCount = 1400;
        break;
      case 'HIGH':
      default:
        this.plasmaCount = 2000;
        this.embersCount = 800;
        break;
    }
  }

  /**
   * Procedural ShaderMaterial for the Relativistic Accretion Disk & Lensed Arcs:
   * Features Keplerian differential rotation, multi-octave plasma turbulence,
   * relativistic Doppler beaming, white-hot core, and ruby-red dusty perimeter.
   */
  private createRelativisticAccretionMaterial(isLensedArc: boolean): THREE.ShaderMaterial {
    const isMobile = this.quality === 'MOBILE' || this.quality === 'LOW';

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.timeUniform,
        uSpeed: { value: 1.0 },
        uInstability: { value: 0.0 },
        uIsLensed: { value: isLensedArc ? 1.0 : 0.0 },
        uColorCore: { value: new THREE.Color('#fff9ee') },     // White-hot inner core
        uColorYellow: { value: new THREE.Color('#ffcc11') },   // Solar yellow
        uColorOrange: { value: new THREE.Color('#ff5500') },   // Blazing orange
        uColorRed: { value: new THREE.Color('#b30e00') },      // Deep crimson
        uColorViolet: { value: new THREE.Color('#6d28d9') },   // Relativistic fringe
        uColorDust: { value: new THREE.Color('#1c0702') },     // Smoky outer dust
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uInstability;
        uniform float uIsLensed;
        uniform vec3 uColorCore;
        uniform vec3 uColorYellow;
        uniform vec3 uColorOrange;
        uniform vec3 uColorRed;
        uniform vec3 uColorViolet;
        uniform vec3 uColorDust;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        // Optimized fast pseudo-noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p) * 2.0;
          float theta = atan(p.y, p.x);

          // Keplerian differential rotation: inner radius orbits much faster
          float kepler = pow(clamp(r, 0.15, 1.0), -1.35);
          float effectiveSpeed = uSpeed * (1.0 + uInstability * 2.5);
          float theta_rot = theta - uTime * 0.85 * effectiveSpeed * kepler;

          // Multi-frequency striated plasma streams
          float logR = log(r * 5.0 + 1.0);
          float stream1 = sin(theta_rot * 14.0 - logR * 18.0 + noise(vec2(logR * 8.0, theta_rot * 3.0)) * 4.0);
          float stream2 = sin(theta_rot * 28.0 + logR * 10.0 + noise(vec2(logR * 14.0, theta_rot * 6.0)) * 3.0);
          float stream3 = sin(theta_rot * 56.0 - logR * 32.0);

          ${isMobile ? `
            float striations = stream1 * 0.65 + stream2 * 0.35;
          ` : `
            float striations = stream1 * 0.5 + stream2 * 0.35 + stream3 * 0.15;
          `}
          striations = striations * 0.5 + 0.5;

          // Relativistic Doppler beaming:
          // Approaching side (left) is amplified and hotter; receding side (right) is dimmer and redder
          float doppler = 1.0 + 0.95 * (-sin(theta_rot));
          doppler = clamp(doppler, 0.3, 2.3);

          // Radial color transitions: ISCO -> White Core -> Solar Yellow -> Fiery Orange -> Crimson -> Smoky Dust
          vec3 col;
          if (r < 0.18) {
            float k = smoothstep(0.0, 0.18, r);
            col = mix(uColorViolet, uColorCore, k);
          } else if (r < 0.38) {
            float k = smoothstep(0.18, 0.38, r);
            col = mix(uColorCore, uColorYellow, k);
          } else if (r < 0.68) {
            float k = smoothstep(0.38, 0.68, r);
            col = mix(uColorYellow, uColorOrange, k);
          } else if (r < 0.88) {
            float k = smoothstep(0.68, 0.88, r);
            col = mix(uColorOrange, uColorRed, k);
          } else {
            float k = smoothstep(0.88, 1.0, r);
            col = mix(uColorRed, uColorDust, k);
          }

          // Apply striations & Doppler luminescence
          col += vec3(1.0, 0.92, 0.7) * pow(striations, 2.6) * (0.8 + uInstability * 1.2);
          col *= doppler;

          // Radial alpha profile: sharp inner horizon shadow, smooth outer dissipation
          float alphaInner = smoothstep(0.08, 0.18, r);
          float alphaOuter = smoothstep(1.0, 0.72, r);
          float alpha = alphaInner * alphaOuter;
          alpha *= (0.7 + 0.3 * striations);
          alpha = clamp(alpha * doppler * (0.92 + uInstability * 0.08), 0.0, 1.0);

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
  }

  /**
   * Volumetric coronal haze wrapping around the black hole equator
   */
  private createVolumetricCorona(horizonRadius: number): void {
    const coronaCount = this.quality === 'LOW' || this.quality === 'MOBILE' ? 6 : 14;
    const hazeGeo = new THREE.PlaneGeometry(horizonRadius * 7.5, horizonRadius * 7.5);

    // Procedural soft glowing radial texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
      grad.addColorStop(0.0, 'rgba(255, 120, 20, 0.45)');
      grad.addColorStop(0.3, 'rgba(235, 60, 10, 0.25)');
      grad.addColorStop(0.65, 'rgba(160, 20, 5, 0.12)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const hazeTexture = new THREE.CanvasTexture(canvas);

    this.coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: hazeTexture },
        uTime: this.timeUniform,
        uInstability: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uInstability;
        varying vec2 vUv;

        void main() {
          vec4 tex = texture2D(uTexture, vUv);
          float pulse = 0.85 + 0.15 * sin(uTime * 1.8);
          gl_FragColor = vec4(tex.rgb * (1.0 + uInstability * 0.8), tex.a * pulse * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    for (let i = 0; i < coronaCount; i++) {
      const mesh = new THREE.Mesh(hazeGeo, this.coronaMaterial);
      mesh.rotation.z = (i / coronaCount) * Math.PI * 2;
      mesh.rotation.x = Math.PI / 2.3 + (Math.random() - 0.5) * 0.25;
      mesh.scale.setScalar(0.85 + Math.random() * 0.45);
      this.coronaHazeGroup.add(mesh);
    }
  }

  /**
   * Infalling high-energy orbital plasma sparks spiraling into the vortex
   */
  private createOrbitalPlasmaParticles(horizonRadius: number): THREE.Points {
    const geo = new THREE.BufferGeometry();
    this.plasmaParticlePositions = new Float32Array(this.plasmaCount * 3);
    this.plasmaParticleRadii = new Float32Array(this.plasmaCount);
    this.plasmaParticleAngles = new Float32Array(this.plasmaCount);
    this.plasmaParticleSpeeds = new Float32Array(this.plasmaCount);
    const colors = new Float32Array(this.plasmaCount * 3);

    const minR = horizonRadius * 1.1;
    const maxR = horizonRadius * 6.5;

    for (let i = 0; i < this.plasmaCount; i++) {
      const radius = minR + Math.pow(Math.random(), 1.6) * (maxR - minR);
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.8 + Math.random() * 0.6) * Math.pow(horizonRadius / radius, 1.4);

      this.plasmaParticleRadii[i] = radius;
      this.plasmaParticleAngles[i] = angle;
      this.plasmaParticleSpeeds[i] = speed;

      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * (radius * 0.08); // Slight vertical turbulence
      const z = Math.sin(angle) * radius;

      this.plasmaParticlePositions[i * 3] = x;
      this.plasmaParticlePositions[i * 3 + 1] = y;
      this.plasmaParticlePositions[i * 3 + 2] = z;

      // Color based on distance: inner = white/yellow, outer = orange/red
      const normDist = (radius - minR) / (maxR - minR);
      if (normDist < 0.25) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.75;
      } else if (normDist < 0.65) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.55;
        colors[i * 3 + 2] = 0.1;
      } else {
        colors[i * 3] = 0.85;
        colors[i * 3 + 1] = 0.15;
        colors[i * 3 + 2] = 0.05;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.plasmaParticlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.plasmaParticlesMaterial = new THREE.PointsMaterial({
      size: this.quality === 'MOBILE' ? 8 : 12,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    const points = new THREE.Points(geo, this.plasmaParticlesMaterial);
    points.rotation.x = Math.PI / 2.45;
    return points;
  }

  /**
   * Foreground and midground floating embers & space dust providing 3D depth
   */
  private createForegroundEmbers(): THREE.Points {
    const geo = new THREE.BufferGeometry();
    this.embersPositions = new Float32Array(this.embersCount * 3);
    this.embersVelocities = new Float32Array(this.embersCount * 3);
    const colors = new Float32Array(this.embersCount * 3);

    for (let i = 0; i < this.embersCount; i++) {
      // Distributed across the space corridor in front of the black hole
      this.embersPositions[i * 3] = (Math.random() - 0.5) * 4000;
      this.embersPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      this.embersPositions[i * 3 + 2] = 200 + Math.random() * 2800; // Between player and black hole

      this.embersVelocities[i * 3] = (Math.random() - 0.5) * 8;
      this.embersVelocities[i * 3 + 1] = (Math.random() - 0.5) * 6;
      this.embersVelocities[i * 3 + 2] = -12 - Math.random() * 25; // Drifting toward black hole

      // Warm fiery embers
      const colRand = Math.random();
      if (colRand < 0.4) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.7;
        colors[i * 3 + 2] = 0.2;
      } else if (colRand < 0.8) {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.35;
        colors[i * 3 + 2] = 0.05;
      } else {
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 1.0; // Rare ionization spark
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.embersPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.embersMaterial = new THREE.PointsMaterial({
      size: this.quality === 'MOBILE' ? 5 : 7,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    return new THREE.Points(geo, this.embersMaterial);
  }

  /**
   * Deep space high-density starfield with spectral temperature distribution
   */
  private createDeepSpaceStars(): THREE.Points {
    const starCount = this.quality === 'MOBILE' ? 1200 : this.quality === 'LOW' ? 2200 : 5000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Distant sphere shell
      const r = 5500 + Math.random() * 2500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Star spectral classes (O, B, A, F, G, K, M)
      const spec = Math.random();
      if (spec < 0.25) {
        // Hot blue-white stars
        colors[i * 3] = 0.75;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1.0;
      } else if (spec < 0.65) {
        // Pure white stars
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (spec < 0.85) {
        // Yellow-orange stars
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.55;
      } else {
        // Red giants
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.45;
        colors[i * 3 + 2] = 0.35;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: this.quality === 'MOBILE' ? 2.5 : 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    return new THREE.Points(geo, starMat);
  }

  /**
   * Distant faint galaxies and cosmic dust clouds
   */
  private createDistantGalaxies(): void {
    if (this.quality === 'MOBILE') return;

    const galaxyCount = 5;
    for (let i = 0; i < galaxyCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
        grad.addColorStop(0.0, 'rgba(255, 230, 200, 0.45)');
        grad.addColorStop(0.4, 'rgba(120, 160, 255, 0.18)');
        grad.addColorStop(0.8, 'rgba(180, 80, 220, 0.06)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat);
      const angle = (i / galaxyCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 6000 + Math.random() * 1000;
      plane.position.set(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 3000,
        Math.sin(angle) * dist
      );
      plane.lookAt(0, 0, 0);
      this.distantGalaxiesGroup.add(plane);
    }
  }

  /**
   * Sets dynamic catastrophe instability (0.0 to 1.0)
   */
  public setInstability(level: number): void {
    this.instability = THREE.MathUtils.clamp(level, 0.0, 1.0);
    this.diskMaterial.uniforms.uInstability.value = this.instability;
    this.lensedArcMaterial.uniforms.uInstability.value = this.instability;
    this.photonRingMaterial.uniforms.uInstability.value = this.instability;
    this.coronaMaterial.uniforms.uInstability.value = this.instability;
    this.lensDistortionMaterial.uniforms.uInstability.value = this.instability;

    this.baseRotationSpeed = 0.55 + this.instability * 2.8;
    this.diskMaterial.uniforms.uSpeed.value = 1.0 + this.instability * 3.5;
    this.lensedArcMaterial.uniforms.uSpeed.value = 1.0 + this.instability * 3.5;

    // Flare environmental lighting
    this.coreLight.intensity = 4.5 + this.instability * 6.0;
    this.rimLight.intensity = 2.0 + this.instability * 3.5;
  }

  /**
   * Triggers terminal cosmological collapse animation
   */
  public triggerCollapse(): void {
    this.isCollapsing = true;
    this.collapseProgress = 0.0;
  }

  /**
   * Sets graphic quality tier at runtime
   */
  public setQuality(quality: BlackHoleQuality): void {
    if (this.quality === quality) return;
    this.quality = quality;
    this.configureQualityCounts();
  }

  /**
   * Per-frame update loop
   */
  public update(dt: number, cameraPosition?: THREE.Vector3): void {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.timeUniform.value += delta * this.baseRotationSpeed;

    // Subtle breathing rotation on accretion disk & arches
    this.equatorialDiskMesh.rotation.z += delta * 0.12 * this.baseRotationSpeed;
    this.upperLensedArcMesh.rotation.z += delta * 0.08 * this.baseRotationSpeed;
    this.lowerLensedArcMesh.rotation.z -= delta * 0.08 * this.baseRotationSpeed;

    // Infalling plasma particles animation
    if (this.orbitalPlasmaPoints && this.plasmaParticlePositions) {
      const posAttr = this.orbitalPlasmaPoints.geometry.attributes.position as THREE.BufferAttribute;
      const count = this.plasmaCount;
      const minR = 310 * 1.1;
      const maxR = 310 * 6.5;

      for (let i = 0; i < count; i++) {
        // Accelerating differential rotation
        this.plasmaParticleAngles[i] += delta * this.plasmaParticleSpeeds[i] * (1.0 + this.instability * 2.0);
        // Slow infalling spiral
        this.plasmaParticleRadii[i] -= delta * (12.0 + this.instability * 30.0);

        if (this.plasmaParticleRadii[i] <= minR) {
          // Re-spawn at outer boundary
          this.plasmaParticleRadii[i] = maxR * (0.85 + Math.random() * 0.15);
          this.plasmaParticleAngles[i] = Math.random() * Math.PI * 2;
        }

        const r = this.plasmaParticleRadii[i];
        const a = this.plasmaParticleAngles[i];
        this.plasmaParticlePositions[i * 3] = Math.cos(a) * r;
        this.plasmaParticlePositions[i * 3 + 2] = Math.sin(a) * r;
      }
      posAttr.needsUpdate = true;
    }

    // Foreground floating embers parallax motion
    if (this.foregroundEmbersPoints && this.embersPositions) {
      const emberAttr = this.foregroundEmbersPoints.geometry.attributes.position as THREE.BufferAttribute;
      const eCount = this.embersCount;

      for (let i = 0; i < eCount; i++) {
        this.embersPositions[i * 3] += this.embersVelocities[i * 3] * delta;
        this.embersPositions[i * 3 + 1] += this.embersVelocities[i * 3 + 1] * delta;
        this.embersPositions[i * 3 + 2] += this.embersVelocities[i * 3 + 2] * delta;

        // Reset if drifted past the event horizon
        if (this.embersPositions[i * 3 + 2] <= -300) {
          this.embersPositions[i * 3] = (Math.random() - 0.5) * 4000;
          this.embersPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
          this.embersPositions[i * 3 + 2] = 2500 + Math.random() * 800;
        }
      }
      emberAttr.needsUpdate = true;
    }

    // Dynamic light pulsing
    this.coreLight.intensity = (4.5 + Math.sin(this.timeUniform.value * 2.4) * 0.6) * (1.0 + this.instability * 1.5);

    // Terminal Collapse inward contraction
    if (this.isCollapsing) {
      this.collapseProgress += delta * 0.28;
      const s = Math.max(0.01, 1.0 - this.collapseProgress * 0.92);
      this.equatorialDiskMesh.scale.set(s, s, s);
      this.upperLensedArcMesh.scale.set(s, s, s);
      this.lowerLensedArcMesh.scale.set(s, s, s);
      this.eventHorizonMesh.scale.set(s, s, s);
      this.photonRingMesh.scale.set(s * 1.4, s * 1.4, s * 1.4);
      this.orbitalPlasmaPoints.scale.set(s, s, s);
    }
  }

  /**
   * Clean memory disposal
   */
  public dispose(): void {
    this.scene.remove(this.root);
    this.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });
  }
}
