import * as THREE from 'three';

import {
  jupiterPosition,
  marsPosition,
  mercuryPosition,
  moonPosition,
  neptunePosition,
  saturnPosition,
  sunPosition,
  uranusPosition,
  venusPosition,
} from '@/lib/astro/planets';
import { mod360, toRad } from '@/lib/astro/math';
import { chironPosition, junoPosition, lilithPosition } from '@/lib/astro/points';

import {
  BODY_RADIUS,
  EARTH_YEAR_SECONDS,
  ORBIT,
  ORBIT_PHASE,
  ORBITAL_PERIOD_YEARS,
  ORBITERS_IN_ORDER,
  PLANET_SPIN_SCALE,
  SPIN_BOOST,
  type HoverBodyId,
  type OrbiterId,
  type PlanetKey,
} from '@/lib/solar-system/constants';

/** Half-width of major-aspect orb in radians (~8°). */
export const ASPECT_ORB_RAD = (8 * Math.PI) / 180;

export type MajorAspectKind = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export type OrbiterPairAspect = {
  a: OrbiterId;
  b: OrbiterId;
  kind: MajorAspectKind;
};

export type AspectToOther = {
  other: OrbiterId;
  kind: MajorAspectKind;
};

const ASPECT_TARGETS: { kind: MajorAspectKind; rad: number }[] = [
  { kind: 'conjunction', rad: 0 },
  { kind: 'sextile', rad: Math.PI / 3 },
  { kind: 'square', rad: Math.PI / 2 },
  { kind: 'trine', rad: (2 * Math.PI) / 3 },
  { kind: 'opposition', rad: Math.PI },
];

function targetRadForKind(kind: MajorAspectKind): number {
  const row = ASPECT_TARGETS.find((x) => x.kind === kind);
  return row?.rad ?? 0;
}

function refineAspectPeakErr(errFn: (tau: number) => number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  for (let k = 0; k < 8; k++) {
    const m1 = a + (b - a) / 3;
    const m2 = b - (b - a) / 3;
    if (errFn(m1) < errFn(m2)) b = m2;
    else a = m1;
  }
  return (a + b) / 2;
}

/** Heliocentric ecliptic longitude in the coplanar model (radians). */
export function heliocentricLongitude(tSim: number, planet: PlanetKey): number {
  const period = ORBITAL_PERIOD_YEARS[planet];
  const phase = ORBIT_PHASE[planet];
  return ((2 * Math.PI) / (period * EARTH_YEAR_SECONDS)) * tSim + phase;
}

/** Smallest angle between two directions in the orbital plane, in [0, π]. */
export function smallestAngularSeparation(a: number, b: number): number {
  let d = Math.abs(a - b) % (2 * Math.PI);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d;
}

export function orbitPositionXZ(tSim: number, planet: PlanetKey): { x: number; z: number } {
  const θ = heliocentricLongitude(tSim, planet);
  const r = ORBIT[planet];
  return { x: Math.cos(θ) * r, z: Math.sin(θ) * r };
}

/**
 * Moon XZ in the heliocentric frame, matching the scene: local offset (d,0,0), Ry(moon),
 * then Earth group Euler (0, spinY, 0.409).
 */
export function moonPositionXZ(tSim: number): { x: number; z: number } {
  const earth = orbitPositionXZ(tSim, 'earth');
  const spinY = tSim * SPIN_BOOST * 0.22 * PLANET_SPIN_SCALE;
  const moonA = tSim * 0.95;
  const d = BODY_RADIUS.earth * 3.2;
  const v = new THREE.Vector3(d, 0, 0);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), moonA);
  const e = new THREE.Euler(0, spinY, 0.409, 'XYZ');
  v.applyEuler(e);
  return { x: earth.x + v.x, z: earth.z + v.z };
}

export function bodyPositionXZ(tSim: number, body: HoverBodyId): { x: number; z: number } {
  if (body === 'sun') return { x: 0, z: 0 };
  if (body === 'moon') return moonPositionXZ(tSim);
  return orbitPositionXZ(tSim, body);
}

export function orbiterLongitude(tSim: number, body: OrbiterId): number {
  const p = bodyPositionXZ(tSim, body);
  return Math.atan2(p.z, p.x);
}

/** Angular separation [0, π] between two orbiters in the heliocentric XZ model. */
export function separationBetweenOrbiters(tSim: number, a: OrbiterId, b: OrbiterId): number {
  const la = orbiterLongitude(tSim, a);
  const lb = orbiterLongitude(tSim, b);
  return smallestAngularSeparation(la, lb);
}

/**
 * Next simulated time ≥ t0 when separation is a local minimum near this aspect target
 * (numeric; toy ephemeris).
 */
export function nextAspectPeakTimeSim(
  t0: number,
  a: OrbiterId,
  b: OrbiterId,
  kind: MajorAspectKind,
): number | null {
  const target = targetRadForKind(kind);
  const err = (tau: number) => Math.abs(separationBetweenOrbiters(tau, a, b) - target);
  /** Coarse search: many pairs can render per frame (sun panel). */
  const horizon = 14 * EARTH_YEAR_SECONDS;
  const dt = 2.4;
  const tight = ASPECT_ORB_RAD * 1.35;

  const ep0 = err(t0 - dt);
  const e0 = err(t0);
  const en0 = err(t0 + dt);
  if (e0 <= ep0 && e0 <= en0 && e0 < tight) {
    return refineAspectPeakErr(err, t0 - dt, t0 + dt);
  }

  for (let t = t0 + dt; t < t0 + horizon; t += dt) {
    const e = err(t);
    const ep = err(t - dt);
    const en = err(t + dt);
    if (e <= ep && e <= en && e < tight) {
      return refineAspectPeakErr(err, t - dt, t + dt);
    }
  }
  return null;
}

/** Convert ΔtSim to approximate “calendar” days (1 sim Earth year = EARTH_YEAR_SECONDS). */
export function simDeltaToApproxDays(deltaTSim: number): number {
  return (deltaTSim / EARTH_YEAR_SECONDS) * 365.25;
}

/** Geocentric ecliptic longitude (rad), same functions as chart / transits code. */
export function orbiterGeoLongitudeRad(T: number, body: OrbiterId): number {
  switch (body) {
    case 'mercury':
      return toRad(mercuryPosition(T));
    case 'venus':
      return toRad(venusPosition(T));
    case 'earth':
      return toRad(mod360(sunPosition(T) + 180));
    case 'mars':
      return toRad(marsPosition(T));
    case 'jupiter':
      return toRad(jupiterPosition(T));
    case 'saturn':
      return toRad(saturnPosition(T));
    case 'uranus':
      return toRad(uranusPosition(T));
    case 'neptune':
      return toRad(neptunePosition(T));
    case 'moon':
      return toRad(moonPosition(T));
    case 'lilith':
      return toRad(lilithPosition(T));
    case 'juno':
      return toRad(junoPosition(T));
    case 'chiron':
      return toRad(chironPosition(T));
    default:
      return 0;
  }
}

export function separationBetweenOrbitersGeo(T: number, a: OrbiterId, b: OrbiterId): number {
  return smallestAngularSeparation(orbiterGeoLongitudeRad(T, a), orbiterGeoLongitudeRad(T, b));
}

/** Geocentric ecliptic longitude of the Sun (rad), same as chart catalogue. */
export function sunGeoLongitudeRad(T: number): number {
  return toRad(sunPosition(T));
}

/** Angular separation [0, π] between geocentric Sun and another body’s geocentric longitude. */
export function separationSunOrbiterGeo(T: number, other: OrbiterId): number {
  return smallestAngularSeparation(sunGeoLongitudeRad(T), orbiterGeoLongitudeRad(T, other));
}

/**
 * Point on the ecliptic plane as seen from Earth: body direction (geocentric λ) from Earth’s
 * scene position, scaled by rimRadius. Chords between two such points subtend the same angle
 * as geocentric ecliptic separation (major aspects in the panel).
 */
export function geoEclipticRimPointXZ(
  T: number,
  body: HoverBodyId,
  earthX: number,
  earthZ: number,
  rimRadius: number,
): { x: number; z: number } {
  const λ =
    body === 'sun' ? sunGeoLongitudeRad(T) : orbiterGeoLongitudeRad(T, body);
  return {
    x: earthX + rimRadius * Math.cos(λ),
    z: earthZ + rimRadius * Math.sin(λ),
  };
}

const GEO_PEAK_STEP_T = 1 / 36525;

/**
 * Next Julian-century time ≥ T0 when geocentric separation is near exact for this aspect
 * (step = 1 day; same orb model as the toy version).
 */
export function nextAspectPeakTimeGeo(
  T0: number,
  a: OrbiterId,
  b: OrbiterId,
  kind: MajorAspectKind,
): number | null {
  const target = targetRadForKind(kind);
  const err = (Ttest: number) =>
    Math.abs(separationBetweenOrbitersGeo(Ttest, a, b) - target);
  const maxDays = 12 * 365;
  const tight = ASPECT_ORB_RAD * 1.35;

  const ep0 = err(T0 - GEO_PEAK_STEP_T);
  const e0 = err(T0);
  const en0 = err(T0 + GEO_PEAK_STEP_T);
  if (e0 <= ep0 && e0 <= en0 && e0 < tight) {
    return refineAspectPeakErr(err, T0 - GEO_PEAK_STEP_T, T0 + GEO_PEAK_STEP_T);
  }

  for (let k = 1; k <= maxDays; k++) {
    const T2 = T0 + k * GEO_PEAK_STEP_T;
    const e = err(T2);
    const ep = err(T2 - GEO_PEAK_STEP_T);
    const en = err(T2 + GEO_PEAK_STEP_T);
    if (e <= ep && e <= en && e < tight) {
      return refineAspectPeakErr(err, T2 - GEO_PEAK_STEP_T, T2 + GEO_PEAK_STEP_T);
    }
  }
  return null;
}

/**
 * Next Julian-century time ≥ T0 when Sun–body geocentric separation is near exact for this aspect.
 */
export function nextSunOrbiterAspectPeakTimeGeo(
  T0: number,
  other: OrbiterId,
  kind: MajorAspectKind,
): number | null {
  const target = targetRadForKind(kind);
  const err = (Ttest: number) => Math.abs(separationSunOrbiterGeo(Ttest, other) - target);
  const maxDays = 12 * 365;
  const tight = ASPECT_ORB_RAD * 1.35;

  const ep0 = err(T0 - GEO_PEAK_STEP_T);
  const e0 = err(T0);
  const en0 = err(T0 + GEO_PEAK_STEP_T);
  if (e0 <= ep0 && e0 <= en0 && e0 < tight) {
    return refineAspectPeakErr(err, T0 - GEO_PEAK_STEP_T, T0 + GEO_PEAK_STEP_T);
  }

  for (let k = 1; k <= maxDays; k++) {
    const T2 = T0 + k * GEO_PEAK_STEP_T;
    const e = err(T2);
    const ep = err(T2 - GEO_PEAK_STEP_T);
    const en = err(T2 + GEO_PEAK_STEP_T);
    if (e <= ep && e <= en && e < tight) {
      return refineAspectPeakErr(err, T2 - GEO_PEAK_STEP_T, T2 + GEO_PEAK_STEP_T);
    }
  }
  return null;
}

/** Days until peak from ΔT in Julian centuries (36525 days / century). */
export function geoDeltaToDays(deltaT: number): number {
  return deltaT * 36525;
}

export function formatPeakCalendarDays(T0: number, TPeak: number | null): string {
  if (TPeak == null) return 'peak —';
  const days = geoDeltaToDays(TPeak - T0);
  if (days < 0) return 'peak: now';
  if (days <= 0.25) return 'peak: now';
  if (days < 12) return `peak in ${Math.max(1, Math.round(days))} d`;
  if (days < 75) return `peak in ${Math.round(days / 7)} wk`;
  if (days < 800) return `peak in ${(days / 30.44).toFixed(1)} mo`;
  return `peak in ${(days / 365.25).toFixed(1)} y`;
}

export function aspectsFromOrbiterGeo(T: number, body: OrbiterId): AspectToOther[] {
  const λ = orbiterGeoLongitudeRad(T, body);
  const out: AspectToOther[] = [];
  for (const other of ORBITERS_IN_ORDER) {
    if (other === body) continue;
    const μ = orbiterGeoLongitudeRad(T, other);
    const sep = smallestAngularSeparation(λ, μ);
    const kind = classifyMajorAspect(sep);
    if (kind) out.push({ other, kind });
  }
  return out;
}

/** Major aspects from geocentric Sun to each shown body (Earth omitted). */
export function aspectsFromSunGeo(T: number): AspectToOther[] {
  const sunλ = sunGeoLongitudeRad(T);
  const out: AspectToOther[] = [];
  for (const other of ORBITERS_IN_ORDER) {
    if (other === 'earth') continue;
    const sep = smallestAngularSeparation(sunλ, orbiterGeoLongitudeRad(T, other));
    const kind = classifyMajorAspect(sep);
    if (kind) out.push({ other, kind });
  }
  return out;
}

export function allPairwiseOrbiterAspectsGeo(T: number): OrbiterPairAspect[] {
  const n = ORBITERS_IN_ORDER.length;
  const out: OrbiterPairAspect[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = ORBITERS_IN_ORDER[i];
      const b = ORBITERS_IN_ORDER[j];
      const sep = smallestAngularSeparation(orbiterGeoLongitudeRad(T, a), orbiterGeoLongitudeRad(T, b));
      const kind = classifyMajorAspect(sep);
      if (kind) out.push({ a, b, kind });
    }
  }
  return out;
}

/** Map separation in [0, π] to the closest major aspect, or null if outside orb. */
export function classifyMajorAspect(separationRad: number): MajorAspectKind | null {
  let best: MajorAspectKind | null = null;
  let bestErr = Number.POSITIVE_INFINITY;
  for (const { kind, rad } of ASPECT_TARGETS) {
    const err = Math.abs(separationRad - rad);
    if (err < bestErr) {
      bestErr = err;
      best = kind;
    }
  }
  return bestErr < ASPECT_ORB_RAD ? best : null;
}

/** Aspects between one orbiter and every other orbiter (heliocentric longitudes). */
export function aspectsFromOrbiter(tSim: number, body: OrbiterId): AspectToOther[] {
  const λ = orbiterLongitude(tSim, body);
  const out: AspectToOther[] = [];
  for (const other of ORBITERS_IN_ORDER) {
    if (other === body) continue;
    const μ = orbiterLongitude(tSim, other);
    const sep = smallestAngularSeparation(λ, μ);
    const kind = classifyMajorAspect(sep);
    if (kind) out.push({ other, kind });
  }
  return out;
}

/** Every orbiter pair in aspect (each pair once, lexicographic a < b). */
export function allPairwiseOrbiterAspects(tSim: number): OrbiterPairAspect[] {
  const n = ORBITERS_IN_ORDER.length;
  const out: OrbiterPairAspect[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = ORBITERS_IN_ORDER[i];
      const b = ORBITERS_IN_ORDER[j];
      const sep = smallestAngularSeparation(orbiterLongitude(tSim, a), orbiterLongitude(tSim, b));
      const kind = classifyMajorAspect(sep);
      if (kind) out.push({ a, b, kind });
    }
  }
  return out;
}

export function aspectLineColor(kind: MajorAspectKind): string {
  switch (kind) {
    case 'conjunction':
      return '#fcd34d';
    case 'opposition':
      return '#e879f9';
    case 'trine':
      return '#6ee7b7';
    case 'square':
      return '#f87171';
    case 'sextile':
      return '#93c5fd';
    default:
      return '#a78bfa';
  }
}
