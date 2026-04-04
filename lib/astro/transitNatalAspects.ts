import {
  getAspect,
  INFLUENCE_PLOT_SELECTABLE_ASPECTS,
  type AspectKind,
  longitudeSeparation,
  orbFromExactSeparation,
} from './aspects';
import { reapplyWholeSignHouses } from './calculate';
import type { ChartResult, PlanetName } from './types';

const PLANET_ORDER: PlanetName[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
];

/** Table sort: conjunction first, then opposition, trine, square, sextile. */
const ASPECT_ORDER: AspectKind[] = [
  'conjunction',
  'opposition',
  'trine',
  'square',
  'sextile',
];

function isWithinTransitNatalOrb(kind: AspectKind, orbFromExact: number): boolean {
  if (kind === 'conjunction' || kind === 'opposition') return orbFromExact < 5;
  if (kind === 'trine' || kind === 'square' || kind === 'sextile') return orbFromExact <= 3;
  return false;
}

function planetIndex(name: PlanetName): number {
  return PLANET_ORDER.indexOf(name);
}

export interface TransitNatalAspectAtMoment {
  aspectId: AspectKind;
  transitPlanet: PlanetName;
  natalPlanet: PlanetName;
  /** Ecliptic longitude of the transiting body (tropical). */
  transitLongitude: number;
  /** Ecliptic longitude of the natal body (tropical). */
  natalLongitude: number;
  /** Whole-sign house of the natal body (1–12). */
  natalHouse: number;
  separationDeg: number;
  orbFromExactDeg: number;
}

function lonByPlanet(result: ChartResult): Map<PlanetName, number> {
  const m = new Map<PlanetName, number>();
  for (const p of result.planets) {
    m.set(p.name, p.longitude);
  }
  return m;
}

function houseByPlanet(result: ChartResult): Map<PlanetName, number> {
  const m = new Map<PlanetName, number>();
  for (const p of result.planets) {
    m.set(p.name, p.house);
  }
  return m;
}

/**
 * Every (transit planet × natal planet) pair whose separation matches a major aspect
 * (conjunction, opposition, square, trine, sextile) within tight orbs:
 * conjunction and opposition: orb from exact under 5°; trine, square, sextile: at most 3°.
 * When a pair could match multiple angles, the tightest orb wins among allowed aspects.
 */
export function computeTransitNatalAspectsAtMoment(
  natal: ChartResult,
  transit: ChartResult
): TransitNatalAspectAtMoment[] {
  const natalFixed = reapplyWholeSignHouses(natal);
  const natalLon = lonByPlanet(natalFixed);
  const natalHouseMap = houseByPlanet(natalFixed);
  const transitLon = lonByPlanet(transit);
  const out: TransitNatalAspectAtMoment[] = [];

  for (const tName of PLANET_ORDER) {
    const lt = transitLon.get(tName);
    if (lt === undefined) continue;
    for (const nName of PLANET_ORDER) {
      const ln = natalLon.get(nName);
      const nHouse = natalHouseMap.get(nName);
      if (ln === undefined || nHouse === undefined) continue;
      const sep = longitudeSeparation(lt, ln);
      let best: { kind: AspectKind; orbEx: number } | null = null;
      for (const kind of INFLUENCE_PLOT_SELECTABLE_ASPECTS) {
        const def = getAspect(kind);
        const orbEx = orbFromExactSeparation(sep, def.angleDeg);
        if (!isWithinTransitNatalOrb(kind, orbEx)) continue;
        if (!best || orbEx < best.orbEx) best = { kind, orbEx };
      }
      if (best) {
        out.push({
          aspectId: best.kind,
          transitPlanet: tName,
          natalPlanet: nName,
          transitLongitude: lt,
          natalLongitude: ln,
          natalHouse: nHouse,
          separationDeg: Math.round(sep * 10) / 10,
          orbFromExactDeg: Math.round(best.orbEx * 10) / 10,
        });
      }
    }
  }

  const aspectRank = (k: AspectKind) => ASPECT_ORDER.indexOf(k);
  out.sort((a, b) => {
    const ar = aspectRank(a.aspectId) - aspectRank(b.aspectId);
    if (ar !== 0) return ar;
    const tr = planetIndex(a.transitPlanet) - planetIndex(b.transitPlanet);
    if (tr !== 0) return tr;
    return planetIndex(a.natalPlanet) - planetIndex(b.natalPlanet);
  });
  return out;
}
