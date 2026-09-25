import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode05SolarStorm = {
  id: 'SOLAR_STORM' as const,
  config: GAME_MODE_CONFIGS.SOLAR_STORM,
  modeSettings: ALL_MODES_CONFIG.SOLAR_STORM,
  getPathConfig: () => getExtendedPathConfig('SOLAR_STORM'),
};
