import { GAME_MODE_CONFIGS } from '../modeConfig';
import { ALL_MODES_CONFIG } from '../modeConfigs';
import { getExtendedPathConfig } from '../extendedPath/modePathConfigs';

export const Mode01SingularityRun = {
  id: 'SINGULARITY_RUN' as const,
  config: GAME_MODE_CONFIGS.SINGULARITY_RUN,
  modeSettings: ALL_MODES_CONFIG.SINGULARITY_RUN,
  getPathConfig: () => getExtendedPathConfig('SINGULARITY_RUN'),
};

