import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode16RivalDuel = {
  id: 'RIVAL_DUEL' as const,
  config: GAME_MODE_CONFIGS.RIVAL_DUEL,
  modeSettings: ALL_MODES_CONFIG.RIVAL_DUEL,
  getPathConfig: () => getExtendedPathConfig('RIVAL_DUEL'),
};
