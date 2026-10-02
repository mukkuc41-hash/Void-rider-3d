import * as THREE from 'three';
import { sound } from '../audio';
import type {
  CosmicEventElement,
  CosmicElementType,
} from './cosmicEventElementsCatalog';
import { COSMIC_40_EVENT_PAIRS } from './cosmicEventElementsCatalog';

export type { CosmicEventElement, CosmicElementType };
export { COSMIC_40_EVENT_PAIRS };

/**
 * 40-Event Cosmic Catastrophe Definition
 * Every event has:
 * CAUSE -> PHYSICAL EFFECT -> ENVIRONMENTAL RESPONSE -> PLAYER RESPONSE -> PERSISTENT AFTERMATH
 * Includes 2 real celestial elements with real appearance, revolution, collision, spaghettification, and completion strategy.
 */
export interface CosmicEventDefinition {
  index: number;
  id: string;
  name: string;
  title: string;
  subtitle: string;
  cause: string;
  physicalEffect: string;
  environmentalResponse: string;
  playerResponse: string;
  triggerTime: number; // in seconds from evacuation start
  severity: number; // 1 to 10 scale
  gravityParams: {
    gravityInfluenceRadius: number;
    gravityAsymmetry: number;
    lensingStrength: number;
    tidalStrength: number;
    infallRate: number;
    accretionActivity: number;
    matterStreamIntensity: number;
    gravitationalWaveStrength: number;
    spacetimeDistortion: number;
    environmentCompression: number;
    asymmetricExpansion: number;
    collapseIntensity: number;
  };
  element1: CosmicEventElement;
  element2: CosmicEventElement;
  eventOccurrenceNarrative: string;
  completionStrategy: string;
}

const RAW_COSMIC_40_EVENTS: Omit<CosmicEventDefinition, 'element1' | 'element2' | 'eventOccurrenceNarrative' | 'completionStrategy'>[] = [
  {
    index: 1,
    id: 'gravity_distortion',
    name: 'GRAVITY DISTORTION',
    title: 'EVENT 01 — GRAVITY DISTORTION',
    subtitle: 'Gravitational deviation detected. Orbital paths slowly bending inward.',
    cause: 'Initial black hole tidal gradient perturbation propagating into sector.',
    physicalEffect: 'Orbital vectors curve toward the singularity; asteroid trajectories bend.',
    environmentalResponse: 'Near-field asteroids drift off balance; route curvature becomes subtly unstable.',
    playerResponse: 'Steering resistance, subtle lateral force, navigation drift.',
    triggerTime: 30,
    severity: 1.0,
    gravityParams: {
      gravityInfluenceRadius: 0.15,
      gravityAsymmetry: 0.05,
      lensingStrength: 0.1,
      tidalStrength: 0.12,
      infallRate: 0.1,
      accretionActivity: 0.15,
      matterStreamIntensity: 0.1,
      gravitationalWaveStrength: 0.05,
      spacetimeDistortion: 0.08,
      environmentCompression: 0.05,
      asymmetricExpansion: 0.05,
      collapseIntensity: 0.05,
    },
  },
  {
    index: 2,
    id: 'orbital_failure',
    name: 'ORBITAL FAILURE',
    title: 'EVENT 02 — ORBITAL FAILURE',
    subtitle: 'Stable orbital systems losing equilibrium. Satellites and moons deviating.',
    cause: 'Tidal forces exceed station-keeping thruster thresholds.',
    physicalEffect: 'Moons deviate from Keplerian orbits; satellites lose stabilization.',
    environmentalResponse: 'Communications satellite array drifts; orbital rings experience structural stress.',
    playerResponse: 'Yaw perturbation, orbital cross-drift, compass jitter.',
    triggerTime: 60,
    severity: 1.5,
    gravityParams: {
      gravityInfluenceRadius: 0.2,
      gravityAsymmetry: 0.08,
      lensingStrength: 0.15,
      tidalStrength: 0.18,
      infallRate: 0.15,
      accretionActivity: 0.2,
      matterStreamIntensity: 0.15,
      gravitationalWaveStrength: 0.1,
      spacetimeDistortion: 0.12,
      environmentCompression: 0.08,
      asymmetricExpansion: 0.08,
      collapseIntensity: 0.1,
    },
  },
  {
    index: 3,
    id: 'tidal_wave',
    name: 'TIDAL WAVE',
    title: 'EVENT 03 — TIDAL WAVE',
    subtitle: 'Large-scale tidal forces propagating. Structures stretching along gravity gradient.',
    cause: 'Differential gravitational pull across megastructure spans.',
    physicalEffect: 'Bridges stretch and bend; towers lean; platform joints vibrate.',
    environmentalResponse: 'Lattice girders groan; tension cables snap; track segments flex.',
    playerResponse: 'Suspension heave, vertical resonance, camera vibration.',
    triggerTime: 90,
    severity: 2.0,
    gravityParams: {
      gravityInfluenceRadius: 0.25,
      gravityAsymmetry: 0.12,
      lensingStrength: 0.2,
      tidalStrength: 0.28,
      infallRate: 0.2,
      accretionActivity: 0.25,
      matterStreamIntensity: 0.2,
      gravitationalWaveStrength: 0.15,
      spacetimeDistortion: 0.18,
      environmentCompression: 0.12,
      asymmetricExpansion: 0.1,
      collapseIntensity: 0.15,
    },
  },
  {
    index: 4,
    id: 'planetary_collision',
    name: 'PLANETARY COLLISION',
    title: 'EVENT 04 — PLANETARY COLLISION',
    subtitle: 'Catastrophic celestial impact. Fragment field dispersing across sector.',
    cause: 'Perturbed orbital paths cause twin planets to intersect trajectories.',
    physicalEffect: 'Hyper-velocity collision of two celestial bodies; crustal fragmentation.',
    environmentalResponse: 'Expanding shockwave ring, molten debris field permanently entering world.',
    playerResponse: 'Colossal impact shockwave, high-speed debris avoidance, intense camera shake.',
    triggerTime: 120,
    severity: 3.0,
    gravityParams: {
      gravityInfluenceRadius: 0.35,
      gravityAsymmetry: 0.2,
      lensingStrength: 0.28,
      tidalStrength: 0.35,
      infallRate: 0.3,
      accretionActivity: 0.35,
      matterStreamIntensity: 0.3,
      gravitationalWaveStrength: 0.3,
      spacetimeDistortion: 0.25,
      environmentCompression: 0.18,
      asymmetricExpansion: 0.18,
      collapseIntensity: 0.25,
    },
  },
  {
    index: 5,
    id: 'accretion_surge',
    name: 'ACCRETION SURGE',
    title: 'EVENT 05 — ACCRETION SURGE',
    subtitle: 'Accretion disk activity surging. Relativistic plasma streams accelerating.',
    cause: 'Inflow of collision crust into the outer accretion radius.',
    physicalEffect: 'Matter streams accelerate; superheated plasma illuminates sector.',
    environmentalResponse: 'Glowing plasma clouds expand; high-voltage energy conduits overload.',
    playerResponse: 'High-energy plasma turbulence, magnetic HUD flickering, roll disturbance.',
    triggerTime: 150,
    severity: 3.5,
    gravityParams: {
      gravityInfluenceRadius: 0.4,
      gravityAsymmetry: 0.25,
      lensingStrength: 0.35,
      tidalStrength: 0.4,
      infallRate: 0.38,
      accretionActivity: 0.5,
      matterStreamIntensity: 0.45,
      gravitationalWaveStrength: 0.35,
      spacetimeDistortion: 0.3,
      environmentCompression: 0.22,
      asymmetricExpansion: 0.2,
      collapseIntensity: 0.3,
    },
  },
  {
    index: 6,
    id: 'destruction_front',
    name: 'DESTRUCTION FRONT',
    title: 'EVENT 06 — DESTRUCTION FRONT',
    subtitle: 'Simulated destruction front advancing behind route. Erasing rear sector.',
    cause: 'Cascading structural collapse reaches critical propagation speed.',
    physicalEffect: 'Physical destruction front moves along track: STABLE to CONSUMED.',
    environmentalResponse: 'Track sections drop into the abyss; trailing structures disintegrate.',
    playerResponse: 'Urgent forward acceleration; destruction proximity alert.',
    triggerTime: 180,
    severity: 4.0,
    gravityParams: {
      gravityInfluenceRadius: 0.45,
      gravityAsymmetry: 0.3,
      lensingStrength: 0.4,
      tidalStrength: 0.45,
      infallRate: 0.45,
      accretionActivity: 0.55,
      matterStreamIntensity: 0.5,
      gravitationalWaveStrength: 0.4,
      spacetimeDistortion: 0.35,
      environmentCompression: 0.28,
      asymmetricExpansion: 0.25,
      collapseIntensity: 0.38,
    },
  },
  {
    index: 7,
    id: 'gravity_reversal',
    name: 'GRAVITY REVERSAL',
    title: 'EVENT 07 — GRAVITY REVERSAL',
    subtitle: 'Localized gravity vectors undulating. Continuous harmonic acceleration.',
    cause: 'Interference pattern of competing relativistic gravitational frame-dragging.',
    physicalEffect: 'Objects experience continuous changes in acceleration and direction.',
    environmentalResponse: 'Floating platform slabs rise, dip, and drift sideways smoothly (no teleport).',
    playerResponse: 'Vertical lift forces, traction oscillation, inverted inertia handling.',
    triggerTime: 210,
    severity: 4.5,
    gravityParams: {
      gravityInfluenceRadius: 0.5,
      gravityAsymmetry: 0.4,
      lensingStrength: 0.45,
      tidalStrength: 0.5,
      infallRate: 0.48,
      accretionActivity: 0.58,
      matterStreamIntensity: 0.52,
      gravitationalWaveStrength: 0.45,
      spacetimeDistortion: 0.42,
      environmentCompression: 0.32,
      asymmetricExpansion: 0.3,
      collapseIntensity: 0.42,
    },
  },
  {
    index: 8,
    id: 'spaghettification_wave',
    name: 'SPAGHETTIFICATION WAVE',
    title: 'EVENT 08 — SPAGHETTIFICATION WAVE',
    subtitle: 'Extreme tidal shear stretching corridor structures along gravitational vectors.',
    cause: 'Strong tidal gravitational gradient across the flight corridor.',
    physicalEffect: 'Tensile stretching along the singularity axis; lateral compression.',
    environmentalResponse: 'Kilometer-long rail systems warp; asteroid chains elongate like beads.',
    playerResponse: 'Longitudinal craft stretching feedback, extreme steering stiffness.',
    triggerTime: 240,
    severity: 5.0,
    gravityParams: {
      gravityInfluenceRadius: 0.55,
      gravityAsymmetry: 0.45,
      lensingStrength: 0.5,
      tidalStrength: 0.65,
      infallRate: 0.52,
      accretionActivity: 0.62,
      matterStreamIntensity: 0.58,
      gravitationalWaveStrength: 0.5,
      spacetimeDistortion: 0.48,
      environmentCompression: 0.38,
      asymmetricExpansion: 0.35,
      collapseIntensity: 0.48,
    },
  },
  {
    index: 9,
    id: 'station_collapse',
    name: 'STATION COLLAPSE',
    title: 'EVENT 09 — STATION COLLAPSE',
    subtitle: 'Monolithic 1.8km orbital station failing. Docking rings detaching into infall.',
    cause: 'Centrifugal forces overcome by singularity tidal strain.',
    physicalEffect: 'Progressive structural failure: deformation -> separation -> inward acceleration.',
    environmentalResponse: 'Docking rings buckle; 400m station spires tumble into the void.',
    playerResponse: 'Collision avoidance with massive tumbling station hull wreckage.',
    triggerTime: 270,
    severity: 5.5,
    gravityParams: {
      gravityInfluenceRadius: 0.6,
      gravityAsymmetry: 0.48,
      lensingStrength: 0.55,
      tidalStrength: 0.7,
      infallRate: 0.58,
      accretionActivity: 0.65,
      matterStreamIntensity: 0.62,
      gravitationalWaveStrength: 0.55,
      spacetimeDistortion: 0.52,
      environmentCompression: 0.42,
      asymmetricExpansion: 0.4,
      collapseIntensity: 0.52,
    },
  },
  {
    index: 10,
    id: 'debris_storm',
    name: 'DEBRIS STORM',
    title: 'EVENT 10 — DEBRIS STORM',
    subtitle: 'Accumulated hyper-velocity debris storm sweeping across safe flight corridor.',
    cause: 'Accumulation of planetary, station, asteroid, and track fragments.',
    physicalEffect: 'Dense, multi-velocity debris field orbiting at relativistic speeds.',
    environmentalResponse: 'Thousands of instanced fragments fly past route; near hazards active.',
    playerResponse: 'Shield stress, rapid evasive maneuvers, audible hull scrapes.',
    triggerTime: 300,
    severity: 6.0,
    gravityParams: {
      gravityInfluenceRadius: 0.65,
      gravityAsymmetry: 0.52,
      lensingStrength: 0.6,
      tidalStrength: 0.72,
      infallRate: 0.65,
      accretionActivity: 0.7,
      matterStreamIntensity: 0.68,
      gravitationalWaveStrength: 0.6,
      spacetimeDistortion: 0.58,
      environmentCompression: 0.48,
      asymmetricExpansion: 0.45,
      collapseIntensity: 0.58,
    },
  },
  {
    index: 11,
    id: 'event_horizon_influence',
    name: 'EVENT-HORIZON INFLUENCE ESCALATION',
    title: 'EVENT 11 — EVENT-HORIZON INFLUENCE ESCALATION',
    subtitle: 'Severe gravitational lensing warping distant stars, light paths, and silhouettes.',
    cause: 'Proximity to singularity expands photon deflection cone.',
    physicalEffect: 'Optical space-time distortion bending background geodesics.',
    environmentalResponse: 'Curved light paths, distorted celestial silhouettes, lensing arcs.',
    playerResponse: 'Optical chromatic aberration, perspective distortion, visual disorientation.',
    triggerTime: 330,
    severity: 6.5,
    gravityParams: {
      gravityInfluenceRadius: 0.7,
      gravityAsymmetry: 0.55,
      lensingStrength: 0.75,
      tidalStrength: 0.75,
      infallRate: 0.7,
      accretionActivity: 0.75,
      matterStreamIntensity: 0.72,
      gravitationalWaveStrength: 0.65,
      spacetimeDistortion: 0.68,
      environmentCompression: 0.52,
      asymmetricExpansion: 0.5,
      collapseIntensity: 0.62,
    },
  },
  {
    index: 12,
    id: 'gravitational_lockdown',
    name: 'GRAVITATIONAL LOCKDOWN',
    title: 'EVENT 12 — GRAVITATIONAL LOCKDOWN',
    subtitle: 'Transportation corridors collapsing simultaneously. Alternate routes failing.',
    cause: 'Tidal disruption shears multi-route junctions and bypass elevated tracks.',
    physicalEffect: 'Multiple physical route branches become structurally compromised.',
    environmentalResponse: 'Routes transition: SAFE to UNSTABLE to COLLAPSING to CONSUMED.',
    playerResponse: 'Emergency route decision-making; steering to surviving track branches.',
    triggerTime: 360,
    severity: 7.0,
    gravityParams: {
      gravityInfluenceRadius: 0.75,
      gravityAsymmetry: 0.6,
      lensingStrength: 0.78,
      tidalStrength: 0.8,
      infallRate: 0.75,
      accretionActivity: 0.78,
      matterStreamIntensity: 0.75,
      gravitationalWaveStrength: 0.7,
      spacetimeDistortion: 0.72,
      environmentCompression: 0.58,
      asymmetricExpansion: 0.55,
      collapseIntensity: 0.68,
    },
  },
  {
    index: 13,
    id: 'singularity_critical',
    name: 'SINGULARITY CRITICAL',
    title: 'EVENT 13 — SINGULARITY CRITICAL',
    subtitle: 'Accretion boundary reaching critical relativistic state. Safe margins failing.',
    cause: 'Massive influx of matter supercharges accretion rotational shear.',
    physicalEffect: 'Extreme spacetime curvature; debris streams accelerate to near light-speed.',
    environmentalResponse: 'Interconnected mega-towers experience propagating joint failures.',
    playerResponse: 'Thruster output instability, intense camera shake, hull integrity warnings.',
    triggerTime: 390,
    severity: 7.5,
    gravityParams: {
      gravityInfluenceRadius: 0.8,
      gravityAsymmetry: 0.65,
      lensingStrength: 0.82,
      tidalStrength: 0.84,
      infallRate: 0.8,
      accretionActivity: 0.82,
      matterStreamIntensity: 0.8,
      gravitationalWaveStrength: 0.75,
      spacetimeDistortion: 0.78,
      environmentCompression: 0.64,
      asymmetricExpansion: 0.6,
      collapseIntensity: 0.72,
    },
  },
  {
    index: 14,
    id: 'cosmic_collapse',
    name: 'COSMIC COLLAPSE',
    title: 'EVENT 14 — COSMIC COLLAPSE',
    subtitle: 'Civilization megastructures in full collapse. Head for the evacuation facility.',
    cause: 'Global sector orbital infrastructure reaches total structural fatigue.',
    physicalEffect: 'Distant space becomes desolate; remaining track leads to evacuation tower.',
    environmentalResponse: 'Emergency beacons pulse; rear track actively disintegrates into infall.',
    playerResponse: 'Final approach to evacuation entrance; precise navigation alignment.',
    triggerTime: 420,
    severity: 8.0,
    gravityParams: {
      gravityInfluenceRadius: 0.85,
      gravityAsymmetry: 0.7,
      lensingStrength: 0.86,
      tidalStrength: 0.88,
      infallRate: 0.85,
      accretionActivity: 0.86,
      matterStreamIntensity: 0.85,
      gravitationalWaveStrength: 0.8,
      spacetimeDistortion: 0.82,
      environmentCompression: 0.7,
      asymmetricExpansion: 0.65,
      collapseIntensity: 0.78,
    },
  },
  {
    index: 15,
    id: 'final_singularity_surge',
    name: 'FINAL SINGULARITY SURGE',
    title: 'EVENT 15 — FINAL SINGULARITY SURGE',
    subtitle: 'Singularity boundary surge. Extreme gravitational wave propagation.',
    cause: 'Event horizon relativistic surge radiating outward.',
    physicalEffect: 'Relativistic space-time compression wave propagating through sector.',
    environmentalResponse: 'Remaining distant structures and debris streams surge toward singularity.',
    playerResponse: 'Extreme gravitational turbulence, cockpit shudder, warning alarms.',
    triggerTime: 450,
    severity: 8.5,
    gravityParams: {
      gravityInfluenceRadius: 0.9,
      gravityAsymmetry: 0.75,
      lensingStrength: 0.9,
      tidalStrength: 0.92,
      infallRate: 0.9,
      accretionActivity: 0.9,
      matterStreamIntensity: 0.9,
      gravitationalWaveStrength: 0.85,
      spacetimeDistortion: 0.88,
      environmentCompression: 0.78,
      asymmetricExpansion: 0.72,
      collapseIntensity: 0.84,
    },
  },
  {
    index: 16,
    id: 'orbital_resonance_break',
    name: 'ORBITAL RESONANCE BREAK',
    title: 'EVENT 16 — ORBITAL RESONANCE BREAK',
    subtitle: 'Resonant orbital locks breaking. Moons and station traffic colliding.',
    cause: 'Tidal differential breaks Laplace resonance between orbiting celestial bodies.',
    physicalEffect: 'Moons alter eccentricity; orbital infrastructure collides on crossed orbits.',
    environmentalResponse: 'Secondary satellite collisions scatter flashing debris across view.',
    playerResponse: 'Cross-traffic hazards, evasive flight maneuvers, collision alarms.',
    triggerTime: 480,
    severity: 8.6,
    gravityParams: {
      gravityInfluenceRadius: 0.91,
      gravityAsymmetry: 0.77,
      lensingStrength: 0.91,
      tidalStrength: 0.93,
      infallRate: 0.91,
      accretionActivity: 0.91,
      matterStreamIntensity: 0.91,
      gravitationalWaveStrength: 0.86,
      spacetimeDistortion: 0.89,
      environmentCompression: 0.79,
      asymmetricExpansion: 0.73,
      collapseIntensity: 0.85,
    },
  },
  {
    index: 17,
    id: 'roche_limit_breach',
    name: 'ROCHE LIMIT BREACH',
    title: 'EVENT 17 — ROCHE LIMIT BREACH',
    subtitle: 'Moon enters Roche limit. Tidal gravity tearing celestial mantle apart.',
    cause: 'Closest moon crosses the critical tidal disruption radius.',
    physicalEffect: 'Self-gravitation overcome by black hole tides; body fractures into streams.',
    environmentalResponse: 'Enormous rocky tectonic fragments peel away into glowing ribbon streams.',
    playerResponse: 'Debris cloud traversal, visual spectacle of fracturing celestial body.',
    triggerTime: 510,
    severity: 8.7,
    gravityParams: {
      gravityInfluenceRadius: 0.92,
      gravityAsymmetry: 0.78,
      lensingStrength: 0.92,
      tidalStrength: 0.94,
      infallRate: 0.92,
      accretionActivity: 0.92,
      matterStreamIntensity: 0.92,
      gravitationalWaveStrength: 0.87,
      spacetimeDistortion: 0.9,
      environmentCompression: 0.8,
      asymmetricExpansion: 0.74,
      collapseIntensity: 0.86,
    },
  },
  {
    index: 18,
    id: 'gravitational_wave_passage',
    name: 'GRAVITATIONAL WAVE PASSAGE',
    title: 'EVENT 18 — GRAVITATIONAL WAVE PASSAGE',
    subtitle: 'Relativistic gravitational wave crest passing. Spacetime metric oscillating.',
    cause: 'Asymmetric infall pulse generates high-amplitude quadrupole wave.',
    physicalEffect: 'Temporary spatial stretching and compression perpendicular to propagation.',
    environmentalResponse: 'Track route undulates like an ocean swell; stations oscillate.',
    playerResponse: 'Craft pitch-heave oscillations, navigation interference, HUD wave distortion.',
    triggerTime: 540,
    severity: 8.8,
    gravityParams: {
      gravityInfluenceRadius: 0.93,
      gravityAsymmetry: 0.8,
      lensingStrength: 0.93,
      tidalStrength: 0.95,
      infallRate: 0.93,
      accretionActivity: 0.93,
      matterStreamIntensity: 0.93,
      gravitationalWaveStrength: 0.95,
      spacetimeDistortion: 0.92,
      environmentCompression: 0.82,
      asymmetricExpansion: 0.76,
      collapseIntensity: 0.87,
    },
  },
  {
    index: 19,
    id: 'orbital_debris_cascade',
    name: 'ORBITAL DEBRIS CASCADE',
    title: 'EVENT 19 — ORBITAL DEBRIS CASCADE',
    subtitle: 'Kessler cascade active. Fragment impacts multiplying exponentially.',
    cause: 'Hyper-velocity debris impacts generate secondary high-speed fragmentation.',
    physicalEffect: 'Fragment population density spikes; collision cross-section grows.',
    environmentalResponse: 'Dense cloud of metallic and mineral shards blankets the corridor.',
    playerResponse: 'Multiple incoming impact warnings, shield deflections, reduced forward visibility.',
    triggerTime: 570,
    severity: 8.9,
    gravityParams: {
      gravityInfluenceRadius: 0.94,
      gravityAsymmetry: 0.81,
      lensingStrength: 0.94,
      tidalStrength: 0.95,
      infallRate: 0.94,
      accretionActivity: 0.94,
      matterStreamIntensity: 0.94,
      gravitationalWaveStrength: 0.88,
      spacetimeDistortion: 0.93,
      environmentCompression: 0.83,
      asymmetricExpansion: 0.77,
      collapseIntensity: 0.88,
    },
  },
  {
    index: 20,
    id: 'planetary_ring_disruption',
    name: 'PLANETARY RING DISRUPTION',
    title: 'EVENT 20 — PLANETARY RING DISRUPTION',
    subtitle: 'Planetary ring plane destabilizing. Ice and rock particles raining inward.',
    cause: 'Tidal forces warp the planar stability of planetary rings.',
    physicalEffect: 'Ring particles disperse into three-dimensional helical streams.',
    environmentalResponse: 'Enormous particulate streams cross the environment; silhouettes obscured.',
    playerResponse: 'Micro-particle sandblasting audio, luminescent ring crossing.',
    triggerTime: 600,
    severity: 9.0,
    gravityParams: {
      gravityInfluenceRadius: 0.95,
      gravityAsymmetry: 0.82,
      lensingStrength: 0.95,
      tidalStrength: 0.96,
      infallRate: 0.95,
      accretionActivity: 0.95,
      matterStreamIntensity: 0.95,
      gravitationalWaveStrength: 0.89,
      spacetimeDistortion: 0.94,
      environmentCompression: 0.85,
      asymmetricExpansion: 0.78,
      collapseIntensity: 0.89,
    },
  },
  {
    index: 21,
    id: 'moon_fracture',
    name: 'MOON FRACTURE',
    title: 'EVENT 21 — MOON FRACTURE',
    subtitle: 'Nearby moon splitting along tectonic rift. Core magma venting.',
    cause: 'Internal tidal heating and extensional stresses rupture lunar crust.',
    physicalEffect: 'Moon divides into multiple large chunks; magma plumes vent into vacuum.',
    environmentalResponse: 'Massive glowing crustal blocks separate slowly; debris fields expand.',
    playerResponse: 'Sub-bass thermal rumble, avoidance of giant rotating lunar fragments.',
    triggerTime: 630,
    severity: 9.05,
    gravityParams: {
      gravityInfluenceRadius: 0.95,
      gravityAsymmetry: 0.83,
      lensingStrength: 0.95,
      tidalStrength: 0.96,
      infallRate: 0.95,
      accretionActivity: 0.95,
      matterStreamIntensity: 0.95,
      gravitationalWaveStrength: 0.9,
      spacetimeDistortion: 0.94,
      environmentCompression: 0.86,
      asymmetricExpansion: 0.79,
      collapseIntensity: 0.9,
    },
  },
  {
    index: 22,
    id: 'orbital_ring_failure',
    name: 'ORBITAL RING FAILURE',
    title: 'EVENT 22 — ORBITAL RING FAILURE',
    subtitle: 'Gigantic megastructure ring fracturing into disconnected 400m sections.',
    cause: 'Buckling stress exceeds ultra-dense carbon nanotube tensile limits.',
    physicalEffect: 'Continuous ring snaps at multiple points; sections enter independent orbits.',
    environmentalResponse: 'Curved ring sections tumble across sector; glowing maintenance hubs shatter.',
    playerResponse: 'Flying beneath collapsing ring arches; hazard avoidance.',
    triggerTime: 660,
    severity: 9.1,
    gravityParams: {
      gravityInfluenceRadius: 0.95,
      gravityAsymmetry: 0.84,
      lensingStrength: 0.95,
      tidalStrength: 0.96,
      infallRate: 0.95,
      accretionActivity: 0.95,
      matterStreamIntensity: 0.95,
      gravitationalWaveStrength: 0.9,
      spacetimeDistortion: 0.95,
      environmentCompression: 0.87,
      asymmetricExpansion: 0.8,
      collapseIntensity: 0.91,
    },
  },
  {
    index: 23,
    id: 'planetary_debris_infall',
    name: 'PLANETARY DEBRIS INFALL',
    title: 'EVENT 23 — PLANETARY DEBRIS INFALL',
    subtitle: 'Billions of tons of planetary matter spiraling into lower accretion trajectories.',
    cause: 'Angular momentum loss drags disrupted planetary mass inward.',
    physicalEffect: 'Colossal continuous debris rivers funneling toward event horizon.',
    environmentalResponse: 'Intense background illumination; debris impact cascades on outer infrastructure.',
    playerResponse: 'Steering through dense debris currents; high-velocity hazards.',
    triggerTime: 690,
    severity: 9.15,
    gravityParams: {
      gravityInfluenceRadius: 0.96,
      gravityAsymmetry: 0.85,
      lensingStrength: 0.96,
      tidalStrength: 0.96,
      infallRate: 0.96,
      accretionActivity: 0.96,
      matterStreamIntensity: 0.96,
      gravitationalWaveStrength: 0.91,
      spacetimeDistortion: 0.95,
      environmentCompression: 0.88,
      asymmetricExpansion: 0.81,
      collapseIntensity: 0.92,
    },
  },
  {
    index: 24,
    id: 'gravitational_slingshot_cascade',
    name: 'GRAVITATIONAL SLINGSHOT CASCADE',
    title: 'EVENT 24 — GRAVITATIONAL SLINGSHOT CASCADE',
    subtitle: 'Asteroids receiving relativistic gravitational assists. Hyper-velocity hazards.',
    cause: 'Close passage around singularity slingshots orbital bodies at extreme angles.',
    physicalEffect: 'High kinetic energy trajectory changes across multiple celestial planes.',
    environmentalResponse: 'Asteroids streak across route at hyper-velocity with refractive trails.',
    playerResponse: 'Fast reaction windows, alert pings, emergency thruster adjustments.',
    triggerTime: 720,
    severity: 9.2,
    gravityParams: {
      gravityInfluenceRadius: 0.96,
      gravityAsymmetry: 0.86,
      lensingStrength: 0.96,
      tidalStrength: 0.97,
      infallRate: 0.96,
      accretionActivity: 0.96,
      matterStreamIntensity: 0.96,
      gravitationalWaveStrength: 0.92,
      spacetimeDistortion: 0.95,
      environmentCompression: 0.89,
      asymmetricExpansion: 0.82,
      collapseIntensity: 0.93,
    },
  },
  {
    index: 25,
    id: 'celestial_trajectory_crossing',
    name: 'CELESTIAL TRAJECTORY CROSSING',
    title: 'EVENT 25 — CELESTIAL TRAJECTORY CROSSING',
    subtitle: 'Multiple orbital planes converging. Massive intersection of celestial paths.',
    cause: 'Inward spiral forces previously separated orbital shells to intersect.',
    physicalEffect: 'Dense clusters of satellites, platforms, and asteroid swarms cross paths.',
    environmentalResponse: 'Secondary impacts light up background; debris density surges.',
    playerResponse: 'Navigating intersecting traffic corridors, high radar clutter.',
    triggerTime: 750,
    severity: 9.25,
    gravityParams: {
      gravityInfluenceRadius: 0.96,
      gravityAsymmetry: 0.87,
      lensingStrength: 0.96,
      tidalStrength: 0.97,
      infallRate: 0.96,
      accretionActivity: 0.96,
      matterStreamIntensity: 0.96,
      gravitationalWaveStrength: 0.92,
      spacetimeDistortion: 0.96,
      environmentCompression: 0.9,
      asymmetricExpansion: 0.83,
      collapseIntensity: 0.94,
    },
  },
  {
    index: 26,
    id: 'structural_resonance_failure',
    name: 'STRUCTURAL RESONANCE FAILURE',
    title: 'EVENT 26 — STRUCTURAL RESONANCE FAILURE',
    subtitle: 'Sustained physical oscillation tearing megastructure joints apart.',
    cause: 'Gravitational wave frequency matches structural harmonic resonant frequency.',
    physicalEffect: 'Vibration -> fatigue -> cracking -> deformation -> separation -> collapse.',
    environmentalResponse: 'Suspension bridges undulate and snap; towers twist and fracture.',
    playerResponse: 'Deep acoustic groaning feedback, track deck vibration, camera roll.',
    triggerTime: 780,
    severity: 9.3,
    gravityParams: {
      gravityInfluenceRadius: 0.97,
      gravityAsymmetry: 0.88,
      lensingStrength: 0.97,
      tidalStrength: 0.97,
      infallRate: 0.97,
      accretionActivity: 0.97,
      matterStreamIntensity: 0.97,
      gravitationalWaveStrength: 0.93,
      spacetimeDistortion: 0.96,
      environmentCompression: 0.91,
      asymmetricExpansion: 0.84,
      collapseIntensity: 0.95,
    },
  },
  {
    index: 27,
    id: 'debris_field_density_critical',
    name: 'DEBRIS FIELD DENSITY CRITICAL',
    title: 'EVENT 27 — DEBRIS FIELD DENSITY CRITICAL',
    subtitle: 'Accumulated fragmentation reaching critical density. Forward flight obscured.',
    cause: 'Cumulative debris from all 26 prior events coalesces in the inner orbital plane.',
    physicalEffect: 'Extreme spatial particle density; optical path extinction.',
    environmentalResponse: 'Dense swarm of rotating wreckage and microscopic shards surrounds sector.',
    playerResponse: 'Shield drain, tactile controller vibration, headlight glare.',
    triggerTime: 810,
    severity: 9.35,
    gravityParams: {
      gravityInfluenceRadius: 0.97,
      gravityAsymmetry: 0.89,
      lensingStrength: 0.97,
      tidalStrength: 0.97,
      infallRate: 0.97,
      accretionActivity: 0.97,
      matterStreamIntensity: 0.97,
      gravitationalWaveStrength: 0.93,
      spacetimeDistortion: 0.96,
      environmentCompression: 0.92,
      asymmetricExpansion: 0.85,
      collapseIntensity: 0.95,
    },
  },
  {
    index: 28,
    id: 'planetary_atmospheric_disturbance',
    name: 'PLANETARY ATMOSPHERIC DISTURBANCE',
    title: 'EVENT 28 — PLANETARY ATMOSPHERIC DISTURBANCE',
    subtitle: 'Gas giant atmosphere elongated by tidal pull. Giant atmospheric plumes.',
    cause: 'Tidal gravity draws upper planetary atmosphere into tidal teardrop bulge.',
    physicalEffect: 'Gaseous envelope strips into space along gravitational equipotential lines.',
    environmentalResponse: 'Enormous glowing atmospheric gas wisps stream toward singularity.',
    playerResponse: 'Gaseous atmospheric drag resistance, aerodynamic turbulence.',
    triggerTime: 840,
    severity: 9.4,
    gravityParams: {
      gravityInfluenceRadius: 0.97,
      gravityAsymmetry: 0.9,
      lensingStrength: 0.97,
      tidalStrength: 0.98,
      infallRate: 0.97,
      accretionActivity: 0.97,
      matterStreamIntensity: 0.97,
      gravitationalWaveStrength: 0.94,
      spacetimeDistortion: 0.97,
      environmentCompression: 0.93,
      asymmetricExpansion: 0.86,
      collapseIntensity: 0.96,
    },
  },
  {
    index: 29,
    id: 'magnetospheric_disruption',
    name: 'MAGNETOSPHERIC DISRUPTION',
    title: 'EVENT 29 — MAGNETOSPHERIC DISRUPTION',
    subtitle: 'Electromagnetic flux lines compressing. Auroral discharge ribbons.',
    cause: 'Planetary magnetic fields compressed and reconnected by accretion shock.',
    physicalEffect: 'Intense synchrotron radiation; violent charged-particle currents.',
    environmentalResponse: 'Glowing auroral ribbons twist across vacuum; electrical arcs snap between hulls.',
    playerResponse: 'HUD electromagnetic static interference, navigation needle spinning.',
    triggerTime: 870,
    severity: 9.45,
    gravityParams: {
      gravityInfluenceRadius: 0.98,
      gravityAsymmetry: 0.91,
      lensingStrength: 0.98,
      tidalStrength: 0.98,
      infallRate: 0.98,
      accretionActivity: 0.98,
      matterStreamIntensity: 0.98,
      gravitationalWaveStrength: 0.94,
      spacetimeDistortion: 0.97,
      environmentCompression: 0.94,
      asymmetricExpansion: 0.87,
      collapseIntensity: 0.96,
    },
  },
  {
    index: 30,
    id: 'relativistic_debris_stream',
    name: 'RELATIVISTIC DEBRIS STREAM',
    title: 'EVENT 30 — RELATIVISTIC DEBRIS STREAM',
    subtitle: 'Debris streams accelerating to relativistic velocity. Lorentz contracted.',
    cause: 'Infall approaching inner photon sphere imparts near-luminal speeds.',
    physicalEffect: 'Material travels with Lorentz factor gamma > 1.2; Doppler beamed.',
    environmentalResponse: 'Debris streams appear compressed and blue-shifted along vector of motion.',
    playerResponse: 'Ultra-fast projectile hazards; instant reaction required.',
    triggerTime: 900,
    severity: 9.5,
    gravityParams: {
      gravityInfluenceRadius: 0.98,
      gravityAsymmetry: 0.92,
      lensingStrength: 0.98,
      tidalStrength: 0.98,
      infallRate: 0.98,
      accretionActivity: 0.98,
      matterStreamIntensity: 0.98,
      gravitationalWaveStrength: 0.95,
      spacetimeDistortion: 0.98,
      environmentCompression: 0.95,
      asymmetricExpansion: 0.88,
      collapseIntensity: 0.97,
    },
  },
  {
    index: 31,
    id: 'orbital_habitat_deformation',
    name: 'ORBITAL HABITAT DEFORMATION',
    title: 'EVENT 31 — ORBITAL HABITAT DEFORMATION',
    subtitle: 'Large rotating toroidal habitats warping. Docking spines snapping.',
    cause: 'Unequal tidal acceleration across rotating habitat diameter.',
    physicalEffect: 'Habitat rings deform into ovals; internal atmosphere vents through ruptures.',
    environmentalResponse: 'Colossal residential torus buckles; escape pods eject into vacuum.',
    playerResponse: 'Visual tragedy of futuristic habitat collapse; collision avoidance.',
    triggerTime: 930,
    severity: 9.55,
    gravityParams: {
      gravityInfluenceRadius: 0.98,
      gravityAsymmetry: 0.93,
      lensingStrength: 0.98,
      tidalStrength: 0.98,
      infallRate: 0.98,
      accretionActivity: 0.98,
      matterStreamIntensity: 0.98,
      gravitationalWaveStrength: 0.95,
      spacetimeDistortion: 0.98,
      environmentCompression: 0.95,
      asymmetricExpansion: 0.89,
      collapseIntensity: 0.97,
    },
  },
  {
    index: 32,
    id: 'multi_route_collapse',
    name: 'MULTI-ROUTE COLLAPSE',
    title: 'EVENT 32 — MULTI-ROUTE COLLAPSE',
    subtitle: 'Simultaneous failure of parallel route branches. Dynamic path evaluation.',
    cause: 'Destruction front overtakes multiple junction anchors simultaneously.',
    physicalEffect: 'Elevated, lower, and bypass tracks collapse in real time.',
    environmentalResponse: 'Alternative route spans drop into the abyss; emergency signals flash.',
    playerResponse: 'Split-second branch selection; precision pilot input.',
    triggerTime: 960,
    severity: 9.6,
    gravityParams: {
      gravityInfluenceRadius: 0.98,
      gravityAsymmetry: 0.94,
      lensingStrength: 0.98,
      tidalStrength: 0.98,
      infallRate: 0.98,
      accretionActivity: 0.98,
      matterStreamIntensity: 0.98,
      gravitationalWaveStrength: 0.96,
      spacetimeDistortion: 0.98,
      environmentCompression: 0.96,
      asymmetricExpansion: 0.9,
      collapseIntensity: 0.98,
    },
  },
  {
    index: 33,
    id: 'gravitational_trajectory_chaos',
    name: 'GRAVITATIONAL TRAJECTORY CHAOS',
    title: 'EVENT 33 — GRAVITATIONAL TRAJECTORY CHAOS',
    subtitle: 'Chaotic three-body gravitational perturbation across all local matter.',
    cause: 'Overlapping gravitational wells of singularity, collapsing planet, and moon.',
    physicalEffect: 'Non-linear gravitational trajectories (continuous motion, zero teleportation).',
    environmentalResponse: 'All loose objects spiral along erratic yet continuous spatial paths.',
    playerResponse: 'Constant flight stick adjustments, variable weight sensation.',
    triggerTime: 990,
    severity: 9.65,
    gravityParams: {
      gravityInfluenceRadius: 0.99,
      gravityAsymmetry: 0.95,
      lensingStrength: 0.99,
      tidalStrength: 0.99,
      infallRate: 0.99,
      accretionActivity: 0.99,
      matterStreamIntensity: 0.99,
      gravitationalWaveStrength: 0.96,
      spacetimeDistortion: 0.98,
      environmentCompression: 0.96,
      asymmetricExpansion: 0.91,
      collapseIntensity: 0.98,
    },
  },
  {
    index: 34,
    id: 'megastructure_fracture',
    name: 'MEGASTRUCTURE FRACTURE',
    title: 'EVENT 34 — MEGASTRUCTURE FRACTURE',
    subtitle: 'Civilization-scale spine towers snapping. Trillions of tons tumbling.',
    cause: 'Cumulative fatigue breaches catastrophic fracture toughness threshold.',
    physicalEffect: 'Microfractures -> vibration -> large cracks -> separation -> rotation -> infall.',
    environmentalResponse: '600m spine towers break in half; upper sections plunge inward.',
    playerResponse: 'Flying through fractured structural gap; high hazard exposure.',
    triggerTime: 1020,
    severity: 9.7,
    gravityParams: {
      gravityInfluenceRadius: 0.99,
      gravityAsymmetry: 0.96,
      lensingStrength: 0.99,
      tidalStrength: 0.99,
      infallRate: 0.99,
      accretionActivity: 0.99,
      matterStreamIntensity: 0.99,
      gravitationalWaveStrength: 0.97,
      spacetimeDistortion: 0.99,
      environmentCompression: 0.97,
      asymmetricExpansion: 0.92,
      collapseIntensity: 0.98,
    },
  },
  {
    index: 35,
    id: 'cosmic_dust_veil',
    name: 'COSMIC DUST VEIL',
    title: 'EVENT 35 — COSMIC DUST VEIL',
    subtitle: 'Vast pulverization cloud obscuring distant cosmos. Navigation lights required.',
    cause: 'Continuous grinding collisions reduce millions of metric tons into dust.',
    physicalEffect: 'Rayleigh and Mie scattering through pervasive cosmic particulate veil.',
    environmentalResponse: 'Distant stars dim; black hole accretion glow creates diffuse eerie twilight.',
    playerResponse: 'Relying on HUD guidance markers and illumination beams in the dark.',
    triggerTime: 1050,
    severity: 9.75,
    gravityParams: {
      gravityInfluenceRadius: 0.99,
      gravityAsymmetry: 0.97,
      lensingStrength: 0.99,
      tidalStrength: 0.99,
      infallRate: 0.99,
      accretionActivity: 0.99,
      matterStreamIntensity: 0.99,
      gravitationalWaveStrength: 0.97,
      spacetimeDistortion: 0.99,
      environmentCompression: 0.97,
      asymmetricExpansion: 0.93,
      collapseIntensity: 0.99,
    },
  },
  {
    index: 36,
    id: 'collision_cascade',
    name: 'COLLISION CASCADE',
    title: 'EVENT 36 — COLLISION CASCADE',
    subtitle: 'Multiple converging debris fields crashing into each other simultaneously.',
    cause: 'Infalling matter streams collide as they bottleneck near the ISCO boundary.',
    physicalEffect: 'Secondary fragmentation surges; kinetic energy converts to thermal flash.',
    environmentalResponse: 'Sparks, metal vapor, and shattered hull plates explode outward.',
    playerResponse: 'Navigating through turbulent debris explosion zones.',
    triggerTime: 1080,
    severity: 9.8,
    gravityParams: {
      gravityInfluenceRadius: 0.99,
      gravityAsymmetry: 0.98,
      lensingStrength: 0.99,
      tidalStrength: 0.99,
      infallRate: 0.99,
      accretionActivity: 0.99,
      matterStreamIntensity: 0.99,
      gravitationalWaveStrength: 0.98,
      spacetimeDistortion: 0.99,
      environmentCompression: 0.98,
      asymmetricExpansion: 0.94,
      collapseIntensity: 0.99,
    },
  },
  {
    index: 37,
    id: 'last_stable_orbits',
    name: 'LAST STABLE ORBITS',
    title: 'EVENT 37 — LAST STABLE ORBITS',
    subtitle: 'Final surviving orbital infrastructure collapsing. Ruins of civilization.',
    cause: 'Only isolated high-density anchors temporarily resist final tidal pull.',
    physicalEffect: 'Stark, dismantled panorama of shattered civilization drifting together.',
    environmentalResponse: 'Planet fragments, station skeletons, collapsed tracks surround singularity.',
    playerResponse: 'Solemn realization of total civilizational destruction.',
    triggerTime: 1110,
    severity: 9.85,
    gravityParams: {
      gravityInfluenceRadius: 1.0,
      gravityAsymmetry: 0.98,
      lensingStrength: 1.0,
      tidalStrength: 1.0,
      infallRate: 1.0,
      accretionActivity: 1.0,
      matterStreamIntensity: 1.0,
      gravitationalWaveStrength: 0.98,
      spacetimeDistortion: 1.0,
      environmentCompression: 0.98,
      asymmetricExpansion: 0.95,
      collapseIntensity: 0.99,
    },
  },
  {
    index: 38,
    id: 'evacuation_corridor_collapse',
    name: 'EVACUATION CORRIDOR COLLAPSE',
    title: 'EVENT 38 — EVACUATION CORRIDOR COLLAPSE',
    subtitle: 'Final racing route crumbling behind you. Reach the evacuation facility.',
    cause: 'Destruction front eliminates all remaining track except the evacuation entry spur.',
    physicalEffect: 'Route segments collapse sequentially right at the player\'s exhaust trail.',
    environmentalResponse: 'Evacuation Tower sanctuary ahead shines beacon lights; blast doors waiting.',
    playerResponse: 'Full throttle, entering tower entrance, descending into basement.',
    triggerTime: 1140,
    severity: 9.9,
    gravityParams: {
      gravityInfluenceRadius: 1.0,
      gravityAsymmetry: 0.99,
      lensingStrength: 1.0,
      tidalStrength: 1.0,
      infallRate: 1.0,
      accretionActivity: 1.0,
      matterStreamIntensity: 1.0,
      gravitationalWaveStrength: 0.99,
      spacetimeDistortion: 1.0,
      environmentCompression: 0.99,
      asymmetricExpansion: 0.96,
      collapseIntensity: 0.99,
    },
  },
  {
    index: 39,
    id: 'final_cosmic_compression',
    name: 'FINAL COSMIC COMPRESSION',
    title: 'EVENT 39 — FINAL COSMIC COMPRESSION',
    subtitle: 'Remaining universe matter converging. Spacetime metric extreme warp.',
    cause: 'Gravitational collapse accelerates all matter toward singularity origin.',
    physicalEffect: 'Stars stretch into arcs; debris fields funnel into the event horizon.',
    environmentalResponse: 'All remaining environment accelerates inward; immense tidal funnel.',
    playerResponse: 'Inside shelter: heavy hydraulic blast door sealing; outside: universe compressing.',
    triggerTime: 1170,
    severity: 9.95,
    gravityParams: {
      gravityInfluenceRadius: 1.0,
      gravityAsymmetry: 1.0,
      lensingStrength: 1.0,
      tidalStrength: 1.0,
      infallRate: 1.0,
      accretionActivity: 1.0,
      matterStreamIntensity: 1.0,
      gravitationalWaveStrength: 1.0,
      spacetimeDistortion: 1.0,
      environmentCompression: 1.0,
      asymmetricExpansion: 0.98,
      collapseIntensity: 1.0,
    },
  },
  {
    index: 40,
    id: 'absolute_cosmic_end',
    name: 'ABSOLUTE COSMIC END',
    title: 'EVENT 40 — ABSOLUTE COSMIC END',
    subtitle: 'The universe collapses into the singularity. Dark implosion climax.',
    cause: 'Final astrophysical collapse of all surrounding matter into the persistent black hole.',
    physicalEffect: 'Sequential cosmic climax: motion slows -> near silence -> dark pulse -> BOOM -> black screen.',
    environmentalResponse: 'NO WHITE FLASH. NO FIREBALL. Pure dark gravitational implosion & sudden silence.',
    playerResponse: 'Witnessing the ultimate physical collapse of a universe from the secured vault.',
    triggerTime: 1200,
    severity: 10.0,
    gravityParams: {
      gravityInfluenceRadius: 1.0,
      gravityAsymmetry: 1.0,
      lensingStrength: 1.0,
      tidalStrength: 1.0,
      infallRate: 1.0,
      accretionActivity: 1.0,
      matterStreamIntensity: 1.0,
      gravitationalWaveStrength: 1.0,
      spacetimeDistortion: 1.0,
      environmentCompression: 1.0,
      asymmetricExpansion: 1.0,
      collapseIntensity: 1.0,
    },
  },
];

export const COSMIC_40_EVENTS: CosmicEventDefinition[] = RAW_COSMIC_40_EVENTS.map(raw => {
  const pair = COSMIC_40_EVENT_PAIRS[raw.index];
  return {
    ...raw,
    element1: pair.element1,
    element2: pair.element2,
    eventOccurrenceNarrative: pair.eventOccurrenceNarrative,
    completionStrategy: pair.completionStrategy,
  };
});

/* =========================================================================
   1. PersistentDestructionRegistry
   Stores the persistent destruction state across the entire continuous universe.
   Destruction accumulates; nothing resets.
   ========================================================================= */
export interface RegisteredDestructionEntity {
  id: string;
  sourceEvent: number;
  type: 'PLANET' | 'MOON' | 'STATION' | 'BRIDGE' | 'TOWER' | 'RING' | 'TRACK' | 'CARGO';
  state: 'STABLE' | 'DAMAGED' | 'UNSTABLE' | 'COLLAPSING' | 'DESTROYED' | 'FRAGMENTED' | 'DEBRIS' | 'DISTANT_DEBRIS' | 'INFALL' | 'CONSUMED';
  initialPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  fragmentCount: number;
  damagePercent: number;
  persistedInWorld: boolean;
}

export class PersistentDestructionRegistry {
  private static instance: PersistentDestructionRegistry;
  public entities: Map<string, RegisteredDestructionEntity> = new Map();
  public accumulatedDebrisCount = 0;
  public totalFracturedStructures = 0;
  public totalCollapsedRouteMeters = 0;

  public static getInstance(): PersistentDestructionRegistry {
    if (!PersistentDestructionRegistry.instance) {
      PersistentDestructionRegistry.instance = new PersistentDestructionRegistry();
    }
    return PersistentDestructionRegistry.instance;
  }

  public register(entity: RegisteredDestructionEntity): void {
    this.entities.set(entity.id, entity);
    if (entity.state === 'DESTROYED' || entity.state === 'FRAGMENTED' || entity.state === 'DEBRIS') {
      this.accumulatedDebrisCount += entity.fragmentCount;
      this.totalFracturedStructures++;
    }
  }

  public updateState(id: string, state: RegisteredDestructionEntity['state'], damagePercent = 100): void {
    const e = this.entities.get(id);
    if (e) {
      e.state = state;
      e.damagePercent = Math.max(e.damagePercent, damagePercent);
    }
  }

  public getEntity(id: string): RegisteredDestructionEntity | undefined {
    return this.entities.get(id);
  }

  public reset(): void {
    this.entities.clear();
    this.accumulatedDebrisCount = 0;
    this.totalFracturedStructures = 0;
    this.totalCollapsedRouteMeters = 0;
  }
}

/* =========================================================================
   2. CosmicEventScheduler
   Schedules and coordinates the 40 events across continuous gameplay.
   ========================================================================= */
export class CosmicEventScheduler {
  public currentEventIndex = 0;
  public activeEvent: CosmicEventDefinition | null = null;
  public nextEventTime = 30;
  public phase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY' = 'GAMEPLAY';
  public phaseTimer = 0;
  public eventHistory: string[] = [];

  public update(elapsedSeconds: number, dt: number): CosmicEventDefinition | null {
    // Check for next threshold crossing
    for (const def of COSMIC_40_EVENTS) {
      if (def.index === this.currentEventIndex + 1 && elapsedSeconds >= def.triggerTime) {
        this.triggerEvent(def);
        return def;
      }
    }

    // Advance phase timer
    if (this.activeEvent) {
      this.phaseTimer += dt;
      if (this.phase === 'WARNING' && this.phaseTimer >= 3.0) {
        this.phase = 'BUILDUP';
      } else if (this.phase === 'BUILDUP' && this.phaseTimer >= 5.5) {
        this.phase = 'CINEMATIC';
      } else if (this.phase === 'CINEMATIC' && this.phaseTimer >= 8.0) {
        this.phase = 'GAMEPLAY';
      }
    }

    return null;
  }

  public triggerEvent(def: CosmicEventDefinition): void {
    this.currentEventIndex = def.index;
    this.activeEvent = def;
    this.phase = 'WARNING';
    this.phaseTimer = 0;
    this.eventHistory.push(def.id);
    this.nextEventTime = def.index < 40 ? COSMIC_40_EVENTS[def.index].triggerTime : 1200;
  }

  public jumpToEvent(index: number): CosmicEventDefinition | null {
    const def = COSMIC_40_EVENTS.find(e => e.index === index);
    if (def) {
      this.triggerEvent(def);
      return def;
    }
    return null;
  }

  public reset(): void {
    this.currentEventIndex = 0;
    this.activeEvent = null;
    this.nextEventTime = 30;
    this.phase = 'GAMEPLAY';
    this.phaseTimer = 0;
    this.eventHistory = [];
  }
}

/* =========================================================================
   3. GravityEventSystem
   Manages the 12 controlled black hole environmental parameters.
   DOES NOT REDESIGN THE BLACK HOLE.
   ========================================================================= */
export class GravityEventSystem {
  public gravityInfluenceRadius = 0.15;
  public gravityAsymmetry = 0.05;
  public lensingStrength = 0.1;
  public tidalStrength = 0.12;
  public infallRate = 0.1;
  public accretionActivity = 0.15;
  public matterStreamIntensity = 0.1;
  public gravitationalWaveStrength = 0.05;
  public spacetimeDistortion = 0.08;
  public environmentCompression = 0.05;
  public asymmetricExpansion = 0.05;
  public collapseIntensity = 0.05;

  public blackHoleCenter = new THREE.Vector3(0, 180, -3500);

  public applyEventParameters(event: CosmicEventDefinition): void {
    const p = event.gravityParams;
    this.gravityInfluenceRadius = p.gravityInfluenceRadius;
    this.gravityAsymmetry = p.gravityAsymmetry;
    this.lensingStrength = p.lensingStrength;
    this.tidalStrength = p.tidalStrength;
    this.infallRate = p.infallRate;
    this.accretionActivity = p.accretionActivity;
    this.matterStreamIntensity = p.matterStreamIntensity;
    this.gravitationalWaveStrength = p.gravitationalWaveStrength;
    this.spacetimeDistortion = p.spacetimeDistortion;
    this.environmentCompression = p.environmentCompression;
    this.asymmetricExpansion = p.asymmetricExpansion;
    this.collapseIntensity = p.collapseIntensity;
  }

  public calculateInfallVector(position: THREE.Vector3, mass = 1.0): THREE.Vector3 {
    const toBH = new THREE.Vector3().subVectors(this.blackHoleCenter, position);
    const dist = Math.max(150, toBH.length());
    toBH.normalize();

    // Infall magnitude governed by tidal strength & infallRate
    const force = (3500 / dist) * this.tidalStrength * 45 * mass * (1.0 + this.infallRate * 1.5);
    return toBH.multiplyScalar(force);
  }
}

/* =========================================================================
   4. OrbitalDynamicsSystem
   Simulates decaying Keplerian trajectories and orbital resonance loss.
   ========================================================================= */
export class OrbitalDynamicsSystem {
  public updateOrbitalBody(
    position: THREE.Vector3,
    center: THREE.Vector3,
    radius: number,
    angle: number,
    decayRate: number,
    dt: number
  ): { newPosition: THREE.Vector3; newAngle: number; newRadius: number } {
    const newAngle = angle + dt * (0.05 + 0.15 * (1000 / Math.max(200, radius)));
    const newRadius = Math.max(350, radius - dt * decayRate);
    const newPos = new THREE.Vector3(
      center.x + Math.cos(newAngle) * newRadius,
      center.y + Math.sin(newAngle * 0.5) * (newRadius * 0.15),
      center.z + Math.sin(newAngle) * newRadius
    );
    return { newPosition: newPos, newAngle, newRadius };
  }
}

/* =========================================================================
   5. TidalForceSystem
   Applies directional tensile elongation and shear spaghettification.
   ========================================================================= */
export class TidalForceSystem {
  public calculateTidalScale(
    objectPosition: THREE.Vector3,
    singularityCenter: THREE.Vector3,
    baseScale: THREE.Vector3,
    tidalStrength: number
  ): THREE.Vector3 {
    const dist = objectPosition.distanceTo(singularityCenter);
    const factor = Math.min(2.8, 1.0 + (3000 / Math.max(300, dist)) * tidalStrength * 0.8);
    // Elongates along Z (infall vector) and compresses transversely
    return new THREE.Vector3(
      baseScale.x / Math.sqrt(factor),
      baseScale.y / Math.sqrt(factor),
      baseScale.z * factor
    );
  }
}

/* =========================================================================
   6. DebrisEvolutionSystem
   Manages debris lifecycle states across the continuous universe.
   ========================================================================= */
export class DebrisEvolutionSystem {
  public evolve(
    currentState: RegisteredDestructionEntity['state'],
    distanceToSingularity: number
  ): RegisteredDestructionEntity['state'] {
    if (distanceToSingularity < 350) return 'CONSUMED';
    if (distanceToSingularity < 1200) return 'INFALL';
    if (distanceToSingularity < 2200) return 'DISTANT_DEBRIS';
    if (currentState === 'DESTROYED') return 'DEBRIS';
    return currentState;
  }
}

/* =========================================================================
   7. StructuralFailureSystem
   Calculates realistic physical structural failure states:
   VIBRATION -> FATIGUE -> CRACKING -> DEFORMATION -> SEPARATION -> COLLAPSE -> INFALL.
   ========================================================================= */
export class StructuralFailureSystem {
  public calculateFailureStage(stress: number, elapsedSinceTrigger: number): {
    stage: 'VIBRATION' | 'FATIGUE' | 'CRACKING' | 'DEFORMATION' | 'SEPARATION' | 'COLLAPSE' | 'INFALL';
    vibrationIntensity: number;
    fractureAngleDeg: number;
  } {
    if (elapsedSinceTrigger < 2.0) {
      return { stage: 'VIBRATION', vibrationIntensity: stress * 0.4, fractureAngleDeg: 0 };
    } else if (elapsedSinceTrigger < 4.5) {
      return { stage: 'FATIGUE', vibrationIntensity: stress * 0.8, fractureAngleDeg: 1.5 };
    } else if (elapsedSinceTrigger < 7.0) {
      return { stage: 'CRACKING', vibrationIntensity: stress * 1.2, fractureAngleDeg: 4.0 };
    } else if (elapsedSinceTrigger < 10.0) {
      return { stage: 'DEFORMATION', vibrationIntensity: stress * 1.5, fractureAngleDeg: 12.0 };
    } else if (elapsedSinceTrigger < 14.0) {
      return { stage: 'SEPARATION', vibrationIntensity: stress * 0.6, fractureAngleDeg: 25.0 };
    } else if (elapsedSinceTrigger < 20.0) {
      return { stage: 'COLLAPSE', vibrationIntensity: 0.3, fractureAngleDeg: 60.0 };
    } else {
      return { stage: 'INFALL', vibrationIntensity: 0.1, fractureAngleDeg: 90.0 };
    }
  }
}

/* =========================================================================
   8. PlanetaryDynamicsSystem
   Manages twin colliding bodies, lunar fracturing, Roche limit breach,
   and planetary ring particulate dispersion.
   ========================================================================= */
export class PlanetaryDynamicsSystem {
  public planetAPos = new THREE.Vector3(1600, 750, -3200);
  public planetBPos = new THREE.Vector3(2850, 680, -3400);
  public isCollided = false;
  public collisionProgress = 0;

  public updateCollision(dt: number, activeEvent: number): {
    impactOccurred: boolean;
    debrisScatterRadius: number;
  } {
    if (activeEvent < 4) return { impactOccurred: false, debrisScatterRadius: 0 };

    this.collisionProgress += dt * 0.2;
    if (this.planetAPos.distanceTo(this.planetBPos) > 750) {
      this.planetAPos.x += dt * 60;
      this.planetBPos.x -= dt * 70;
      return { impactOccurred: false, debrisScatterRadius: 0 };
    }

    if (!this.isCollided) {
      this.isCollided = true;
      sound.playPlanetaryCollision();
      sound.playHeavyImpact();
      return { impactOccurred: true, debrisScatterRadius: 100 };
    }

    return { impactOccurred: false, debrisScatterRadius: 100 + this.collisionProgress * 250 };
  }
}

/* =========================================================================
   9. EnvironmentalDestructionManager
   Applies destruction, fracturing, and material state changes in Three.js world.
   ========================================================================= */
export class EnvironmentalDestructionManager {
  public applyFractureDisplacement(mesh: THREE.Object3D, angleDeg: number, fallVector: THREE.Vector3, dt: number): void {
    mesh.rotation.z += (angleDeg * (Math.PI / 180)) * dt * 0.1;
    mesh.position.addScaledVector(fallVector, dt);
  }
}

/* =========================================================================
   10. DestructionFrontManager
   Simulates the forward-moving physical destruction front advancing along route.
   ========================================================================= */
export class DestructionFrontManager {
  public progressM = 0;
  public distanceToPlayerM = 2500;
  public baseSpeedMps = 55;

  public update(dt: number, severity: number, playerTrackProgressM: number): boolean {
    const speed = this.baseSpeedMps + severity * 3.5;
    this.progressM += speed * dt;
    this.distanceToPlayerM = Math.max(0, playerTrackProgressM - this.progressM);
    return this.distanceToPlayerM <= 0;
  }
}

/* =========================================================================
   11. CelestialObjectManager
   Coordinates physical 3D planets, moons, satellites, and rings in world.
   ========================================================================= */
export class CelestialObjectManager {
  public moonTectonicChunks: THREE.Mesh[] = [];
  public planetaryRings: THREE.Mesh[] = [];
}

/* =========================================================================
   12. GravitationalWaveSystem
   Propagates relativistic space-time metric compression/expansion pulses.
   ========================================================================= */
export class GravitationalWaveSystem {
  public wavePhase = 0;
  public waveAmplitude = 0;

  public update(dt: number, strength: number): { displacementY: number; metricStrain: number } {
    this.wavePhase += dt * 3.8;
    this.waveAmplitude = strength;
    const displacementY = Math.sin(this.wavePhase) * (strength * 18.0);
    const metricStrain = Math.cos(this.wavePhase) * (strength * 0.08);
    return { displacementY, metricStrain };
  }
}

/* =========================================================================
   13. AtmosphericSpaceManager
   Simulates atmospheric bulges, magnetospheric aurora ribbons, and particle drag.
   ========================================================================= */
export class AtmosphericSpaceManager {
  public auroralIntensity = 0;
  public gasStreamDensity = 0;

  public update(eventIndex: number): void {
    this.auroralIntensity = eventIndex >= 29 ? Math.min(1.0, (eventIndex - 28) * 0.25) : 0;
    this.gasStreamDensity = eventIndex >= 28 ? Math.min(1.0, (eventIndex - 27) * 0.22) : 0;
  }
}

/* =========================================================================
   14. EnvironmentalLightingManager
   Controls accretion plasma illumination, power blackouts, and darkness wave.
   ========================================================================= */
export class EnvironmentalLightingManager {
  public primaryLightColor = new THREE.Color(0xff7722);
  public ambientIntensity = 0.4;
  public flashbangActive = false;
  public darknessWaveActive = false;

  public update(eventIndex: number, dt: number): void {
    if (eventIndex >= 35) {
      // Cosmic dust veil dimming
      this.ambientIntensity = Math.max(0.08, 0.4 - (eventIndex - 34) * 0.06);
    } else {
      this.ambientIntensity = 0.4;
    }
  }
}

/* =========================================================================
   15. EnvironmentalTransitionManager
   Ensures seamless world streaming and continuity between all 40 event phases.
   ========================================================================= */
export class EnvironmentalTransitionManager {
  public activeTransition = false;
  public transitionProgress = 0;

  public startTransition(): void {
    this.activeTransition = true;
    this.transitionProgress = 0;
  }

  public update(dt: number): void {
    if (this.activeTransition) {
      this.transitionProgress += dt * 0.5;
      if (this.transitionProgress >= 1.0) {
        this.activeTransition = false;
      }
    }
  }
}

/* =========================================================================
   16. Master CatastropheEventManager
   Coordinates all 15 sub-systems, evaluates ship forces, and tracks 40 events.
   ========================================================================= */
export class CatastropheEventManager {
  public readonly scheduler: CosmicEventScheduler;
  public readonly gravitySystem: GravityEventSystem;
  public readonly orbitalSystem: OrbitalDynamicsSystem;
  public readonly tidalSystem: TidalForceSystem;
  public readonly debrisSystem: DebrisEvolutionSystem;
  public readonly structuralSystem: StructuralFailureSystem;
  public readonly planetarySystem: PlanetaryDynamicsSystem;
  public readonly destructionManager: EnvironmentalDestructionManager;
  public readonly destructionFront: DestructionFrontManager;
  public readonly celestialManager: CelestialObjectManager;
  public readonly waveSystem: GravitationalWaveSystem;
  public readonly atmosphericManager: AtmosphericSpaceManager;
  public readonly lightingManager: EnvironmentalLightingManager;
  public readonly transitionManager: EnvironmentalTransitionManager;
  public readonly registry: PersistentDestructionRegistry;

  public currentEventIndex = 0;
  public activeEvent: CosmicEventDefinition | null = null;
  public elapsedSeconds = 0;

  constructor() {
    this.scheduler = new CosmicEventScheduler();
    this.gravitySystem = new GravityEventSystem();
    this.orbitalSystem = new OrbitalDynamicsSystem();
    this.tidalSystem = new TidalForceSystem();
    this.debrisSystem = new DebrisEvolutionSystem();
    this.structuralSystem = new StructuralFailureSystem();
    this.planetarySystem = new PlanetaryDynamicsSystem();
    this.destructionManager = new EnvironmentalDestructionManager();
    this.destructionFront = new DestructionFrontManager();
    this.celestialManager = new CelestialObjectManager();
    this.waveSystem = new GravitationalWaveSystem();
    this.atmosphericManager = new AtmosphericSpaceManager();
    this.lightingManager = new EnvironmentalLightingManager();
    this.transitionManager = new EnvironmentalTransitionManager();
    this.registry = PersistentDestructionRegistry.getInstance();
  }

  public update(dt: number, playerTrackProgressM: number): {
    activeEvent: CosmicEventDefinition | null;
    phase: 'WARNING' | 'BUILDUP' | 'CINEMATIC' | 'GAMEPLAY';
    frontCaughtPlayer: boolean;
  } {
    const delta = Math.max(0, Math.min(dt, 0.25));
    this.elapsedSeconds += delta;

    // 1. Advance Scheduler across 40 Events
    const newEvent = this.scheduler.update(this.elapsedSeconds, delta);
    if (newEvent) {
      this.currentEventIndex = newEvent.index;
      this.activeEvent = newEvent;
      this.gravitySystem.applyEventParameters(newEvent);
      this.transitionManager.startTransition();

      // Play authentic sound cues
      if (newEvent.index === 1) {
        sound.playEmergencyAlarm();
        sound.playGravitationalRumble(3.0);
      } else if (newEvent.index === 4) {
        sound.playPlanetaryCollision();
        sound.playHeavyImpact();
      } else if (newEvent.index === 18) {
        sound.playDarkGravitationalShockwave();
      } else if (newEvent.index === 26) {
        sound.playStructureCreak();
      } else if (newEvent.index === 40) {
        sound.playFinalCosmicCollapse();
      } else {
        sound.playGravitationalRumble(3.2);
      }
    }

    // 2. Advance Subsystems
    const severity = this.activeEvent?.severity ?? 1.0;
    const frontCaughtPlayer = this.destructionFront.update(delta, severity, playerTrackProgressM);
    this.planetarySystem.updateCollision(delta, this.currentEventIndex);
    this.atmosphericManager.update(this.currentEventIndex);
    this.lightingManager.update(this.currentEventIndex, delta);
    this.transitionManager.update(delta);

    return {
      activeEvent: this.activeEvent,
      phase: this.scheduler.phase,
      frontCaughtPlayer,
    };
  }

  /**
   * Evaluates realistic physical impact forces applied to player ship
   */
  public getShipImpactForces(timeSec: number): {
    lateralForce: number;
    steeringResistance: number;
    velocityDisturbance: number;
    pitchDisturbance: number;
    rollDisturbance: number;
    yawDisturbance: number;
    cameraShake: number;
    fovDistortion: number;
    hudInterference: number;
    shieldStress: number;
    navigationInterference: number;
  } {
    if (!this.activeEvent) {
      return {
        lateralForce: 0,
        steeringResistance: 0,
        velocityDisturbance: 0,
        pitchDisturbance: 0,
        rollDisturbance: 0,
        yawDisturbance: 0,
        cameraShake: 0,
        fovDistortion: 0,
        hudInterference: 0,
        shieldStress: 0,
        navigationInterference: 0,
      };
    }

    const sev = this.activeEvent.severity;
    const wave = Math.sin(timeSec * 3.8) * 0.55 + Math.sin(timeSec * 7.5) * 0.25;

    // Lateral force and steering resistance
    const lateralForce = wave * (sev * 0.38);
    const steeringResistance = Math.min(0.55, (sev / 10) * 0.55);

    // Velocity fluctuation
    const velocityDisturbance = Math.cos(timeSec * 2.2) * (sev * 0.65);

    // Rotational perturbations
    const pitchDisturbance = Math.sin(timeSec * 4.5) * (sev * 0.025);
    const rollDisturbance = Math.cos(timeSec * 3.8) * (sev * 0.038);
    const yawDisturbance = Math.sin(timeSec * 2.8) * (sev * 0.018);

    // Camera & HUD
    const cameraShake = Math.min(2.5, (sev / 10) * 2.2);
    const fovDistortion = Math.min(8.0, (sev / 10) * 7.5);
    const hudInterference = Math.min(1.0, this.activeEvent.index >= 18 ? (this.activeEvent.index - 17) * 0.045 : 0);
    const shieldStress = (sev / 10) * 12.0;
    const navigationInterference = this.activeEvent.index >= 29 ? 0.7 : this.activeEvent.index >= 12 ? 0.3 : 0;

    return {
      lateralForce,
      steeringResistance,
      velocityDisturbance,
      pitchDisturbance,
      rollDisturbance,
      yawDisturbance,
      cameraShake,
      fovDistortion,
      hudInterference,
      shieldStress,
      navigationInterference,
    };
  }

  public reset(): void {
    this.currentEventIndex = 0;
    this.activeEvent = null;
    this.elapsedSeconds = 0;
    this.scheduler.reset();
    this.registry.reset();
  }
}
