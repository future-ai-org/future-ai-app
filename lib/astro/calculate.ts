import type { BirthData, ChartResult, PlanetPosition, PlanetName, ChartOptions } from './types';
import { julianDay, obliquity, localSiderealTime } from './math';
import {
  sunPosition, moonPosition, mercuryPosition, venusPosition,
  marsPosition, jupiterPosition, saturnPosition, uranusPosition,
  neptunePosition, plutoPosition, isRetrograde,
} from './planets';
import { calcAscendant, calcMC, wholeSignHouses, planetHouse } from './houses';
import { computePoints } from './points';
import { validateBirthDate } from './validate';

export function calculateChart(
  data: BirthData,
  options: ChartOptions = {},
  overrides?: {
    /**
     * When provided, forces ASC to this ecliptic longitude (degrees).
     * Useful when user selected an ascendant but birth time/city are unknown.
     */
    ascendant?: number;
    /**
     * When true, the UI should show a disclaimer that ASC is an assumed value
     * (e.g. "selected sign at 15°").
     */
    ascendantAngleUnknown?: boolean;
  },
): ChartResult {
  const validated = validateBirthDate(data.date);
  if (!validated.valid) {
    throw new Error('Birth date year must be between -2000 and 2100');
  }
  const match = data.date.trim().match(/^([+-]?\d+)-(\d{2})-(\d{2})$/);
  // `validateBirthDate()` already checked the format and ranges.
  if (!match) throw new Error('Birth date format is invalid');

  const yr = Number(match[1]);
  const mo = Number(match[2]);
  const dy = Number(match[3]);
  const [hr, mn] = data.time.split(':').map(Number);
  const utHour = hr + mn / 60 - data.utcOffset;
  const JD = julianDay(yr, mo, dy, utHour);
  const T = (JD - 2451545.0) / 36525;
  const eps = obliquity(JD);
  const LST = localSiderealTime(JD, data.longitude);
  const ASC = Number.isFinite(overrides?.ascendant) ? (overrides!.ascendant as number) : calcAscendant(LST, data.latitude, eps);
  const MC = calcMC(LST, eps);
  const cusps = wholeSignHouses(ASC);

  const planetDefs: [PlanetName, (T: number) => number][] = [
    ['Sun', sunPosition],
    ['Moon', moonPosition],
    ['Mercury', mercuryPosition],
    ['Venus', venusPosition],
    ['Mars', marsPosition],
    ['Jupiter', jupiterPosition],
    ['Saturn', saturnPosition],
    ['Uranus', uranusPosition],
    ['Neptune', neptunePosition],
    ['Pluto', plutoPosition],
  ];

  const planets: PlanetPosition[] = planetDefs.map(([name, fn]) => ({
    name,
    longitude: fn(T),
    retrograde: name !== 'Sun' && name !== 'Moon' ? isRetrograde(fn, T) : false,
    house: 0,
  }));

  planets.forEach(p => { p.house = planetHouse(p.longitude, cusps); });

  const sunLon = sunPosition(T);
  const moonLon = moonPosition(T);
  const venusLon = venusPosition(T);
  const jupiterLon = jupiterPosition(T);
  const points = computePoints(
    { T, asc: ASC, cusps, sunLon, moonLon, venusLon, jupiterLon },
    options,
  );

  return {
    asc: ASC,
    mc: MC,
    obliquity: eps,
    cusps,
    planets,
    points,
    birthData: data,
    calculation: overrides?.ascendantAngleUnknown ? { ascendantAngleUnknown: overrides.ascendantAngleUnknown } : undefined,
  };
}
