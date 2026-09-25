import * as THREE from 'three';
export type { PathNode } from '../extendedPath/extendedPathTypes';

export function createPathNode(
  index: number,
  position: THREE.Vector3,
  tangent: THREE.Vector3,
  normal: THREE.Vector3,
  binormal: THREE.Vector3,
  width: number,
  elevation: number,
  curvature: number,
  t: number,
  segmentId: string
) {
  return {
    index,
    position,
    tangent,
    normal,
    binormal,
    width,
    elevation,
    curvature,
    t,
    segmentId,
  };
}
