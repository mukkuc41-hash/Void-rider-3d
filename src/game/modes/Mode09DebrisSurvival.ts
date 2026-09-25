import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode09DebrisSurvival = {
  id: 'DEBRIS_SURVIVAL' as const,
  config: GAME_MODE_CONFIGS.DEBRIS_SURVIVAL,
  modeSettings: ALL_MODES_CONFIG.DEBRIS_SURVIVAL,
  getPathConfig: () => getExtendedPathConfig('DEBRIS_SURVIVAL'),
};
