import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode19CosmicTreasureHunt = {
  id: 'COSMIC_TREASURE_HUNT' as const,
  config: GAME_MODE_CONFIGS.COSMIC_TREASURE_HUNT,
  modeSettings: ALL_MODES_CONFIG.COSMIC_TREASURE_HUNT,
  getPathConfig: () => getExtendedPathConfig('COSMIC_TREASURE_HUNT'),
};
