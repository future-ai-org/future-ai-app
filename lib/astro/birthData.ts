import type { BirthData } from './types';

/**
 * Returns new birth data with the time shifted by deltaHours (in birth-place local time).
 * Handles date rollover (e.g. 23:30 + 1h → next day 00:30).
 */
export function addHoursToBirthData(data: BirthData, deltaHours: number): BirthData {
  const [y, mo, d] = data.date.split('-').map(Number);
  const [h, min] = data.time.split(':').map(Number);
  const { utcOffset } = data;

  const birthUtcMs = Date.UTC(y, mo - 1, d, h - utcOffset, min, 0, 0);
  const newBirthUtcMs = birthUtcMs + deltaHours * 3600 * 1000;
  const localMs = newBirthUtcMs + utcOffset * 3600 * 1000;
  const local = new Date(localMs);

  const newDate =
    `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`;
  const newTime =
    `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;

  return {
    ...data,
    date: newDate,
    time: newTime,
  };
}
