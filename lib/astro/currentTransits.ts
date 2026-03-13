import { julianDay } from './math';
import { signOf, degInSign } from './format';
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
  isRetrograde,
} from './planets';
import { SIGNS } from './constants';
import type { PlanetName } from './types';

const PLANET_POSITIONS: [PlanetName, (T: number) => number][] = [
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

export interface CurrentTransit {
  planet: PlanetName;
  sign: string;
  degree: number;
  retrograde: boolean;
}

/**
 * Returns current ecliptic longitude sign, degree in sign, and retrograde for each planet at the given date (UTC).
 */
export function getCurrentTransits(date: Date): CurrentTransit[] {
  const utHour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const JD = julianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    utHour,
  );
  const T = (JD - 2451545.0) / 36525;

  return PLANET_POSITIONS.map(([planet, fn]) => {
    const longitude = fn(T);
    const signIndex = signOf(longitude);
    const degree = Math.floor(degInSign(longitude));
    const retrograde = planet !== 'Sun' && planet !== 'Moon' ? isRetrograde(fn, T) : false;
    return { planet, sign: SIGNS[signIndex], degree, retrograde };
  });
}
