import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode04WormholeExpress = {
  id: 'WORMHOLE_EXPRESS' as const,
  config: GAME_MODE_CONFIGS.WORMHOLE_EXPRESS,
  modeSettings: ALL_MODES_CONFIG.WORMHOLE_EXPRESS,
  getPathConfig: () => getExtendedPathConfig('WORMHOLE_EXPRESS'),
};
