import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode11EnergyHeist = {
  id: 'ENERGY_HEIST' as const,
  config: GAME_MODE_CONFIGS.ENERGY_HEIST,
  modeSettings: ALL_MODES_CONFIG.ENERGY_HEIST,
  getPathConfig: () => getExtendedPathConfig('ENERGY_HEIST'),
};
