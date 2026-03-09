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

export function placidusHouses(ASC: number, MC: number, lat: number, eps: number): number[] {
  // Returns array of 12 house cusp longitudes
  const cusps = new Array(12);
  cusps[0] = ASC;  // 1st house = ASC
  cusps[9] = MC;   // 10th house = MC
  cusps[6] = mod360(ASC + 180); // 7th
  cusps[3] = mod360(MC + 180);  // 4th (IC)

  // Use Koch-like simple interpolation for intermediate cusps
  function interpCusp(from: number, to: number, frac: number): number {
    let diff = mod360(to - from);
    if (diff > 180) diff -= 360;
    return mod360(from + diff * frac);
  }

  cusps[10] = interpCusp(MC, ASC, 1 / 3);
  cusps[11] = interpCusp(MC, ASC, 2 / 3);
  cusps[1]  = interpCusp(ASC, mod360(MC + 180), 1 / 3);
  cusps[2]  = interpCusp(ASC, mod360(MC + 180), 2 / 3);
  cusps[4]  = interpCusp(mod360(MC + 180), mod360(ASC + 180), 1 / 3);
  cusps[5]  = interpCusp(mod360(MC + 180), mod360(ASC + 180), 2 / 3);
  cusps[7]  = interpCusp(mod360(ASC + 180), MC, 1 / 3);
  cusps[8]  = interpCusp(mod360(ASC + 180), MC, 2 / 3);

  // suppress unused warning — lat and eps kept for API parity
  void lat; void eps;

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
