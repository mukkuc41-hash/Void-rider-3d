import { ExtendedPathConfig } from './extendedPathTypes';

/**
 * Extended Path Configurations: Modes 01 - 05
 * 01: SINGULARITY_RUN (Black hole core gauntlet, photon sphere slingshot)
 * 02: NEON_CIRCUIT (Neo-Tokyo orbital highway, skyscraper canyon)
 * 03: ASTEROID_RUN (Vesta iron mining trench, rotating boulder tunnel)
 * 04: WORMHOLE_EXPRESS (Subspace conduit zero, warp tunnels & rifts)
 * 05: SOLAR_STORM (Helios corona perihelion, solar flare corridor)
 */

export const MODE_PATH_01_SINGULARITY: ExtendedPathConfig = {
  modeId: 'SINGULARITY_RUN',
  modeName: 'SINGULARITY RUN',
  locationName: 'STATION HORIZON-9 // EVENT HORIZON APEX',
  totalEquivalentKm: 5.8,
  targetSplineLength: 4800,
  controlPoints: [
    [0, 20, 0],           // 00 Deep space launch corridor
    [80, 50, -420],       // 01 Gravity distortion sector entry
    [240, 110, -880],     // 02 High acceleration ramp overlooking singularity
    [480, 160, -1340],    // 03 Photon sphere boundary
    [620, 140, -1820],    // 04 Asteroid accretion rim
    [540, 70, -2280],     // 05 Gravitational slingshot approach
    [280, -20, -2640],    // 06 Extreme curved space dive
    [-80, -95, -2820],    // 07 Event horizon close periapsis
    [-460, -140, -2700],  // 08 Lowest altitude: intense tidal force
    [-820, -120, -2360],  // 09 Superluminal slingshot ejection
    [-1060, -60, -1920],  // 10 Relativistic climb out of well
    [-1180, 15, -1420],   // 11 Hawking radiation plume
    [-1120, 80, -920],    // 12 Outer accretion bridge
    [-920, 125, -460],    // 13 Slalom around dark matter fragments
    [-640, 130, -60],     // 14 Warp conduit alignment
    [-340, 95, 280],      // 15 Sub-space compression straight
    [-60, 45, 480],       // 16 Emergency escape portal gate
    [160, 15, 360],       // 17 Deceleration chicane
    [120, 10, 140],       // 18 Final sprint to Horizon Station
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: LAUNCH CORRIDOR', subtitle: 'DEEP SPACE ESCAPE', startT: 0.0, endT: 0.18, environment: 'DEEP_SPACE', hazardDensity: 0.2, recommendedSpeed: 700, description: 'High-speed acceleration straightaway clear of the gravity well.' },
    { index: 2, name: 'SECTOR 2: GRAVITY DISTORTION', subtitle: 'ACCRETION RIM', startT: 0.18, endT: 0.35, environment: 'DEEP_SPACE', hazardDensity: 0.45, recommendedSpeed: 640, description: 'Spacetime curvature bends ship flight trajectory.' },
    { index: 3, name: 'SECTOR 3: PHOTON SPHERE SLINGSHOT', subtitle: 'EVENT HORIZON APEX', startT: 0.35, endT: 0.55, environment: 'DEEP_SPACE', hazardDensity: 0.7, recommendedSpeed: 820, description: 'Massive gravitational acceleration around Kerr singularity.' },
    { index: 4, name: 'SECTOR 4: TIDAL SURGE CHASM', subtitle: 'RELATIVISTIC CLIMB', startT: 0.55, endT: 0.72, environment: 'DEEP_SPACE', hazardDensity: 0.65, recommendedSpeed: 680, description: 'Climb out of the gravity well against tidal shear.' },
    { index: 5, name: 'SECTOR 5: EMERGENCY EXTRACTION', subtitle: 'FINAL HORIZON SPRINT', startT: 0.72, endT: 1.0, environment: 'DEEP_SPACE', hazardDensity: 0.85, recommendedSpeed: 880, description: 'Final sprint through collapsing dark matter gates.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'singularity_slingshot_shot',
      title: 'EVENT HORIZON SLINGSHOT',
      subtitle: 'RELATIVISTIC VELOCITY ENGAGED',
      triggerT: 0.42,
      durationSec: 2.8,
      shotType: 'SHOT_03_WIDE_ENVIRONMENT_REVEAL',
      fovDelta: 16,
      timeScale: 0.9,
      cameraOffset: [-28, 14, 22],
      lookAtOffset: [0, 2, -15],
    },
    {
      id: 'singularity_climax_shot',
      title: 'GRAVITATIONAL ESCAPE',
      subtitle: 'MAXIMUM THRUST REBOUND',
      triggerT: 0.88,
      durationSec: 2.4,
      shotType: 'SHOT_07_EXTREME_SPEED',
      fovDelta: 22,
      timeScale: 1.0,
      cameraOffset: [0, 3, -12],
      lookAtOffset: [0, 1.5, 30],
    },
  ],
  environmentZones: [
    { environment: 'DEEP_SPACE', startT: 0.0, endT: 1.0, fogColor: 0x050014, fogDensity: 0.0004, ambientColor: 0x241144, sunColor: 0xa855f7, skyboxTheme: 'SINGULARITY', particleSpeedMultiplier: 1.6 },
  ],
  hazards: [
    { id: 'h_grav_well', name: 'GRAVITY WELL ACCRETION', startT: 0.35, endT: 0.55, hazardType: 'GRAV_WELL', intensity: 0.8, warningText: 'STRONG TIDAL SHEAR // COUNTER-STEER TOWARD APEX', color: '#d946ef' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'EVENT HORIZON COLLAPSE: FINAL ESCAPE',
    hazardSurgeMultiplier: 1.6,
    cinematicShot: 'SHOT_09_MASSIVE_SCALE_REVEAL',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_02_NEON: ExtendedPathConfig = {
  modeId: 'NEON_CIRCUIT',
  modeName: 'NEON CIRCUIT',
  locationName: 'NEO-KYOTO // STRATOSPHERIC TRANSIT 01',
  totalEquivalentKm: 6.2,
  targetSplineLength: 5200,
  controlPoints: [
    [0, 0, 0],              // 00 Neon grand boulevard start
    [-120, 25, -380],       // 01 Skyscraper canyon entry
    [-340, 75, -820],       // 02 Tower skybridge climb
    [-580, 110, -1280],     // 03 Stratospheric elevated highway
    [-840, 95, -1720],      // 04 Megastructure outer ring
    [-980, 40, -2140],      // 05 Holographic tunnel descent
    [-920, -25, -2520],     // 06 Subterranean transit chute
    [-680, -60, -2740],     // 07 Deep canyon neon boulevard
    [-380, -45, -2820],     // 08 Downtown orbital plaza
    [-80, -10, -2700],      // 09 Ascending rooftop jump
    [220, 45, -2420],       // 10 Commercial sky-highway
    [480, 90, -2020],       // 11 High-G banked arc over central spire
    [680, 120, -1560],      // 12 Advertising billboard corridor
    [760, 95, -1060],       // 13 High-speed chicane
    [680, 45, -580],        // 14 Skyway connector
    [460, 15, -180],        // 15 Stadium entrance straight
    [220, 5, 80],           // 16 Final sprint straight
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: NEON BOULEVARD', subtitle: 'MEGACITY LAUNCH', startT: 0.0, endT: 0.22, environment: 'NEON_CITY', hazardDensity: 0.25, recommendedSpeed: 720, description: 'Three-lane illuminated skyway threading corporate spires.' },
    { index: 2, name: 'SECTOR 2: SKYSCRAPER CANYON', subtitle: 'TOWER SHADOWS', startT: 0.22, endT: 0.44, environment: 'NEON_CITY', hazardDensity: 0.45, recommendedSpeed: 660, description: 'Tight bank angles between reflective cybernetic towers.' },
    { index: 3, name: 'SECTOR 3: HOLOGRAPHIC TUNNEL', subtitle: 'SUBTERRANEAN TRANSIT', startT: 0.44, endT: 0.68, environment: 'NEON_CITY', hazardDensity: 0.6, recommendedSpeed: 750, description: 'Hyper-speed tube lined with pulsating laser billboards.' },
    { index: 4, name: 'SECTOR 4: ROOFTOP SKYWAY', subtitle: 'DOWNTOWN PANORAMA', startT: 0.68, endT: 1.0, environment: 'NEON_CITY', hazardDensity: 0.75, recommendedSpeed: 840, description: 'Panoramic high-altitude sprint toward the central grandstand.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'neon_skyline_sweep',
      title: 'NEO-KYOTO SPIRE FLY-BY',
      subtitle: 'METROPOLIS PANORAMA',
      triggerT: 0.28,
      durationSec: 2.6,
      shotType: 'SHOT_02_SIDE_FLYBY',
      fovDelta: 10,
      timeScale: 1.0,
      cameraOffset: [24, 6, -8],
      lookAtOffset: [0, 1, 10],
    },
  ],
  environmentZones: [
    { environment: 'NEON_CITY', startT: 0.0, endT: 1.0, fogColor: 0x001528, fogDensity: 0.0005, ambientColor: 0x00e5ff, sunColor: 0x00f0ff, skyboxTheme: 'NEON', particleSpeedMultiplier: 1.3 },
  ],
  hazards: [
    { id: 'h_laser_gates', name: 'TRANSIT LASER BARRIERS', startT: 0.45, endT: 0.65, hazardType: 'LASER_BARRIER', intensity: 0.6, warningText: 'CYBER-GRID INTERFERENCE // ALIGN WITH CYAN EMITTERS', color: '#00f0ff' },
  ],
  finalClimax: {
    startT: 0.85,
    climaxTitle: 'DOWNTOWN OVERDRIVE: GRAND FINALE',
    hazardSurgeMultiplier: 1.4,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_03_ASTEROID: ExtendedPathConfig = {
  modeId: 'ASTEROID_RUN',
  modeName: 'ASTEROID RUN',
  locationName: 'VESTA MINING CORRIDOR // DEEP SECTOR 4',
  totalEquivalentKm: 6.8,
  targetSplineLength: 5600,
  controlPoints: [
    [0, 0, 0],              // 00 Iron belt staging area
    [60, -35, -420],        // 01 Deep mining canyon descent
    [220, -75, -880],       // 02 Heavy banking around iron megalith
    [460, -30, -1360],      // 03 Climbing out of hazard crevice
    [620, 45, -1820],       // 04 Tumbling boulder gate
    [580, 95, -2320],       // 05 Ore refinery flyover
    [340, 60, -2760],       // 06 Slalom through dense debris field
    [60, 15, -3080],        // 07 Deep cavern interior dive
    [-280, -45, -3180],     // 08 Sub-surface ore conduit
    [-620, -85, -2980],     // 09 Low cavern bend with tight clearances
    [-920, -95, -2560],     // 10 Molten magma crater rim
    [-1120, -40, -2040],    // 11 Ascending mining shaft
    [-1160, 35, -1520],     // 12 High ridge overlooking wreckage
    [-980, 85, -1020],      // 13 Mountain apex panoramic straight
    [-680, 105, -580],      // 14 Banked descent toward extraction
    [-340, 70, -220],       // 15 Crane gantry slalom
    [-80, 25, 60],          // 16 Final ore depot sprint
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: MINING CANYON', subtitle: 'TRENCH RUN', startT: 0.0, endT: 0.25, environment: 'ASTEROID_FIELD', hazardDensity: 0.35, recommendedSpeed: 680, description: 'Carved ore trench flanked by jagged iron spires.' },
    { index: 2, name: 'SECTOR 2: TUMBLING SWARM', subtitle: 'KINETIC DANGER', startT: 0.25, endT: 0.5, environment: 'ASTEROID_FIELD', hazardDensity: 0.65, recommendedSpeed: 620, description: 'Dense tumbling asteroid belt with destructible obstacles.' },
    { index: 3, name: 'SECTOR 3: ORE REFINERY CAVERN', subtitle: 'SUBTERRANEAN DRIFT', startT: 0.5, endT: 0.75, environment: 'ASTEROID_FIELD', hazardDensity: 0.55, recommendedSpeed: 690, description: 'Enclosed cavern illuminated by molten slag conduits.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION GAUNTLET', subtitle: 'FINAL ORE ESCAPE', startT: 0.75, endT: 1.0, environment: 'ASTEROID_FIELD', hazardDensity: 0.8, recommendedSpeed: 780, description: 'High-speed breakout through automated refining cranes.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'asteroid_split_cinematic',
      title: 'MEGALITH FRACTURE ALERT',
      subtitle: 'BOULDER BREAKUP OPENING DUAL ROUTES',
      triggerT: 0.38,
      durationSec: 2.8,
      shotType: 'SHOT_05_FRONT_OBSTACLE_REVEAL',
      fovDelta: 12,
      timeScale: 0.85,
      cameraOffset: [0, 4, 18],
      lookAtOffset: [0, 0, -35],
    },
  ],
  environmentZones: [
    { environment: 'ASTEROID_FIELD', startT: 0.0, endT: 1.0, fogColor: 0x1f1408, fogDensity: 0.0006, ambientColor: 0xffaa00, sunColor: 0xff8800, skyboxTheme: 'ASTEROID', particleSpeedMultiplier: 1.4 },
  ],
  hazards: [
    { id: 'h_asteroid_barrage', name: 'TUMBLING ASTEROID SHOWER', startT: 0.25, endT: 0.52, hazardType: 'ASTEROID_SWARM', intensity: 0.75, warningText: 'DENSE COLLISION RISK // FIRE DESTRUCTION BEAM', color: '#f59e0b' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'CRATER COLLAPSE: HIGH-SPEED EVASION',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_04_WORMHOLE: ExtendedPathConfig = {
  modeId: 'WORMHOLE_EXPRESS',
  modeName: 'WORMHOLE EXPRESS',
  locationName: 'SUBSPACE CONDUIT ZERO // TAURUS SECTOR',
  totalEquivalentKm: 7.2,
  targetSplineLength: 5900,
  controlPoints: [
    [0, 10, 0],             // 00 Deep space conduit staging
    [110, 40, -450],        // 01 Subspace aperture entry approach
    [320, 85, -960],        // 02 Wormhole 1 event ring entry
    [580, 130, -1520],      // 03 Warped hyperspace corridor alpha
    [720, 110, -2100],      // 04 Dimensional twist 90-degree spiral
    [640, 45, -2660],       // 05 Wormhole 2 gate exit slingshot
    [380, -25, -3100],      // 06 Distorted reality nexus
    [40, -75, -3320],       // 07 Multiple portal junction
    [-340, -90, -3260],     // 08 Unstable vortex tunnel
    [-710, -60, -2940],     // 09 Wormhole 3 acceleration throat
    [-980, 0, -2440],       // 10 Hyperspace wave crest
    [-1120, 65, -1860],     // 11 Temporal shear straight
    [-1060, 115, -1280],    // 12 Wormhole 4 exit jump
    [-840, 120, -720],      // 13 Chromatic aberration chicane
    [-520, 80, -280],       // 14 Reality stabilization descent
    [-180, 30, 40],         // 15 Final tachyon sprint
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: APERTURE APPROACH', subtitle: 'SUBSPACE ENTRY', startT: 0.0, endT: 0.22, environment: 'WORMHOLE', hazardDensity: 0.3, recommendedSpeed: 740, description: 'Acceleration corridor leading directly into the first warp portal.' },
    { index: 2, name: 'SECTOR 2: WARP TUNNEL ALPHA', subtitle: 'DIMENSIONAL SPIRAL', startT: 0.22, endT: 0.48, environment: 'WORMHOLE', hazardDensity: 0.55, recommendedSpeed: 820, description: 'Supercharged chromatic tunnel bending spacetime around ship.' },
    { index: 3, name: 'SECTOR 3: DISTORTED REALITY NEXUS', subtitle: 'MULTIPLE EXITS', startT: 0.48, endT: 0.74, environment: 'WORMHOLE', hazardDensity: 0.7, recommendedSpeed: 800, description: 'Unstable nexus where racers must navigate dynamic distortion rifts.' },
    { index: 4, name: 'SECTOR 4: FINAL HYPERSPACE JUMP', subtitle: 'REALITY RE-ENTRY', startT: 0.74, endT: 1.0, environment: 'WORMHOLE', hazardDensity: 0.85, recommendedSpeed: 920, description: 'Maximum velocity ejection back into local realspace.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'wormhole_entry_cinematic',
      title: 'SUBSPACE INVERSION ACTIVE',
      subtitle: 'HYPERSPACE VELOCITY MULTIPLIER',
      triggerT: 0.24,
      durationSec: 2.7,
      shotType: 'SHOT_07_EXTREME_SPEED',
      fovDelta: 25,
      timeScale: 0.95,
      cameraOffset: [0, 2.5, -14],
      lookAtOffset: [0, 1, 40],
    },
  ],
  environmentZones: [
    { environment: 'WORMHOLE', startT: 0.0, endT: 1.0, fogColor: 0x050522, fogDensity: 0.0005, ambientColor: 0x3b82f6, sunColor: 0x60a5fa, skyboxTheme: 'WORMHOLE', particleSpeedMultiplier: 2.2 },
  ],
  hazards: [
    { id: 'h_spatial_distortion', name: 'TEMPORAL SPATIAL RIFTS', startT: 0.48, endT: 0.72, hazardType: 'PLASMA_WALL', intensity: 0.7, warningText: 'UNSTABLE WARP GEOMETRY // MAINTAIN CENTER VECTOR', color: '#60a5fa' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'WORMHOLE COLLAPSE: TACHYON OVERDRIVE',
    hazardSurgeMultiplier: 1.6,
    cinematicShot: 'SHOT_03_WIDE_ENVIRONMENT_REVEAL',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_05_SOLAR: ExtendedPathConfig = {
  modeId: 'SOLAR_STORM',
  modeName: 'SOLAR STORM',
  locationName: 'HELIOS CORONA // PERIHELION ARC',
  totalEquivalentKm: 6.5,
  targetSplineLength: 5400,
  controlPoints: [
    [0, 0, 0],              // 00 Stellar observation orbital start
    [140, 30, -380],        // 01 Outer coronal loop
    [380, 80, -820],        // 02 High solar prominence overpass
    [680, 115, -1320],      // 03 Plasma flare corridor entry
    [860, 95, -1880],       // 04 Magnetic flux lines arc
    [880, 40, -2440],       // 05 Extreme thermal zone descent
    [710, -25, -2920],      // 06 Perihelion closest solar approach
    [420, -75, -3240],      // 07 Plasma wave avoidance bend
    [80, -90, -3320],       // 08 Solar shadow cooling zone
    [-280, -65, -3160],     // 09 Magnetic storm chasm
    [-620, -15, -2780],     // 10 Chromospheric ejection corridor
    [-860, 45, -2260],      // 11 Climbing solar wind slipstream
    [-960, 95, -1680],      // 12 Coronal mass ejection evasion
    [-880, 120, -1120],     // 13 High-altitude cooling straight
    [-640, 90, -620],       // 14 Solar sail collector bypass
    [-340, 45, -220],       // 15 Deceleration straight
    [-80, 10, 60],          // 16 Helios station finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: CORONAL ARC', subtitle: 'PERIHELION ENTRY', startT: 0.0, endT: 0.25, environment: 'SOLAR_CORONA', hazardDensity: 0.3, recommendedSpeed: 700, description: 'Racing along outer solar magnetic loops with rising core temps.' },
    { index: 2, name: 'SECTOR 2: PLASMA FLARE CORRIDOR', subtitle: 'SOLAR ERUPTIONS', startT: 0.25, endT: 0.52, environment: 'SOLAR_CORONA', hazardDensity: 0.65, recommendedSpeed: 640, description: 'Erupting coronal mass flares crossing racing line lanes.' },
    { index: 3, name: 'SECTOR 3: THERMAL SHADOW ZONE', subtitle: 'CORE COOLING', startT: 0.52, endT: 0.76, environment: 'SOLAR_CORONA', hazardDensity: 0.5, recommendedSpeed: 780, description: 'Asteroid shadow corridor where heat dissipation is maximized.' },
    { index: 4, name: 'SECTOR 4: SOLAR WIND ESCAPE', subtitle: 'FINAL THERMAL SPRINT', startT: 0.76, endT: 1.0, environment: 'SOLAR_CORONA', hazardDensity: 0.8, recommendedSpeed: 860, description: 'Maximum engine boost riding solar wind particles to safety.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'solar_flare_eruption',
      title: 'CORONAL MASS EJECTION WARNING',
      subtitle: 'PLASMA WAVE EXPANDING ACROSS SECTOR',
      triggerT: 0.32,
      durationSec: 2.8,
      shotType: 'SHOT_03_WIDE_ENVIRONMENT_REVEAL',
      fovDelta: 14,
      timeScale: 0.9,
      cameraOffset: [26, 12, 10],
      lookAtOffset: [-10, 0, -25],
    },
  ],
  environmentZones: [
    { environment: 'SOLAR_CORONA', startT: 0.0, endT: 1.0, fogColor: 0x2d1200, fogDensity: 0.0006, ambientColor: 0xff6600, sunColor: 0xffaa00, skyboxTheme: 'SOLAR', particleSpeedMultiplier: 1.8 },
  ],
  hazards: [
    { id: 'h_solar_flare', name: 'CORONAL PLASMA FLARE', startT: 0.26, endT: 0.5, hazardType: 'SOLAR_FLARE', intensity: 0.85, warningText: 'HEAT SPIKE DETECTED // DIVE INTO SHADOW CONDUITS', color: '#ea580c' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'SOLAR ERUPTION WAVE: SPRINT TO STATION',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_06_ORBITING_PLAYER',
    musicIntensity: 1.0,
  },
};
