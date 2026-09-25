import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode18SurvivalElimination = {
  id: 'SURVIVAL_ELIMINATION' as const,
  config: GAME_MODE_CONFIGS.SURVIVAL_ELIMINATION,
  modeSettings: ALL_MODES_CONFIG.SURVIVAL_ELIMINATION,
  getPathConfig: () => getExtendedPathConfig('SURVIVAL_ELIMINATION'),
};
