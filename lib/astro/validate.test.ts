import { describe, it, expect } from "vitest";
import {
  MIN_CHART_YEAR,
  MAX_CHART_YEAR,
  isValidChartYear,
  validateBirthDate,
} from "./validate";

describe("validate", () => {
  describe("isValidChartYear", () => {
    it("returns true for years within range", () => {
      expect(isValidChartYear(MIN_CHART_YEAR)).toBe(true);
      expect(isValidChartYear(MAX_CHART_YEAR)).toBe(true);
      expect(isValidChartYear(2000)).toBe(true);
      expect(isValidChartYear(-1999)).toBe(true);
    });

    it("returns false for years below min", () => {
      expect(isValidChartYear(MIN_CHART_YEAR - 1)).toBe(false);
      expect(isValidChartYear(-2001)).toBe(false);
    });

    it("returns false for years above max", () => {
      expect(isValidChartYear(MAX_CHART_YEAR + 1)).toBe(false);
      expect(isValidChartYear(2101)).toBe(false);
    });

    it("returns false for non-integers", () => {
      expect(isValidChartYear(2000.5)).toBe(false);
      expect(isValidChartYear(NaN)).toBe(false);
    });
  });

  describe("validateBirthDate", () => {
    it("returns valid with year for YYYY-MM-DD", () => {
      expect(validateBirthDate("1990-05-15")).toEqual({ valid: true, year: 1990 });
      expect(validateBirthDate("2000-01-01")).toEqual({ valid: true, year: 2000 });
    });

    it("returns valid with signed year", () => {
      expect(validateBirthDate("-2000-01-01")).toEqual({ valid: true, year: -2000 });
      expect(validateBirthDate("-1999-12-31")).toEqual({ valid: true, year: -1999 });
    });

    it("returns invalid for empty or non-string", () => {
      expect(validateBirthDate("")).toEqual({ valid: false });
      expect(validateBirthDate(null as unknown as string)).toEqual({ valid: false });
    });

    it("returns invalid for wrong format", () => {
      expect(validateBirthDate("15-05-1990")).toEqual({ valid: false });
      expect(validateBirthDate("1990/05/15")).toEqual({ valid: false });
      expect(validateBirthDate("1990-5")).toEqual({ valid: false });
    });

    it("returns invalid for out-of-range year", () => {
      expect(validateBirthDate("-2001-06-01")).toEqual({ valid: false });
      expect(validateBirthDate("2101-06-01")).toEqual({ valid: false });
    });

    it("returns invalid for invalid month or day", () => {
      expect(validateBirthDate("2000-00-01")).toEqual({ valid: false });
      expect(validateBirthDate("2000-13-01")).toEqual({ valid: false });
      expect(validateBirthDate("2000-01-00")).toEqual({ valid: false });
    });
  });
});
