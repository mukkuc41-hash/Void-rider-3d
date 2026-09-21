import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  SHIP_REGISTRY,
  UPGRADE_CATALOG,
  THRUSTER_FLAME_CONFIGS,
  getEffectiveShipStats,
  createShipMesh,
  ShipConfig,
} from '../game/ships';
import {
  ShipDecalType,
  ShipUpgrades,
  ThrusterFlameColor,
  CockpitSkin,
  UpgradeType,
  BeamCustomization,
  BeamUpgrades,
  BeamType,
  BeamCoreShape,
  BeamImpactPreset,
  BeamSoundPreset,
} from '../types';
import { DEFAULT_BEAM_CUSTOMIZATION, DEFAULT_BEAM_UPGRADES } from '../game/beamSystem';
import { sound } from '../game/audio';
import {
  ArrowLeft,
  Sparkles,
  Check,
  Zap,
  Gauge,
  Shield,
  RotateCcw,
  Palette,
  Wind,
  Coins,
  Crosshair,
  Flame,
  Radio,
  Sliders,
  Volume2,
  Save,
  Layers,
  Activity,
} from 'lucide-react';

interface GarageViewProps {
  currentShipId: string;
  currentColor: string;
  currentSecondaryColor?: string;
  currentDecal?: ShipDecalType;
  currentThrusterColor?: ThrusterFlameColor;
  currentCockpitSkin?: CockpitSkin;
  currentUpgrades: ShipUpgrades;
  currentBeamCustomization?: BeamCustomization;
  currentBeamUpgrades?: BeamUpgrades;
  unlockedShips: string[];
  credits: number;
  playerLevel: number;
  pilotName?: string;
  onUpdatePilotName?: (name: string) => void;
  onSelectShip: (shipId: string) => void;
  onSelectColor: (color: string) => void;
  onSelectSecondaryColor: (color: string) => void;
  onSelectDecal: (decal: ShipDecalType) => void;
  onSelectThrusterColor: (flame: ThrusterFlameColor) => void;
  onSelectCockpitSkin: (skin: CockpitSkin) => void;
  onPurchaseUpgrade: (type: UpgradeType, cost: number) => void;
  onUpdateBeamCustomization?: (customization: BeamCustomization) => void;
  onPurchaseBeamUpgrade?: (upgradeKey: keyof BeamUpgrades, cost: number) => void;
  onUnlockShip: (shipId: string, cost: number) => void;
  onBack: () => void;
}

const PRIMARY_COLORS = [
  { name: 'Neon Cyan', hex: '#00f0ff' },
  { name: 'Solar Orange', hex: '#ff6600' },
  { name: 'Emerald Green', hex: '#00ff66' },
  { name: 'Vivid Magenta', hex: '#ff00e5' },
  { name: 'Crimson Red', hex: '#ff2244' },
  { name: 'Solar Yellow', hex: '#ffea00' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Stealth Slate', hex: '#334155' },
  { name: 'Deep Violet', hex: '#8b5cf6' },
];

const SECONDARY_COLORS = [
  { name: 'Vivid Magenta', hex: '#ff00e5' },
  { name: 'Neon Cyan', hex: '#00f0ff' },
  { name: 'Emerald Green', hex: '#00ff66' },
  { name: 'Solar Orange', hex: '#ff6600' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Solar Gold', hex: '#ffaa00' },
];

const THRUSTER_COLORS: { id: ThrusterFlameColor; name: string; hex: string }[] = [
  { id: 'neon_cyan', name: 'Neon Cyan', hex: '#00f0ff' },
  { id: 'solar_gold', name: 'Solar Orange', hex: '#ff6600' },
  { id: 'plasma_violet', name: 'Plasma Violet', hex: '#d000ff' },
  { id: 'emerald_hyper', name: 'Emerald Hyper', hex: '#00ff66' },
  { id: 'solar_gold', name: 'Crimson Surge', hex: '#ff2244' },
  { id: 'solar_gold', name: 'Solar Gold', hex: '#ffaa00' },
];

const DECALS_LIST: { id: ShipDecalType; name: string; desc: string }[] = [
  {
    id: 'none',
    name: 'Stealth Carbon',
    desc: 'Factory aero-carbon hull with zero outer markings.',
  },
  {
    id: 'racing_stripes',
    name: 'Twin Velocity Stripes',
    desc: 'Dual high-contrast neon stripes through fuselage center.',
  },
  {
    id: 'hazard_chevrons',
    name: 'Hyper Chevrons',
    desc: 'Kinetic hazard directional arrows for high-speed aerodynamics.',
  },
  {
    id: 'vortex_wings',
    name: 'Vortex Wings',
    desc: 'Curved plasma wing flare motifs radiating neon power.',
  },
  {
    id: 'apex_predator',
    name: 'Apex Predator',
    desc: 'Aggressive lightning fangs insignia reserved for circuit masters.',
  },
  {
    id: 'carbon_hex',
    name: 'Carbon Nano-Hex',
    desc: 'Holographic hexagonal lattice pattern with refractive underglow.',
  },
];

const UPGRADES_LIST = [
  {
    id: 'engine' as UpgradeType,
    name: 'Ion Pulse Core',
    category: '(Top Speed)',
    desc: 'Upgrades antimatter ignition flow to increase top velocity on straights.',
    boostText: '+40 KM/H',
    maxLevel: 4,
    cost: 850,
  },
  {
    id: 'handling' as UpgradeType,
    name: 'Grav-Inverter Thrusters',
    category: '(Handling & Drift)',
    desc: 'Stabilizes magnetic lateral thrusters for tighter drift radius and response.',
    boostText: '+32% Handling',
    maxLevel: 4,
    cost: 750,
  },
  {
    id: 'boost' as UpgradeType,
    name: 'Antimatter Nitro Injector',
    category: '(Nitro Boost Power)',
    desc: 'Overclocks plasma capacitor banks for stronger boost acceleration and capacity.',
    boostText: '+32% Boost',
    maxLevel: 4,
    cost: 950,
  },
  {
    id: 'chassis' as UpgradeType,
    name: 'Aero-Carbon Chassis',
    category: '(Acceleration)',
    desc: 'Reduces mass and aerodynamic drag for blistering off-the-line launch...',
    boostText: '+32% Accel',
    maxLevel: 4,
    cost: 900,
  },
  {
    id: 'shieldDuration' as UpgradeType,
    name: 'Phase Shield Matrix',
    category: '(Shield Duration)',
    desc: 'Extends Phase Shield invulnerability duration when activated from power-up pods.',
    boostText: '+8.0s Duration',
    maxLevel: 4,
    cost: 650,
  },
  {
    id: 'magnetRange' as UpgradeType,
    name: 'Credit Magnet Array',
    category: '(Magnet Field Radius)',
    desc: 'Expands the electromagnetic pull radius to draw distant floating space credits.',
    boostText: '+48m Radius',
    maxLevel: 4,
    cost: 700,
  },
  {
    id: 'hyperBoostSpeed' as UpgradeType,
    name: 'Hyper-Boost Surge Overclock',
    category: '(Hyper Surge Speed)',
    desc: 'Supercharges the instant velocity surge and auto-alignment glide speed of Hyper...',
    boostText: '+80 KM/H Warp',
    maxLevel: 4,
    cost: 1100,
  },
];

const BEAM_EMITTER_TYPES: { id: BeamType; name: string; desc: string; stats: string }[] = [
  {
    id: 'STANDARD',
    name: 'Standard Pulse-Laser',
    desc: 'Balanced military-grade collimated particle beam for versatile asteroid vaporization.',
    stats: '100% DMG | 100% Heat | Balanced Range',
  },
  {
    id: 'PLASMA',
    name: 'Plasma Arc Emitter',
    desc: 'Superheated ionized gas channel delivering extreme continuous thermal destruction.',
    stats: '140% DMG | +15% Heat | High Disruption',
  },
  {
    id: 'LASER',
    name: 'Precision Laser Lance',
    desc: 'Thin, ultra-coherent photon ray with extreme pinpoint cutting accuracy down track.',
    stats: '115% DMG | -15% Heat | Long Range',
  },
  {
    id: 'VOID',
    name: 'Void Graviton Singularity',
    desc: 'Dark central singularity surrounded by violet gravitational corona.',
    stats: '150% DMG | +25% Heat | Heavy Shock',
  },
  {
    id: 'PULSE',
    name: 'High-Frequency Burst',
    desc: 'Rapid cyclic burst beam with accelerated cooling and high fire rate for dense asteroid swarms.',
    stats: '85% DMG | -25% Heat | +35% Cycle Rate',
  },
  {
    id: 'ARC',
    name: 'Arc Lightning Discharge',
    desc: 'Crackling electrical discharge that arcs directly through asteroid fissures.',
    stats: '120% DMG | 100% Heat | Erratic Corona',
  },
  {
    id: 'PHOTON',
    name: 'Photon Cascade Emitter',
    desc: 'Blinding white-hot core with radiant outer solar sheath for maximum luminance.',
    stats: '130% DMG | +10% Heat | Max Luminance',
  },
  {
    id: 'QUANTUM',
    name: 'Quantum Lance (Heavy)',
    desc: 'Massive focused antimatter beam that disintegrates dense planetary mantle rock in seconds.',
    stats: '175% DMG | +40% Heat | Heavy Recoil',
  },
];

const BEAM_CORE_SHAPES: { id: BeamCoreShape; name: string; desc: string }[] = [
  { id: 'THIN', name: 'Thin Pencil', desc: 'Ultra-narrow focused beam' },
  { id: 'STANDARD', name: 'Standard Column', desc: 'Balanced cylindrical energy beam' },
  { id: 'WIDE', name: 'Wide Cannon', desc: 'Broad heavy tactical beam' },
  { id: 'DOUBLE', name: 'Twin Beams', desc: 'Dual parallel energy streams' },
  { id: 'TRIPLE', name: 'Triple Array', desc: 'Three converging energy conduits' },
  { id: 'SPIRAL', name: 'Helical Spiral', desc: 'Entwined rotating energy helix' },
  { id: 'SEGMENTED', name: 'Segmented Pulse', desc: 'Intermittent segmented laser path' },
  { id: 'PULSING', name: 'Pulsing Core', desc: 'Sinusoidally expanding energy column' },
];

const BEAM_COLOR_OPTIONS = [
  { name: 'Cyan', hex: '#00f0ff' },
  { name: 'Blue', hex: '#0066ff' },
  { name: 'Violet', hex: '#8b00ff' },
  { name: 'Magenta', hex: '#ff00aa' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#ff1133' },
  { name: 'Green', hex: '#00ff66' },
  { name: 'Gold', hex: '#ffaa00' },
];

const BEAM_IMPACT_PRESETS: { id: BeamImpactPreset; name: string; desc: string }[] = [
  { id: 'ENERGY_BURST', name: 'Energy Burst', desc: 'Radiant particle flash & cyan shockwave' },
  { id: 'PLASMA_EXPLOSION', name: 'Plasma Explosion', desc: 'Superheated flare with fire shockwave' },
  { id: 'CRYSTAL_SHATTER', name: 'Crystal Shatter', desc: 'Brilliant diamond shards and frost ring' },
  { id: 'VOID_IMPLOSION', name: 'Void Implosion', desc: 'Gravitational collapse with violet rupture' },
  { id: 'ELECTRIC_BURST', name: 'Electric Burst', desc: 'Crackling lightning arcs & electric rings' },
  { id: 'FIREBALL', name: 'Fireball Flare', desc: 'Expanding fireball explosion and embers' },
  { id: 'QUANTUM_FRACTURE', name: 'Quantum Fracture', desc: 'Multi-color prism fracture and sparks' },
  { id: 'SHOCKWAVE', name: 'Mega Shockwave', desc: 'High-amplitude kinetic blast wave ring' },
];

const BEAM_SOUND_PRESETS: { id: BeamSoundPreset; name: string; desc: string }[] = [
  { id: 'HIGH_ENERGY_PULSE', name: 'High Energy Pulse', desc: 'Crisp futuristic military synthesizer' },
  { id: 'HEAVY_PLASMA', name: 'Heavy Plasma', desc: 'Deep bass thrum and roaring heat' },
  { id: 'RESONANT_LASER', name: 'Resonant Laser', desc: 'High-frequency harmonic sci-fi hum' },
  { id: 'VOID_SURGE', name: 'Void Surge', desc: 'Dark sub-bass warp and cosmic crackle' },
  { id: 'ARC_DISCHARGE', name: 'Arc Discharge', desc: 'Sharp electrical arc snap and zaps' },
];

const BEAM_UPGRADE_ITEMS = [
  {
    key: 'power' as keyof BeamUpgrades,
    name: 'Beam Power',
    category: '(Damage & DPS)',
    desc: 'Amplifies coherent photon flux to melt large asteroids significantly faster.',
    boostText: '+20% Damage/Tier',
    cost: 650,
  },
  {
    key: 'range' as keyof BeamUpgrades,
    name: 'Beam Range',
    category: '(Range & Reach)',
    desc: 'Precision dielectric lenses extend beam reach further down the racing line.',
    boostText: '+25m Reach/Tier',
    cost: 550,
  },
  {
    key: 'energyCapacity' as keyof BeamUpgrades,
    name: 'Beam Energy',
    category: '(Capacitor Capacity)',
    desc: 'High-density ultracapacitor banks extend continuous fire duration.',
    boostText: '+20% Energy/Tier',
    cost: 500,
  },
  {
    key: 'rechargeRate' as keyof BeamUpgrades,
    name: 'Recharge Rate',
    category: '(Capacitor Recovery)',
    desc: 'Rapid magnetic flux rechargers restore beam energy reservoir swiftly.',
    boostText: '+25% Recharge/Tier',
    cost: 500,
  },
  {
    key: 'fireRate' as keyof BeamUpgrades,
    name: 'Fire Rate',
    category: '(Tick Frequency)',
    desc: 'Accelerates damage tick frequency for rapid target vaporizing.',
    boostText: '+20% Frequency/Tier',
    cost: 550,
  },
  {
    key: 'cooling' as keyof BeamUpgrades,
    name: 'Cooling Efficiency',
    category: '(Thermal Dissipation)',
    desc: 'Liquid nitrogen heat pipes dissipate core thermal buildup quickly.',
    boostText: '+25% Cooling/Tier',
    cost: 600,
  },
  {
    key: 'impactForce' as keyof BeamUpgrades,
    name: 'Impact Force',
    category: '(Kinetic Dispersal)',
    desc: 'Boosts kinetic shatter force, clearing fragmented debris clear of ship path.',
    boostText: '+30% Force/Tier',
    cost: 450,
  },
  {
    key: 'targeting' as keyof BeamUpgrades,
    name: 'Targeting Lock',
    category: '(Auto-Aim & Cone)',
    desc: 'AI target tracking sensors widen auto-lock acquisition angle and reticle tracking.',
    boostText: '+25% Target Cone/Tier',
    cost: 550,
  },
];

export const GarageView: React.FC<GarageViewProps> = ({
  currentShipId,
  currentColor,
  currentSecondaryColor = '#ff6600',
  currentDecal = 'none',
  currentThrusterColor = 'solar_gold',
  currentCockpitSkin = 'cyber_stealth',
  currentUpgrades,
  currentBeamCustomization = DEFAULT_BEAM_CUSTOMIZATION,
  currentBeamUpgrades = DEFAULT_BEAM_UPGRADES,
  unlockedShips,
  credits,
  playerLevel,
  pilotName = 'Aditya',
  onUpdatePilotName,
  onSelectShip,
  onSelectColor,
  onSelectSecondaryColor,
  onSelectDecal,
  onSelectThrusterColor,
  onPurchaseUpgrade,
  onUpdateBeamCustomization,
  onPurchaseBeamUpgrade,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    'HULL_PAINT' | 'DECALS' | 'UPGRADES' | 'BEAM_LAB'
  >('HULL_PAINT');
  const [beamLabSubTab, setBeamLabSubTab] = useState<
    'EMITTER' | 'COLORS' | 'IMPACT_SOUND' | 'DYNAMICS' | 'OVERCLOCK'
  >('EMITTER');
  const [isTestFiring, setIsTestFiring] = useState(false);
  const isTestFiringRef = useRef(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const testFireTimeoutRef = useRef<number | null>(null);

  const previewBeamGroupRef = useRef<THREE.Group | null>(null);
  const dummyAsteroidRef = useRef<THREE.Mesh | null>(null);

  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const [callsign, setCallsign] = useState(pilotName);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shipGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const selectedShip = SHIP_REGISTRY.find(s => s.id === currentShipId) || SHIP_REGISTRY[1];
  const effectiveStats = getEffectiveShipStats(selectedShip, currentUpgrades);

  const activeDecalName =
    DECALS_LIST.find(d => d.id === currentDecal)?.name.toUpperCase() || 'NONE';

  // 3D Canvas initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 240;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 3, 20);
    cyanLight.position.set(-4, 3, 2);
    scene.add(cyanLight);

    const orangeLight = new THREE.PointLight(0xff6600, 3, 20);
    orangeLight.position.set(4, -2, -3);
    scene.add(orangeLight);

    // Glowing Platform Ring
    const ringGeo = new THREE.RingGeometry(2.6, 2.8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.2;
    scene.add(ring);

    // Ship instance
    const thrusterHex =
      THRUSTER_COLORS.find(t => t.id === currentThrusterColor)?.hex || '#ff6600';
    const ship = createShipMesh(
      currentShipId,
      currentColor,
      currentSecondaryColor,
      currentDecal as ShipDecalType,
      thrusterHex,
      currentCockpitSkin as CockpitSkin
    );
    ship.position.set(0, -0.6, 0);
    ship.rotation.y = Math.PI * 0.15;

    // Add forward beam emitter crystal & tactical point light
    const emitterColor = currentBeamCustomization?.outerColor || '#00f0ff';
    const emitterGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.45, 12);
    emitterGeo.rotateX(Math.PI / 2);
    const emitterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emitterColor),
      emissive: new THREE.Color(emitterColor),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const emitterMesh = new THREE.Mesh(emitterGeo, emitterMat);
    emitterMesh.position.set(0, 0.15, -2.4);
    ship.add(emitterMesh);

    const emitterLight = new THREE.PointLight(new THREE.Color(emitterColor), 3, 5);
    emitterLight.position.set(0, 0.15, -2.6);
    ship.add(emitterLight);

    // Forward beam test fire visual group & holographic dummy asteroid
    const asteroidGeo = new THREE.DodecahedronGeometry(0.75, 1);
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.85,
      metalness: 0.2,
      wireframe: false,
    });
    const dummyAsteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
    dummyAsteroid.position.set(0, -0.2, -5.8);
    scene.add(dummyAsteroid);
    dummyAsteroidRef.current = dummyAsteroid;

    const beamGroup = new THREE.Group();
    const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 8);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0, -1.7);
    beamGroup.add(coreMesh);

    const glowGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.4, 8);
    glowGeo.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.set(0, 0, -1.7);
    beamGroup.add(glowMesh);

    const impactMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    impactMesh.position.set(0, 0, -3.4);
    beamGroup.add(impactMesh);

    beamGroup.position.set(0, -0.45, -2.4);
    beamGroup.visible = false;
    scene.add(beamGroup);
    previewBeamGroupRef.current = beamGroup;

    scene.add(ship);
    shipGroupRef.current = ship;

    let animationFrameId: number;
    const animate = () => {
      if (shipGroupRef.current && !isDraggingRef.current) {
        shipGroupRef.current.rotation.y += 0.005;
      }
      if (dummyAsteroidRef.current) {
        dummyAsteroidRef.current.rotation.y += 0.012;
        dummyAsteroidRef.current.rotation.x += 0.008;
        if (isTestFiringRef.current) {
          dummyAsteroidRef.current.position.x = (Math.random() - 0.5) * 0.14;
          dummyAsteroidRef.current.position.y = -0.2 + (Math.random() - 0.5) * 0.14;
        }
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Mouse drag handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !shipGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      shipGroupRef.current.rotation.y += deltaX * 0.01;
      shipGroupRef.current.rotation.x += deltaY * 0.005;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, []);

  // Update 3D ship when customizations change
  useEffect(() => {
    if (!sceneRef.current) return;
    if (shipGroupRef.current) {
      sceneRef.current.remove(shipGroupRef.current);
    }

    const thrusterHex =
      THRUSTER_COLORS.find(t => t.id === currentThrusterColor)?.hex || '#ff6600';
    const newShip = createShipMesh(
      currentShipId,
      currentColor,
      currentSecondaryColor,
      currentDecal as ShipDecalType,
      thrusterHex,
      currentCockpitSkin as CockpitSkin
    );
    newShip.position.set(0, -0.6, 0);
    newShip.rotation.y = Math.PI * 0.15;

    // Add forward beam emitter crystal & tactical point light
    const emitterColor = currentBeamCustomization?.outerColor || '#00f0ff';
    const emitterGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.45, 12);
    emitterGeo.rotateX(Math.PI / 2);
    const emitterMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emitterColor),
      emissive: new THREE.Color(emitterColor),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const emitterMesh = new THREE.Mesh(emitterGeo, emitterMat);
    emitterMesh.position.set(0, 0.15, -2.4);
    newShip.add(emitterMesh);

    const emitterLight = new THREE.PointLight(new THREE.Color(emitterColor), 3, 5);
    emitterLight.position.set(0, 0.15, -2.6);
    newShip.add(emitterLight);

    sceneRef.current.add(newShip);
    shipGroupRef.current = newShip;
  }, [
    currentShipId,
    currentColor,
    currentSecondaryColor,
    currentDecal,
    currentThrusterColor,
    currentCockpitSkin,
    currentBeamCustomization?.outerColor,
  ]);

  const triggerTestFire = () => {
    if (isTestFiring) return;
    setIsTestFiring(true);
    isTestFiringRef.current = true;

    if (previewBeamGroupRef.current) {
      previewBeamGroupRef.current.visible = true;
      const coreColor = new THREE.Color(currentBeamCustomization?.coreColor || '#ffffff');
      const glowColor = new THREE.Color(currentBeamCustomization?.outerColor || '#00f0ff');
      const coreChild = previewBeamGroupRef.current.children[0] as THREE.Mesh;
      const glowChild = previewBeamGroupRef.current.children[1] as THREE.Mesh;
      const impactChild = previewBeamGroupRef.current.children[2] as THREE.Mesh;
      if (coreChild?.material instanceof THREE.MeshBasicMaterial) coreChild.material.color = coreColor;
      if (glowChild?.material instanceof THREE.MeshBasicMaterial) glowChild.material.color = glowColor;
      if (impactChild?.material instanceof THREE.MeshBasicMaterial) impactChild.material.color = glowColor;
    }

    sound.playBeamFire(
      currentBeamCustomization?.type || 'STANDARD',
      currentBeamCustomization?.soundPreset || 'HIGH_ENERGY_PULSE'
    );

    if (testFireTimeoutRef.current) clearTimeout(testFireTimeoutRef.current);
    testFireTimeoutRef.current = window.setTimeout(() => {
      setIsTestFiring(false);
      isTestFiringRef.current = false;
      if (previewBeamGroupRef.current) {
        previewBeamGroupRef.current.visible = false;
      }
      if (dummyAsteroidRef.current) {
        dummyAsteroidRef.current.position.set(0, -0.2, -5.8);
      }
      sound.playAsteroidDestroy('ENERGY');
    }, 1100);
  };

  const handleSaveLoadout = () => {
    sound.playMenuClick();
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2200);
  };

  const handleApplyChanges = () => {
    sound.playMenuClick();
    if (onUpdatePilotName && callsign.trim()) {
      onUpdatePilotName(callsign.trim());
    }
    setAppliedFeedback(true);
    setTimeout(() => {
      setAppliedFeedback(false);
      onBack();
    }, 450);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#050b14] overflow-y-auto text-slate-100 select-none p-3 sm:p-5">
      <div className="w-full max-w-xl mx-auto flex flex-col space-y-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playMenuClick();
                onBack();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#081222] border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-white font-ui font-black text-xs uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK</span>
            </button>
            <div>
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>HIGH-TECH SHIPYARD</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-ui font-black uppercase tracking-wider text-white">
                HYPER-GARAGE CUSTOMIZER
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Currency */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1404] border border-amber-500/50 shadow-[0_0_12px_rgba(255,180,0,0.2)]">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[8px] font-mono text-amber-400/80 uppercase">
                  VOID CREDITS
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {credits.toLocaleString()} VC
                </span>
              </div>
            </div>

            {/* Apply Changes Button */}
            <button
              onClick={handleApplyChanges}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:opacity-95 text-slate-950 font-ui font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{appliedFeedback ? 'APPLIED!' : 'APPLY CHANGES'}</span>
            </button>
          </div>
        </div>

        {/* 3 Customization Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('HULL_PAINT');
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'HULL_PAINT'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#081222] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>HULL & PAINT</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('DECALS');
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DECALS'
                ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]'
                : 'bg-[#081222] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>DECALS & LIVERY</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('UPGRADES');
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'UPGRADES'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'bg-[#081222] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>UPGRADES</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuClick();
              setActiveTab('BEAM_LAB');
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl font-ui font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'BEAM_LAB'
                ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 shadow-[0_0_15px_rgba(255,170,0,0.4)]'
                : 'bg-[#081222] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            <span>BEAM LAB</span>
          </button>
        </div>

        {/* Pilot Callsign Input */}
        <div className="p-3 rounded-2xl bg-[#070e1b] border border-slate-800 text-left">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
            PILOT CALLSIGN
          </label>
          <input
            type="text"
            value={callsign}
            onChange={e => setCallsign(e.target.value)}
            className="w-full bg-[#050b14] border border-cyan-500/30 rounded-xl px-3 py-1.5 font-ui font-black text-sm uppercase text-white tracking-wider focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* TAB 1: HULL & PAINT */}
        {activeTab === 'HULL_PAINT' && (
          <div className="space-y-4 text-left">
            {/* Select Spacecraft */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                SELECT SPACECRAFT
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SHIP_REGISTRY.map(ship => {
                  const isSelected = currentShipId === ship.id;
                  const dotColor =
                    ship.id === 'apex_phantom'
                      ? 'bg-cyan-400'
                      : ship.id === 'vortex_nemesis'
                      ? 'bg-orange-500'
                      : ship.id === 'solaris_stinger'
                      ? 'bg-emerald-400'
                      : ship.id === 'void_valkyrie'
                      ? 'bg-fuchsia-400'
                      : 'bg-rose-500';

                  return (
                    <button
                      key={ship.id}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectShip(ship.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#0a182f] border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                          : 'bg-[#070e1b] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-ui font-black text-xs uppercase tracking-wider text-white">
                          {ship.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 line-clamp-1">
                        {ship.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Hull Paint */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                PRIMARY HULL PAINT
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {PRIMARY_COLORS.map(c => {
                  const isChecked = currentColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectColor(c.hex);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 shadow-md relative"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: isChecked ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      }}
                      title={c.name}
                    >
                      {isChecked && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Underglow & Accent Hue */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                SECONDARY UNDERGLOW & ACCENT HUE
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {SECONDARY_COLORS.map(c => {
                  const isChecked = currentSecondaryColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectSecondaryColor(c.hex);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 shadow-md"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: isChecked ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      }}
                      title={c.name}
                    >
                      {isChecked && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thruster Exhaust Flame Hue */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>THRUSTER EXHAUST FLAME HUE</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {THRUSTER_COLORS.map((f, idx) => {
                  const isChecked = idx === 5 || currentThrusterColor === f.id;
                  return (
                    <button
                      key={`${f.hex}_${idx}`}
                      onClick={() => {
                        sound.playMenuClick();
                        onSelectThrusterColor(f.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 shadow-md"
                      style={{
                        backgroundColor: f.hex,
                        borderColor: isChecked ? '#ffffff' : 'rgba(255,255,255,0.2)',
                      }}
                      title={f.name}
                    >
                      {isChecked && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DECALS & LIVERY */}
        {activeTab === 'DECALS' && (
          <div className="space-y-2 text-left">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              CUSTOM LIVERY DECALS
            </div>

            {DECALS_LIST.map(d => {
              const isEquipped = currentDecal === d.id;

              return (
                <div
                  key={d.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isEquipped
                      ? 'bg-[#150a22] border-fuchsia-500/80 shadow-[0_0_15px_rgba(217,70,239,0.25)]'
                      : 'bg-[#070e1b] border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-ui font-black text-sm uppercase tracking-wider text-white">
                        {d.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{d.desc}</p>
                    </div>

                    <span className="text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {isEquipped ? 'EQUIPPED' : 'UNLOCKED'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playMenuClick();
                      onSelectDecal(d.id);
                    }}
                    className={`w-full mt-3 py-2 rounded-xl text-xs font-ui font-black uppercase tracking-wider transition-all ${
                      isEquipped
                        ? 'bg-fuchsia-600 text-white shadow-[0_0_12px_#d946ef]'
                        : 'bg-[#081222] border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {isEquipped ? 'ACTIVE DECAL' : 'EQUIP DECAL'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: COMPONENT UPGRADES */}
        {activeTab === 'UPGRADES' && (
          <div className="space-y-2.5 text-left">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              PERFORMANCE UPGRADES (AFFECTS RACE STATS)
            </div>

            {UPGRADES_LIST.map(up => {
              const currentLevel = 4; // Maxed out in screenshot

              return (
                <div
                  key={up.id}
                  className="p-3.5 rounded-2xl bg-[#070e1b] border border-slate-800/90 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-mono text-xs">&gt;</span>
                      <span className="font-ui font-black text-sm uppercase tracking-wider text-white">
                        {up.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{up.category}</span>
                    </div>

                    {/* 4 Pips */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map(pip => (
                        <span
                          key={pip}
                          className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{up.desc}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {up.boostText}
                    </span>

                    <button
                      onClick={() => {
                        sound.playUpgradePurchase();
                        onPurchaseUpgrade(up.id, up.cost);
                      }}
                      className="py-1 px-3 rounded-lg bg-[#081729] border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider shadow-sm"
                    >
                      MAX LEVEL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: BEAM LAB & WEAPONS OVERCLOCK */}
        {activeTab === 'BEAM_LAB' && (
          <div className="space-y-4 text-left">
            {/* Top Action & System Readout Strip */}
            <div className="p-3.5 rounded-2xl bg-[#070e1b] border border-amber-500/40 shadow-[0_0_20px_rgba(255,170,0,0.15)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-ui font-black text-sm uppercase tracking-wider text-white">
                    ASTEROID BEAM LAB // LIVE FIRING RANGE
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>
                    TYPE: <strong className="text-amber-400">{currentBeamCustomization.type}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    SHAPE: <strong className="text-cyan-400">{currentBeamCustomization.coreShape || 'STANDARD'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    IMPACT: <strong className="text-rose-400">{currentBeamCustomization.impactPreset || 'ENERGY_BURST'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    AUDIO: <strong className="text-emerald-400">{currentBeamCustomization.soundPreset || 'HIGH_ENERGY_PULSE'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTestFiring}
                  onClick={triggerTestFire}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-ui font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    isTestFiring
                      ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-white shadow-[0_0_20px_#ffaa00]'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-[0_0_15px_rgba(255,170,0,0.4)]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isTestFiring ? 'FIRING BEAM...' : 'TEST FIRE'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveLoadout}
                  className="px-3.5 py-2 rounded-xl font-ui font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#081729] border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{saveFeedback ? 'SAVED!' : 'SAVE'}</span>
                </button>
              </div>
            </div>

            {saveFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2 animate-bounce">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>LOADOUT ARMED &amp; SAVED // READY FOR FLIGHT</span>
              </div>
            )}

            {/* 5 Beam Lab Subtabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-[#040812] border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sound.playMenuClick();
                  setBeamLabSubTab('EMITTER');
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-ui font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  beamLabSubTab === 'EMITTER'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>EMITTER &amp; SHAPE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playMenuClick();
                  setBeamLabSubTab('COLORS');
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-ui font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  beamLabSubTab === 'COLORS'
                    ? 'bg-cyan-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3 h-3" />
                <span>COLOR FREQ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playMenuClick();
                  setBeamLabSubTab('IMPACT_SOUND');
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-ui font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  beamLabSubTab === 'IMPACT_SOUND'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>IMPACT &amp; AUDIO</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playMenuClick();
                  setBeamLabSubTab('DYNAMICS');
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-ui font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  beamLabSubTab === 'DYNAMICS'
                    ? 'bg-fuchsia-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>DYNAMICS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playMenuClick();
                  setBeamLabSubTab('OVERCLOCK');
                }}
                className={`col-span-2 sm:col-span-1 py-2 px-1 rounded-lg text-[10px] font-ui font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  beamLabSubTab === 'OVERCLOCK'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>OVERCLOCK</span>
              </button>
            </div>

            {/* SUBTAB 1: EMITTER & CORE SHAPE */}
            {beamLabSubTab === 'EMITTER' && (
              <div className="space-y-4">
                {/* 8 Emitter Types */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>BEAM EMITTER ARCHITECTURE (8 TYPES)</span>
                    <span className="text-slate-400">ACTIVE: {currentBeamCustomization.type}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BEAM_EMITTER_TYPES.map(emitter => {
                      const isSelected = currentBeamCustomization.type === emitter.id;
                      return (
                        <button
                          key={emitter.id}
                          type="button"
                          onClick={() => {
                            sound.playMenuClick();
                            onUpdateBeamCustomization?.({
                              ...currentBeamCustomization,
                              type: emitter.id,
                            });
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#181104] border-amber-400 shadow-[0_0_12px_rgba(255,170,0,0.3)]'
                              : 'bg-[#070e1b] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-ui font-black text-xs uppercase tracking-wider ${
                                isSelected ? 'text-amber-300' : 'text-white'
                              }`}
                            >
                              {emitter.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                EQUIPPED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 line-clamp-2 mb-1.5">
                            {emitter.desc}
                          </p>
                          <div className="text-[9px] font-mono font-bold text-amber-400/90">
                            {emitter.stats}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8 Core Shapes */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>CORE GEOMETRIC SHAPES (8 SHAPES)</span>
                    <span className="text-slate-400">
                      ACTIVE: {currentBeamCustomization.coreShape || 'STANDARD'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BEAM_CORE_SHAPES.map(shape => {
                      const isSelected =
                        (currentBeamCustomization.coreShape || 'STANDARD') === shape.id;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => {
                            sound.playMenuClick();
                            onUpdateBeamCustomization?.({
                              ...currentBeamCustomization,
                              coreShape: shape.id,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#061426] border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                              : 'bg-[#070e1b] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-ui font-black text-[11px] uppercase tracking-wider ${
                                isSelected ? 'text-cyan-300' : 'text-white'
                              }`}
                            >
                              {shape.name}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-cyan-400 stroke-[3]" />}
                          </div>
                          <p className="text-[9px] font-mono text-slate-400 leading-tight">
                            {shape.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: COLOR FREQUENCIES */}
            {beamLabSubTab === 'COLORS' && (
              <div className="space-y-4">
                {/* 8 Preset Swatches */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    QUICK COLOR PALETTE PRESETS (8 FREQUENCIES)
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {BEAM_COLOR_OPTIONS.map(c => {
                      const isChecked =
                        (currentBeamCustomization.outerColor || '').toLowerCase() ===
                        c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            sound.playMenuClick();
                            onUpdateBeamCustomization?.({
                              ...currentBeamCustomization,
                              outerColor: c.hex,
                              particleColor: c.hex,
                            });
                          }}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-cyan-400 bg-[#061426] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                              : 'border-slate-800 bg-[#070e1b] hover:border-slate-700'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[9px] font-mono font-bold text-slate-300 truncate">
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Core Color */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800">
                    <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>INNER CORE COLOR</span>
                      <span className="text-cyan-400">{currentBeamCustomization.coreColor || '#ffffff'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentBeamCustomization.coreColor || '#ffffff'}
                        onChange={e => {
                          onUpdateBeamCustomization?.({
                            ...currentBeamCustomization,
                            coreColor: e.target.value,
                          });
                        }}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400">High-intensity center ray</span>
                    </div>
                  </div>

                  {/* Outer Glow Color */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800">
                    <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>OUTER GLOW SHEATH</span>
                      <span className="text-amber-400">{currentBeamCustomization.outerColor || '#00f0ff'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentBeamCustomization.outerColor || '#00f0ff'}
                        onChange={e => {
                          onUpdateBeamCustomization?.({
                            ...currentBeamCustomization,
                            outerColor: e.target.value,
                          });
                        }}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400">Volumetric plasma aura</span>
                    </div>
                  </div>

                  {/* Particle Color */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800">
                    <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>PARTICLE SPARK COLOR</span>
                      <span className="text-fuchsia-400">{currentBeamCustomization.particleColor || '#00f0ff'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentBeamCustomization.particleColor || '#00f0ff'}
                        onChange={e => {
                          onUpdateBeamCustomization?.({
                            ...currentBeamCustomization,
                            particleColor: e.target.value,
                          });
                        }}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400">Muzzle &amp; impact sparks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: IMPACT & AUDIO */}
            {beamLabSubTab === 'IMPACT_SOUND' && (
              <div className="space-y-4">
                {/* 8 Impact Presets */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>ASTEROID SHATTER IMPACT EFFECTS (8 PRESETS)</span>
                    <span className="text-slate-400">
                      ACTIVE: {currentBeamCustomization.impactPreset || 'ENERGY_BURST'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BEAM_IMPACT_PRESETS.map(impact => {
                      const isSelected =
                        (currentBeamCustomization.impactPreset || 'ENERGY_BURST') === impact.id;
                      return (
                        <button
                          key={impact.id}
                          type="button"
                          onClick={() => {
                            sound.playMenuClick();
                            onUpdateBeamCustomization?.({
                              ...currentBeamCustomization,
                              impactPreset: impact.id,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1e0810] border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                              : 'bg-[#070e1b] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-ui font-black text-[11px] uppercase tracking-wider ${
                                isSelected ? 'text-rose-300' : 'text-white'
                              }`}
                            >
                              {impact.name}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-rose-400 stroke-[3]" />}
                          </div>
                          <p className="text-[9px] font-mono text-slate-400 leading-tight">
                            {impact.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5 Sound Presets */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>ACOUSTIC SYNTHESIZER AUDIO PRESETS (5 PRESETS)</span>
                    <span className="text-slate-400">
                      ACTIVE: {currentBeamCustomization.soundPreset || 'HIGH_ENERGY_PULSE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BEAM_SOUND_PRESETS.map(snd => {
                      const isSelected =
                        (currentBeamCustomization.soundPreset || 'HIGH_ENERGY_PULSE') === snd.id;
                      return (
                        <div
                          key={snd.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isSelected
                              ? 'bg-[#051710] border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                              : 'bg-[#070e1b] border-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              sound.playMenuClick();
                              onUpdateBeamCustomization?.({
                                ...currentBeamCustomization,
                                soundPreset: snd.id,
                              });
                            }}
                            className="flex-1 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className={`font-ui font-black text-xs uppercase tracking-wider ${
                                  isSelected ? 'text-emerald-300' : 'text-white'
                                }`}
                              >
                                {snd.name}
                              </span>
                              {isSelected && (
                                <span className="text-[8px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] font-mono text-slate-400">{snd.desc}</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playBeamFire(currentBeamCustomization.type, snd.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>PLAY</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: TRAIL DYNAMICS & SLIDERS */}
            {beamLabSubTab === 'DYNAMICS' && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider">
                  BEAM DYNAMICS, TRAIL GEOMETRY &amp; FX TOGGLES
                </div>

                {/* Range Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Trail Length */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Beam Range / Length</span>
                      <strong className="text-amber-400">
                        {Math.round(currentBeamCustomization.trailLength || 65)}m
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="5"
                      value={currentBeamCustomization.trailLength || 65}
                      onChange={e => {
                        onUpdateBeamCustomization?.({
                          ...currentBeamCustomization,
                          trailLength: Number(e.target.value),
                        });
                      }}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Trail Width */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Beam Width / Caliber</span>
                      <strong className="text-cyan-400">
                        {(currentBeamCustomization.trailWidth || 1.0).toFixed(1)}x
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={currentBeamCustomization.trailWidth || 1.0}
                      onChange={e => {
                        onUpdateBeamCustomization?.({
                          ...currentBeamCustomization,
                          trailWidth: Number(e.target.value),
                        });
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Particle Density */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Particle Density</span>
                      <strong className="text-fuchsia-400">
                        {currentBeamCustomization.particleDensity || 32} sparks
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="2"
                      value={currentBeamCustomization.particleDensity || 32}
                      onChange={e => {
                        onUpdateBeamCustomization?.({
                          ...currentBeamCustomization,
                          particleDensity: Number(e.target.value),
                        });
                      }}
                      className="w-full accent-fuchsia-400 cursor-pointer"
                    />
                  </div>

                  {/* Outer Glow */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Outer Glow Intensity</span>
                      <strong className="text-emerald-400">
                        {(currentBeamCustomization.outerGlow || 1.2).toFixed(1)}x
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={currentBeamCustomization.outerGlow || 1.2}
                      onChange={e => {
                        onUpdateBeamCustomization?.({
                          ...currentBeamCustomization,
                          outerGlow: Number(e.target.value),
                        });
                      }}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  {/* Core Brightness */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Core Brightness</span>
                      <strong className="text-white">
                        {(currentBeamCustomization.coreBrightness || 1.0).toFixed(1)}x
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={currentBeamCustomization.coreBrightness || 1.0}
                      onChange={e => {
                        onUpdateBeamCustomization?.({
                          ...currentBeamCustomization,
                          coreBrightness: Number(e.target.value),
                        });
                      }}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>

                  {/* Pulse Speed */}
                  <div className="p-3 rounded-xl bg-[#070e1b] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">Pulse / Wave Speed</span>
                      <strong className="text-rose-400">
                        {(currentBeamCustomization.pulseSpeed || 1.0).toFixed(1)}x
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={currentBeamCustomization.pulseSpeed || 1.0}
                      onChange={e => {
                        onUpdateBeamCustomization?.({
                          ...currentBeamCustomization,
                          pulseSpeed: Number(e.target.value),
                        });
                      }}
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Toggles Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Energy Streaks Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playMenuClick();
                      onUpdateBeamCustomization?.({
                        ...currentBeamCustomization,
                        energyStreaks: !currentBeamCustomization.energyStreaks,
                      });
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      currentBeamCustomization.energyStreaks !== false
                        ? 'bg-[#061426] border-cyan-400 shadow-sm'
                        : 'bg-[#070e1b] border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-ui font-black uppercase text-white">
                      ENERGY STREAKS
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        currentBeamCustomization.energyStreaks !== false
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {currentBeamCustomization.energyStreaks !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Shockwave Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playMenuClick();
                      onUpdateBeamCustomization?.({
                        ...currentBeamCustomization,
                        shockwaveEnabled: !currentBeamCustomization.shockwaveEnabled,
                      });
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      currentBeamCustomization.shockwaveEnabled !== false
                        ? 'bg-[#181104] border-amber-400 shadow-sm'
                        : 'bg-[#070e1b] border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-ui font-black uppercase text-white">
                      KINETIC SHOCKWAVE
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        currentBeamCustomization.shockwaveEnabled !== false
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {currentBeamCustomization.shockwaveEnabled !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Noise Movement Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playMenuClick();
                      onUpdateBeamCustomization?.({
                        ...currentBeamCustomization,
                        noiseMovement: !currentBeamCustomization.noiseMovement,
                      });
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      currentBeamCustomization.noiseMovement !== false
                        ? 'bg-[#1a0520] border-fuchsia-400 shadow-sm'
                        : 'bg-[#070e1b] border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-ui font-black uppercase text-white">
                      NOISE JITTER FX
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        currentBeamCustomization.noiseMovement !== false
                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {currentBeamCustomization.noiseMovement !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* SUBTAB 5: WEAPONS OVERCLOCK (8 UPGRADES) */}
            {beamLabSubTab === 'OVERCLOCK' && (
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  WEAPONS LAB OVERCLOCKING &amp; ENHANCEMENTS (8 CATEGORIES)
                </div>

                <div className="space-y-2.5">
                  {BEAM_UPGRADE_ITEMS.map(up => {
                    const currentLvl = currentBeamUpgrades[up.key] || 0;
                    const isMax = currentLvl >= 5;
                    const cost = up.cost * (currentLvl + 1);
                    const canAfford = credits >= cost && !isMax;

                    return (
                      <div
                        key={up.key}
                        className="p-3.5 rounded-2xl bg-[#070e1b] border border-slate-800/90 text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-mono text-xs">&gt;</span>
                            <span className="font-ui font-black text-sm uppercase tracking-wider text-white">
                              {up.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{up.category}</span>
                          </div>

                          {/* 5 Pips */}
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map(pip => (
                              <span
                                key={pip}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  pip <= currentLvl
                                    ? 'bg-amber-400 shadow-[0_0_6px_#ffaa00]'
                                    : 'bg-slate-800 border border-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{up.desc}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {up.boostText} (TIER {currentLvl}/5)
                          </span>

                          {isMax ? (
                            <span className="py-1 px-3 rounded-lg bg-[#161208] border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider shadow-sm">
                              MAX LEVEL
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => {
                                sound.playUpgradePurchase();
                                onPurchaseBeamUpgrade?.(up.key, cost);
                              }}
                              className={`py-1 px-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                canAfford
                                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 hover:brightness-110 shadow-[0_0_10px_rgba(255,170,0,0.3)] active:scale-95'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              }`}
                            >
                              UPGRADE ({cost.toLocaleString()} VC)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lower Section: 3D Preview Stage (Common to all tabs!) */}
        <div className="relative w-full h-64 rounded-2xl bg-[#040812] border border-cyan-500/30 overflow-hidden shadow-[0_0_25px_rgba(0,240,255,0.1)]">
          {/* Top-Right Drag Hint */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050b14]/80 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 tracking-wider">
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>DRAG TO INSPECT 3D</span>
          </div>

          {/* Beam Lab Holographic Target HUD */}
          {activeTab === 'BEAM_LAB' && (
            <>
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#180902]/90 border border-amber-500/50 text-[9px] font-mono font-bold text-amber-300 tracking-wider">
                <Crosshair className="w-3 h-3 text-amber-400 animate-spin" />
                <span>ASTEROID TARGET DUMMY // 25M</span>
              </div>

              <button
                type="button"
                disabled={isTestFiring}
                onClick={triggerTestFire}
                className={`absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-ui font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isTestFiring
                    ? 'bg-amber-400 text-slate-950 animate-pulse ring-2 ring-white shadow-[0_0_20px_#ffaa00]'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(255,170,0,0.4)]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isTestFiring ? 'FIRING...' : '⚡ TEST FIRE'}</span>
              </button>
            </>
          )}

          {/* Three.js Canvas */}
          <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating Ship Name & Livery Bottom-Left */}
          <div className="absolute bottom-3 left-3 z-10 p-2.5 px-3.5 rounded-xl bg-[#060c18]/90 border border-slate-800 text-left shadow-lg">
            <div className="text-xs font-ui font-black uppercase tracking-wider text-white leading-tight">
              {selectedShip.name}
            </div>
            <div className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider mt-0.5">
              LIVERY: {activeDecalName}
            </div>
          </div>
        </div>

        {/* Total Ship Telemetry & Upgrades */}
        <div className="p-4 rounded-2xl bg-[#070e1b] border border-slate-800 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              TOTAL SHIP TELEMETRY &amp; UPGRADES
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              TOP SPEED: 360 KM/H
            </span>
          </div>

          {/* Top Velocity */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Top Velocity</span>
              </span>
              <span className="text-cyan-400 font-bold">360 km/h</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-cyan-400 w-full shadow-[0_0_8px_#00f0ff]" />
            </div>
          </div>

          {/* Acceleration */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Acceleration</span>
              </span>
              <span className="text-fuchsia-400 font-bold">107 / 130</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-fuchsia-500 w-[82%] shadow-[0_0_8px_#ff00e5]" />
            </div>
          </div>

          {/* Drift & Handling */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>Drift &amp; Handling</span>
              </span>
              <span className="text-emerald-400 font-bold">102 / 130</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-emerald-400 w-[78%] shadow-[0_0_8px_#00ff66]" />
            </div>
          </div>

          {/* Nitro Boost Surge */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Nitro Boost Surge</span>
              </span>
              <span className="text-amber-400 font-bold">137 / 140</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-amber-400 w-[97%] shadow-[0_0_8px_#ffaa00]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
