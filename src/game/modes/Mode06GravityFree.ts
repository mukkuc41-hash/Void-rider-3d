import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode06GravityFree = {
  id: 'GRAVITY_FREE' as const,
  config: GAME_MODE_CONFIGS.GRAVITY_FREE,
  modeSettings: ALL_MODES_CONFIG.GRAVITY_FREE,
  getPathConfig: () => getExtendedPathConfig('GRAVITY_FREE'),
};
