import { julianDay } from './math';
import { mod360 } from './math';
import { sunPosition, moonPosition } from './planets';

const SYNODIC_MONTH_DAYS = 29.530588;
const FULL_MOON_OFFSET_DAYS = SYNODIC_MONTH_DAYS / 2;

export type MoonPhaseName =
  | 'new moon'
  | 'waxing crescent'
  | 'first quarter'
  | 'waxing gibbous'
  | 'full moon'
  | 'waning gibbous'
  | 'last quarter'
  | 'waning crescent';

const MOON_PHASE_EMOJI: Record<MoonPhaseName, string> = {
  'new moon': '🌑',
  'waxing crescent': '🌒',
  'first quarter': '🌓',
  'waxing gibbous': '🌔',
  'full moon': '🌕',
  'waning gibbous': '🌖',
  'last quarter': '🌗',
  'waning crescent': '🌘',
};

export interface MoonPhaseInfo {
  phaseName: MoonPhaseName;
  emoji: string;
  daysSinceNew: number;
  daysToNewMoon: number;
  daysToFullMoon: number;
  /** Whichever is closer: 'new' or 'full' */
  nextTarget: 'new' | 'full';
  daysToNext: number;
}

function phaseNameFromAngle(angleDeg: number): MoonPhaseName {
  // angle 0 = new, 90 = first quarter, 180 = full, 270 = last quarter
  const a = angleDeg;
  if (a < 22.5) return 'new moon';
  if (a < 67.5) return 'waxing crescent';
  if (a < 112.5) return 'first quarter';
  if (a < 157.5) return 'waxing gibbous';
  if (a < 202.5) return 'full moon';
  if (a < 247.5) return 'waning gibbous';
  if (a < 292.5) return 'last quarter';
  if (a < 337.5) return 'waning crescent';
  return 'new moon';
}

/**
 * Returns current moon phase and days until next new moon or full moon (whichever is closer).
 */
export function getMoonPhaseInfo(date: Date): MoonPhaseInfo {
  const utHour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const JD = julianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    utHour,
  );
  const T = (JD - 2451545.0) / 36525;
  const sunLon = sunPosition(T);
  const moonLon = moonPosition(T);
  const phaseAngle = mod360(moonLon - sunLon);
  const daysSinceNew = (phaseAngle / 360) * SYNODIC_MONTH_DAYS;

  const daysToNewMoon = daysSinceNew < 0.1
    ? SYNODIC_MONTH_DAYS
    : SYNODIC_MONTH_DAYS - daysSinceNew;
  const daysToFullMoon = (FULL_MOON_OFFSET_DAYS - daysSinceNew + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const toNew = daysToNewMoon < 0.5 ? SYNODIC_MONTH_DAYS : daysToNewMoon;
  const toFull = daysToFullMoon < 0.5 ? FULL_MOON_OFFSET_DAYS : daysToFullMoon;

  const nextTarget = toNew <= toFull ? 'new' : 'full';
  const daysToNext = nextTarget === 'new' ? Math.round(toNew * 10) / 10 : Math.round(toFull * 10) / 10;

  const phaseName = phaseNameFromAngle(phaseAngle);
  return {
    phaseName,
    emoji: MOON_PHASE_EMOJI[phaseName],
    daysSinceNew,
    daysToNewMoon: Math.round(daysToNewMoon * 10) / 10,
    daysToFullMoon: Math.round(daysToFullMoon * 10) / 10,
    nextTarget,
    daysToNext,
  };
}
