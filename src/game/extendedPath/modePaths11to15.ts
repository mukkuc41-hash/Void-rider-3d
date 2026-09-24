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
  totalEquivalentKm: 5.8,
  targetSplineLength: 4900,
  controlPoints: [
    [0, 10, 0],             // 00 Infiltration staging sector
    [-90, 30, -380],        // 01 Facility perimeter breach
    [-280, 75, -840],       // 02 Security sensor corridor
    [-520, 110, -1340],     // 03 Reactor exterior skyway
    [-710, 90, -1860],      // 04 Heavy containment ring
    [-790, 35, -2380],      // 05 Reactor core approach dive
    [-680, -30, -2840],     // 06 Central containment chamber
    [-440, -80, -3160],     // 07 Primary core collection platform
    [-120, -95, -3260],     // 08 Meltdown trigger sequence
    [220, -65, -3080],      // 09 High-heat cooling exhaust chute
    [520, -10, -2680],      // 10 Security lockdown tunnel
    [740, 50, -2140],       // 11 Turret defense gauntlet
    [790, 95, -1580],       // 12 Extraction conduit climb
    [660, 85, -1040],       // 13 Reactor superstructure exit
    [390, 45, -520],        // 14 Emergency speed tunnel
    [120, 15, -80],         // 15 Extraction dropship finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: INFILTRATION PERIMETER', subtitle: 'SECURITY BYPASS', startT: 0.0, endT: 0.24, environment: 'ENERGY_REACTOR', hazardDensity: 0.3, recommendedSpeed: 710, description: 'Stealth approach through exterior automated defense sensors.' },
    { index: 2, name: 'SECTOR 2: CONTAINMENT RING', subtitle: 'CORE ACCESS', startT: 0.24, endT: 0.5, environment: 'ENERGY_REACTOR', hazardDensity: 0.6, recommendedSpeed: 670, description: 'Circumnavigating the pulsating electromagnetic containment coils.' },
    { index: 3, name: 'SECTOR 3: REACTOR CORE CHAMBER', subtitle: 'EXTRACTION CRITICAL', startT: 0.5, endT: 0.74, environment: 'ENERGY_REACTOR', hazardDensity: 0.75, recommendedSpeed: 780, description: 'Collecting high-energy cores as the facility initiates lockdown.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION CHUTE', subtitle: 'FINAL MELTDOWN SPRINT', startT: 0.74, endT: 1.0, environment: 'ENERGY_REACTOR', hazardDensity: 0.85, recommendedSpeed: 880, description: 'Full-boost escape before containment integrity hits zero.' },
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
    { id: 'h_reactor_turrets', name: 'FACILITY DEFENSE TURRETS', startT: 0.5, endT: 0.75, hazardType: 'LASER_BARRIER', intensity: 0.75, warningText: 'AUTOMATED DEFENSE ONLINE // EVADE LASER VOLLEYS', color: '#f97316' },
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
  totalEquivalentKm: 6.2,
  targetSplineLength: 5200,
  controlPoints: [
    [0, 15, 0],             // 00 Military station catapult start
    [110, 45, -400],        // 01 Weapons platform entry
    [310, 95, -880],        // 02 Swarm intercept zone
    [540, 135, -1400],      // 03 Fortress perimeter skyway
    [710, 110, -1940],      // 04 Heavy anti-air flak sector
    [760, 45, -2480],       // 05 Battlefield descent
    [640, -25, -2940],      // 06 Combat drone dogfight corridor
    [380, -75, -3260],      // 07 Destroyer carrier wreckage
    [40, -90, -3360],       // 08 Defense ring underpass
    [-310, -60, -3160],     // 09 Minefield evasion chicane
    [-610, -5, -2740],      // 10 Orbital cannon battery approach
    [-810, 55, -2200],      // 11 S-bend between defense towers
    [-860, 110, -1620],     // 12 Command station breach
    [-740, 95, -1060],      // 13 Skyway over carrier deck
    [-460, 50, -540],       // 14 Battlefield egress
    [-160, 20, -80],        // 15 Command carrier landing finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: CATAPULT LAUNCH', subtitle: 'STATION DEFENSE', startT: 0.0, endT: 0.22, environment: 'BATTLEFIELD', hazardDensity: 0.35, recommendedSpeed: 730, description: 'High-G catapult exit into active combat airspace.' },
    { index: 2, name: 'SECTOR 2: DRONE SWARM GAUNTLET', subtitle: 'HOSTILE INTERCEPT', startT: 0.22, endT: 0.5, environment: 'BATTLEFIELD', hazardDensity: 0.7, recommendedSpeed: 660, description: 'Interceptors and kamikaze attack drones crowding flight lanes.' },
    { index: 3, name: 'SECTOR 3: CANNON BATTERY TRENCH', subtitle: 'FLAK EVASION', startT: 0.5, endT: 0.76, environment: 'BATTLEFIELD', hazardDensity: 0.8, recommendedSpeed: 750, description: 'Threading low trenches beneath massive capital-ship artillery.' },
    { index: 4, name: 'SECTOR 4: CARRIER LANDING SPRINT', subtitle: 'FINAL COMBAT RUN', startT: 0.76, endT: 1.0, environment: 'BATTLEFIELD', hazardDensity: 0.85, recommendedSpeed: 860, description: 'High-speed breakout toward the flagship recovery deck.' },
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
    { id: 'h_drone_mines', name: 'TACTICAL COMBAT MINES', startT: 0.24, endT: 0.74, hazardType: 'DRONE_MINES', intensity: 0.8, warningText: 'PROXIMITY MINES DETECTED // LOCK MISSILES ON DRONES', color: '#ef4444' },
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
  totalEquivalentKm: 5.9,
  targetSplineLength: 4900,
  controlPoints: [
    [0, 10, 0],             // 00 Intact highway staging area
    [-80, 25, -360],        // 01 Structural stress fractures appear
    [-240, 60, -780],       // 02 First falling platform segment
    [-460, 90, -1240],      // 03 Disintegrating outer bridge
    [-660, 75, -1720],      // 04 Dissolving magnetic rail
    [-760, 20, -2220],      // 05 Plunging canyon road
    [-680, -45, -2680],     // 06 Collapsing tunnel interior
    [-460, -90, -3040],     // 07 Shattered road leap
    [-160, -95, -3180],     // 08 Emergency floating energy pontoons
    [180, -65, -3040],      // 09 Collapsing overpass
    [480, -15, -2660],      // 10 High-speed vanishing ramp
    [690, 40, -2160],       // 11 Falling pillar slalom
    [760, 85, -1600],       // 12 Narrow intact emergency lane
    [640, 75, -1080],       // 13 Final disintegrating highway straight
    [380, 40, -560],        // 14 Safety threshold approach
    [110, 15, -100],        // 15 Stabilized terminal dock finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: STRESS FRACTURES', subtitle: 'INITIAL INTEGRITY', startT: 0.0, endT: 0.22, environment: 'CRUMBLING_RUINS', hazardDensity: 0.35, recommendedSpeed: 740, description: 'Roadway intact but seismic alerts warning of impending structural failure.' },
    { index: 2, name: 'SECTOR 2: DISSOLVING HIGHWAY', subtitle: 'FALLING PLATFORMS', startT: 0.22, endT: 0.52, environment: 'CRUMBLING_RUINS', hazardDensity: 0.7, recommendedSpeed: 680, description: 'Track segments plunging into the abyss moments behind the player.' },
    { index: 3, name: 'SECTOR 3: COLLAPSING TUNNEL', subtitle: 'CEILING CAVERN BREACH', startT: 0.52, endT: 0.78, environment: 'CRUMBLING_RUINS', hazardDensity: 0.8, recommendedSpeed: 770, description: 'Enclosed tunnel caving in; precision steering through debris required.' },
    { index: 4, name: 'SECTOR 4: EMERGENCY RUNWAY', subtitle: 'FINAL STABILIZATION', startT: 0.78, endT: 1.0, environment: 'CRUMBLING_RUINS', hazardDensity: 0.9, recommendedSpeed: 890, description: 'Full-boost sprint before the last remaining bridge disintegrates.' },
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
    { id: 'h_collapsing_platforms', name: 'DISINTEGRATING TRACK PLATFORMS', startT: 0.22, endT: 0.85, hazardType: 'COLLAPSE', intensity: 0.9, warningText: 'ROAD COLLAPSE BEHIND // NEVER DECELERATE', color: '#f59e0b' },
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
  totalEquivalentKm: 7.8,
  targetSplineLength: 6400,
  controlPoints: [
    [0, 0, 0],              // 00 Colossal planetary ring start
    [160, 30, -480],        // 01 Outer ring perimeter curve
    [460, 75, -1040],       // 02 High-G solar banked arc
    [820, 115, -1660],      // 03 Megastructure ring suspension
    [1120, 90, -2360],      // 04 Vertical orbital loop approach
    [1180, 20, -3100],      // 05 Inner ring transition
    [980, -60, -3740],      // 06 Ring junction fork
    [640, -110, -4220],     // 07 Lowest ring altitude above planet
    [220, -120, -4440],     // 08 Planetary shadow crossing
    [-240, -90, -4320],     // 09 Ascending outer ring spoke
    [-660, -30, -3880],     // 10 Rotating ring obstacle section
    [-960, 45, -3220],      // 11 High panoramic planetary curve
    [-1080, 110, -2440],    // 12 Broken ring jump section
    [-980, 120, -1640],     // 13 Ring stabilizer beam straight
    [-710, 80, -960],       // 14 Orbital stadium approach
    [-360, 35, -380],       // 15 Final perimeter sprint
    [-90, 10, 80],          // 16 Central ring hub finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: OUTER RING ARC', subtitle: 'PLANETARY HORIZON', startT: 0.0, endT: 0.25, environment: 'PLANETARY_RING', hazardDensity: 0.25, recommendedSpeed: 760, description: 'Sweeping along the illuminated edge of a colossal planetary ring.' },
    { index: 2, name: 'SECTOR 2: INNER RING VERTICAL LOOP', subtitle: 'COLOSSAL G-FORCE', startT: 0.25, endT: 0.52, environment: 'PLANETARY_RING', hazardDensity: 0.5, recommendedSpeed: 700, description: 'Looping through the inner ring structure against planetary gravity.' },
    { index: 3, name: 'SECTOR 3: ROTATING RING JUNCTION', subtitle: 'MECHANICAL SPOKES', startT: 0.52, endT: 0.78, environment: 'PLANETARY_RING', hazardDensity: 0.65, recommendedSpeed: 790, description: 'Navigating rotating structural spokes connecting inner and outer rings.' },
    { index: 4, name: 'SECTOR 4: FULL-SPEED RING SPRINT', subtitle: 'FINAL ORBITAL APEX', startT: 0.78, endT: 1.0, environment: 'PLANETARY_RING', hazardDensity: 0.75, recommendedSpeed: 910, description: 'High-speed orbit sprint framed by the gas giant horizon.' },
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
    { id: 'h_rotating_ring', name: 'ROTATING MEGARING ARMS', startT: 0.52, endT: 0.76, hazardType: 'DRONE_MINES', intensity: 0.6, warningText: 'SYNCHRONIZE WITH ROTATING SPOKE GAPS', color: '#06b6d4' },
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
  totalEquivalentKm: 8.2,
  targetSplineLength: 6800,
  controlPoints: [
    [0, 10, 0],             // 00 Acceleration conduit launch
    [80, 25, -520],         // 01 Speed gate cluster alpha
    [220, 50, -1180],       // 02 Sub-warp threshold crossing
    [440, 75, -1960],       // 03 Hyperspace tunnel entry
    [640, 65, -2820],       // 04 Extreme straightaway section 1
    [710, 20, -3740],       // 05 Chromatic speed curve
    [580, -35, -4580],      // 06 Warp compression straight
    [310, -70, -5260],      // 07 Tachyon acceleration chute
    [-60, -80, -5620],      // 08 Light-speed apex turn
    [-460, -50, -5540],     // 09 Hyperspace tunnel transition beta
    [-810, 0, -5080],       // 10 Extreme straightaway section 2
    [-1040, 60, -4320],     // 11 Quantum slipstream curve
    [-1090, 105, -3380],    // 12 Speed threshold gamma
    [-940, 110, -2360],     // 13 Tunnel exit deceleration gate
    [-640, 75, -1440],      // 14 Reality alignment straight
    [-280, 35, -640],       // 15 Final hyperspace jump straight
    [-60, 10, 80],          // 16 Finish terminal portal
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: ACCELERATION CONDUIT', subtitle: 'SUB-WARP THRESHOLD', startT: 0.0, endT: 0.22, environment: 'HYPERSPACE_VOID', hazardDensity: 0.2, recommendedSpeed: 840, description: 'High-density boost pad corridor launching racers toward lightspeed.' },
    { index: 2, name: 'SECTOR 2: TACHYON HYPERTUNNEL', subtitle: 'CHROMATIC STREAKS', startT: 0.22, endT: 0.5, environment: 'HYPERSPACE_VOID', hazardDensity: 0.45, recommendedSpeed: 950, description: 'Hyper-tunnel where environmental stars streak into laser lines.' },
    { index: 3, name: 'SECTOR 3: QUANTUM SLIPSTREAM', subtitle: 'EXTREME STRAIGHTS', startT: 0.5, endT: 0.78, environment: 'HYPERSPACE_VOID', hazardDensity: 0.55, recommendedSpeed: 1020, description: 'Maximum velocity long straights rewarding drafting and boost stacking.' },
    { index: 4, name: 'SECTOR 4: FINAL HYPERSPACE JUMP', subtitle: 'REALSPACE ARRIVAL', startT: 0.78, endT: 1.0, environment: 'HYPERSPACE_VOID', hazardDensity: 0.7, recommendedSpeed: 1100, description: 'Superluminal finish gate punch returning fleet to realspace.' },
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
    { id: 'h_hyperspace_gates', name: 'SUPERLUMINAL SPEED GATES', startT: 0.2, endT: 0.8, hazardType: 'LASER_BARRIER', intensity: 0.35, warningText: 'CENTER ALIGNMENT FOR VELOCITY MULTIPLIER', color: '#8b5cf6' },
  ],
  finalClimax: {
    startT: 0.82,
    climaxTitle: 'LIGHTSPEED JUMP: FINAL FINISH PUNCH',
    hazardSurgeMultiplier: 1.3,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};
