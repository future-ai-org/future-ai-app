import { describe, it, expect } from "vitest";
import {
  mod360,
  toRad,
  toDeg,
  julianDay,
  greenwichSiderealTime,
  localSiderealTime,
  obliquity,
} from "./math";

describe("math", () => {
  describe("mod360", () => {
    it("wraps to 0..360", () => {
      expect(mod360(0)).toBe(0);
      expect(mod360(360)).toBe(0);
      expect(mod360(400)).toBe(40);
      expect(mod360(-90)).toBe(270);
      expect(mod360(-360)).toBe(0);
    });
  });

  describe("toRad / toDeg", () => {
    it("converts degrees to radians and back", () => {
      expect(toRad(180)).toBeCloseTo(Math.PI);
      expect(toDeg(Math.PI)).toBeCloseTo(180);
      expect(toDeg(toRad(90))).toBeCloseTo(90);
    });
  });

  describe("julianDay", () => {
    it("returns known JD for 2000-01-01 12:00 UT", () => {
      const jd = julianDay(2000, 1, 1, 12);
      expect(jd).toBeCloseTo(2451545.0, 0);
    });
    it("handles month <= 2 (year rollback)", () => {
      const jdFeb = julianDay(2000, 2, 1, 0);
      expect(jdFeb).toBeGreaterThan(2451545);
    });
  });

  describe("greenwichSiderealTime", () => {
    it("returns value in 0..360 for J2000.0", () => {
      const gst = greenwichSiderealTime(2451545.0);
      expect(gst).toBeGreaterThanOrEqual(0);
      expect(gst).toBeLessThan(360);
    });
  });

  describe("localSiderealTime", () => {
    it("adjusts GST by longitude", () => {
      const gst = greenwichSiderealTime(2451545.0);
      const lst = localSiderealTime(2451545.0, 0);
      expect(lst).toBeCloseTo(gst, 2);
      const lstWest = localSiderealTime(2451545.0, -90);
      expect(mod360(lstWest - gst + 360)).toBeCloseTo(270, 0); // -90° = 270° add
    });
  });

  describe("obliquity", () => {
    it("returns obliquity in degrees (~23.4 for J2000)", () => {
      const ob = obliquity(2451545.0);
      expect(ob).toBeCloseTo(23.43, 1);
    });
  });
});
