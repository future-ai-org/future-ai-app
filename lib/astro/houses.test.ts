import { describe, it, expect } from "vitest";
import {
  calcAscendant,
  calcMC,
  wholeSignHouses,
  planetHouse,
} from "./houses";
import { mod360 } from "./math";

describe("houses", () => {
  describe("wholeSignHouses", () => {
    it("places 12 cusps at sign boundaries starting with ASC’s sign", () => {
      expect(wholeSignHouses(0)).toEqual([
        0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
      ]);
    });
    it("uses 0° of the sign containing ASC, not the exact ASC longitude", () => {
      expect(wholeSignHouses(15)).toEqual(wholeSignHouses(0));
      expect(wholeSignHouses(125)).toEqual([
        120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90,
      ]);
    });
    it("wraps for ASC in late Pisces", () => {
      const c = wholeSignHouses(350);
      expect(c[0]).toBe(330);
      expect(c[1]).toBe(0);
      expect(c[11]).toBe(mod360(330 + 11 * 30));
    });
  });

  describe("planetHouse", () => {
    it("returns house 1 for longitude in first 30° segment", () => {
      const cusps = wholeSignHouses(0);
      expect(planetHouse(10, cusps)).toBe(1);
      expect(planetHouse(29.9, cusps)).toBe(1);
    });
    it("returns correct house for later segments", () => {
      const cusps = wholeSignHouses(0);
      expect(planetHouse(30, cusps)).toBe(2);
      expect(planetHouse(89, cusps)).toBe(3);
    });
    it("assigns by zodiac sign of ASC (15° Aries → all Aries in house 1)", () => {
      const cusps = wholeSignHouses(15);
      expect(planetHouse(20, cusps)).toBe(1);
      expect(planetHouse(14, cusps)).toBe(1);
      expect(planetHouse(29.9, cusps)).toBe(1);
      expect(planetHouse(30, cusps)).toBe(2);
    });
  });

  describe("calcAscendant / calcMC", () => {
    it("returns degrees in 0..360", () => {
      const eps = 23.44;
      const asc = calcAscendant(45, 40, eps);
      const mc = calcMC(45, eps);
      expect(asc).toBeGreaterThanOrEqual(0);
      expect(asc).toBeLessThan(360);
      expect(mc).toBeGreaterThanOrEqual(0);
      expect(mc).toBeLessThan(360);
    });
  });
});
