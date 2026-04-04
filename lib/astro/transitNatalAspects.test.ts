import { describe, expect, it } from 'vitest';
import { computeTransitNatalAspectsAtMoment } from './transitNatalAspects';
import type { BirthData, ChartResult, PlanetPosition } from './types';

function minimalChart(
  planets: Partial<Record<string, number>>,
  overrides?: Partial<ChartResult>
): ChartResult {
  const names = [
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
  ] as const;
  const planetList: PlanetPosition[] = names.map((name) => ({
    name,
    longitude: planets[name] ?? 0,
    retrograde: false,
    house: 1,
  }));
  const birthData: BirthData = {
    date: '2000-01-01',
    time: '12:00',
    latitude: 0,
    longitude: 0,
    utcOffset: 0,
    cityLabel: 'test',
  };
  return {
    asc: 0,
    mc: 0,
    obliquity: 23.44,
    cusps: Array.from({ length: 12 }, (_, i) => i * 30),
    planets: planetList,
    birthData,
    ...overrides,
  };
}

describe('computeTransitNatalAspectsAtMoment', () => {
  it('reports conjunction when longitudes match', () => {
    const natal = minimalChart({ Sun: 100, Moon: 50 });
    const transit = minimalChart({ Sun: 100, Moon: 50 });
    const rows = computeTransitNatalAspectsAtMoment(natal, transit);
    const sunConj = rows.find(
      (r) => r.transitPlanet === 'Sun' && r.natalPlanet === 'Sun' && r.aspectId === 'conjunction'
    );
    expect(sunConj).toBeDefined();
    expect(sunConj?.orbFromExactDeg).toBe(0);
  });

  it('reports opposition near 180° separation', () => {
    const natal = minimalChart({ Mars: 0 });
    const transit = minimalChart({ Mars: 179 });
    const rows = computeTransitNatalAspectsAtMoment(natal, transit);
    const opp = rows.find(
      (r) => r.transitPlanet === 'Mars' && r.natalPlanet === 'Mars' && r.aspectId === 'opposition'
    );
    expect(opp).toBeDefined();
    expect(opp!.orbFromExactDeg).toBeLessThanOrEqual(1);
  });

  it('excludes opposition when orb from exact is 5° or more', () => {
    const natal = minimalChart({ Mars: 0 });
    const transit = minimalChart({ Mars: 175 });
    const rows = computeTransitNatalAspectsAtMoment(natal, transit);
    const opp = rows.find(
      (r) => r.transitPlanet === 'Mars' && r.natalPlanet === 'Mars' && r.aspectId === 'opposition'
    );
    expect(opp).toBeUndefined();
  });

  it('sorts conjunctions before other aspects', () => {
    const natal = minimalChart({ Sun: 10, Venus: 0 });
    const transit = minimalChart({ Sun: 10, Mercury: 100 });
    const rows = computeTransitNatalAspectsAtMoment(natal, transit);
    const firstAspect = rows[0]?.aspectId;
    expect(firstAspect).toBe('conjunction');
  });

  it('picks tighter aspect when two could apply', () => {
    const natal = minimalChart({ Venus: 0 });
    const transit = minimalChart({ Mercury: 89.5 });
    const rows = computeTransitNatalAspectsAtMoment(natal, transit);
    const pair = rows.filter((r) => r.transitPlanet === 'Mercury' && r.natalPlanet === 'Venus');
    expect(pair.length).toBe(1);
    expect(pair[0].aspectId).toBe('square');
  });
});
