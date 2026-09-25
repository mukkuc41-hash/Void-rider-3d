import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode14RingRunner = {
  id: 'RING_RUNNER' as const,
  config: GAME_MODE_CONFIGS.RING_RUNNER,
  modeSettings: ALL_MODES_CONFIG.RING_RUNNER,
  getPathConfig: () => getExtendedPathConfig('RING_RUNNER'),
};
