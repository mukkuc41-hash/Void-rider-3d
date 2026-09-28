import { ExtendedPathConfig } from './extendedPathTypes';

/**
 * Extended Path Configurations: Modes 06 - 10
 * 06: GRAVITY_FREE (Zero-G aerobatics, 90°/180° inverted sections)
 * 07: PLASMA_STORM (Advancing storm wall, electrical lightning corridors)
 * 08: SKYLINE_RUSH (Orbital megacity, tower canyons & skybridges)
 * 09: DEBRIS_SURVIVAL (Endless procedural debris stream, abandoned stations)
 * 10: QUANTUM_TIME_TRIAL (Precision racing corridor, ghost racer, timing gates)
 */

export const MODE_PATH_06_GRAVITY_FREE: ExtendedPathConfig = {
  modeId: 'GRAVITY_FREE',
  modeName: 'GRAVITY FREE',
  locationName: 'CENTRIFUGE APEX // ZERO-G EXPERIMENTAL HUB',
  totalEquivalentKm: 9.9,
  targetSplineLength: 8300,
  controlPoints: [
    [0, 27, 0],             // 00 Free-flight station launch
    [162, 117, -648],         // 01 45-degree climbing bank
    [468, 252, -1404],       // 02 90-degree track wall-ride section
    [864, 342, -2268],      // 03 Inverted 180-degree ceiling corridor
    [1152, 324, -3204],      // 04 Zero-G free flight void zone
    [1116, 198, -4104],      // 05 Corkscrew descending spiral
    [756, 36, -4788],       // 06 Vertical loop apex
    [216, -108, -5076],      // 07 Stunt challenge fly-through rings
    [-396, -162, -4860],     // 08 Inverted underpass
    [-972, -90, -4248],     // 09 90-degree lateral roll transition
    [-1404, 54, -3420],      // 10 Station superstructure exterior
    [-1584, 198, -2484],     // 11 High acrobatic crest
    [-1368, 270, -1512],      // 12 Zero-gravity floating debris slalom
    [-864, 216, -684],      // 13 Horizon alignment descent
    [-324, 90, 72],         // 14 Centrifuge entry straight
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: STATION LAUNCH', subtitle: '3D AEROBATICS', startT: 0.0, endT: 0.25, environment: 'ZERO_GRAVITY', hazardDensity: 0.35, recommendedSpeed: 700, description: 'Station staging ramp transitioning into free-flight space.' },
    { index: 2, name: 'SECTOR 2: INVERTED CEILING RUN', subtitle: '180 DEGREE ROLL', startT: 0.25, endT: 0.52, environment: 'ZERO_GRAVITY', hazardDensity: 0.55, recommendedSpeed: 650, description: 'Complete inverted flight above orbital station docks.' },
    { index: 3, name: 'SECTOR 3: CORKSCREW VOID', subtitle: 'STUNT COMBO ZONE', startT: 0.52, endT: 0.78, environment: 'ZERO_GRAVITY', hazardDensity: 0.65, recommendedSpeed: 740, description: 'Tight 3D loops and free-flight stunt opportunities.' },
    { index: 4, name: 'SECTOR 4: CENTRIFUGE RE-ENTRY', subtitle: 'FINAL FLIGHT SPRINT', startT: 0.78, endT: 1.0, environment: 'ZERO_GRAVITY', hazardDensity: 0.8, recommendedSpeed: 820, description: 'High-speed alignment sprint into the centrifuge docking bay.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'gravity_inversion_cinematic',
      title: 'ORIENTATION FLUX ACTIVE',
      subtitle: 'TRACK INVERTING 180 DEGREES',
      triggerT: 0.35,
      durationSec: 2.5,
      shotType: 'SHOT_04_TOP_DOWN_REVEAL',
      fovDelta: 12,
      timeScale: 0.9,
      cameraOffset: [0, 22, -10],
      lookAtOffset: [0, 0, 15],
    },
  ],
  environmentZones: [
    { environment: 'ZERO_GRAVITY', startT: 0.0, endT: 1.0, fogColor: 0x061a14, fogDensity: 0.0004, ambientColor: 0x10b981, sunColor: 0x34d399, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 1.2 },
  ],
  hazards: [
    { id: 'h_rotating_structures_approach', name: 'ROTATING CENTRIFUGE STRUTS // APPROACH', startT: 0.14, endT: 0.26, hazardType: 'DRONE_MINES', intensity: 0.48, warningText: 'ROTATING OBSTACLES // TIMING CRITICAL', color: '#10b981' },
    { id: 'h_rotating_structures_core', name: 'ROTATING CENTRIFUGE STRUTS', startT: 0.30, endT: 0.60, hazardType: 'DRONE_MINES', intensity: 0.60, warningText: 'ROTATING OBSTACLES // TIMING CRITICAL', color: '#10b981' },
    { id: 'h_rotating_structures_final', name: 'ROTATING CENTRIFUGE STRUTS // FINAL GAUNTLET', startT: 0.68, endT: 0.82, hazardType: 'DRONE_MINES', intensity: 0.57, warningText: 'ROTATING OBSTACLES // TIMING CRITICAL', color: '#10b981' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'CENTRIFUGE OVERDRIVE: APEX AEROBATICS',
    hazardSurgeMultiplier: 1.4,
    cinematicShot: 'SHOT_06_ORBITING_PLAYER',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_07_PLASMA_STORM: ExtendedPathConfig = {
  modeId: 'PLASMA_STORM',
  modeName: 'PLASMA STORM',
  locationName: 'ION NEBULA // STORM WALL FRONTIER',
  totalEquivalentKm: 10.8,
  targetSplineLength: 9000,
  controlPoints: [
    [0, 18, 0],             // 00 Electric cloud staging area
    [-198, 63, -720],       // 01 Storm entrance conduit
    [-558, 144, -1548],       // 02 Lightning discharge channel
    [-972, 207, -2448],     // 03 Unstable energy bridge
    [-1332, 180, -3384],     // 04 Storm core approach
    [-1512, 81, -4284],      // 05 Electric vortex descent
    [-1368, -36, -5112],     // 06 High-voltage plasma river
    [-918, -126, -5688],     // 07 Advancing storm wall perimeter
    [-324, -153, -5868],     // 08 Ion arc corridor
    [324, -90, -5544],      // 09 Plasma flare chicane
    [864, 27, -4860],       // 10 Climbing out of storm center
    [1242, 135, -3924],       // 11 Lightning conductor spires
    [1368, 198, -2916],      // 12 Overcharged boost straight
    [1152, 171, -1908],       // 13 Storm dissipation perimeter
    [738, 99, -972],        // 14 Extraction bridge
    [252, 36, -144],         // 15 Station haven finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: CLOUD PERIMETER', subtitle: 'ELECTRIC GATHERING', startT: 0.0, endT: 0.22, environment: 'PLASMA_STORM', hazardDensity: 0.45, recommendedSpeed: 720, description: 'Ionized atmospheric cloud corridor crackling with static energy.' },
    { index: 2, name: 'SECTOR 2: LIGHTNING CONDUIT', subtitle: 'ELECTRICAL DISCHARGES', startT: 0.22, endT: 0.48, environment: 'PLASMA_STORM', hazardDensity: 0.75, recommendedSpeed: 660, description: 'Violent electrical arcs striking between elevated energy bridges.' },
    { index: 3, name: 'SECTOR 3: STORM CORE VORTEX', subtitle: 'STORM WALL ESCAPE', startT: 0.48, endT: 0.74, environment: 'PLASMA_STORM', hazardDensity: 0.85, recommendedSpeed: 780, description: 'Racing ahead of the pursuing advancing plasma wall.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION HAVEN', subtitle: 'FINAL DISCHARGE SPRINT', startT: 0.74, endT: 1.0, environment: 'PLASMA_STORM', hazardDensity: 0.95, recommendedSpeed: 870, description: 'Breakout sprint toward the shielded orbital extraction station.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'plasma_storm_wall_cinematic',
      title: 'PLASMA STORM WALL SURGE',
      subtitle: 'ADVANCING COLLAPSE PERIMETER',
      triggerT: 0.52,
      durationSec: 2.7,
      shotType: 'SHOT_08_REAR_DESTRUCTION',
      fovDelta: 16,
      timeScale: 0.95,
      cameraOffset: [0, 3.5, 16],
      lookAtOffset: [0, 0, -25],
    },
  ],
  environmentZones: [
    { environment: 'PLASMA_STORM', startT: 0.0, endT: 1.0, fogColor: 0x1a0526, fogDensity: 0.0007, ambientColor: 0xc026d3, sunColor: 0xe879f9, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 2.0 },
  ],
  hazards: [
    { id: 'h_plasma_wall_approach', name: 'ADVANCING LETHAL PLASMA WALL // APPROACH', startT: 0.32, endT: 0.44, hazardType: 'PLASMA_WALL', intensity: 0.68, warningText: 'STORM WALL PURSUIT // MAINTAIN FORWARD BOOST', color: '#d946ef' },
    { id: 'h_plasma_wall_core', name: 'ADVANCING LETHAL PLASMA WALL', startT: 0.48, endT: 0.76, hazardType: 'PLASMA_WALL', intensity: 0.85, warningText: 'STORM WALL PURSUIT // MAINTAIN FORWARD BOOST', color: '#d946ef' },
    { id: 'h_plasma_wall_final', name: 'ADVANCING LETHAL PLASMA WALL // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'PLASMA_WALL', intensity: 0.81, warningText: 'STORM WALL PURSUIT // MAINTAIN FORWARD BOOST', color: '#d946ef' },
  ],
  finalClimax: {
    startT: 0.83,
    climaxTitle: 'STORM WALL ENGULFMENT: BREAKOUT SPRINT',
    hazardSurgeMultiplier: 1.6,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_08_SKYLINE: ExtendedPathConfig = {
  modeId: 'SKYLINE_RUSH',
  modeName: 'SKYLINE RUSH',
  locationName: 'AETHELGARD ORBITAL MEGA-SPIRE // SECTOR 8',
  totalEquivalentKm: 11.5,
  targetSplineLength: 9500,
  controlPoints: [
    [0, 0, 0],              // 00 Lower skyline boulevard start
    [144, 81, -684],         // 01 Vertical tower launch
    [432, 207, -1512],       // 02 Skyscraper canyon climb
    [864, 297, -2412],      // 03 Skybridge suspension corridor
    [1242, 252, -3348],      // 04 High orbital highway
    [1404, 144, -4284],       // 05 Spire canyon dive
    [1224, 0, -5112],        // 06 Rooftop transit route
    [792, -117, -5724],      // 07 Automated traffic underpass
    [198, -162, -5904],      // 08 Downtown commercial core
    [-432, -117, -5580],     // 09 Corporate plaza chicane
    [-1008, -18, -4860],     // 10 Ascending skyway connector
    [-1368, 99, -3888],      // 11 Spire perimeter curve
    [-1476, 189, -2844],     // 12 High-altitude panoramic overpass
    [-1242, 153, -1836],      // 13 Skybridge descent
    [-792, 72, -936],       // 14 Stadium approach straight
    [-270, 18, -144],        // 15 Aethelgard grandstand finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: LOWER SKYLINE', subtitle: 'VERTICAL LAUNCH', startT: 0.0, endT: 0.24, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.4, recommendedSpeed: 740, description: 'Rapid elevation climb alongside gleaming corporate mega-spires.' },
    { index: 2, name: 'SECTOR 2: TOWER CANYON & SKYBRIDGE', subtitle: 'HIGHWAY SUSPENSION', startT: 0.24, endT: 0.5, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.6, recommendedSpeed: 680, description: 'Diving skybridges spanning breathtaking architectural chasms.' },
    { index: 3, name: 'SECTOR 3: ROOFTOP EXPRESS', subtitle: 'DRONE TRAFFIC', startT: 0.5, endT: 0.76, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.75, recommendedSpeed: 760, description: 'Rooftop jump tracks weaving through automated drone freighters.' },
    { index: 4, name: 'SECTOR 4: GRANDSTAND DESCENT', subtitle: 'FINAL SKYLINE SPRINT', startT: 0.76, endT: 1.0, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.85, recommendedSpeed: 860, description: 'Sweeping stratospheric plunge toward the Aethelgard arena.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'skyline_panoramic_reveal',
      title: 'AETHELGARD PANORAMA',
      subtitle: 'ORBITAL METROPOLIS REVEAL',
      triggerT: 0.3,
      durationSec: 2.8,
      shotType: 'SHOT_09_MASSIVE_SCALE_REVEAL',
      fovDelta: 18,
      timeScale: 0.95,
      cameraOffset: [-35, 20, 25],
      lookAtOffset: [0, 0, -30],
    },
  ],
  environmentZones: [
    { environment: 'SKYLINE_HIGHWAY', startT: 0.0, endT: 1.0, fogColor: 0x021d28, fogDensity: 0.0005, ambientColor: 0x14b8a6, sunColor: 0x2dd4bf, skyboxTheme: 'NEON', particleSpeedMultiplier: 1.3 },
  ],
  hazards: [
    { id: 'h_traffic_drones_approach', name: 'AUTOMATED CARGO CONVOY // APPROACH', startT: 0.34, endT: 0.46, hazardType: 'DRONE_MINES', intensity: 0.52, warningText: 'TRAFFIC INTERFERENCE // WEAVE THROUGH SKYBRIDGES', color: '#14b8a6' },
    { id: 'h_traffic_drones_core', name: 'AUTOMATED CARGO CONVOY', startT: 0.50, endT: 0.74, hazardType: 'DRONE_MINES', intensity: 0.65, warningText: 'TRAFFIC INTERFERENCE // WEAVE THROUGH SKYBRIDGES', color: '#14b8a6' },
    { id: 'h_traffic_drones_final', name: 'AUTOMATED CARGO CONVOY // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'DRONE_MINES', intensity: 0.62, warningText: 'TRAFFIC INTERFERENCE // WEAVE THROUGH SKYBRIDGES', color: '#14b8a6' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'STRATOSPHERIC DIVE: SPRINT TO FINISH',
    hazardSurgeMultiplier: 1.4,
    cinematicShot: 'SHOT_02_SIDE_FLYBY',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_09_DEBRIS: ExtendedPathConfig = {
  modeId: 'DEBRIS_SURVIVAL',
  modeName: 'DEBRIS SURVIVAL',
  locationName: 'SCRAP YARD ORBITAL GRAVEYARD // SECTOR 9',
  totalEquivalentKm: 13.5,
  targetSplineLength: 11000,
  controlPoints: [
    [0, 0, 0],              // 00 Abandoned staging dock
    [126, -45, -792],        // 01 Broken spacecraft graveyard
    [378, -108, -1728],       // 02 Destroyed dreadnought hull fly-through
    [792, -81, -2736],      // 03 Collapsing superstructure corridor
    [1152, 36, -3744],       // 04 Tumbling reactor core hazard
    [1224, 153, -4788],       // 05 Debris density surge 1
    [936, 198, -5760],      // 06 Abandoned space station interior
    [396, 126, -6516],       // 07 Station hangar egress
    [-252, 27, -6732],      // 08 Shattered solar panel array
    [-864, -72, -6372],     // 09 Micro-meteorite and kinetic scrap belt
    [-1422, -135, -5580],     // 10 Wreckage chicane
    [-1764, -90, -4536],     // 11 Structural collapse sector
    [-1872, 45, -3456],     // 12 Escaping the debris cloud
    [-1656, 144, -2376],      // 13 High-speed wreckage slalom
    [-1224, 171, -1404],       // 14 Cleared space connector
    [-648, 99, -540],       // 15 Emergency extraction straight
    [-144, 27, 108],          // 16 Haven gate finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: GRAVEYARD DOCKS', subtitle: 'DERELICT FLEET', startT: 0.0, endT: 0.22, environment: 'DEBRIS_FIELD', hazardDensity: 0.5, recommendedSpeed: 680, description: 'Threading the skeletons of decommissioned battleships.' },
    { index: 2, name: 'SECTOR 2: STATION COLLAPSE', subtitle: 'STRUCTURAL BREAKUP', startT: 0.22, endT: 0.5, environment: 'DEBRIS_FIELD', hazardDensity: 0.8, recommendedSpeed: 630, description: 'Huge abandoned space station breaking apart around racers.' },
    { index: 3, name: 'SECTOR 3: KINETIC SHAPNEL BELT', subtitle: 'HIGH DENSITY DEBRIS', startT: 0.5, endT: 0.76, environment: 'DEBRIS_FIELD', hazardDensity: 0.9, recommendedSpeed: 700, description: 'Tumbling hull fragments and micro-shrapnel clouds.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION HAVEN', subtitle: 'FINAL SURVIVAL RUN', startT: 0.76, endT: 1.0, environment: 'DEBRIS_FIELD', hazardDensity: 1, recommendedSpeed: 820, description: 'Endurance sprint to clear the lethal collision field.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'station_breakup_cinematic',
      title: 'SUPERSTRUCTURE COLLAPSE ALERT',
      subtitle: 'DERELICT HABITAT FRACTURING',
      triggerT: 0.36,
      durationSec: 2.8,
      shotType: 'SHOT_08_REAR_DESTRUCTION',
      fovDelta: 14,
      timeScale: 0.9,
      cameraOffset: [0, 4, 18],
      lookAtOffset: [0, 0, -30],
    },
  ],
  environmentZones: [
    { environment: 'DEBRIS_FIELD', startT: 0.0, endT: 1.0, fogColor: 0x15120e, fogDensity: 0.0006, ambientColor: 0xa8a29e, sunColor: 0xd6d3d1, skyboxTheme: 'ASTEROID', particleSpeedMultiplier: 1.7 },
  ],
  hazards: [
    { id: 'h_kinetic_scrap_approach', name: 'TUMBLING WRECKAGE SHOWER // APPROACH', startT: 0.08, endT: 0.20, hazardType: 'COLLAPSE', intensity: 0.64, warningText: 'CATASTROPHIC DEBRIS DENSITY // EVASION REQUIRED', color: '#a8a29e' },
    { id: 'h_kinetic_scrap_core', name: 'TUMBLING WRECKAGE SHOWER', startT: 0.24, endT: 0.76, hazardType: 'COLLAPSE', intensity: 0.80, warningText: 'CATASTROPHIC DEBRIS DENSITY // EVASION REQUIRED', color: '#a8a29e' },
    { id: 'h_kinetic_scrap_final', name: 'TUMBLING WRECKAGE SHOWER // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'COLLAPSE', intensity: 0.76, warningText: 'CATASTROPHIC DEBRIS DENSITY // EVASION REQUIRED', color: '#a8a29e' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'GRAVEYARD CATACLYSM: FINAL SPRINT',
    hazardSurgeMultiplier: 1.7,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_10_QUANTUM_TIME: ExtendedPathConfig = {
  modeId: 'QUANTUM_TIME_TRIAL',
  modeName: 'QUANTUM TIME TRIAL',
  locationName: 'CHRONOS PRECISION GRID // SECTOR 10',
  totalEquivalentKm: 9.4,
  targetSplineLength: 7900,
  controlPoints: [
    [0, 18, 0],             // 00 Precision launch straight
    [162, 54, -648],         // 01 Sector 1 speed gate alpha
    [468, 117, -1440],        // 02 High-G banked curve
    [864, 171, -2304],       // 03 Technical chicane
    [1152, 144, -3204],       // 04 Split route junction
    [1224, 45, -4068],       // 05 Precision laser gate maze
    [972, -63, -4824],      // 06 Speed tunnel entrance
    [468, -135, -5292],      // 07 Chrono checkpoint beta
    [-144, -144, -5364],      // 08 Vertical technical S-bend
    [-756, -90, -4968],     // 09 Ghost racer convergence
    [-1224, 18, -4176],      // 10 Stratospheric speed straight
    [-1476, 117, -3204],      // 11 Precision hairpin
    [-1422, 189, -2196],     // 12 Sector 3 timing split
    [-1044, 162, -1224],       // 13 Final acceleration corridor
    [-504, 81, -396],       // 14 Chrono gate approach
    [-108, 27, 108],          // 15 Chronos finish gate
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: VELOCITY ACCELERATION', subtitle: 'GATE TIMING', startT: 0.0, endT: 0.25, environment: 'QUANTUM_GRID', hazardDensity: 0.25, recommendedSpeed: 780, description: 'Optimal racing line corridor with active precision speed gates.' },
    { index: 2, name: 'SECTOR 2: TECHNICAL S-BEND', subtitle: 'APEX MASTER', startT: 0.25, endT: 0.52, environment: 'QUANTUM_GRID', hazardDensity: 0.45, recommendedSpeed: 680, description: 'Rapid transition turns rewarding precise drift angle execution.' },
    { index: 3, name: 'SECTOR 3: SPEED TUNNEL & SPLIT', subtitle: 'GHOST REVEAL', startT: 0.52, endT: 0.78, environment: 'QUANTUM_GRID', hazardDensity: 0.4, recommendedSpeed: 820, description: 'High-speed hyper-tunnel with ghost racer trajectory projection.' },
    { index: 4, name: 'SECTOR 4: CHRONOS APEX', subtitle: 'FINAL TIME GATE', startT: 0.78, endT: 1.0, environment: 'QUANTUM_GRID', hazardDensity: 0.5, recommendedSpeed: 900, description: 'Maximum velocity sprint to beat the target personal best time.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'ghost_racer_materialize',
      title: 'QUANTUM GHOST TELEMETRY',
      subtitle: 'RECORD TRAJECTORY PROJECTED',
      triggerT: 0.48,
      durationSec: 2.4,
      shotType: 'SHOT_02_SIDE_FLYBY',
      fovDelta: 10,
      timeScale: 1.0,
      cameraOffset: [-18, 5, 8],
      lookAtOffset: [0, 1, 15],
    },
  ],
  environmentZones: [
    { environment: 'QUANTUM_GRID', startT: 0.0, endT: 1.0, fogColor: 0x001524, fogDensity: 0.0004, ambientColor: 0x06b6d4, sunColor: 0x22d3ee, skyboxTheme: 'QUANTUM', particleSpeedMultiplier: 1.5 },
  ],
  hazards: [
    { id: 'h_laser_timing_approach', name: 'PRECISION TIMING GATES // APPROACH', startT: 0.19, endT: 0.31, hazardType: 'LASER_BARRIER', intensity: 0.32, warningText: 'SPEED GATE SYNCHRONIZATION ACTIVE', color: '#06b6d4' },
    { id: 'h_laser_timing_core', name: 'PRECISION TIMING GATES', startT: 0.35, endT: 0.65, hazardType: 'LASER_BARRIER', intensity: 0.40, warningText: 'SPEED GATE SYNCHRONIZATION ACTIVE', color: '#06b6d4' },
    { id: 'h_laser_timing_final', name: 'PRECISION TIMING GATES // FINAL GAUNTLET', startT: 0.72, endT: 0.87, hazardType: 'LASER_BARRIER', intensity: 0.38, warningText: 'SPEED GATE SYNCHRONIZATION ACTIVE', color: '#06b6d4' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'FINAL SECTOR CHRONO SPRINT: BEAT THE RECORD',
    hazardSurgeMultiplier: 1.2,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};
