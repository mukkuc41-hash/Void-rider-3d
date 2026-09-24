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
  totalEquivalentKm: 5.5,
  targetSplineLength: 4600,
  controlPoints: [
    [0, 15, 0],             // 00 Free-flight station launch
    [90, 65, -360],         // 01 45-degree climbing bank
    [260, 140, -780],       // 02 90-degree track wall-ride section
    [480, 190, -1260],      // 03 Inverted 180-degree ceiling corridor
    [640, 180, -1780],      // 04 Zero-G free flight void zone
    [620, 110, -2280],      // 05 Corkscrew descending spiral
    [420, 20, -2660],       // 06 Vertical loop apex
    [120, -60, -2820],      // 07 Stunt challenge fly-through rings
    [-220, -90, -2700],     // 08 Inverted underpass
    [-540, -50, -2360],     // 09 90-degree lateral roll transition
    [-780, 30, -1900],      // 10 Station superstructure exterior
    [-880, 110, -1380],     // 11 High acrobatic crest
    [-760, 150, -840],      // 12 Zero-gravity floating debris slalom
    [-480, 120, -380],      // 13 Horizon alignment descent
    [-180, 50, 40],         // 14 Centrifuge entry straight
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: STATION LAUNCH', subtitle: '3D AEROBATICS', startT: 0.0, endT: 0.25, environment: 'ZERO_GRAVITY', hazardDensity: 0.25, recommendedSpeed: 700, description: 'Station staging ramp transitioning into free-flight space.' },
    { index: 2, name: 'SECTOR 2: INVERTED CEILING RUN', subtitle: '180 DEGREE ROLL', startT: 0.25, endT: 0.52, environment: 'ZERO_GRAVITY', hazardDensity: 0.45, recommendedSpeed: 650, description: 'Complete inverted flight above orbital station docks.' },
    { index: 3, name: 'SECTOR 3: CORKSCREW VOID', subtitle: 'STUNT COMBO ZONE', startT: 0.52, endT: 0.78, environment: 'ZERO_GRAVITY', hazardDensity: 0.55, recommendedSpeed: 740, description: 'Tight 3D loops and free-flight stunt opportunities.' },
    { index: 4, name: 'SECTOR 4: CENTRIFUGE RE-ENTRY', subtitle: 'FINAL FLIGHT SPRINT', startT: 0.78, endT: 1.0, environment: 'ZERO_GRAVITY', hazardDensity: 0.7, recommendedSpeed: 820, description: 'High-speed alignment sprint into the centrifuge docking bay.' },
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
    { id: 'h_rotating_structures', name: 'ROTATING CENTRIFUGE STRUTS', startT: 0.3, endT: 0.6, hazardType: 'DRONE_MINES', intensity: 0.6, warningText: 'ROTATING OBSTACLES // TIMING CRITICAL', color: '#10b981' },
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
  totalEquivalentKm: 6.0,
  targetSplineLength: 5000,
  controlPoints: [
    [0, 10, 0],             // 00 Electric cloud staging area
    [-110, 35, -400],       // 01 Storm entrance conduit
    [-310, 80, -860],       // 02 Lightning discharge channel
    [-540, 115, -1360],     // 03 Unstable energy bridge
    [-740, 100, -1880],     // 04 Storm core approach
    [-840, 45, -2380],      // 05 Electric vortex descent
    [-760, -20, -2840],     // 06 High-voltage plasma river
    [-510, -70, -3160],     // 07 Advancing storm wall perimeter
    [-180, -85, -3260],     // 08 Ion arc corridor
    [180, -50, -3080],      // 09 Plasma flare chicane
    [480, 15, -2700],       // 10 Climbing out of storm center
    [690, 75, -2180],       // 11 Lightning conductor spires
    [760, 110, -1620],      // 12 Overcharged boost straight
    [640, 95, -1060],       // 13 Storm dissipation perimeter
    [410, 55, -540],        // 14 Extraction bridge
    [140, 20, -80],         // 15 Station haven finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: CLOUD PERIMETER', subtitle: 'ELECTRIC GATHERING', startT: 0.0, endT: 0.22, environment: 'PLASMA_STORM', hazardDensity: 0.35, recommendedSpeed: 720, description: 'Ionized atmospheric cloud corridor crackling with static energy.' },
    { index: 2, name: 'SECTOR 2: LIGHTNING CONDUIT', subtitle: 'ELECTRICAL DISCHARGES', startT: 0.22, endT: 0.48, environment: 'PLASMA_STORM', hazardDensity: 0.65, recommendedSpeed: 660, description: 'Violent electrical arcs striking between elevated energy bridges.' },
    { index: 3, name: 'SECTOR 3: STORM CORE VORTEX', subtitle: 'STORM WALL ESCAPE', startT: 0.48, endT: 0.74, environment: 'PLASMA_STORM', hazardDensity: 0.75, recommendedSpeed: 780, description: 'Racing ahead of the pursuing advancing plasma wall.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION HAVEN', subtitle: 'FINAL DISCHARGE SPRINT', startT: 0.74, endT: 1.0, environment: 'PLASMA_STORM', hazardDensity: 0.85, recommendedSpeed: 870, description: 'Breakout sprint toward the shielded orbital extraction station.' },
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
    { id: 'h_plasma_wall', name: 'ADVANCING LETHAL PLASMA WALL', startT: 0.48, endT: 0.76, hazardType: 'PLASMA_WALL', intensity: 0.85, warningText: 'STORM WALL PURSUIT // MAINTAIN FORWARD BOOST', color: '#d946ef' },
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
  totalEquivalentKm: 6.4,
  targetSplineLength: 5300,
  controlPoints: [
    [0, 0, 0],              // 00 Lower skyline boulevard start
    [80, 45, -380],         // 01 Vertical tower launch
    [240, 115, -840],       // 02 Skyscraper canyon climb
    [480, 165, -1340],      // 03 Skybridge suspension corridor
    [690, 140, -1860],      // 04 High orbital highway
    [780, 80, -2380],       // 05 Spire canyon dive
    [680, 0, -2840],        // 06 Rooftop transit route
    [440, -65, -3180],      // 07 Automated traffic underpass
    [110, -90, -3280],      // 08 Downtown commercial core
    [-240, -65, -3100],     // 09 Corporate plaza chicane
    [-560, -10, -2700],     // 10 Ascending skyway connector
    [-760, 55, -2160],      // 11 Spire perimeter curve
    [-820, 105, -1580],     // 12 High-altitude panoramic overpass
    [-690, 85, -1020],      // 13 Skybridge descent
    [-440, 40, -520],       // 14 Stadium approach straight
    [-150, 10, -80],        // 15 Aethelgard grandstand finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: LOWER SKYLINE', subtitle: 'VERTICAL LAUNCH', startT: 0.0, endT: 0.24, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.3, recommendedSpeed: 740, description: 'Rapid elevation climb alongside gleaming corporate mega-spires.' },
    { index: 2, name: 'SECTOR 2: TOWER CANYON & SKYBRIDGE', subtitle: 'HIGHWAY SUSPENSION', startT: 0.24, endT: 0.5, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.5, recommendedSpeed: 680, description: 'Diving skybridges spanning breathtaking architectural chasms.' },
    { index: 3, name: 'SECTOR 3: ROOFTOP EXPRESS', subtitle: 'DRONE TRAFFIC', startT: 0.5, endT: 0.76, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.65, recommendedSpeed: 760, description: 'Rooftop jump tracks weaving through automated drone freighters.' },
    { index: 4, name: 'SECTOR 4: GRANDSTAND DESCENT', subtitle: 'FINAL SKYLINE SPRINT', startT: 0.76, endT: 1.0, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.75, recommendedSpeed: 860, description: 'Sweeping stratospheric plunge toward the Aethelgard arena.' },
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
    { id: 'h_traffic_drones', name: 'AUTOMATED CARGO CONVOY', startT: 0.5, endT: 0.74, hazardType: 'DRONE_MINES', intensity: 0.65, warningText: 'TRAFFIC INTERFERENCE // WEAVE THROUGH SKYBRIDGES', color: '#14b8a6' },
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
  totalEquivalentKm: 7.5,
  targetSplineLength: 6100,
  controlPoints: [
    [0, 0, 0],              // 00 Abandoned staging dock
    [70, -25, -440],        // 01 Broken spacecraft graveyard
    [210, -60, -960],       // 02 Destroyed dreadnought hull fly-through
    [440, -45, -1520],      // 03 Collapsing superstructure corridor
    [640, 20, -2080],       // 04 Tumbling reactor core hazard
    [680, 85, -2660],       // 05 Debris density surge 1
    [520, 110, -3200],      // 06 Abandoned space station interior
    [220, 70, -3620],       // 07 Station hangar egress
    [-140, 15, -3740],      // 08 Shattered solar panel array
    [-480, -40, -3540],     // 09 Micro-meteorite and kinetic scrap belt
    [-790, -75, -3100],     // 10 Wreckage chicane
    [-980, -50, -2520],     // 11 Structural collapse sector
    [-1040, 25, -1920],     // 12 Escaping the debris cloud
    [-920, 80, -1320],      // 13 High-speed wreckage slalom
    [-680, 95, -780],       // 14 Cleared space connector
    [-360, 55, -300],       // 15 Emergency extraction straight
    [-80, 15, 60],          // 16 Haven gate finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: GRAVEYARD DOCKS', subtitle: 'DERELICT FLEET', startT: 0.0, endT: 0.22, environment: 'DEBRIS_FIELD', hazardDensity: 0.4, recommendedSpeed: 680, description: 'Threading the skeletons of decommissioned battleships.' },
    { index: 2, name: 'SECTOR 2: STATION COLLAPSE', subtitle: 'STRUCTURAL BREAKUP', startT: 0.22, endT: 0.5, environment: 'DEBRIS_FIELD', hazardDensity: 0.7, recommendedSpeed: 630, description: 'Huge abandoned space station breaking apart around racers.' },
    { index: 3, name: 'SECTOR 3: KINETIC SHAPNEL BELT', subtitle: 'HIGH DENSITY DEBRIS', startT: 0.5, endT: 0.76, environment: 'DEBRIS_FIELD', hazardDensity: 0.8, recommendedSpeed: 700, description: 'Tumbling hull fragments and micro-shrapnel clouds.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION HAVEN', subtitle: 'FINAL SURVIVAL RUN', startT: 0.76, endT: 1.0, environment: 'DEBRIS_FIELD', hazardDensity: 0.9, recommendedSpeed: 820, description: 'Endurance sprint to clear the lethal collision field.' },
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
    { id: 'h_kinetic_scrap', name: 'TUMBLING WRECKAGE SHOWER', startT: 0.24, endT: 0.76, hazardType: 'COLLAPSE', intensity: 0.8, warningText: 'CATASTROPHIC DEBRIS DENSITY // EVASION REQUIRED', color: '#a8a29e' },
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
  totalEquivalentKm: 5.2,
  targetSplineLength: 4400,
  controlPoints: [
    [0, 10, 0],             // 00 Precision launch straight
    [90, 30, -360],         // 01 Sector 1 speed gate alpha
    [260, 65, -800],        // 02 High-G banked curve
    [480, 95, -1280],       // 03 Technical chicane
    [640, 80, -1780],       // 04 Split route junction
    [680, 25, -2260],       // 05 Precision laser gate maze
    [540, -35, -2680],      // 06 Speed tunnel entrance
    [260, -75, -2940],      // 07 Chrono checkpoint beta
    [-80, -80, -2980],      // 08 Vertical technical S-bend
    [-420, -50, -2760],     // 09 Ghost racer convergence
    [-680, 10, -2320],      // 10 Stratospheric speed straight
    [-820, 65, -1780],      // 11 Precision hairpin
    [-790, 105, -1220],     // 12 Sector 3 timing split
    [-580, 90, -680],       // 13 Final acceleration corridor
    [-280, 45, -220],       // 14 Chrono gate approach
    [-60, 15, 60],          // 15 Chronos finish gate
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: VELOCITY ACCELERATION', subtitle: 'GATE TIMING', startT: 0.0, endT: 0.25, environment: 'QUANTUM_GRID', hazardDensity: 0.15, recommendedSpeed: 780, description: 'Optimal racing line corridor with active precision speed gates.' },
    { index: 2, name: 'SECTOR 2: TECHNICAL S-BEND', subtitle: 'APEX MASTER', startT: 0.25, endT: 0.52, environment: 'QUANTUM_GRID', hazardDensity: 0.35, recommendedSpeed: 680, description: 'Rapid transition turns rewarding precise drift angle execution.' },
    { index: 3, name: 'SECTOR 3: SPEED TUNNEL & SPLIT', subtitle: 'GHOST REVEAL', startT: 0.52, endT: 0.78, environment: 'QUANTUM_GRID', hazardDensity: 0.3, recommendedSpeed: 820, description: 'High-speed hyper-tunnel with ghost racer trajectory projection.' },
    { index: 4, name: 'SECTOR 4: CHRONOS APEX', subtitle: 'FINAL TIME GATE', startT: 0.78, endT: 1.0, environment: 'QUANTUM_GRID', hazardDensity: 0.4, recommendedSpeed: 900, description: 'Maximum velocity sprint to beat the target personal best time.' },
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
    { id: 'h_laser_timing', name: 'PRECISION TIMING GATES', startT: 0.35, endT: 0.65, hazardType: 'LASER_BARRIER', intensity: 0.4, warningText: 'SPEED GATE SYNCHRONIZATION ACTIVE', color: '#06b6d4' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'FINAL SECTOR CHRONO SPRINT: BEAT THE RECORD',
    hazardSurgeMultiplier: 1.2,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};
