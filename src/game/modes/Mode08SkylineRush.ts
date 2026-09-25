import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode08SkylineRush = {
  id: 'SKYLINE_RUSH' as const,
  config: GAME_MODE_CONFIGS.SKYLINE_RUSH,
  modeSettings: ALL_MODES_CONFIG.SKYLINE_RUSH,
  getPathConfig: () => getExtendedPathConfig('SKYLINE_RUSH'),
};
