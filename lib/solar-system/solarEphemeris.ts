/**
 * Real ephemeris for the 3D solar-system view: same engine as ../astro/planets / ../astro/points.
 * Scene uses heliocentric ecliptic angles × visual ORBIT radii; aspect angles and chord lines use
 * geocentric ecliptic longitudes (Earth as observer).
 */

import * as THREE from 'three';

import { julianDay, mod360, toRad } from '@/lib/astro/math';
import {
  earthXY,
  moonPosition,
  planetXYZ,
} from '@/lib/astro/planets';
import { lilithPosition } from '@/lib/astro/points';

import { BODY_RADIUS, ORBIT, type PlanetKey } from '@/lib/solar-system/constants';

/** Julian centuries since J2000 (same as chart code). */
export function julianCenturiesUTC(date: Date): number {
  const utHour =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const JD = julianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    utHour,
  );
  return (JD - 2451545.0) / 36525;
}

function daysFromEpoch(T: number): number {
  return T * 36525 + 1.5;
}

function meanMotion(aAU: number): number {
  return 0.9856076686 / Math.sqrt(aAU * aAU * aAU);
}

function helioAngleMercury(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    48.3313,
    3.24587e-5,
    7.0047,
    5.0e-8,
    29.1241,
    1.01444e-5,
    0.387098,
    0,
    0.205635,
    5.59e-10,
    168.6562,
    4.0923344368,
  );
  return Math.atan2(yh, xh);
}

function helioAngleVenus(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    76.6799,
    2.4659e-5,
    3.3946,
    2.75e-8,
    54.891,
    1.38374e-5,
    0.72333,
    0,
    0.006773,
    -1.302e-9,
    48.0052,
    1.6021302244,
  );
  return Math.atan2(yh, xh);
}

function helioAngleMars(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    49.5574,
    2.11081e-5,
    1.8497,
    -1.78e-8,
    286.5016,
    2.92961e-5,
    1.523688,
    0,
    0.093405,
    2.516e-9,
    18.6021,
    0.5240207766,
  );
  return Math.atan2(yh, xh);
}

function helioAngleJupiter(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    100.4542,
    2.76854e-5,
    1.303,
    -1.557e-7,
    273.8777,
    1.64505e-5,
    5.20256,
    0,
    0.048498,
    4.469e-9,
    19.895,
    0.0830853001,
  );
  return Math.atan2(yh, xh);
}

function helioAngleSaturn(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    113.6634,
    2.3898e-5,
    2.4886,
    -1.081e-7,
    339.3939,
    2.97661e-5,
    9.55475,
    0,
    0.055546,
    -9.499e-9,
    316.967,
    0.0334442282,
  );
  return Math.atan2(yh, xh);
}

function helioAngleUranus(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    74.0005,
    1.3978e-5,
    0.7733,
    1.9e-8,
    96.6612,
    3.0565e-5,
    19.18171,
    -1.55e-8,
    0.047318,
    7.45e-9,
    142.5905,
    0.011725806,
  );
  return Math.atan2(yh, xh);
}

function helioAngleNeptune(d: number): number {
  const { xh, yh } = planetXYZ(
    d,
    131.7806,
    3.0173e-5,
    1.77,
    -2.55e-7,
    272.8461,
    -6.027e-6,
    30.05826,
    3.313e-8,
    0.008606,
    2.15e-9,
    260.2471,
    0.005995147,
  );
  return Math.atan2(yh, xh);
}

function helioAngleEarth(d: number): number {
  const { x, y } = earthXY(d);
  return Math.atan2(y, x);
}

function helioAngleJuno(d: number): number {
  const a = 2.6700912;
  const e = 0.25498122;
  const n = meanMotion(a);
  const days55400ToJ2000 = 2455400.5 - 2451545;
  const M_at_J2000 = mod360(32.0960832 - n * days55400ToJ2000);
  const M0 = mod360(M_at_J2000 - n * 1.5);
  const { xh, yh } = planetXYZ(
    d,
    169.91138,
    0,
    12.98211,
    0,
    248.10807,
    0,
    a,
    0,
    e,
    0,
    M0,
    n,
  );
  return Math.atan2(yh, xh);
}

function helioAngleChiron(d: number): number {
  const a = 13.7;
  const e = 0.3772;
  const n = meanMotion(a);
  const daysEpochToJ2000 = 2459396.5 - 2451545;
  const M_at_J2000 = mod360(180.7 - n * daysEpochToJ2000);
  const M0 = mod360(M_at_J2000 - n * 1.5);
  const { xh, yh } = planetXYZ(
    d,
    209.27,
    0,
    6.9299,
    0,
    339.71,
    0,
    a,
    0,
    e,
    0,
    M0,
    n,
  );
  return Math.atan2(yh, xh);
}

/** Mean Lilith as a small offset from Earth’s heliocentric place (angle only). */
function helioAngleLilith(T: number, d: number): number {
  const { x: ex, y: ey } = earthXY(d);
  const λ = toRad(lilithPosition(T));
  const k = 0.003;
  return Math.atan2(ey + k * Math.sin(λ), ex + k * Math.cos(λ));
}

function helioLongitudeRad(T: number, planet: PlanetKey): number {
  const d = daysFromEpoch(T);
  switch (planet) {
    case 'mercury':
      return helioAngleMercury(d);
    case 'venus':
      return helioAngleVenus(d);
    case 'earth':
      return helioAngleEarth(d);
    case 'mars':
      return helioAngleMars(d);
    case 'jupiter':
      return helioAngleJupiter(d);
    case 'saturn':
      return helioAngleSaturn(d);
    case 'uranus':
      return helioAngleUranus(d);
    case 'neptune':
      return helioAngleNeptune(d);
    case 'lilith':
      return helioAngleLilith(T, d);
    case 'juno':
      return helioAngleJuno(d);
    case 'chiron':
      return helioAngleChiron(d);
    default:
      return 0;
  }
}

/** Heliocentric scene XZ (ecliptic plane) using real angles and toy radii. */
export function sceneOrbitXZ(T: number, planet: PlanetKey): { x: number; z: number } {
  const θ = helioLongitudeRad(T, planet);
  const r = ORBIT[planet];
  return { x: Math.cos(θ) * r, z: Math.sin(θ) * r };
}

/**
 * Moon offset in Earth’s local XZ: geocentric ecliptic longitude (same as charts), arm matches {@link MoonMesh}.
 */
export function sceneMoonOffsetXZ(T: number): { x: number; z: number } {
  const λ = toRad(moonPosition(T));
  const d = BODY_RADIUS.earth * 3.2;
  return { x: d * Math.cos(λ), z: d * Math.sin(λ) };
}

/** World XZ of the Moon after Earth’s spin + obliquity (matches the scene graph). */
export function moonWorldXZ(
  T: number,
  earthXZ: { x: number; z: number },
  spinY: number,
): { x: number; z: number } {
  const off = sceneMoonOffsetXZ(T);
  const v = new THREE.Vector3(off.x, 0, off.z);
  v.applyEuler(new THREE.Euler(0, spinY, 0.409, 'XYZ'));
  return { x: earthXZ.x + v.x, z: earthXZ.z + v.z };
}
