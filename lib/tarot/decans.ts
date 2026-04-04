import { mod360 } from '@/lib/astro/math';

/** Golden Dawn / Chaldean decan order: minor arcana 2–10 around the zodiac (Aries → … → Pisces). */
const BY_SIGN: [string, string, string][] = [
  ['2 Wands', '3 Wands', '4 Wands'],
  ['5 Pentacles', '6 Pentacles', '7 Pentacles'],
  ['8 Swords', '9 Swords', '10 Swords'],
  ['2 Cups', '3 Cups', '4 Cups'],
  ['5 Wands', '6 Wands', '7 Wands'],
  ['8 Pentacles', '9 Pentacles', '10 Pentacles'],
  ['2 Swords', '3 Swords', '4 Swords'],
  ['5 Cups', '6 Cups', '7 Cups'],
  ['8 Wands', '9 Wands', '10 Wands'],
  ['2 Pentacles', '3 Pentacles', '4 Pentacles'],
  ['5 Swords', '6 Swords', '7 Swords'],
  ['8 Cups', '9 Cups', '10 Cups'],
];

export interface TarotDecan {
  /** Index 0–35 around the ecliptic, each 10°. */
  index: number;
  /** Midpoint longitude (tropical), degrees [0, 360). */
  midpointLon: number;
  /** Full card name, e.g. "3 Wands". */
  name: string;
}

/** One decan per 10° of the ecliptic, in zodiac order. */
export const TAROT_DECANS: TarotDecan[] = (() => {
  const out: TarotDecan[] = [];
  let idx = 0;
  for (let s = 0; s < 12; s++) {
    for (let d = 0; d < 3; d++) {
      out.push({
        index: idx++,
        midpointLon: s * 30 + d * 10 + 5,
        name: BY_SIGN[s][d],
      });
    }
  }
  return out;
})();

export function shortTarotLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const rank = parts[0];
  const suit = parts[1];
  return `${rank}${suit[0] ?? '?'}`;
}

/** Same as `drawChartWheel`’s ecliptic → canvas angle (radians). 0° = right; π = left (ASC side). */
export function eclipticLongitudeToCanvasAngle(eclipticLon: number, ascDegrees: number): number {
  const ascNorm = mod360(ascDegrees);
  const wheelRef = Math.floor(ascNorm / 30) * 30;
  const lonNorm = mod360(eclipticLon);
  const diff = mod360(lonNorm - wheelRef + 360);
  const angle = Math.PI - (diff * Math.PI) / 180;
  return angle >= 0 ? angle : angle + 2 * Math.PI;
}

/** Matches `drawChartWheel` outer radius for a square canvas of side `size`. */
export function chartWheelOuterRadiusPx(size: number, chartPadding = 38): number {
  const available = size - 2 * chartPadding;
  return available / 2;
}
