import { describe, it, expect } from 'vitest';
import { findNatalMajorAspects } from './natalAspects';
import type { BirthData, ChartResult } from './types';

function chartWithPlanets(
  planets: ChartResult['planets'],
  points?: ChartResult['points'],
): ChartResult {
  const birth: BirthData = {
    date: '1990-06-01',
    time: '12:00',
    latitude: 40,
    longitude: -74,
    utcOffset: -4,
    cityLabel: 'Test',
  };
  return {
    asc: 0,
    mc: 270,
    obliquity: 23.4,
    cusps: Array.from({ length: 12 }, (_, i) => (i * 30) % 360),
    planets,
    points,
    birthData: birth,
  };
}

describe('findNatalMajorAspects', () => {
  it('still includes ASC and MC when the planet list is empty', () => {
    const r = findNatalMajorAspects(chartWithPlanets([]));
    expect(r.some(x => x.aspectId === 'square' && x.bodyA === 'ASC' && x.bodyB === 'MC')).toBe(true);
  });

  it('finds a conjunction', () => {
    const r = findNatalMajorAspects(
      chartWithPlanets([
        { name: 'Sun', longitude: 10, retrograde: false, house: 1 },
        { name: 'Moon', longitude: 12, retrograde: false, house: 1 },
      ]),
    );
    expect(r.some(x => x.aspectId === 'conjunction' && x.bodyA === 'Moon' && x.bodyB === 'Sun')).toBe(
      true,
    );
  });

  it('finds an opposition', () => {
    const r = findNatalMajorAspects(
      chartWithPlanets([
        { name: 'Sun', longitude: 0, retrograde: false, house: 1 },
        { name: 'Mars', longitude: 180, retrograde: false, house: 7 },
      ]),
    );
    expect(r.some(x => x.aspectId === 'opposition' && x.bodyA === 'Mars' && x.bodyB === 'Sun')).toBe(
      true,
    );
  });

  it('includes optional points', () => {
    const r = findNatalMajorAspects(
      chartWithPlanets(
        [{ name: 'Sun', longitude: 0, retrograde: false, house: 1 }],
        [{ name: 'Chiron', longitude: 120, retrograde: false, house: 5 }],
      ),
    );
    expect(r.some(x => x.aspectId === 'trine' && x.bodyA === 'Chiron' && x.bodyB === 'Sun')).toBe(true);
  });
});
