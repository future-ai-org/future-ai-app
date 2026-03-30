import type { ChartResult, PlanetPosition } from './types';
import { reapplyWholeSignHouses } from './calculate';
import { planetHouse } from './houses';
import { formatLon } from './format';
import { PLANET_GLYPHS } from './constants';

/** Planet from chart A placed in chart B's house system. */
export interface PlanetInHouse {
  planet: PlanetPosition;
  house: number;
  inSign: string;
  glyph: string;
}

/** Compatibility: A's planets in B's houses, and B's planets in A's houses. */
export interface CompatibilityResult {
  chartALabel: string;
  chartBLabel: string;
  /** Chart A's planets in Chart B's houses */
  aInB: PlanetInHouse[];
  /** Chart B's planets in Chart A's houses */
  bInA: PlanetInHouse[];
}

function planetInHouseList(
  planets: PlanetPosition[],
  cusps: number[],
): PlanetInHouse[] {
  return planets.map(p => {
    const house = planetHouse(p.longitude, cusps);
    const formatted = formatLon(p.longitude);
    return {
      planet: p,
      house,
      inSign: formatted.sign,
      glyph: formatted.glyph,
    };
  });
}

export function computeCompatibility(
  chartA: ChartResult,
  chartB: ChartResult,
  labelA: string,
  labelB: string,
): CompatibilityResult {
  const a = reapplyWholeSignHouses(chartA);
  const b = reapplyWholeSignHouses(chartB);
  return {
    chartALabel: labelA,
    chartBLabel: labelB,
    aInB: planetInHouseList(a.planets, b.cusps),
    bInA: planetInHouseList(b.planets, a.cusps),
  };
}

export function planetGlyph(name: string): string {
  return PLANET_GLYPHS[name] ?? name.slice(0, 1);
}
