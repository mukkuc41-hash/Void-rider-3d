import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode20VoidChampionship = {
  id: 'VOID_CHAMPIONSHIP' as const,
  config: GAME_MODE_CONFIGS.VOID_CHAMPIONSHIP,
  modeSettings: ALL_MODES_CONFIG.VOID_CHAMPIONSHIP,
  getPathConfig: () => getExtendedPathConfig('VOID_CHAMPIONSHIP'),
};
