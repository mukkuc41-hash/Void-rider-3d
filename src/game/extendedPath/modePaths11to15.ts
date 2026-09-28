import { ExtendedPathConfig } from './extendedPathTypes';

/**
 * Extended Path Configurations: Modes 11 - 15
 * 11: ENERGY_HEIST (Prometheus reactor facility, security tunnels, energy core extraction)
 * 12: DRONE_ASSAULT (Military defense ring, combat drone waves & dogfight racing)
 * 13: COLLAPSING_TRACK (Disintegrating orbital highway, falling platforms, emergency routes)
 * 14: RING_RUNNER (Colossal planetary orbital ring, vertical loop, rotating structures)
 * 15: HYPERSPACE_SPRINT (Pure high-speed mode, extreme straights, hyperspace jump)
 */

export const MODE_PATH_11_ENERGY_HEIST: ExtendedPathConfig = {
  modeId: 'ENERGY_HEIST',
  modeName: 'ENERGY HEIST',
  locationName: 'PROMETHEUS REACTOR // INFILTRATION GRID',
  totalEquivalentKm: 10.4,
  targetSplineLength: 8800,
  controlPoints: [
    [0, 18, 0],             // 00 Infiltration staging sector
    [-162, 54, -684],        // 01 Facility perimeter breach
    [-504, 135, -1512],       // 02 Security sensor corridor
    [-936, 198, -2412],     // 03 Reactor exterior skyway
    [-1278, 162, -3348],      // 04 Heavy containment ring
    [-1422, 63, -4284],      // 05 Reactor core approach dive
    [-1224, -54, -5112],     // 06 Central containment chamber
    [-792, -144, -5688],     // 07 Primary core collection platform
    [-216, -171, -5868],     // 08 Meltdown trigger sequence
    [396, -117, -5544],      // 09 High-heat cooling exhaust chute
    [936, -18, -4824],      // 10 Security lockdown tunnel
    [1332, 90, -3852],       // 11 Turret defense gauntlet
    [1422, 171, -2844],       // 12 Extraction conduit climb
    [1188, 153, -1872],       // 13 Reactor superstructure exit
    [702, 81, -936],        // 14 Emergency speed tunnel
    [216, 27, -144],         // 15 Extraction dropship finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: INFILTRATION PERIMETER', subtitle: 'SECURITY BYPASS', startT: 0.0, endT: 0.24, environment: 'ENERGY_REACTOR', hazardDensity: 0.4, recommendedSpeed: 710, description: 'Stealth approach through exterior automated defense sensors.' },
    { index: 2, name: 'SECTOR 2: CONTAINMENT RING', subtitle: 'CORE ACCESS', startT: 0.24, endT: 0.5, environment: 'ENERGY_REACTOR', hazardDensity: 0.7, recommendedSpeed: 670, description: 'Circumnavigating the pulsating electromagnetic containment coils.' },
    { index: 3, name: 'SECTOR 3: REACTOR CORE CHAMBER', subtitle: 'EXTRACTION CRITICAL', startT: 0.5, endT: 0.74, environment: 'ENERGY_REACTOR', hazardDensity: 0.85, recommendedSpeed: 780, description: 'Collecting high-energy cores as the facility initiates lockdown.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION CHUTE', subtitle: 'FINAL MELTDOWN SPRINT', startT: 0.74, endT: 1.0, environment: 'ENERGY_REACTOR', hazardDensity: 0.95, recommendedSpeed: 880, description: 'Full-boost escape before containment integrity hits zero.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'reactor_meltdown_cinematic',
      title: 'REACTOR OVERLOAD DETECTED',
      subtitle: 'CORE BREACH IMMINENT // EVACUATE',
      triggerT: 0.54,
      durationSec: 2.6,
      shotType: 'SHOT_03_WIDE_ENVIRONMENT_REVEAL',
      fovDelta: 14,
      timeScale: 0.9,
      cameraOffset: [22, 10, -15],
      lookAtOffset: [-10, 0, 10],
    },
  ],
  environmentZones: [
    { environment: 'ENERGY_REACTOR', startT: 0.0, endT: 1.0, fogColor: 0x1f0e03, fogDensity: 0.0006, ambientColor: 0xf97316, sunColor: 0xfb923c, skyboxTheme: 'SOLAR', particleSpeedMultiplier: 1.7 },
  ],
  hazards: [
    { id: 'h_reactor_turrets_approach', name: 'FACILITY DEFENSE TURRETS // APPROACH', startT: 0.34, endT: 0.46, hazardType: 'LASER_BARRIER', intensity: 0.60, warningText: 'AUTOMATED DEFENSE ONLINE // EVADE LASER VOLLEYS', color: '#f97316' },
    { id: 'h_reactor_turrets_core', name: 'FACILITY DEFENSE TURRETS', startT: 0.50, endT: 0.75, hazardType: 'LASER_BARRIER', intensity: 0.75, warningText: 'AUTOMATED DEFENSE ONLINE // EVADE LASER VOLLEYS', color: '#f97316' },
    { id: 'h_reactor_turrets_final', name: 'FACILITY DEFENSE TURRETS // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'LASER_BARRIER', intensity: 0.71, warningText: 'AUTOMATED DEFENSE ONLINE // EVADE LASER VOLLEYS', color: '#f97316' },
  ],
  finalClimax: {
    startT: 0.83,
    climaxTitle: 'CORE DETONATION: EXTRACTION SPRINT',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_12_DRONE_ASSAULT: ExtendedPathConfig = {
  modeId: 'DRONE_ASSAULT',
  modeName: 'DRONE ASSAULT',
  locationName: 'AEGIS BASTION // COMBAT DEFENSE RING',
  totalEquivalentKm: 11.2,
  targetSplineLength: 9400,
  controlPoints: [
    [0, 27, 0],             // 00 Military station catapult start
    [198, 81, -720],        // 01 Weapons platform entry
    [558, 171, -1584],        // 02 Swarm intercept zone
    [972, 243, -2520],      // 03 Fortress perimeter skyway
    [1278, 198, -3492],      // 04 Heavy anti-air flak sector
    [1368, 81, -4464],       // 05 Battlefield descent
    [1152, -45, -5292],      // 06 Combat drone dogfight corridor
    [684, -135, -5868],      // 07 Destroyer carrier wreckage
    [72, -162, -6048],       // 08 Defense ring underpass
    [-558, -108, -5688],     // 09 Minefield evasion chicane
    [-1098, -9, -4932],      // 10 Orbital cannon battery approach
    [-1458, 99, -3960],      // 11 S-bend between defense towers
    [-1548, 198, -2916],     // 12 Command station breach
    [-1332, 171, -1908],      // 13 Skyway over carrier deck
    [-828, 90, -972],       // 14 Battlefield egress
    [-288, 36, -144],        // 15 Command carrier landing finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: CATAPULT LAUNCH', subtitle: 'STATION DEFENSE', startT: 0.0, endT: 0.22, environment: 'BATTLEFIELD', hazardDensity: 0.45, recommendedSpeed: 730, description: 'High-G catapult exit into active combat airspace.' },
    { index: 2, name: 'SECTOR 2: DRONE SWARM GAUNTLET', subtitle: 'HOSTILE INTERCEPT', startT: 0.22, endT: 0.5, environment: 'BATTLEFIELD', hazardDensity: 0.8, recommendedSpeed: 660, description: 'Interceptors and kamikaze attack drones crowding flight lanes.' },
    { index: 3, name: 'SECTOR 3: CANNON BATTERY TRENCH', subtitle: 'FLAK EVASION', startT: 0.5, endT: 0.76, environment: 'BATTLEFIELD', hazardDensity: 0.9, recommendedSpeed: 750, description: 'Threading low trenches beneath massive capital-ship artillery.' },
    { index: 4, name: 'SECTOR 4: CARRIER LANDING SPRINT', subtitle: 'FINAL COMBAT RUN', startT: 0.76, endT: 1.0, environment: 'BATTLEFIELD', hazardDensity: 0.95, recommendedSpeed: 860, description: 'High-speed breakout toward the flagship recovery deck.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'drone_carrier_scramble',
      title: 'CARRIER SWARM LAUNCH',
      subtitle: 'COMBAT DRONES ENGAGING RACERS',
      triggerT: 0.26,
      durationSec: 2.8,
      shotType: 'SHOT_05_FRONT_OBSTACLE_REVEAL',
      fovDelta: 15,
      timeScale: 0.9,
      cameraOffset: [0, 4, 16],
      lookAtOffset: [0, -1, -30],
    },
  ],
  environmentZones: [
    { environment: 'BATTLEFIELD', startT: 0.0, endT: 1.0, fogColor: 0x1f0808, fogDensity: 0.0006, ambientColor: 0xef4444, sunColor: 0xf87171, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 1.9 },
  ],
  hazards: [
    { id: 'h_drone_mines_approach', name: 'TACTICAL COMBAT MINES // APPROACH', startT: 0.08, endT: 0.20, hazardType: 'DRONE_MINES', intensity: 0.64, warningText: 'PROXIMITY MINES DETECTED // LOCK MISSILES ON DRONES', color: '#ef4444' },
    { id: 'h_drone_mines_core', name: 'TACTICAL COMBAT MINES', startT: 0.24, endT: 0.74, hazardType: 'DRONE_MINES', intensity: 0.80, warningText: 'PROXIMITY MINES DETECTED // LOCK MISSILES ON DRONES', color: '#ef4444' },
    { id: 'h_drone_mines_final', name: 'TACTICAL COMBAT MINES // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'DRONE_MINES', intensity: 0.76, warningText: 'PROXIMITY MINES DETECTED // LOCK MISSILES ON DRONES', color: '#ef4444' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'ORBITAL BOMBARDMENT: FINAL SPRINT',
    hazardSurgeMultiplier: 1.6,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_13_COLLAPSING_TRACK: ExtendedPathConfig = {
  modeId: 'COLLAPSING_TRACK',
  modeName: 'COLLAPSING TRACK',
  locationName: 'CATACLYSM HIGHWAY // DISINTEGRATING SECTOR 13',
  totalEquivalentKm: 10.6,
  targetSplineLength: 8800,
  controlPoints: [
    [0, 18, 0],             // 00 Intact highway staging area
    [-144, 45, -648],        // 01 Structural stress fractures appear
    [-432, 108, -1404],       // 02 First falling platform segment
    [-828, 162, -2232],      // 03 Disintegrating outer bridge
    [-1188, 135, -3096],      // 04 Dissolving magnetic rail
    [-1368, 36, -3996],      // 05 Plunging canyon road
    [-1224, -81, -4824],     // 06 Collapsing tunnel interior
    [-828, -162, -5472],     // 07 Shattered road leap
    [-288, -171, -5724],     // 08 Emergency floating energy pontoons
    [324, -117, -5472],      // 09 Collapsing overpass
    [864, -27, -4788],      // 10 High-speed vanishing ramp
    [1242, 72, -3888],       // 11 Falling pillar slalom
    [1368, 153, -2880],       // 12 Narrow intact emergency lane
    [1152, 135, -1944],       // 13 Final disintegrating highway straight
    [684, 72, -1008],        // 14 Safety threshold approach
    [198, 27, -180],        // 15 Stabilized terminal dock finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: STRESS FRACTURES', subtitle: 'INITIAL INTEGRITY', startT: 0.0, endT: 0.22, environment: 'CRUMBLING_RUINS', hazardDensity: 0.45, recommendedSpeed: 740, description: 'Roadway intact but seismic alerts warning of impending structural failure.' },
    { index: 2, name: 'SECTOR 2: DISSOLVING HIGHWAY', subtitle: 'FALLING PLATFORMS', startT: 0.22, endT: 0.52, environment: 'CRUMBLING_RUINS', hazardDensity: 0.8, recommendedSpeed: 680, description: 'Track segments plunging into the abyss moments behind the player.' },
    { index: 3, name: 'SECTOR 3: COLLAPSING TUNNEL', subtitle: 'CEILING CAVERN BREACH', startT: 0.52, endT: 0.78, environment: 'CRUMBLING_RUINS', hazardDensity: 0.9, recommendedSpeed: 770, description: 'Enclosed tunnel caving in; precision steering through debris required.' },
    { index: 4, name: 'SECTOR 4: EMERGENCY RUNWAY', subtitle: 'FINAL STABILIZATION', startT: 0.78, endT: 1.0, environment: 'CRUMBLING_RUINS', hazardDensity: 1, recommendedSpeed: 890, description: 'Full-boost sprint before the last remaining bridge disintegrates.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'track_collapse_rear_view',
      title: 'TRACK INTEGRITY ZERO',
      subtitle: 'REAR HIGHWAY COLLAPSING INTO SPACE',
      triggerT: 0.42,
      durationSec: 2.6,
      shotType: 'SHOT_08_REAR_DESTRUCTION',
      fovDelta: 16,
      timeScale: 0.9,
      cameraOffset: [0, 4, 18],
      lookAtOffset: [0, -1, -30],
    },
  ],
  environmentZones: [
    { environment: 'CRUMBLING_RUINS', startT: 0.0, endT: 1.0, fogColor: 0x1f0e08, fogDensity: 0.0006, ambientColor: 0xf59e0b, sunColor: 0xfbbf24, skyboxTheme: 'ASTEROID', particleSpeedMultiplier: 1.8 },
  ],
  hazards: [
    { id: 'h_collapsing_platforms_approach', name: 'DISINTEGRATING TRACK PLATFORMS // APPROACH', startT: 0.08, endT: 0.20, hazardType: 'COLLAPSE', intensity: 0.72, warningText: 'ROAD COLLAPSE BEHIND // NEVER DECELERATE', color: '#f59e0b' },
    { id: 'h_collapsing_platforms_core', name: 'DISINTEGRATING TRACK PLATFORMS', startT: 0.22, endT: 0.85, hazardType: 'COLLAPSE', intensity: 0.90, warningText: 'ROAD COLLAPSE BEHIND // NEVER DECELERATE', color: '#f59e0b' },
    { id: 'h_collapsing_platforms_final', name: 'DISINTEGRATING TRACK PLATFORMS // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'COLLAPSE', intensity: 0.85, warningText: 'ROAD COLLAPSE BEHIND // NEVER DECELERATE', color: '#f59e0b' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'FINAL PLATFORM COLLAPSE: SPRINT TO SAFETY',
    hazardSurgeMultiplier: 1.8,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_14_RING_RUNNER: ExtendedPathConfig = {
  modeId: 'RING_RUNNER',
  modeName: 'RING RUNNER',
  locationName: 'SATURNIAN MEGA-RING // ORBITAL COLOSSEUM',
  totalEquivalentKm: 14.0,
  targetSplineLength: 11500,
  controlPoints: [
    [0, 0, 0],              // 00 Colossal planetary ring start
    [288, 54, -864],        // 01 Outer ring perimeter curve
    [828, 135, -1872],       // 02 High-G solar banked arc
    [1476, 207, -2988],      // 03 Megastructure ring suspension
    [2016, 162, -4248],      // 04 Vertical orbital loop approach
    [2124, 36, -5580],      // 05 Inner ring transition
    [1764, -108, -6732],      // 06 Ring junction fork
    [1152, -198, -7596],     // 07 Lowest ring altitude above planet
    [396, -216, -7992],     // 08 Planetary shadow crossing
    [-432, -162, -7776],     // 09 Ascending outer ring spoke
    [-1188, -54, -6984],     // 10 Rotating ring obstacle section
    [-1728, 81, -5796],      // 11 High panoramic planetary curve
    [-1944, 198, -4392],    // 12 Broken ring jump section
    [-1764, 216, -2952],     // 13 Ring stabilizer beam straight
    [-1278, 144, -1728],       // 14 Orbital stadium approach
    [-648, 63, -684],       // 15 Final perimeter sprint
    [-162, 18, 144],          // 16 Central ring hub finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: OUTER RING ARC', subtitle: 'PLANETARY HORIZON', startT: 0.0, endT: 0.25, environment: 'PLANETARY_RING', hazardDensity: 0.35, recommendedSpeed: 760, description: 'Sweeping along the illuminated edge of a colossal planetary ring.' },
    { index: 2, name: 'SECTOR 2: INNER RING VERTICAL LOOP', subtitle: 'COLOSSAL G-FORCE', startT: 0.25, endT: 0.52, environment: 'PLANETARY_RING', hazardDensity: 0.6, recommendedSpeed: 700, description: 'Looping through the inner ring structure against planetary gravity.' },
    { index: 3, name: 'SECTOR 3: ROTATING RING JUNCTION', subtitle: 'MECHANICAL SPOKES', startT: 0.52, endT: 0.78, environment: 'PLANETARY_RING', hazardDensity: 0.75, recommendedSpeed: 790, description: 'Navigating rotating structural spokes connecting inner and outer rings.' },
    { index: 4, name: 'SECTOR 4: FULL-SPEED RING SPRINT', subtitle: 'FINAL ORBITAL APEX', startT: 0.78, endT: 1.0, environment: 'PLANETARY_RING', hazardDensity: 0.85, recommendedSpeed: 910, description: 'High-speed orbit sprint framed by the gas giant horizon.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'ring_megastructure_reveal',
      title: 'ORBITAL RING ARCHITECTURE',
      subtitle: 'PLANETARY ENCIRCLEMENT REVEAL',
      triggerT: 0.28,
      durationSec: 2.8,
      shotType: 'SHOT_09_MASSIVE_SCALE_REVEAL',
      fovDelta: 20,
      timeScale: 0.95,
      cameraOffset: [-35, 18, 28],
      lookAtOffset: [0, 0, -40],
    },
  ],
  environmentZones: [
    { environment: 'PLANETARY_RING', startT: 0.0, endT: 1.0, fogColor: 0x011b24, fogDensity: 0.0004, ambientColor: 0x06b6d4, sunColor: 0x22d3ee, skyboxTheme: 'PLANETARY', particleSpeedMultiplier: 1.4 },
  ],
  hazards: [
    { id: 'h_rotating_ring_approach', name: 'ROTATING MEGARING ARMS // APPROACH', startT: 0.36, endT: 0.48, hazardType: 'DRONE_MINES', intensity: 0.48, warningText: 'SYNCHRONIZE WITH ROTATING SPOKE GAPS', color: '#06b6d4' },
    { id: 'h_rotating_ring_core', name: 'ROTATING MEGARING ARMS', startT: 0.52, endT: 0.76, hazardType: 'DRONE_MINES', intensity: 0.60, warningText: 'SYNCHRONIZE WITH ROTATING SPOKE GAPS', color: '#06b6d4' },
    { id: 'h_rotating_ring_final', name: 'ROTATING MEGARING ARMS // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'DRONE_MINES', intensity: 0.57, warningText: 'SYNCHRONIZE WITH ROTATING SPOKE GAPS', color: '#06b6d4' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'ORBITAL APEX SPRINT: RING HUB FINISH',
    hazardSurgeMultiplier: 1.4,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_15_HYPERSPACE: ExtendedPathConfig = {
  modeId: 'HYPERSPACE_SPRINT',
  modeName: 'HYPERSPACE SPRINT',
  locationName: 'TACHYON EXPRESSWAY // VOID CHANNEL 15',
  totalEquivalentKm: 14.8,
  targetSplineLength: 12200,
  controlPoints: [
    [0, 18, 0],             // 00 Acceleration conduit launch
    [144, 45, -936],         // 01 Speed gate cluster alpha
    [396, 90, -2124],       // 02 Sub-warp threshold crossing
    [792, 135, -3528],       // 03 Hyperspace tunnel entry
    [1152, 117, -5076],       // 04 Extreme straightaway section 1
    [1278, 36, -6732],       // 05 Chromatic speed curve
    [1044, -63, -8244],      // 06 Warp compression straight
    [558, -126, -9468],      // 07 Tachyon acceleration chute
    [-108, -144, -10116],      // 08 Light-speed apex turn
    [-828, -90, -9972],     // 09 Hyperspace tunnel transition beta
    [-1458, 0, -9144],       // 10 Extreme straightaway section 2
    [-1872, 108, -7776],     // 11 Quantum slipstream curve
    [-1962, 189, -6084],    // 12 Speed threshold gamma
    [-1692, 198, -4248],     // 13 Tunnel exit deceleration gate
    [-1152, 135, -2592],      // 14 Reality alignment straight
    [-504, 63, -1152],       // 15 Final hyperspace jump straight
    [-108, 18, 144],          // 16 Finish terminal portal
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: ACCELERATION CONDUIT', subtitle: 'SUB-WARP THRESHOLD', startT: 0.0, endT: 0.22, environment: 'HYPERSPACE_VOID', hazardDensity: 0.3, recommendedSpeed: 840, description: 'High-density boost pad corridor launching racers toward lightspeed.' },
    { index: 2, name: 'SECTOR 2: TACHYON HYPERTUNNEL', subtitle: 'CHROMATIC STREAKS', startT: 0.22, endT: 0.5, environment: 'HYPERSPACE_VOID', hazardDensity: 0.55, recommendedSpeed: 950, description: 'Hyper-tunnel where environmental stars streak into laser lines.' },
    { index: 3, name: 'SECTOR 3: QUANTUM SLIPSTREAM', subtitle: 'EXTREME STRAIGHTS', startT: 0.5, endT: 0.78, environment: 'HYPERSPACE_VOID', hazardDensity: 0.65, recommendedSpeed: 1020, description: 'Maximum velocity long straights rewarding drafting and boost stacking.' },
    { index: 4, name: 'SECTOR 4: FINAL HYPERSPACE JUMP', subtitle: 'REALSPACE ARRIVAL', startT: 0.78, endT: 1.0, environment: 'HYPERSPACE_VOID', hazardDensity: 0.8, recommendedSpeed: 1100, description: 'Superluminal finish gate punch returning fleet to realspace.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'hyperspace_threshold_cinematic',
      title: 'WARP THRESHOLD CROSSED',
      subtitle: 'MAXIMUM VELOCITY STREAKS ACTIVE',
      triggerT: 0.25,
      durationSec: 2.7,
      shotType: 'SHOT_07_EXTREME_SPEED',
      fovDelta: 28,
      timeScale: 1.0,
      cameraOffset: [0, 2, -12],
      lookAtOffset: [0, 1, 50],
    },
  ],
  environmentZones: [
    { environment: 'HYPERSPACE_VOID', startT: 0.0, endT: 1.0, fogColor: 0x07011d, fogDensity: 0.0004, ambientColor: 0x8b5cf6, sunColor: 0xa78bfa, skyboxTheme: 'QUANTUM', particleSpeedMultiplier: 2.8 },
  ],
  hazards: [
    { id: 'h_hyperspace_gates_approach', name: 'SUPERLUMINAL SPEED GATES // APPROACH', startT: 0.08, endT: 0.20, hazardType: 'LASER_BARRIER', intensity: 0.28, warningText: 'CENTER ALIGNMENT FOR VELOCITY MULTIPLIER', color: '#8b5cf6' },
    { id: 'h_hyperspace_gates_core', name: 'SUPERLUMINAL SPEED GATES', startT: 0.20, endT: 0.80, hazardType: 'LASER_BARRIER', intensity: 0.35, warningText: 'CENTER ALIGNMENT FOR VELOCITY MULTIPLIER', color: '#8b5cf6' },
    { id: 'h_hyperspace_gates_final', name: 'SUPERLUMINAL SPEED GATES // FINAL GAUNTLET', startT: 0.72, endT: 0.92, hazardType: 'LASER_BARRIER', intensity: 0.33, warningText: 'CENTER ALIGNMENT FOR VELOCITY MULTIPLIER', color: '#8b5cf6' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'LIGHTSPEED JUMP: FINAL FINISH PUNCH',
    hazardSurgeMultiplier: 1.3,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};
