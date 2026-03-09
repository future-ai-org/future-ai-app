const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export function mod360(x: number): number {
  return ((x % 360) + 360) % 360;
}

export function toRad(d: number): number {
  return d * RAD;
}

export function toDeg(r: number): number {
  return r * DEG;
}

export function julianDay(year: number, month: number, day: number, utHour: number): number {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 + utHour / 24;
}

export function greenwichSiderealTime(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  const theta = 280.46061837 + 360.98564736629 * (JD - 2451545.0)
              + 0.000387933 * T * T - T * T * T / 38710000;
  return mod360(theta);
}

export function localSiderealTime(JD: number, longitude: number): number {
  return mod360(greenwichSiderealTime(JD) + longitude);
}

export function obliquity(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  return 23.4392911 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;
}
