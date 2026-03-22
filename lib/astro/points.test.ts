import { describe, it, expect } from "vitest";
import {
  northNodePosition,
  southNodePosition,
  lilithPosition,
  isDayBirth,
  lotOfFortune,
  lotOfSpirit,
  lotOfErosWithDayNight,
  lotOfVictoryWithDayNight,
  computePoints,
} from "./points";
import { mod360 } from "./math";
import { wholeSignHouses } from "./houses";

describe("points", () => {
  describe("nodes", () => {
    it("south node is north node + 180°", () => {
      const T = 0.1;
      expect(mod360(southNodePosition(T) - northNodePosition(T))).toBeCloseTo(180, 5);
    });
  });

  describe("lilithPosition", () => {
    it("returns longitude in range", () => {
      const lon = lilithPosition(0);
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(360);
    });
  });

  describe("isDayBirth / lots", () => {
    const asc = 0;
    const sun = 270;
    const moon = 100;
    it("classifies day vs night from Sun relative to ASC", () => {
      expect(isDayBirth(sun, asc)).toBe(true);
      expect(isDayBirth(90, asc)).toBe(false);
    });
    it("lotOfFortune and lotOfSpirit differ by day/night formula", () => {
      const dayFortune = lotOfFortune(asc, sun, moon);
      const daySpirit = lotOfSpirit(asc, sun, moon);
      expect(dayFortune).not.toBe(daySpirit);
    });
    it("Eros and Victory use explicit day flag", () => {
      const spirit = lotOfSpirit(asc, sun, moon);
      const venus = 50;
      const jupiter = 200;
      const erosDay = lotOfErosWithDayNight(asc, spirit, venus, true);
      const erosNight = lotOfErosWithDayNight(asc, spirit, venus, false);
      expect(erosDay).not.toBe(erosNight);
      const vicDay = lotOfVictoryWithDayNight(asc, spirit, jupiter, true);
      const vicNight = lotOfVictoryWithDayNight(asc, spirit, jupiter, false);
      expect(vicDay).not.toBe(vicNight);
    });
  });

  describe("computePoints", () => {
    const base = {
      T: 0,
      asc: 15,
      cusps: wholeSignHouses(15),
      sunLon: 100,
      moonLon: 200,
      venusLon: 50,
      jupiterLon: 120,
    };

    it("returns empty array when no options", () => {
      expect(computePoints(base, {})).toEqual([]);
    });

    it("includes requested point kinds", () => {
      const pts = computePoints(base, {
        northNode: true,
        southNode: true,
        lilith: true,
        juno: true,
        chiron: true,
        lotOfFortune: true,
        lotOfSpirit: true,
        lotOfEros: true,
        lotOfVictory: true,
      });
      const names = pts.map((p) => p.name).sort();
      expect(names).toEqual([
        "Chiron",
        "Juno",
        "Lilith",
        "Lot of Eros",
        "Lot of Fortune",
        "Lot of Spirit",
        "Lot of Victory",
        "North Node",
        "South Node",
      ]);
      pts.forEach((p) => {
        expect(p.longitude).toBeGreaterThanOrEqual(0);
        expect(p.longitude).toBeLessThan(360);
        expect(p.house).toBeGreaterThanOrEqual(1);
        expect(p.house).toBeLessThanOrEqual(12);
      });
    });
  });
});
