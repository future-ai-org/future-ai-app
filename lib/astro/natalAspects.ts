import { getAspect, longitudeSeparation, orbFromExactSeparation } from './aspects';
import { mod360 } from './math';
import type { ChartResult } from './types';

/** Ptolemaic major aspects listed on the dashboard natal aspects panel. */
export const NATAL_MAJOR_ASPECT_KINDS = [
  'conjunction',
  'opposition',
  'square',
  'trine',
] as const;

export type NatalMajorAspectKind = (typeof NATAL_MAJOR_ASPECT_KINDS)[number];

export interface NatalMajorAspect {
  aspectId: NatalMajorAspectKind;
  bodyA: string;
  bodyB: string;
  separationDeg: number;
  orbFromExactDeg: number;
}

function collectBodies(result: ChartResult): { name: string; longitude: number }[] {
  const out: { name: string; longitude: number }[] = result.planets.map(p => ({
    name: p.name,
    longitude: mod360(p.longitude),
  }));
  if (result.points) {
    for (const p of result.points) {
      out.push({ name: p.name, longitude: mod360(p.longitude) });
    }
  }
  out.push(
    { name: 'ASC', longitude: mod360(result.asc) },
    { name: 'MC', longitude: mod360(result.mc) },
  );
  return out;
}

/**
 * Natal planet/point pairs in conjunction, opposition, square, or trine using each aspect’s default orb.
 * When a pair is within orb of more than one major angle, the tightest orb wins.
 */
export function findNatalMajorAspects(result: ChartResult): NatalMajorAspect[] {
  const bodies = collectBodies(result);
  const out: NatalMajorAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const sep = longitudeSeparation(a.longitude, b.longitude);
      let best: { kind: NatalMajorAspectKind; orbEx: number } | null = null;
      for (const kind of NATAL_MAJOR_ASPECT_KINDS) {
        const def = getAspect(kind);
        const orbEx = orbFromExactSeparation(sep, def.angleDeg);
        if (orbEx <= def.defaultOrbDeg) {
          if (!best || orbEx < best.orbEx) best = { kind, orbEx };
        }
      }
      if (best) {
        const [name1, name2] = [a.name, b.name].sort((x, y) => x.localeCompare(y));
        out.push({
          aspectId: best.kind,
          bodyA: name1,
          bodyB: name2,
          separationDeg: Math.round(sep * 10) / 10,
          orbFromExactDeg: Math.round(best.orbEx * 10) / 10,
        });
      }
    }
  }
  const order = (k: NatalMajorAspectKind) => NATAL_MAJOR_ASPECT_KINDS.indexOf(k);
  out.sort((x, y) => {
    const ao = order(x.aspectId) - order(y.aspectId);
    if (ao !== 0) return ao;
    const c1 = x.bodyA.localeCompare(y.bodyA);
    if (c1 !== 0) return c1;
    return x.bodyB.localeCompare(y.bodyB);
  });
  return out;
}

export function groupNatalMajorAspectsByKind(
  rows: NatalMajorAspect[],
): Record<NatalMajorAspectKind, NatalMajorAspect[]> {
  const init: Record<NatalMajorAspectKind, NatalMajorAspect[]> = {
    conjunction: [],
    opposition: [],
    square: [],
    trine: [],
  };
  for (const r of rows) {
    init[r.aspectId].push(r);
  }
  return init;
}
