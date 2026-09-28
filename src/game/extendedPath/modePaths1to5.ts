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
  totalEquivalentKm: 10.4,
  targetSplineLength: 8600,
  controlPoints: [
    [0, 36, 0],           // 00 Deep space launch corridor
    [144, 90, -756],       // 01 Gravity distortion sector entry
    [432, 198, -1584],     // 02 High acceleration ramp overlooking singularity
    [864, 288, -2412],    // 03 Photon sphere boundary
    [1116, 252, -3276],    // 04 Asteroid accretion rim
    [972, 126, -4104],     // 05 Gravitational slingshot approach
    [504, -36, -4752],    // 06 Extreme curved space dive
    [-144, -171, -5076],    // 07 Event horizon close periapsis
    [-828, -252, -4860],  // 08 Lowest altitude: intense tidal force
    [-1476, -216, -4248],  // 09 Superluminal slingshot ejection
    [-1908, -108, -3456],  // 10 Relativistic climb out of well
    [-2124, 27, -2556],   // 11 Hawking radiation plume
    [-2016, 144, -1656],    // 12 Outer accretion bridge
    [-1656, 225, -828],    // 13 Slalom around dark matter fragments
    [-1152, 234, -108],     // 14 Warp conduit alignment
    [-612, 171, 504],      // 15 Sub-space compression straight
    [-108, 81, 864],       // 16 Emergency escape portal gate
    [288, 27, 648],       // 17 Deceleration chicane
    [216, 18, 252],       // 18 Final sprint to Horizon Station
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: LAUNCH CORRIDOR', subtitle: 'DEEP SPACE ESCAPE', startT: 0.0, endT: 0.18, environment: 'DEEP_SPACE', hazardDensity: 0.3, recommendedSpeed: 700, description: 'High-speed acceleration straightaway clear of the gravity well.' },
    { index: 2, name: 'SECTOR 2: GRAVITY DISTORTION', subtitle: 'ACCRETION RIM', startT: 0.18, endT: 0.35, environment: 'DEEP_SPACE', hazardDensity: 0.55, recommendedSpeed: 640, description: 'Spacetime curvature bends ship flight trajectory.' },
    { index: 3, name: 'SECTOR 3: PHOTON SPHERE SLINGSHOT', subtitle: 'EVENT HORIZON APEX', startT: 0.35, endT: 0.55, environment: 'DEEP_SPACE', hazardDensity: 0.8, recommendedSpeed: 820, description: 'Massive gravitational acceleration around Kerr singularity.' },
    { index: 4, name: 'SECTOR 4: TIDAL SURGE CHASM', subtitle: 'RELATIVISTIC CLIMB', startT: 0.55, endT: 0.72, environment: 'DEEP_SPACE', hazardDensity: 0.75, recommendedSpeed: 680, description: 'Climb out of the gravity well against tidal shear.' },
    { index: 5, name: 'SECTOR 5: EMERGENCY EXTRACTION', subtitle: 'FINAL HORIZON SPRINT', startT: 0.72, endT: 1.0, environment: 'DEEP_SPACE', hazardDensity: 0.95, recommendedSpeed: 880, description: 'Final sprint through collapsing dark matter gates.' },
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
    { id: 'h_grav_well_approach', name: 'GRAVITY WELL ACCRETION // APPROACH', startT: 0.19, endT: 0.31, hazardType: 'GRAV_WELL', intensity: 0.64, warningText: 'STRONG TIDAL SHEAR // COUNTER-STEER TOWARD APEX', color: '#d946ef' },
    { id: 'h_grav_well_core', name: 'GRAVITY WELL ACCRETION', startT: 0.35, endT: 0.55, hazardType: 'GRAV_WELL', intensity: 0.80, warningText: 'STRONG TIDAL SHEAR // COUNTER-STEER TOWARD APEX', color: '#d946ef' },
    { id: 'h_grav_well_final', name: 'GRAVITY WELL ACCRETION // FINAL GAUNTLET', startT: 0.63, endT: 0.77, hazardType: 'GRAV_WELL', intensity: 0.76, warningText: 'STRONG TIDAL SHEAR // COUNTER-STEER TOWARD APEX', color: '#d946ef' },
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
  totalEquivalentKm: 11.2,
  targetSplineLength: 9400,
  controlPoints: [
    [0, 0, 0],              // 00 Neon grand boulevard start
    [-216, 45, -684],       // 01 Skyscraper canyon entry
    [-612, 135, -1476],       // 02 Tower skybridge climb
    [-1044, 198, -2304],     // 03 Stratospheric elevated highway
    [-1512, 171, -3096],      // 04 Megastructure outer ring
    [-1764, 72, -3852],      // 05 Holographic tunnel descent
    [-1656, -45, -4536],     // 06 Subterranean transit chute
    [-1224, -108, -4932],     // 07 Deep canyon neon boulevard
    [-684, -81, -5076],     // 08 Downtown orbital plaza
    [-144, -18, -4860],      // 09 Ascending rooftop jump
    [396, 81, -4356],       // 10 Commercial sky-highway
    [864, 162, -3636],       // 11 High-G banked arc over central spire
    [1224, 216, -2808],      // 12 Advertising billboard corridor
    [1368, 171, -1908],       // 13 High-speed chicane
    [1224, 81, -1044],        // 14 Skyway connector
    [828, 27, -324],        // 15 Stadium entrance straight
    [396, 9, 144],           // 16 Final sprint straight
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: NEON BOULEVARD', subtitle: 'MEGACITY LAUNCH', startT: 0.0, endT: 0.22, environment: 'NEON_CITY', hazardDensity: 0.35, recommendedSpeed: 720, description: 'Three-lane illuminated skyway threading corporate spires.' },
    { index: 2, name: 'SECTOR 2: SKYSCRAPER CANYON', subtitle: 'TOWER SHADOWS', startT: 0.22, endT: 0.44, environment: 'NEON_CITY', hazardDensity: 0.55, recommendedSpeed: 660, description: 'Tight bank angles between reflective cybernetic towers.' },
    { index: 3, name: 'SECTOR 3: HOLOGRAPHIC TUNNEL', subtitle: 'SUBTERRANEAN TRANSIT', startT: 0.44, endT: 0.68, environment: 'NEON_CITY', hazardDensity: 0.7, recommendedSpeed: 750, description: 'Hyper-speed tube lined with pulsating laser billboards.' },
    { index: 4, name: 'SECTOR 4: ROOFTOP SKYWAY', subtitle: 'DOWNTOWN PANORAMA', startT: 0.68, endT: 1.0, environment: 'NEON_CITY', hazardDensity: 0.85, recommendedSpeed: 840, description: 'Panoramic high-altitude sprint toward the central grandstand.' },
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
    { id: 'h_laser_gates_approach', name: 'TRANSIT LASER BARRIERS // APPROACH', startT: 0.29, endT: 0.41, hazardType: 'LASER_BARRIER', intensity: 0.48, warningText: 'CYBER-GRID INTERFERENCE // ALIGN WITH CYAN EMITTERS', color: '#00f0ff' },
    { id: 'h_laser_gates_core', name: 'TRANSIT LASER BARRIERS', startT: 0.45, endT: 0.65, hazardType: 'LASER_BARRIER', intensity: 0.60, warningText: 'CYBER-GRID INTERFERENCE // ALIGN WITH CYAN EMITTERS', color: '#00f0ff' },
    { id: 'h_laser_gates_final', name: 'TRANSIT LASER BARRIERS // FINAL GAUNTLET', startT: 0.72, endT: 0.87, hazardType: 'LASER_BARRIER', intensity: 0.57, warningText: 'CYBER-GRID INTERFERENCE // ALIGN WITH CYAN EMITTERS', color: '#00f0ff' },
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
  totalEquivalentKm: 12.2,
  targetSplineLength: 10100,
  controlPoints: [
    [0, 0, 0],              // 00 Iron belt staging area
    [108, -63, -756],        // 01 Deep mining canyon descent
    [396, -135, -1584],       // 02 Heavy banking around iron megalith
    [828, -54, -2448],      // 03 Climbing out of hazard crevice
    [1116, 81, -3276],       // 04 Tumbling boulder gate
    [1044, 171, -4176],       // 05 Ore refinery flyover
    [612, 108, -4968],       // 06 Slalom through dense debris field
    [108, 27, -5544],        // 07 Deep cavern interior dive
    [-504, -81, -5724],     // 08 Sub-surface ore conduit
    [-1116, -153, -5364],     // 09 Low cavern bend with tight clearances
    [-1656, -171, -4608],     // 10 Molten magma crater rim
    [-2016, -72, -3672],    // 11 Ascending mining shaft
    [-2088, 63, -2736],     // 12 High ridge overlooking wreckage
    [-1764, 153, -1836],      // 13 Mountain apex panoramic straight
    [-1224, 189, -1044],      // 14 Banked descent toward extraction
    [-612, 126, -396],       // 15 Crane gantry slalom
    [-144, 45, 108],          // 16 Final ore depot sprint
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: MINING CANYON', subtitle: 'TRENCH RUN', startT: 0.0, endT: 0.25, environment: 'ASTEROID_FIELD', hazardDensity: 0.45, recommendedSpeed: 680, description: 'Carved ore trench flanked by jagged iron spires.' },
    { index: 2, name: 'SECTOR 2: TUMBLING SWARM', subtitle: 'KINETIC DANGER', startT: 0.25, endT: 0.5, environment: 'ASTEROID_FIELD', hazardDensity: 0.75, recommendedSpeed: 620, description: 'Dense tumbling asteroid belt with destructible obstacles.' },
    { index: 3, name: 'SECTOR 3: ORE REFINERY CAVERN', subtitle: 'SUBTERRANEAN DRIFT', startT: 0.5, endT: 0.75, environment: 'ASTEROID_FIELD', hazardDensity: 0.65, recommendedSpeed: 690, description: 'Enclosed cavern illuminated by molten slag conduits.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION GAUNTLET', subtitle: 'FINAL ORE ESCAPE', startT: 0.75, endT: 1.0, environment: 'ASTEROID_FIELD', hazardDensity: 0.9, recommendedSpeed: 780, description: 'High-speed breakout through automated refining cranes.' },
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
    { id: 'h_asteroid_barrage_approach', name: 'TUMBLING ASTEROID SHOWER // APPROACH', startT: 0.09, endT: 0.21, hazardType: 'ASTEROID_SWARM', intensity: 0.60, warningText: 'DENSE COLLISION RISK // FIRE DESTRUCTION BEAM', color: '#f59e0b' },
    { id: 'h_asteroid_barrage_core', name: 'TUMBLING ASTEROID SHOWER', startT: 0.25, endT: 0.52, hazardType: 'ASTEROID_SWARM', intensity: 0.75, warningText: 'DENSE COLLISION RISK // FIRE DESTRUCTION BEAM', color: '#f59e0b' },
    { id: 'h_asteroid_barrage_final', name: 'TUMBLING ASTEROID SHOWER // FINAL GAUNTLET', startT: 0.60, endT: 0.74, hazardType: 'ASTEROID_SWARM', intensity: 0.71, warningText: 'DENSE COLLISION RISK // FIRE DESTRUCTION BEAM', color: '#f59e0b' },
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
  totalEquivalentKm: 13.0,
  targetSplineLength: 10600,
  controlPoints: [
    [0, 18, 0],             // 00 Deep space conduit staging
    [198, 72, -810],        // 01 Subspace aperture entry approach
    [576, 153, -1728],        // 02 Wormhole 1 event ring entry
    [1044, 234, -2736],      // 03 Warped hyperspace corridor alpha
    [1296, 198, -3780],      // 04 Dimensional twist 90-degree spiral
    [1152, 81, -4788],       // 05 Wormhole 2 gate exit slingshot
    [684, -45, -5580],      // 06 Distorted reality nexus
    [72, -135, -5976],       // 07 Multiple portal junction
    [-612, -162, -5868],     // 08 Unstable vortex tunnel
    [-1278, -108, -5292],     // 09 Wormhole 3 acceleration throat
    [-1764, 0, -4392],       // 10 Hyperspace wave crest
    [-2016, 117, -3348],     // 11 Temporal shear straight
    [-1908, 207, -2304],    // 12 Wormhole 4 exit jump
    [-1512, 216, -1296],      // 13 Chromatic aberration chicane
    [-936, 144, -504],       // 14 Reality stabilization descent
    [-324, 54, 72],         // 15 Final tachyon sprint
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: APERTURE APPROACH', subtitle: 'SUBSPACE ENTRY', startT: 0.0, endT: 0.22, environment: 'WORMHOLE', hazardDensity: 0.4, recommendedSpeed: 740, description: 'Acceleration corridor leading directly into the first warp portal.' },
    { index: 2, name: 'SECTOR 2: WARP TUNNEL ALPHA', subtitle: 'DIMENSIONAL SPIRAL', startT: 0.22, endT: 0.48, environment: 'WORMHOLE', hazardDensity: 0.65, recommendedSpeed: 820, description: 'Supercharged chromatic tunnel bending spacetime around ship.' },
    { index: 3, name: 'SECTOR 3: DISTORTED REALITY NEXUS', subtitle: 'MULTIPLE EXITS', startT: 0.48, endT: 0.74, environment: 'WORMHOLE', hazardDensity: 0.8, recommendedSpeed: 800, description: 'Unstable nexus where racers must navigate dynamic distortion rifts.' },
    { index: 4, name: 'SECTOR 4: FINAL HYPERSPACE JUMP', subtitle: 'REALITY RE-ENTRY', startT: 0.74, endT: 1.0, environment: 'WORMHOLE', hazardDensity: 0.95, recommendedSpeed: 920, description: 'Maximum velocity ejection back into local realspace.' },
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
    { id: 'h_spatial_distortion_approach', name: 'TEMPORAL SPATIAL RIFTS // APPROACH', startT: 0.32, endT: 0.44, hazardType: 'PLASMA_WALL', intensity: 0.56, warningText: 'UNSTABLE WARP GEOMETRY // MAINTAIN CENTER VECTOR', color: '#60a5fa' },
    { id: 'h_spatial_distortion_core', name: 'TEMPORAL SPATIAL RIFTS', startT: 0.48, endT: 0.72, hazardType: 'PLASMA_WALL', intensity: 0.70, warningText: 'UNSTABLE WARP GEOMETRY // MAINTAIN CENTER VECTOR', color: '#60a5fa' },
    { id: 'h_spatial_distortion_final', name: 'TEMPORAL SPATIAL RIFTS // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'PLASMA_WALL', intensity: 0.66, warningText: 'UNSTABLE WARP GEOMETRY // MAINTAIN CENTER VECTOR', color: '#60a5fa' },
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
  totalEquivalentKm: 11.7,
  targetSplineLength: 9700,
  controlPoints: [
    [0, 0, 0],              // 00 Stellar observation orbital start
    [252, 54, -684],        // 01 Outer coronal loop
    [684, 144, -1476],        // 02 High solar prominence overpass
    [1224, 207, -2376],      // 03 Plasma flare corridor entry
    [1548, 171, -3384],       // 04 Magnetic flux lines arc
    [1584, 72, -4392],       // 05 Extreme thermal zone descent
    [1278, -45, -5256],      // 06 Perihelion closest solar approach
    [756, -135, -5832],      // 07 Plasma wave avoidance bend
    [144, -162, -5976],       // 08 Solar shadow cooling zone
    [-504, -117, -5688],     // 09 Magnetic storm chasm
    [-1116, -27, -5004],     // 10 Chromospheric ejection corridor
    [-1548, 81, -4068],      // 11 Climbing solar wind slipstream
    [-1728, 171, -3024],      // 12 Coronal mass ejection evasion
    [-1584, 216, -2016],     // 13 High-altitude cooling straight
    [-1152, 162, -1116],       // 14 Solar sail collector bypass
    [-612, 81, -396],       // 15 Deceleration straight
    [-144, 18, 108],          // 16 Helios station finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: CORONAL ARC', subtitle: 'PERIHELION ENTRY', startT: 0.0, endT: 0.25, environment: 'SOLAR_CORONA', hazardDensity: 0.4, recommendedSpeed: 700, description: 'Racing along outer solar magnetic loops with rising core temps.' },
    { index: 2, name: 'SECTOR 2: PLASMA FLARE CORRIDOR', subtitle: 'SOLAR ERUPTIONS', startT: 0.25, endT: 0.52, environment: 'SOLAR_CORONA', hazardDensity: 0.75, recommendedSpeed: 640, description: 'Erupting coronal mass flares crossing racing line lanes.' },
    { index: 3, name: 'SECTOR 3: THERMAL SHADOW ZONE', subtitle: 'CORE COOLING', startT: 0.52, endT: 0.76, environment: 'SOLAR_CORONA', hazardDensity: 0.6, recommendedSpeed: 780, description: 'Asteroid shadow corridor where heat dissipation is maximized.' },
    { index: 4, name: 'SECTOR 4: SOLAR WIND ESCAPE', subtitle: 'FINAL THERMAL SPRINT', startT: 0.76, endT: 1.0, environment: 'SOLAR_CORONA', hazardDensity: 0.9, recommendedSpeed: 860, description: 'Maximum engine boost riding solar wind particles to safety.' },
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
    { id: 'h_solar_flare_approach', name: 'CORONAL PLASMA FLARE // APPROACH', startT: 0.10, endT: 0.22, hazardType: 'SOLAR_FLARE', intensity: 0.68, warningText: 'HEAT SPIKE DETECTED // DIVE INTO SHADOW CONDUITS', color: '#ea580c' },
    { id: 'h_solar_flare_core', name: 'CORONAL PLASMA FLARE', startT: 0.26, endT: 0.50, hazardType: 'SOLAR_FLARE', intensity: 0.85, warningText: 'HEAT SPIKE DETECTED // DIVE INTO SHADOW CONDUITS', color: '#ea580c' },
    { id: 'h_solar_flare_final', name: 'CORONAL PLASMA FLARE // FINAL GAUNTLET', startT: 0.58, endT: 0.72, hazardType: 'SOLAR_FLARE', intensity: 0.81, warningText: 'HEAT SPIKE DETECTED // DIVE INTO SHADOW CONDUITS', color: '#ea580c' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'SOLAR ERUPTION WAVE: SPRINT TO STATION',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_06_ORBITING_PLAYER',
    musicIntensity: 1.0,
  },
};
