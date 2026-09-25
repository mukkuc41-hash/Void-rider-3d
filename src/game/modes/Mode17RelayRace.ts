import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode17RelayRace = {
  id: 'RELAY_RACE' as const,
  config: GAME_MODE_CONFIGS.RELAY_RACE,
  modeSettings: ALL_MODES_CONFIG.RELAY_RACE,
  getPathConfig: () => getExtendedPathConfig('RELAY_RACE'),
};
