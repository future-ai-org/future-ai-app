import { mod360, toRad, toDeg } from './math';

export function calcAscendant(LST: number, lat: number, eps: number): number {
  const e = toRad(eps);
  const p = toRad(lat);
  const R = toRad(LST); // RAMC in radians
  const y = -Math.cos(R);
  const x = Math.sin(R) * Math.cos(e) + Math.tan(p) * Math.sin(e);
  let asc = toDeg(Math.atan2(y, x));
  // Quadrant correction
  if (x < 0) asc += 180;
  return mod360(asc);
}

export function calcMC(LST: number, eps: number): number {
  const e = toRad(eps);
  const R = toRad(LST);
  let mc = toDeg(Math.atan2(Math.tan(R), Math.cos(e)));
  if (Math.cos(R) < 0) mc += 180;
  return mod360(mc);
}

/** Whole sign: each house is one 30° sign; house 1 is the zodiac sign containing ASC (cusp at 0° of that sign). */
export function wholeSignHouses(ASC: number): number[] {
  const ascNorm = mod360(ASC);
  const ascSignStart = Math.floor(ascNorm / 30) * 30;
  const cusps = new Array(12);
  for (let i = 0; i < 12; i++) {
    cusps[i] = mod360(ascSignStart + i * 30);
  }
  return cusps;
}

export function planetHouse(lon: number, cusps: number[]): number {
  for (let h = 0; h < 12; h++) {
    const start = cusps[h];
    const end = cusps[(h + 1) % 12];
    const diff = mod360(end - start);
    const dist = mod360(lon - start);
    if (dist < diff) return h + 1;
  }
  return 1;
}
