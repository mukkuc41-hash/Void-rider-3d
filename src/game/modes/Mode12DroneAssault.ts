import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode12DroneAssault = {
  id: 'DRONE_ASSAULT' as const,
  config: GAME_MODE_CONFIGS.DRONE_ASSAULT,
  modeSettings: ALL_MODES_CONFIG.DRONE_ASSAULT,
  getPathConfig: () => getExtendedPathConfig('DRONE_ASSAULT'),
};
