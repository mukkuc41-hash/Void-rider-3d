import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode03AsteroidRun = {
  id: 'ASTEROID_RUN' as const,
  config: GAME_MODE_CONFIGS.ASTEROID_RUN,
  modeSettings: ALL_MODES_CONFIG.ASTEROID_RUN,
  getPathConfig: () => getExtendedPathConfig('ASTEROID_RUN'),
};
