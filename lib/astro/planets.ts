import { mod360, toRad, toDeg } from './math';

// ---- Schlyter orbital-elements engine ----

export function solveKepler(M_deg: number, e: number): number {
  const M = toRad(mod360(M_deg));
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 100; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E; // radians
}

// Returns heliocentric ecliptic (xh, yh) and mean anomaly M (degrees)
export function planetXYZ(
  d: number,
  N0: number, Ni: number,
  i0: number, ii: number,
  w0: number, wi: number,
  a0: number, ai: number,
  e0: number, ei: number,
  M0: number, Mi: number,
): { xh: number; yh: number; zh: number; M: number } {
  const N   = mod360(N0 + Ni * d);
  const inc = mod360(i0 + ii * d);
  const w   = mod360(w0 + wi * d);
  const a   = a0 + ai * d;
  const e   = e0 + ei * d;
  const M   = mod360(M0 + Mi * d);
  const E   = solveKepler(M, e);
  const xv  = a * (Math.cos(E) - e);
  const yv  = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const r   = Math.sqrt(xv * xv + yv * yv);
  const v   = toDeg(Math.atan2(yv, xv));
  const vw  = toRad(mod360(v + w));
  const Nr  = toRad(N);
  const ir  = toRad(inc);
  const xh  = r * (Math.cos(Nr) * Math.cos(vw) - Math.sin(Nr) * Math.sin(vw) * Math.cos(ir));
  const yh  = r * (Math.sin(Nr) * Math.cos(vw) + Math.cos(Nr) * Math.sin(vw) * Math.cos(ir));
  const zh  = r * Math.sin(vw) * Math.sin(ir);
  return { xh, yh, zh, M };
}

// Earth's heliocentric ecliptic position
export function earthXY(d: number): { x: number; y: number } {
  const w = mod360(282.9404 + 4.70935e-5 * d);
  const e = 0.016709 - 1.151e-9 * d;
  const M = mod360(356.0470 + 0.9856002585 * d);
  const E = solveKepler(M, e);
  const xv = Math.cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(E);
  const r  = Math.sqrt(xv * xv + yv * yv);
  const v  = toDeg(Math.atan2(yv, xv));
  const lon = toRad(mod360(v + w + 180)); // +180: Sun geocentric → Earth heliocentric
  return { x: r * Math.cos(lon), y: r * Math.sin(lon) };
}

// Convert heliocentric (xh,yh) to geocentric ecliptic longitude
export function geoLon(xh: number, yh: number, d: number): number {
  const e = earthXY(d);
  return mod360(toDeg(Math.atan2(yh - e.y, xh - e.x)));
}

// d from T: d = T*36525 + 1.5  (Schlyter epoch = J2000 Jan 0.0 = JD 2451543.5)

export function sunPosition(T: number): number {
  const L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = toRad(mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T));
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  return mod360(L0 + C);
}

export function moonPosition(T: number): number {
  const L1 = mod360(218.3165 + 481267.8813 * T);
  const M  = toRad(mod360(357.5291 + 35999.0503 * T));
  const Mp = toRad(mod360(134.9634 + 477198.8676 * T));
  const D  = toRad(mod360(297.8502 + 445267.1115 * T));
  const F  = toRad(mod360(93.2721 + 483202.0175 * T));
  const lon = L1
    + 6.2886 * Math.sin(Mp)
    + 1.2740 * Math.sin(2 * D - Mp)
    + 0.6583 * Math.sin(2 * D)
    + 0.2136 * Math.sin(2 * Mp)
    - 0.1851 * Math.sin(M)
    - 0.1143 * Math.sin(2 * F)
    + 0.0588 * Math.sin(2 * D - 2 * Mp)
    + 0.0572 * Math.sin(2 * D - M - Mp)
    + 0.0533 * Math.sin(2 * D + Mp)
    - 0.0468 * Math.sin(3 * Mp - 2 * D)
    + 0.0286 * Math.sin(D)
    + 0.0280 * Math.sin(M - Mp);
  return mod360(lon);
}

export function mercuryPosition(T: number): number {
  const d = T * 36525 + 1.5;
  const { xh, yh } = planetXYZ(d,
    48.3313, 3.24587e-5,   7.0047, 5.00e-8,
    29.1241, 1.01444e-5,   0.387098, 0,
    0.205635, 5.59e-10,    168.6562, 4.0923344368);
  return geoLon(xh, yh, d);
}

export function venusPosition(T: number): number {
  const d = T * 36525 + 1.5;
  const { xh, yh } = planetXYZ(d,
    76.6799, 2.46590e-5,   3.3946, 2.75e-8,
    54.8910, 1.38374e-5,   0.723330, 0,
    0.006773, -1.302e-9,   48.0052, 1.6021302244);
  return geoLon(xh, yh, d);
}

export function marsPosition(T: number): number {
  const d = T * 36525 + 1.5;
  const { xh, yh } = planetXYZ(d,
    49.5574, 2.11081e-5,   1.8497, -1.78e-8,
    286.5016, 2.92961e-5,  1.523688, 0,
    0.093405, 2.516e-9,    18.6021, 0.5240207766);
  return geoLon(xh, yh, d);
}

export function jupiterPosition(T: number): number {
  const d = T * 36525 + 1.5;
  const { xh, yh, M: Mj } = planetXYZ(d,
    100.4542, 2.76854e-5,  1.3030, -1.557e-7,
    273.8777, 1.64505e-5,  5.20256, 0,
    0.048498, 4.469e-9,    19.8950, 0.0830853001);
  const Ms = mod360(316.9670 + 0.0334442282 * d);
  let lon = geoLon(xh, yh, d);
  lon += -0.332 * Math.sin(toRad(2 * Mj - 5 * Ms - 67.6));
  lon += -0.056 * Math.sin(toRad(2 * Mj - 2 * Ms + 21));
  lon +=  0.042 * Math.sin(toRad(3 * Mj - 5 * Ms + 21));
  lon += -0.036 * Math.sin(toRad(Mj - 2 * Ms));
  lon +=  0.022 * Math.cos(toRad(Mj - Ms));
  lon +=  0.023 * Math.sin(toRad(2 * Mj - 3 * Ms + 52));
  lon += -0.016 * Math.sin(toRad(Mj - 5 * Ms - 69));
  return mod360(lon);
}

export function saturnPosition(T: number): number {
  const d = T * 36525 + 1.5;
  const Mj = mod360(19.8950 + 0.0830853001 * d);
  const { xh, yh, M: Ms } = planetXYZ(d,
    113.6634, 2.38980e-5,  2.4886, -1.081e-7,
    339.3939, 2.97661e-5,  9.55475, 0,
    0.055546, -9.499e-9,   316.9670, 0.0334442282);
  let lon = geoLon(xh, yh, d);
  lon +=  0.812 * Math.sin(toRad(2 * Mj - 5 * Ms - 67.6));
  lon += -0.229 * Math.cos(toRad(2 * Mj - 4 * Ms - 2));
  lon +=  0.119 * Math.sin(toRad(Mj - 2 * Ms - 3));
  lon +=  0.046 * Math.sin(toRad(2 * Mj - 6 * Ms - 69));
  lon +=  0.014 * Math.sin(toRad(Mj - 3 * Ms + 32));
  return mod360(lon);
}

export function uranusPosition(T: number): number {
  const d = T * 36525 + 1.5;
  const Mj = mod360(19.8950 + 0.0830853001 * d);
  const Ms = mod360(316.9670 + 0.0334442282 * d);
  const { xh, yh, M: Mu } = planetXYZ(d,
    74.0005, 1.3978e-5,    0.7733, 1.9e-8,
    96.6612, 3.0565e-5,    19.18171, -1.55e-8,
    0.047318, 7.45e-9,     142.5905, 0.011725806);
  let lon = geoLon(xh, yh, d);
  lon +=  0.040 * Math.sin(toRad(Ms - 2 * Mu + 6));
  lon +=  0.035 * Math.sin(toRad(Ms - 3 * Mu + 33));
  lon += -0.015 * Math.sin(toRad(Mj - Mu + 20));
  return mod360(lon);
}

export function neptunePosition(T: number): number {
  const d = T * 36525 + 1.5;
  const { xh, yh } = planetXYZ(d,
    131.7806, 3.0173e-5,   1.7700, -2.55e-7,
    272.8461, -6.027e-6,   30.05826, 3.313e-8,
    0.008606, 2.15e-9,     260.2471, 0.005995147);
  return geoLon(xh, yh, d);
}

export function plutoPosition(T: number): number {
  // Pluto via Keplerian elements (J2000) + geoLon; d in days, rates per day
  const d = T * 36525 + 1.5;
  const { xh, yh } = planetXYZ(d,
    110.30347, 0,  17.14175, 0,  113.76329, 0,  39.48169, 0,
    0.24880766, 0,
    14.88203, 145.20765 / 36525);  // M at J2000, °/century → °/day
  return geoLon(xh, yh, d);
}

// Detect retrograde: if daily motion is negative
export function isRetrograde(posFunc: (T: number) => number, T: number): boolean {
  const dt = 1 / 36525; // 1 day
  const p1 = posFunc(T - dt);
  const p2 = posFunc(T + dt);
  let diff = p2 - p1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}
