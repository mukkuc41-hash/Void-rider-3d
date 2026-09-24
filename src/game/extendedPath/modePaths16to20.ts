import { ExtendedPathConfig } from './extendedPathTypes';

/**
 * Extended Path Configurations: Modes 16 - 20
 * 16: RIVAL_DUEL (Apex gladiatorial chasm, 1v1 duel against Zer0, technical overtaking arena)
 * 17: RELAY_RACE (Multi-sector expedition, 5 distinct sectors A to E with handoff gates)
 * 18: SURVIVAL_ELIMINATION (Colosseum knockout gauntlet, 5 escalating difficulty sectors)
 * 19: COSMIC_TREASURE_HUNT (Progenitor ruins, ancient vault, hidden shortcuts & energy crystals)
 * 20: VOID_CHAMPIONSHIP (7 multi-environment championship tour: Neon, Asteroid, Solar, Ring, Wormhole, Hyperspace, Stadium)
 */

export const MODE_PATH_16_RIVAL_DUEL: ExtendedPathConfig = {
  modeId: 'RIVAL_DUEL',
  modeName: 'RIVAL DUEL',
  locationName: 'APEX GLADIATORIAL CHASM // SECTOR 16',
  totalEquivalentKm: 5.6,
  targetSplineLength: 4700,
  controlPoints: [
    [0, 10, 0],             // 00 Duel arena staging gates
    [70, 25, -380],         // 01 Wide side-by-side overtaking highway
    [210, 65, -840],        // 02 High-speed banked curve
    [440, 95, -1360],       // 03 Technical canyon chicane
    [640, 80, -1880],       // 04 Combat zone approach
    [680, 25, -2380],       // 05 Narrow tunnel dive
    [540, -40, -2820],      // 06 Technical S-bend gauntlet
    [260, -85, -3100],      // 07 Deep chasm duel straightaway
    [-110, -90, -3160],     // 08 Apex hairpin turn
    [-460, -55, -2920],     // 09 Ascending combat sector
    [-740, 10, -2480],      // 10 Drafting straight
    [-840, 75, -1920],      // 11 Spire overpass curve
    [-780, 110, -1340],     // 12 High-speed overtaking straight
    [-540, 90, -780],       // 13 Arena entrance chicane
    [-240, 45, -300],       // 14 Final 1v1 sprint straight
    [-60, 15, 60],          // 15 Gladiatorial finish gate
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: OVERTAKING HIGHWAY', subtitle: 'SIDE-BY-SIDE DRAG', startT: 0.0, endT: 0.25, environment: 'DUEL_ARENA', hazardDensity: 0.2, recommendedSpeed: 760, description: 'Wide 4-lane straight designed for high-speed slipstreaming.' },
    { index: 2, name: 'SECTOR 2: TECHNICAL CHASM', subtitle: 'DEFENSIVE BLOCKING', startT: 0.25, endT: 0.52, environment: 'DUEL_ARENA', hazardDensity: 0.45, recommendedSpeed: 680, description: 'Tight canyon bends testing steering precision and ramming defenses.' },
    { index: 3, name: 'SECTOR 3: COMBAT TUNNEL', subtitle: 'MISSILE DUEL', startT: 0.52, endT: 0.78, environment: 'DUEL_ARENA', hazardDensity: 0.6, recommendedSpeed: 770, description: 'Enclosed tunnel where tactical missile timing decides position.' },
    { index: 4, name: 'SECTOR 4: ARENA SHOWDOWN', subtitle: 'FINAL SPRINT', startT: 0.78, endT: 1.0, environment: 'DUEL_ARENA', hazardDensity: 0.7, recommendedSpeed: 880, description: 'Final drag race across the gladiatorial arena floor.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'rival_duel_sidebyside',
      title: 'RIVAL ENGAGEMENT: ZER0',
      subtitle: 'SIDE-BY-SIDE CONTACT // DUEL ACTIVE',
      triggerT: 0.28,
      durationSec: 2.5,
      shotType: 'SHOT_02_SIDE_FLYBY',
      fovDelta: 12,
      timeScale: 0.95,
      cameraOffset: [20, 4, -5],
      lookAtOffset: [0, 1, 12],
    },
  ],
  environmentZones: [
    { environment: 'DUEL_ARENA', startT: 0.0, endT: 1.0, fogColor: 0x1f0808, fogDensity: 0.0005, ambientColor: 0xdc2626, sunColor: 0xf87171, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 1.6 },
  ],
  hazards: [
    { id: 'h_duel_combat', name: 'GLADIATORIAL COMBAT SPIKES', startT: 0.35, endT: 0.7, hazardType: 'DRONE_MINES', intensity: 0.5, warningText: 'RIVAL WEAPONS ONLINE // PREPARE DEFENSIVE SHIELD', color: '#dc2626' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'FINAL DUEL SPRINT: HEAD-TO-HEAD FINISH',
    hazardSurgeMultiplier: 1.3,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_17_RELAY_RACE: ExtendedPathConfig = {
  modeId: 'RELAY_RACE',
  modeName: 'RELAY RACE',
  locationName: 'ODYSSEY EXPEDITION // 5-SECTOR TRANSIT',
  totalEquivalentKm: 7.0,
  targetSplineLength: 5800,
  controlPoints: [
    [0, 10, 0],             // 00 Sector A: Neon city launch
    [-90, 30, -420],        // 01 Neon skyway
    [-280, 80, -940],       // 02 Tower skybridge
    [-540, 115, -1520],     // 03 Handoff Gate 1 (A to B)
    [-760, 90, -2120],      // 04 Sector B: Asteroid mining trench
    [-840, 35, -2700],      // 05 Asteroid cavern bend
    [-740, -30, -3220],     // 06 Handoff Gate 2 (B to C)
    [-460, -85, -3560],     // 07 Sector C: Plasma storm cloud
    [-110, -95, -3660],     // 08 Lightning discharge curve
    [240, -60, -3460],      // 09 Handoff Gate 3 (C to D)
    [580, -10, -3020],      // 10 Sector D: Orbital station docks
    [790, 60, -2440],       // 11 Station exterior skyway
    [840, 110, -1780],      // 12 Handoff Gate 4 (D to E)
    [690, 95, -1140],       // 13 Sector E: Hyperspace accelerator
    [410, 50, -560],        // 14 Warp tunnel straight
    [120, 15, -80],         // 15 Odyssey grand relay finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR A: NEON SPEEDWAY', subtitle: 'STAGE 1: AGILITY', startT: 0.0, endT: 0.2, environment: 'NEON_CITY', hazardDensity: 0.25, recommendedSpeed: 720, description: 'Speedster pilot lead-off leg through illuminated megacity corridors.' },
    { index: 2, name: 'SECTOR B: ASTEROID CANYON', subtitle: 'STAGE 2: DURABILITY', startT: 0.2, endT: 0.42, environment: 'ASTEROID_FIELD', hazardDensity: 0.55, recommendedSpeed: 660, description: 'Armored pilot second leg navigating tumbling kinetic debris.' },
    { index: 3, name: 'SECTOR C: ION PLASMA STORM', subtitle: 'STAGE 3: SHIELDING', startT: 0.42, endT: 0.64, environment: 'PLASMA_STORM', hazardDensity: 0.65, recommendedSpeed: 740, description: 'Energy specialist third leg fighting electrical storm discharges.' },
    { index: 4, name: 'SECTOR D: STATION TRANSIT', subtitle: 'STAGE 4: PRECISION', startT: 0.64, endT: 0.82, environment: 'SKYLINE_HIGHWAY', hazardDensity: 0.5, recommendedSpeed: 780, description: 'Tactician fourth leg threading tight orbital station airlocks.' },
    { index: 5, name: 'SECTOR E: HYPERSPACE ANCHOR', subtitle: 'STAGE 5: VELOCITY', startT: 0.82, endT: 1.0, environment: 'HYPERSPACE_VOID', hazardDensity: 0.75, recommendedSpeed: 960, description: 'Anchor racer final leg maximum supercharged boost to the line.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'relay_handoff_cinematic',
      title: 'RELAY HANDOFF PROTOCOL',
      subtitle: 'BATON TRANSFERRED // ANCHOR SPRINT',
      triggerT: 0.82,
      durationSec: 2.6,
      shotType: 'SHOT_02_SIDE_FLYBY',
      fovDelta: 16,
      timeScale: 0.95,
      cameraOffset: [-22, 6, 12],
      lookAtOffset: [0, 1, 20],
    },
  ],
  environmentZones: [
    { environment: 'NEON_CITY', startT: 0.0, endT: 0.2, fogColor: 0x001528, fogDensity: 0.0004, ambientColor: 0x00e5ff, sunColor: 0x00f0ff, skyboxTheme: 'NEON', particleSpeedMultiplier: 1.3 },
    { environment: 'ASTEROID_FIELD', startT: 0.2, endT: 0.42, fogColor: 0x1f1408, fogDensity: 0.0005, ambientColor: 0xffaa00, sunColor: 0xff8800, skyboxTheme: 'ASTEROID', particleSpeedMultiplier: 1.4 },
    { environment: 'PLASMA_STORM', startT: 0.42, endT: 0.64, fogColor: 0x1a0526, fogDensity: 0.0006, ambientColor: 0xc026d3, sunColor: 0xe879f9, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 1.8 },
    { environment: 'SKYLINE_HIGHWAY', startT: 0.64, endT: 0.82, fogColor: 0x021d28, fogDensity: 0.0005, ambientColor: 0x14b8a6, sunColor: 0x2dd4bf, skyboxTheme: 'NEON', particleSpeedMultiplier: 1.4 },
    { environment: 'HYPERSPACE_VOID', startT: 0.82, endT: 1.0, fogColor: 0x07011d, fogDensity: 0.0004, ambientColor: 0x8b5cf6, sunColor: 0xa78bfa, skyboxTheme: 'QUANTUM', particleSpeedMultiplier: 2.6 },
  ],
  hazards: [
    { id: 'h_relay_gates', name: 'RELAY ENERGY ARCS', startT: 0.35, endT: 0.65, hazardType: 'LASER_BARRIER', intensity: 0.5, warningText: 'TRANSIT ZONE GATES SYNCHRONIZED', color: '#06b6d4' },
  ],
  finalClimax: {
    startT: 0.84,
    climaxTitle: 'ANCHOR LEG: LIGHTSPEED RELAY SPRINT',
    hazardSurgeMultiplier: 1.4,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_18_SURVIVAL_ELIMINATION: ExtendedPathConfig = {
  modeId: 'SURVIVAL_ELIMINATION',
  modeName: 'SURVIVAL ELIMINATION',
  locationName: 'COLOSSEUM KNOCKOUT // SECTOR 18',
  totalEquivalentKm: 6.6,
  targetSplineLength: 5500,
  controlPoints: [
    [0, 10, 0],             // 00 Fleet staging arena (6 racers)
    [90, 35, -440],         // 01 Stage 1: Wide warm-up highway
    [290, 85, -960],        // 02 High-speed banked curve
    [520, 125, -1540],      // 03 Elimination Gate 1 approach
    [710, 95, -2160],       // 04 Stage 2: Tight chicane section
    [740, 35, -2760],       // 05 Laser barrier obstacle lane
    [610, -35, -3280],      // 06 Elimination Gate 2 approach
    [320, -85, -3620],      // 07 Stage 3: Extreme technical chasm
    [-60, -95, -3700],      // 08 Sharp hairpin with zero-G drift
    [-440, -60, -3480],     // 09 Elimination Gate 3 approach
    [-740, 5, -3020],       // 10 Stage 4: High-G corkscrew
    [-890, 75, -2420],      // 11 Disintegrating track elements
    [-840, 120, -1740],     // 12 Elimination Gate 4 (Final 2 Racers)
    [-640, 95, -1120],      // 13 Stage 5: Championship 1v1 sprint
    [-340, 45, -540],       // 14 Colosseum arena entry
    [-80, 15, 60],          // 15 Winner takes all finish gate
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: WARM-UP HIGHWAY', subtitle: 'ROUND 1: 6 RACERS', startT: 0.0, endT: 0.22, environment: 'ELIMINATION_GAUNTLET', hazardDensity: 0.25, recommendedSpeed: 740, description: 'Wide opening straight allowing racers to jostle for position.' },
    { index: 2, name: 'SECTOR 2: LASER CHICANE', subtitle: 'ROUND 2: 5 RACERS', startT: 0.22, endT: 0.45, environment: 'ELIMINATION_GAUNTLET', hazardDensity: 0.5, recommendedSpeed: 680, description: 'Laser grids and narrowing lanes forcing aggressive overtakes.' },
    { index: 3, name: 'SECTOR 3: CHASM HAIRPIN', subtitle: 'ROUND 3: 4 RACERS', startT: 0.45, endT: 0.68, environment: 'ELIMINATION_GAUNTLET', hazardDensity: 0.7, recommendedSpeed: 640, description: 'High-risk drift hairpin where mistakes cause immediate drops.' },
    { index: 4, name: 'SECTOR 4: CORKSCREW GAUNTLET', subtitle: 'ROUND 4: 3 RACERS', startT: 0.68, endT: 0.85, environment: 'ELIMINATION_GAUNTLET', hazardDensity: 0.8, recommendedSpeed: 780, description: 'Violent 3D corkscrew leading to the penultimate knockout.' },
    { index: 5, name: 'SECTOR 5: FINAL DUEL SPRINT', subtitle: 'FINAL 2 RACERS', startT: 0.85, endT: 1.0, environment: 'ELIMINATION_GAUNTLET', hazardDensity: 0.9, recommendedSpeed: 910, description: 'Head-to-head sprint for ultimate survival supremacy.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'elimination_countdown_cinematic',
      title: 'KNOCKOUT CLOCK COUNTDOWN',
      subtitle: 'LAST PLACE SHIP TARGETED BY DEFENSE CANNON',
      triggerT: 0.45,
      durationSec: 2.6,
      shotType: 'SHOT_04_TOP_DOWN_REVEAL',
      fovDelta: 14,
      timeScale: 0.9,
      cameraOffset: [0, 24, -12],
      lookAtOffset: [0, 0, 18],
    },
  ],
  environmentZones: [
    { environment: 'ELIMINATION_GAUNTLET', startT: 0.0, endT: 1.0, fogColor: 0x1f0404, fogDensity: 0.0006, ambientColor: 0xb91c1c, sunColor: 0xef4444, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 1.8 },
  ],
  hazards: [
    { id: 'h_elimination_cannon', name: 'ORBITAL ELIMINATION TARGETING', startT: 0.2, endT: 0.85, hazardType: 'DRONE_MINES', intensity: 0.8, warningText: 'MAINTAIN LEAD // LAST POSITION SHIP DESTROYED', color: '#ef4444' },
  ],
  finalClimax: {
    startT: 0.85,
    climaxTitle: 'CHAMPIONSHIP KNOCKOUT: FINAL 2 SURVIVOR SPRINT',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_01_LOW_REAR_CHASE',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_19_TREASURE_HUNT: ExtendedPathConfig = {
  modeId: 'COSMIC_TREASURE_HUNT',
  modeName: 'COSMIC TREASURE HUNT',
  locationName: 'PROGENITOR RUINS // LABYRINTH VAULT',
  totalEquivalentKm: 6.4,
  targetSplineLength: 5300,
  controlPoints: [
    [0, 10, 0],             // 00 Ancient ruins staging approach
    [-80, 25, -400],        // 01 Carved megalith gates
    [-260, 65, -880],       // 02 Crystal canyon entry
    [-520, 105, -1420],     // 03 Hidden portal shortcut fork
    [-740, 85, -1980],      // 04 Asteroid cave interior
    [-810, 25, -2520],      // 05 Glowing alien relic chamber
    [-710, -45, -3000],     // 06 Subterranean crystal bridge
    [-440, -95, -3320],     // 07 Primary treasure vault approach
    [-110, -100, -3420],    // 08 Ancient vault core platform
    [240, -70, -3220],      // 09 Vault defense activation
    [560, -15, -2800],      // 10 Extraction tunnel
    [760, 45, -2260],       // 11 Megastructure spire climb
    [810, 100, -1680],      // 12 High-altitude relic gauntlet
    [680, 85, -1100],       // 13 Ruins exterior overpass
    [410, 45, -540],        // 14 Artifact extraction straight
    [120, 15, -80],         // 15 Research vessel finish
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: PROGENITOR ENTRANCE', subtitle: 'CRYSTAL CANYON', startT: 0.0, endT: 0.25, environment: 'TREASURE_VAULT', hazardDensity: 0.3, recommendedSpeed: 720, description: 'Threading ancient stone obelisks embedded with pulsating crystals.' },
    { index: 2, name: 'SECTOR 2: ASTEROID CAVERN', subtitle: 'HIDDEN PORTALS', startT: 0.25, endT: 0.52, environment: 'TREASURE_VAULT', hazardDensity: 0.55, recommendedSpeed: 650, description: 'Labyrinthine cave system with branch shortcuts and relic caches.' },
    { index: 3, name: 'SECTOR 3: ANCIENT VAULT CORE', subtitle: 'TREASURE SECURED', startT: 0.52, endT: 0.78, environment: 'TREASURE_VAULT', hazardDensity: 0.7, recommendedSpeed: 750, description: 'Vault awakens as the player claims the progenitor power artifact.' },
    { index: 4, name: 'SECTOR 4: EXTRACTION FLIGHT', subtitle: 'FINAL RELIC ESCAPE', startT: 0.78, endT: 1.0, environment: 'TREASURE_VAULT', hazardDensity: 0.8, recommendedSpeed: 860, description: 'Maximum engine boost escape before the ancient ruin seals shut.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'ancient_vault_awakens',
      title: 'PROGENITOR VAULT ACTIVATION',
      subtitle: 'ANCIENT ALIEN BEACONS ONLINE',
      triggerT: 0.56,
      durationSec: 2.8,
      shotType: 'SHOT_03_WIDE_ENVIRONMENT_REVEAL',
      fovDelta: 16,
      timeScale: 0.9,
      cameraOffset: [25, 12, -18],
      lookAtOffset: [-10, 0, 15],
    },
  ],
  environmentZones: [
    { environment: 'TREASURE_VAULT', startT: 0.0, endT: 1.0, fogColor: 0x051b14, fogDensity: 0.0005, ambientColor: 0x10b981, sunColor: 0x34d399, skyboxTheme: 'NEBULA', particleSpeedMultiplier: 1.5 },
  ],
  hazards: [
    { id: 'h_vault_defenses', name: 'ANCIENT SENTINEL BEACONS', startT: 0.45, endT: 0.75, hazardType: 'LASER_BARRIER', intensity: 0.65, warningText: 'VAULT DEFENSES ACTIVE // COLLECT ENERGY GEMS', color: '#10b981' },
  ],
  finalClimax: {
    startT: 0.83,
    climaxTitle: 'VAULT LOCKDOWN: EXTRACTION SPRINT',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_07_EXTREME_SPEED',
    musicIntensity: 1.0,
  },
};

export const MODE_PATH_20_VOID_CHAMPIONSHIP: ExtendedPathConfig = {
  modeId: 'VOID_CHAMPIONSHIP',
  modeName: 'VOID CHAMPIONSHIP',
  locationName: 'THE GRAND PAN-COSMIC CIRCUIT // STAGE FINALE',
  totalEquivalentKm: 8.5,
  targetSplineLength: 7200,
  controlPoints: [
    [0, 10, 0],             // 00 Championship stadium staging
    [90, 30, -480],         // 01 Sector 1: Neon city skyway
    [280, 75, -1120],       // 02 Corporate tower chicane
    [540, 120, -1860],      // 03 Transition to Sector 2: Asteroid trench
    [760, 95, -2640],       // 04 Tumbling ore cavern
    [820, 35, -3480],       // 05 Transition to Sector 3: Solar storm
    [690, -35, -4280],      // 06 Solar flare corridor overpass
    [410, -90, -4960],      // 07 Transition to Sector 4: Planetary ring
    [40, -110, -5420],      // 08 Colossal orbital ring arc
    [-380, -90, -5540],     // 09 Transition to Sector 5: Wormhole vortex
    [-780, -35, -5260],     // 10 Warped subspace tunnel
    [-1090, 30, -4640],     // 11 Transition to Sector 6: Hyperspace straight
    [-1180, 95, -3780],     // 12 Maximum velocity tachyon corridor
    [-1040, 125, -2820],    // 13 Transition to Sector 7: Grand Finale
    [-760, 105, -1880],     // 14 Championship stadium skybridge
    [-420, 60, -980],       // 15 Pyrotechnic archway descent
    [-110, 15, -180],       // 16 Final sprint straight to podium gate
  ],
  sectors: [
    { index: 1, name: 'SECTOR 1: NEON METROPOLIS', subtitle: 'STAGE 1: URBAN SPRINT', startT: 0.0, endT: 0.16, environment: 'NEON_CITY', hazardDensity: 0.25, recommendedSpeed: 740, description: 'High-speed urban canyon between towering cybernetic skyscrapers.' },
    { index: 2, name: 'SECTOR 2: ASTEROID BELT', subtitle: 'STAGE 2: KINETIC MINING', startT: 0.16, endT: 0.32, environment: 'ASTEROID_FIELD', hazardDensity: 0.5, recommendedSpeed: 680, description: 'Threading narrow rocky gorges through dense mineral deposits.' },
    { index: 3, name: 'SECTOR 3: SOLAR CORONA', subtitle: 'STAGE 3: THERMAL FLARE', startT: 0.32, endT: 0.48, environment: 'SOLAR_CORONA', hazardDensity: 0.65, recommendedSpeed: 720, description: 'Extreme heat corridor flanking solar prominences and flares.' },
    { index: 4, name: 'SECTOR 4: PLANETARY RING', subtitle: 'STAGE 4: ORBITAL ARC', startT: 0.48, endT: 0.64, environment: 'PLANETARY_RING', hazardDensity: 0.55, recommendedSpeed: 810, description: 'Banked curve across the shimmering ice particles of the orbital ring.' },
    { index: 5, name: 'SECTOR 5: WORMHOLE RIFT', subtitle: 'STAGE 5: SUBSPACE CHUTE', startT: 0.64, endT: 0.78, environment: 'WORMHOLE', hazardDensity: 0.7, recommendedSpeed: 890, description: 'Distorted spacetime conduit bending ship velocity vectors.' },
    { index: 6, name: 'SECTOR 6: HYPERSPACE SPRINT', subtitle: 'STAGE 6: TACHYON OVERDRIVE', startT: 0.78, endT: 0.88, environment: 'HYPERSPACE_VOID', hazardDensity: 0.6, recommendedSpeed: 1040, description: 'Superluminal long straightway leading to the championship arena.' },
    { index: 7, name: 'SECTOR 7: STADIUM FINALE', subtitle: 'STAGE 7: GRAND PODIUM', startT: 0.88, endT: 1.0, environment: 'CHAMPIONSHIP_STADIUM', hazardDensity: 0.75, recommendedSpeed: 950, description: 'Pyrotechnic finish corridor before 500,000 spectators.' },
  ],
  branches: [],
  cinematicTriggers: [
    {
      id: 'championship_finale_reveal',
      title: 'CHAMPIONSHIP PANORAMA',
      subtitle: 'PLANET, RINGS & FLEET ASSEMBLED',
      triggerT: 0.86,
      durationSec: 3.2,
      shotType: 'SHOT_10_FINALE_CAMERA',
      fovDelta: 22,
      timeScale: 0.95,
      cameraOffset: [-32, 22, 35],
      lookAtOffset: [0, 0, -35],
    },
  ],
  environmentZones: [
    { environment: 'NEON_CITY', startT: 0.0, endT: 0.16, fogColor: 0x001528, fogDensity: 0.0004, ambientColor: 0x00e5ff, sunColor: 0x00f0ff, skyboxTheme: 'NEON', particleSpeedMultiplier: 1.3 },
    { environment: 'ASTEROID_FIELD', startT: 0.16, endT: 0.32, fogColor: 0x1f1408, fogDensity: 0.0005, ambientColor: 0xffaa00, sunColor: 0xff8800, skyboxTheme: 'ASTEROID', particleSpeedMultiplier: 1.4 },
    { environment: 'SOLAR_CORONA', startT: 0.32, endT: 0.48, fogColor: 0x2d1200, fogDensity: 0.0006, ambientColor: 0xff6600, sunColor: 0xffaa00, skyboxTheme: 'SOLAR', particleSpeedMultiplier: 1.8 },
    { environment: 'PLANETARY_RING', startT: 0.48, endT: 0.64, fogColor: 0x011b24, fogDensity: 0.0004, ambientColor: 0x06b6d4, sunColor: 0x22d3ee, skyboxTheme: 'PLANETARY', particleSpeedMultiplier: 1.4 },
    { environment: 'WORMHOLE', startT: 0.64, endT: 0.78, fogColor: 0x050522, fogDensity: 0.0005, ambientColor: 0x3b82f6, sunColor: 0x60a5fa, skyboxTheme: 'WORMHOLE', particleSpeedMultiplier: 2.2 },
    { environment: 'HYPERSPACE_VOID', startT: 0.78, endT: 0.88, fogColor: 0x07011d, fogDensity: 0.0004, ambientColor: 0x8b5cf6, sunColor: 0xa78bfa, skyboxTheme: 'QUANTUM', particleSpeedMultiplier: 2.6 },
    { environment: 'CHAMPIONSHIP_STADIUM', startT: 0.88, endT: 1.0, fogColor: 0x180b26, fogDensity: 0.0004, ambientColor: 0xeab308, sunColor: 0xfacc15, skyboxTheme: 'NEON', particleSpeedMultiplier: 1.5 },
  ],
  hazards: [
    { id: 'h_championship_pyro', name: 'CELEBRATORY PYROTECHNIC VOLLEYS', startT: 0.88, endT: 1.0, hazardType: 'DRONE_MINES', intensity: 0.4, warningText: 'PODIUM PYROTECHNIC SALVOS OVERHEAD', color: '#eab308' },
  ],
  finalClimax: {
    startT: 0.86,
    climaxTitle: 'VOID CHAMPIONSHIP FINALE: PODIUM SPRINT',
    hazardSurgeMultiplier: 1.5,
    cinematicShot: 'SHOT_10_FINALE_CAMERA',
    musicIntensity: 1.0,
  },
};
