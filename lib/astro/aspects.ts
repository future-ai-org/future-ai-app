import { mod360 } from './math';

/**
 * Major and minor aspects used for transit / sky-event detection and influence plots.
 * Add new kinds here, set angle + default orb, then include the id in feature-specific lists
 * (e.g. `INFLUENCE_PLOT_ASPECTS` for the home-page chart).
 */
export const ASPECT_KINDS = [
  'conjunction',
  'opposition',
  'trine',
  'square',
  'sextile',
  'quintile',
] as const;

export type AspectKind = (typeof ASPECT_KINDS)[number];

export interface AspectDefinition {
  id: AspectKind;
  /** Exact separation along the shorter ecliptic arc (0°–180°). */
  angleDeg: number;
  defaultOrbDeg: number;
  /** UI label, lowercase (sentence use). */
  label: string;
}

export const ASPECTS: Record<AspectKind, AspectDefinition> = {
  conjunction: { id: 'conjunction', angleDeg: 0, defaultOrbDeg: 10, label: 'conjunction' },
  opposition: { id: 'opposition', angleDeg: 180, defaultOrbDeg: 10, label: 'opposition' },
  trine: { id: 'trine', angleDeg: 120, defaultOrbDeg: 8, label: 'trine' },
  square: { id: 'square', angleDeg: 90, defaultOrbDeg: 8, label: 'square' },
  sextile: { id: 'sextile', angleDeg: 60, defaultOrbDeg: 6, label: 'sextile' },
  quintile: { id: 'quintile', angleDeg: 72, defaultOrbDeg: 3, label: 'quintile' },
};

/** Aspects drawn on the home-page influence plot (bands / Gaussians). */
export const INFLUENCE_PLOT_ASPECTS: AspectKind[] = ['conjunction', 'opposition'];

export function getAspect(kind: AspectKind): AspectDefinition {
  return ASPECTS[kind];
}

/** Shortest ecliptic arc between two longitudes, 0°–180°. */
export function longitudeSeparation(lon1: number, lon2: number): number {
  let diff = Math.abs(mod360(lon1 - lon2));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/** How far the actual separation is from the exact aspect angle (0 = perfect). */
export function orbFromExactSeparation(separationDeg: number, aspectAngleDeg: number): number {
  return Math.abs(separationDeg - aspectAngleDeg);
}

export function isWithinAspectOrb(
  lon1: number,
  lon2: number,
  aspect: AspectDefinition,
  orbDeg: number = aspect.defaultOrbDeg
): boolean {
  const sep = longitudeSeparation(lon1, lon2);
  return orbFromExactSeparation(sep, aspect.angleDeg) <= orbDeg;
}

/**
 * Ecliptic longitude for labeling an aspect (bisector of the shorter arc from lon1 to lon2).
 */
export function aspectDisplayLongitude(lon1: number, lon2: number): number {
  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return mod360(lon1 + diff / 2);
}

/** Stable row / series key: aspect + sorted planet names. */
export function aspectPairTrackKey(aspectId: AspectKind, planetA: string, planetB: string): string {
  const pair = [planetA, planetB].sort().join('–');
  return `${aspectId}:${pair}`;
}

export function parseAspectPairTrackKey(track: string): { aspectId: AspectKind; pair: string } | null {
  const idx = track.indexOf(':');
  if (idx <= 0) return null;
  const aspectId = track.slice(0, idx) as AspectKind;
  if (!(aspectId in ASPECTS)) return null;
  return { aspectId, pair: track.slice(idx + 1) };
}
