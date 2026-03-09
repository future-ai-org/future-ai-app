import type { BirthData, ChartResult, PlanetPosition, PlanetName } from './types';
import { julianDay, obliquity, localSiderealTime } from './math';
import {
  sunPosition, moonPosition, mercuryPosition, venusPosition,
  marsPosition, jupiterPosition, saturnPosition, uranusPosition,
  neptunePosition, plutoPosition, isRetrograde,
} from './planets';
import { calcAscendant, calcMC, placidusHouses, planetHouse } from './houses';

export function calculateChart(data: BirthData): ChartResult {
  const [yr, mo, dy] = data.date.split('-').map(Number);
  const [hr, mn] = data.time.split(':').map(Number);
  const utHour = hr + mn / 60 - data.utcOffset;
  const JD = julianDay(yr, mo, dy, utHour);
  const T = (JD - 2451545.0) / 36525;
  const eps = obliquity(JD);
  const LST = localSiderealTime(JD, data.longitude);
  const ASC = calcAscendant(LST, data.latitude, eps);
  const MC = calcMC(LST, eps);
  const cusps = placidusHouses(ASC, MC, data.latitude, eps);

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

  return { asc: ASC, mc: MC, obliquity: eps, cusps, planets, birthData: data };
}
