import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode15HyperspaceSprint = {
  id: 'HYPERSPACE_SPRINT' as const,
  config: GAME_MODE_CONFIGS.HYPERSPACE_SPRINT,
  modeSettings: ALL_MODES_CONFIG.HYPERSPACE_SPRINT,
  getPathConfig: () => getExtendedPathConfig('HYPERSPACE_SPRINT'),
};
