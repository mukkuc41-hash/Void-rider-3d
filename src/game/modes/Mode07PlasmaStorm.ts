import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode07PlasmaStorm = {
  id: 'PLASMA_STORM' as const,
  config: GAME_MODE_CONFIGS.PLASMA_STORM,
  modeSettings: ALL_MODES_CONFIG.PLASMA_STORM,
  getPathConfig: () => getExtendedPathConfig('PLASMA_STORM'),
};
