import type { PlanetName } from './types';
import { julianDay, mod360 } from './math';
import {
  sunPosition,
  moonPosition,
  mercuryPosition,
  venusPosition,
  marsPosition,
  jupiterPosition,
  saturnPosition,
  uranusPosition,
  neptunePosition,
  plutoPosition,
} from './planets';

const PLANET_NAMES: PlanetName[] = [
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

const POSITION_FNS: [(T: number) => number, PlanetName][] = [
  [sunPosition, 'Sun'],
  [moonPosition, 'Moon'],
  [mercuryPosition, 'Mercury'],
  [venusPosition, 'Venus'],
  [marsPosition, 'Mars'],
  [jupiterPosition, 'Jupiter'],
  [saturnPosition, 'Saturn'],
  [uranusPosition, 'Uranus'],
  [neptunePosition, 'Neptune'],
  [plutoPosition, 'Pluto'],
];

/** Julian centuries since J2000 from a Date at noon UTC */
function TFromDate(d: Date): number {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const JD = julianDay(y, m, day, 12);
  return (JD - 2451545.0) / 36525;
}

/** Longitude difference (0–180°) for conjunction check */
function longitudeSeparation(lon1: number, lon2: number): number {
  let diff = Math.abs(mod360(lon1 - lon2));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export interface ConjunctionEvent {
  date: Date;
  planet1: PlanetName;
  planet2: PlanetName;
  separationDeg: number;
  /** Ecliptic longitudes at noon UTC (for tooltip). */
  lon1: number;
  lon2: number;
}

const DEFAULT_ORB_DEG = 10;

/**
 * Find days in [start, end] where two planets are within orbDeg of each other (conjunction).
 * Uses noon UTC per day. Returns one event per day when that pair is within orb (closest day in a run).
 */
export function findConjunctionsInRange(
  startDate: Date,
  endDate: Date,
  orbDeg: number = DEFAULT_ORB_DEG
): ConjunctionEvent[] {
  const events: ConjunctionEvent[] = [];
  const start = new Date(startDate);
  start.setUTCHours(12, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(12, 0, 0, 0);

  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    const T = TFromDate(d);
    const longitudes = new Map<PlanetName, number>();
    for (const [fn, name] of POSITION_FNS) {
      longitudes.set(name, fn(T));
    }

    for (let i = 0; i < PLANET_NAMES.length; i++) {
      for (let j = i + 1; j < PLANET_NAMES.length; j++) {
        const p1 = PLANET_NAMES[i];
        const p2 = PLANET_NAMES[j];
        const lon1 = longitudes.get(p1)!;
        const lon2 = longitudes.get(p2)!;
        const sep = longitudeSeparation(lon1, lon2);
        if (sep <= orbDeg) {
          events.push({
            date: new Date(d),
            planet1: p1,
            planet2: p2,
            separationDeg: Math.round(sep * 10) / 10,
            lon1: Math.round(lon1 * 10) / 10,
            lon2: Math.round(lon2 * 10) / 10,
          });
        }
      }
    }
  }

  return events;
}
