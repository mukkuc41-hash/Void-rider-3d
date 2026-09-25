import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode13CollapsingTrack = {
  id: 'COLLAPSING_TRACK' as const,
  config: GAME_MODE_CONFIGS.COLLAPSING_TRACK,
  modeSettings: ALL_MODES_CONFIG.COLLAPSING_TRACK,
  getPathConfig: () => getExtendedPathConfig('COLLAPSING_TRACK'),
};
