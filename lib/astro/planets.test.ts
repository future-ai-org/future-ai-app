import { describe, it, expect } from "vitest";
import {
  solveKepler,
  sunPosition,
  moonPosition,
  mercuryPosition,
  earthXY,
  geoLon,
  isRetrograde,
} from "./planets";
import { mod360 } from "./math";

describe("planets", () => {
  describe("solveKepler", () => {
    it("converges for near-circular orbit", () => {
      const E = solveKepler(90, 0.01);
      expect(E).toBeGreaterThan(0);
      expect(E).toBeLessThan(Math.PI);
    });
  });

  describe("sunPosition", () => {
    it("at J2000 (T=0) is near catalog mean longitude", () => {
      const lon = sunPosition(0);
      expect(lon).toBeCloseTo(280.46646, 0);
    });
  });

  describe("moonPosition", () => {
    it("returns longitude in 0..360", () => {
      const lon = moonPosition(0);
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(360);
    });
  });

  describe("mercuryPosition", () => {
    it("returns geocentric longitude in range", () => {
      const lon = mercuryPosition(0);
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(360);
    });
  });

  describe("earthXY / geoLon", () => {
    it("geoLon matches heliocentric difference frame", () => {
      const d = 0 * 36525 + 1.5;
      const e = earthXY(d);
      const lon = geoLon(e.x, e.y, d);
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(360);
    });
  });

  describe("isRetrograde", () => {
    it("detects decreasing longitude", () => {
      const retro = isRetrograde((T) => mod360(360 - T * 10000), 0);
      expect(retro).toBe(true);
    });
    it("detects direct motion", () => {
      const direct = isRetrograde((T) => mod360(T * 10000), 0);
      expect(direct).toBe(false);
    });
  });
});
