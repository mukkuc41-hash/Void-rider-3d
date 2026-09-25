import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode10QuantumTimeTrial = {
  id: 'QUANTUM_TIME_TRIAL' as const,
  config: GAME_MODE_CONFIGS.QUANTUM_TIME_TRIAL,
  modeSettings: ALL_MODES_CONFIG.QUANTUM_TIME_TRIAL,
  getPathConfig: () => getExtendedPathConfig('QUANTUM_TIME_TRIAL'),
};
