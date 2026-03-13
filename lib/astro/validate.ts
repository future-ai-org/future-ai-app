/**
 * Year range for chart generation. Prevents extreme or invalid dates.
 * Ephemeris accuracy is reasonable within this range.
 */
export const MIN_CHART_YEAR = 1900;
export const MAX_CHART_YEAR = 2100;

/**
 * Returns true if the year is within the allowed range for chart calculation.
 */
export function isValidChartYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_CHART_YEAR && year <= MAX_CHART_YEAR;
}

/**
 * Validates a birth date string (YYYY-MM-DD). Returns the parsed year if valid.
 * Use this before calculating a chart to avoid weird years.
 */
export function validateBirthDate(dateStr: string): { valid: true; year: number } | { valid: false } {
  if (!dateStr || typeof dateStr !== 'string') return { valid: false };
  const parts = dateStr.trim().split('-').map(Number);
  if (parts.length !== 3) return { valid: false };
  const [yr, mo, dy] = parts;
  if (!Number.isInteger(yr) || !Number.isInteger(mo) || !Number.isInteger(dy)) return { valid: false };
  if (mo < 1 || mo > 12 || dy < 1 || dy > 31) return { valid: false };
  if (!isValidChartYear(yr)) return { valid: false };
  return { valid: true, year: yr };
}
