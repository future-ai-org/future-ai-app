import { describe, it, expect } from "vitest";
import { addHoursToBirthData } from "./birthData";
import type { BirthData } from "./types";

const base: BirthData = {
  date: "2000-06-15",
  time: "12:00",
  latitude: 39.7,
  longitude: -104.9,
  utcOffset: -6,
  cityLabel: "Denver",
};

describe("birthData", () => {
  describe("addHoursToBirthData", () => {
    it("adds hours and keeps same day when no rollover", () => {
      const result = addHoursToBirthData(base, 2);
      expect(result.date).toBe("2000-06-15");
      expect(result.time).toBe("14:00");
      expect(result.latitude).toBe(base.latitude);
      expect(result.longitude).toBe(base.longitude);
    });
    it("rolls to next day when crossing midnight", () => {
      const result = addHoursToBirthData(base, 15); // 12:00 + 15h = 03:00 next day
      expect(result.date).toBe("2000-06-16");
      expect(result.time).toBe("03:00");
    });
    it("subtracts hours (negative delta)", () => {
      const result = addHoursToBirthData(base, -2);
      expect(result.date).toBe("2000-06-15");
      expect(result.time).toBe("10:00");
    });
    it("rolls to previous day when subtracting past midnight", () => {
      const result = addHoursToBirthData(base, -15); // 12:00 - 15h = 21:00 prev day
      expect(result.date).toBe("2000-06-14");
      expect(result.time).toBe("21:00");
    });
    it("preserves other birth data fields", () => {
      const result = addHoursToBirthData(base, 1);
      expect(result.cityLabel).toBe("Denver");
      expect(result.utcOffset).toBe(-6);
      expect(result.latitude).toBe(39.7);
      expect(result.longitude).toBe(-104.9);
    });
  });
});
