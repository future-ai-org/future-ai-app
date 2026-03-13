import { mod360 } from './math';
import { planetXYZ, geoLon, isRetrograde } from './planets';
import type { ChartOptions, PointPosition } from './types';
import { planetHouse } from './houses';

// T = Julian centuries from J2000.0
// JD = 2451545 + T * 36525

/** Mean longitude of the Moon's ascending (North) node in degrees. Retrograde. */
export function northNodePosition(T: number): number {
  const omega = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T;
  return mod360(omega);
}

export function southNodePosition(T: number): number {
  return mod360(northNodePosition(T) + 180);
}

/** Mean Black Moon Lilith = mean longitude of lunar apogee. From Moon elements (L′−M′)+180°. */
export function lilithPosition(T: number): number {
  const meanPerigee = 83.3531 + 4068.4267 * T;
  const meanApogee = meanPerigee + 180;
  return mod360(meanApogee);
}

// Mean motion in deg/day from semi-major axis a in AU: n = 0.9856076686 / sqrt(a^3)
function meanMotion(aAU: number): number {
  return 0.9856076686 / Math.sqrt(aAU * aAU * aAU);
}

// d = days from Schlyter epoch (JD 2451543.5), same as planets.ts
const daysFromEpoch = (T: number) => T * 36525 + 1.5;

// Asteroids: Kepler orbit in ecliptic + our Earth (ecliptic); same d so same time and frame as main planets.
function asteroidLon(
  d: number,
  N: number, i: number, w: number, a: number, e: number, M0: number,
): number {
  const n = meanMotion(a);
  const { xh, yh } = planetXYZ(d, N, 0, i, 0, w, 0, a, 0, e, 0, M0, n);
  return geoLon(xh, yh, d);
}

// (3) Juno – JPL SB elem (MJD 55400): N,i,w,a,e; M at J2000 from M_55400 − n×(JD_55400−JD_J2000)
export function junoPosition(T: number): number {
  const d = daysFromEpoch(T);
  const a = 2.6700912, e = 0.25498122;
  const n = meanMotion(a);
  const days55400ToJ2000 = 2455400.5 - 2451545; // ≈ 3855.5
  const M_at_J2000 = mod360(32.0960832 - n * days55400ToJ2000);
  const M0 = mod360(M_at_J2000 - n * 1.5);
  return asteroidLon(d, 169.91138, 12.98211, 248.10807, a, e, M0);
}

// (2060) Chiron – JPL elements at JD 2459396.5 (2021); M at J2000 = M_epoch − n×(JD_epoch−JD_J2000)
export function chironPosition(T: number): number {
  const d = daysFromEpoch(T);
  const a = 13.70, e = 0.3772;
  const n = meanMotion(a);
  const daysEpochToJ2000 = 2459396.5 - 2451545;
  const M_at_J2000 = mod360(180.70 - n * daysEpochToJ2000);
  const M0 = mod360(M_at_J2000 - n * 1.5);
  return asteroidLon(d, 209.27, 6.9299, 339.71, a, e, M0);
}

/** Day birth = Sun above horizon (in whole sign: Sun in 7th–12th house from ASC). */
export function isDayBirth(sunLon: number, asc: number): boolean {
  const diff = mod360(sunLon - asc);
  return diff >= 180; // Sun in upper hemisphere (DSC to ASC)
}

/** Lot of Fortune: day = ASC + Moon - Sun, night = ASC + Sun - Moon. */
export function lotOfFortune(asc: number, sunLon: number, moonLon: number): number {
  return mod360(
    isDayBirth(sunLon, asc)
      ? asc + moonLon - sunLon
      : asc + sunLon - moonLon,
  );
}

/** Lot of Spirit: day = ASC + Sun - Moon, night = ASC + Moon - Sun. */
export function lotOfSpirit(asc: number, sunLon: number, moonLon: number): number {
  return mod360(
    isDayBirth(sunLon, asc)
      ? asc + sunLon - moonLon
      : asc + moonLon - sunLon,
  );
}

/** Lot of Eros: day = ASC + Venus - Spirit, night = ASC + Spirit - Venus. */
export function lotOfErosWithDayNight(
  asc: number, spiritLon: number, venusLon: number, isDay: boolean,
): number {
  return mod360(
    isDay ? asc + venusLon - spiritLon : asc + spiritLon - venusLon,
  );
}

/** Lot of Victory: day = ASC + Jupiter - Spirit, night = ASC + Spirit - Jupiter. */
export function lotOfVictoryWithDayNight(
  asc: number, spiritLon: number, jupiterLon: number, isDay: boolean,
): number {
  return mod360(
    isDay ? asc + jupiterLon - spiritLon : asc + spiritLon - jupiterLon,
  );
}

export interface PointsInput {
  T: number;
  asc: number;
  cusps: number[];
  sunLon: number;
  moonLon: number;
  venusLon: number;
  jupiterLon: number;
}

export function computePoints(
  input: PointsInput,
  options: ChartOptions,
): PointPosition[] {
  const { T, asc, cusps, sunLon, moonLon, venusLon, jupiterLon } = input;
  const isDay = isDayBirth(sunLon, asc);
  const points: PointPosition[] = [];

  const spiritLon = lotOfSpirit(asc, sunLon, moonLon);

  if (options.northNode === true) {
    const lon = northNodePosition(T);
    points.push({
      name: 'North Node',
      longitude: lon,
      house: planetHouse(lon, cusps),
      retrograde: true,
    });
  }
  if (options.southNode === true) {
    const lon = southNodePosition(T);
    points.push({
      name: 'South Node',
      longitude: lon,
      house: planetHouse(lon, cusps),
      retrograde: true,
    });
  }
  if (options.lilith === true) {
    const lon = lilithPosition(T);
    points.push({
      name: 'Lilith',
      longitude: lon,
      house: planetHouse(lon, cusps),
      retrograde: true,
    });
  }
  if (options.juno === true) {
    const lon = junoPosition(T);
    points.push({
      name: 'Juno',
      longitude: lon,
      house: planetHouse(lon, cusps),
      retrograde: isRetrograde(junoPosition, T),
    });
  }
  if (options.chiron === true) {
    const lon = chironPosition(T);
    points.push({
      name: 'Chiron',
      longitude: lon,
      house: planetHouse(lon, cusps),
      retrograde: isRetrograde(chironPosition, T),
    });
  }
  if (options.lotOfFortune === true) {
    const lon = lotOfFortune(asc, sunLon, moonLon);
    points.push({
      name: 'Lot of Fortune',
      longitude: lon,
      house: planetHouse(lon, cusps),
    });
  }
  if (options.lotOfSpirit === true) {
    const lon = spiritLon;
    points.push({
      name: 'Lot of Spirit',
      longitude: lon,
      house: planetHouse(lon, cusps),
    });
  }
  if (options.lotOfEros === true) {
    const lon = lotOfErosWithDayNight(asc, spiritLon, venusLon, isDay);
    points.push({
      name: 'Lot of Eros',
      longitude: lon,
      house: planetHouse(lon, cusps),
    });
  }
  if (options.lotOfVictory === true) {
    const lon = lotOfVictoryWithDayNight(asc, spiritLon, jupiterLon, isDay);
    points.push({
      name: 'Lot of Victory',
      longitude: lon,
      house: planetHouse(lon, cusps),
    });
  }

  return points;
}
