export type PlanetName = 'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'|'Uranus'|'Neptune'|'Pluto';

/** Optional points (asteroids, Lilith, nodes, lots) shown when enabled in chart options. */
export type PointName =
  | 'Lilith' | 'Juno' | 'Chiron'
  | 'North Node' | 'South Node'
  | 'Lot of Fortune' | 'Lot of Spirit' | 'Lot of Eros' | 'Lot of Victory';

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
  /** Optional IANA timezone (e.g. "America/Denver") for precise local time/DST. */
  timeZone?: string;
}

export interface PlanetPosition {
  name: PlanetName;
  longitude: number;
  retrograde: boolean;
  house: number;
}

/** A calculated point (asteroid, node, lot, Lilith). Lots and nodes have no retrograde. */
export interface PointPosition {
  name: PointName;
  longitude: number;
  house: number;
  retrograde?: boolean;
}

/** Options for which optional points and lots to include in the chart. */
export interface ChartOptions {
  lilith?: boolean;
  juno?: boolean;
  chiron?: boolean;
  northNode?: boolean;
  southNode?: boolean;
  lotOfFortune?: boolean;
  lotOfSpirit?: boolean;
  lotOfEros?: boolean;
  lotOfVictory?: boolean;
}

/** Default options for the "current sky" (/today) chart: include North Node, South Node, Lilith, Juno, Chiron. */
export const CHART_OF_MOMENT_OPTIONS: ChartOptions = {
  northNode: true,
  southNode: true,
  lilith: true,
  juno: true,
  chiron: true,
};

export interface ChartResult {
  asc: number;
  mc: number;
  obliquity: number;
  cusps: number[];
  planets: PlanetPosition[];
  /** Optional points (asteroids, nodes, lots) when enabled by ChartOptions. Omit when loading old saved charts. */
  points?: PointPosition[];
  birthData: BirthData;
  /**
   * Optional calculation metadata / notes to help the UI explain assumptions.
   * Stored alongside the chart result for saved charts.
   */
  calculation?: {
    /**
     * True when user provided an ascendant sign but birth time/city are unknown,
     * so ASC is treated as "selected sign at 15°" (not an exact astronomical ASC).
     */
    ascendantAngleUnknown?: boolean;
  };
}

export interface FormattedPosition {
  sign: string;
  glyph: string;
  degrees: number;
  minutes: number;
  display: string;
}
