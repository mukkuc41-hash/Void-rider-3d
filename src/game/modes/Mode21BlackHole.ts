import {
  BLACK_HOLE_MODE_ID,
  BLACK_HOLE_SUBMODES,
  BlackHoleSubmodeConfig,
  BlackHoleSubmodeId,
  FINAL_SINGULARITY_DURATION_SECONDS,
} from '../blackHoleSubmodes';

/**
 * MODE 21 — BLACK HOLE
 * Quantum Launch Pro
 *
 * Integration-ready mode descriptor. This file intentionally does not alter
 * the existing GameMode union or replace the current 20 modes. Those changes
 * are handled by the Mode 21 integration files that follow.
 */

export interface BlackHoleMode21Descriptor {
  id: typeof BLACK_HOLE_MODE_ID;
  number: 21;
  name: 'BLACK HOLE';
  subtitle: 'QUANTUM LAUNCH PRO';
  description: string;
  submodeCount: number;
  submodes: readonly BlackHoleSubmodeConfig[];
  finalSubmodeId: 'FINAL_COLLAPSE';
  finalCountdownSeconds: number;
}

export const Mode21BlackHole: BlackHoleMode21Descriptor = {
  id: BLACK_HOLE_MODE_ID,
  number: 21,
  name: 'BLACK HOLE',
  subtitle: 'QUANTUM LAUNCH PRO',
  description:
    'A ten-submode black-hole racing campaign featuring gravitational routes, dynamic track collapse, event-horizon hazards, tactical AI, emergency escapes, and a final seven-minute five-stage singularity survival sequence.',
  submodeCount: BLACK_HOLE_SUBMODES.length,
  submodes: BLACK_HOLE_SUBMODES,
  finalSubmodeId: 'FINAL_COLLAPSE',
  finalCountdownSeconds: 420,
};

export function getMode21BlackHoleSubmode(id: BlackHoleSubmodeId): BlackHoleSubmodeConfig {
  const submode = BLACK_HOLE_SUBMODES.find((entry) => entry.id === id);
  if (!submode) {
    throw new Error(`Unknown Mode 21 Black Hole submode: ${id}`);
  }
  return submode;
}

export function getMode21BlackHoleSubmodeList(): readonly BlackHoleSubmodeConfig[] {
  return Mode21BlackHole.submodes;
}

export function isMode21FinalCollapse(id: BlackHoleSubmodeId): boolean {
  return id === Mode21BlackHole.finalSubmodeId;
}
