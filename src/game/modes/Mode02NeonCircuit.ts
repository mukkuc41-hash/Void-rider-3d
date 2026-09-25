import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode02NeonCircuit = {
  id: 'NEON_CIRCUIT' as const,
  config: GAME_MODE_CONFIGS.NEON_CIRCUIT,
  modeSettings: ALL_MODES_CONFIG.NEON_CIRCUIT,
  getPathConfig: () => getExtendedPathConfig('NEON_CIRCUIT'),
};
