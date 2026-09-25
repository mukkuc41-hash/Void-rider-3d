import * as THREE from 'three';
import { PathNode } from '../extendedPath/extendedPathTypes';

export class PathGenerator {
  public static buildSplineCurve(
    controlPoints: [number, number, number][],
    closed: boolean = true,
    tension: number = 0.5
  ): THREE.CatmullRomCurve3 {
    const vPoints = controlPoints.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vPoints, closed, 'centripetal', tension);
  }

  public static samplePathNodes(
    curve: THREE.CatmullRomCurve3,
    sampleCount: number = 72,
    baseWidth: number = 24
  ): PathNode[] {
    const nodes: PathNode[] = [];
    const step = 1.0 / sampleCount;

    for (let i = 0; i < sampleCount; i++) {
      const t = i * step;
      const position = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      // Compute Frenet frame or stable normal
      const up = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      if (binormal.lengthSq() < 0.001) {
        binormal.set(1, 0, 0);
      }
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      // Estimate curvature from consecutive tangents
      const nextT = ((i + 1) % sampleCount) * step;
      const nextTan = curve.getTangentAt(nextT).normalize();
      const curvature = 1.0 - Math.max(0, tangent.dot(nextTan));

      nodes.push({
        index: i,
        position,
        tangent,
        normal,
        binormal,
        width: baseWidth * (1.0 - curvature * 0.25),
        elevation: position.y,
        curvature,
        t,
        segmentId: `seg_${Math.floor(t * 18)}`,
      });
    }

    return nodes;
  }
}
