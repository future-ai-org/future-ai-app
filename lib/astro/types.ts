export type PlanetName = 'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'|'Uranus'|'Neptune'|'Pluto';

export interface BirthData {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  latitude: number;
  longitude: number;
  utcOffset: number;
  cityLabel: string;
}

export interface GeoResult {
  latitude: number;
  longitude: number;
  utcOffset: number;
  displayName: string;
}

export interface PlanetPosition {
  name: PlanetName;
  longitude: number;
  retrograde: boolean;
  house: number;
}

export interface ChartResult {
  asc: number;
  mc: number;
  obliquity: number;
  cusps: number[];
  planets: PlanetPosition[];
  birthData: BirthData;
}

export interface FormattedPosition {
  sign: string;
  glyph: string;
  degrees: number;
  minutes: number;
  display: string;
}
