import { describe, it, expect } from "vitest";
import {
  getAspect,
  longitudeSeparation,
  orbFromExactSeparation,
  isWithinAspectOrb,
  aspectDisplayLongitude,
  aspectPairTrackKey,
  parseAspectPairTrackKey,
  ASPECTS,
} from "./aspects";

describe("aspects", () => {
  describe("getAspect / ASPECTS", () => {
    it("exposes angle and default orb per kind", () => {
      expect(getAspect("trine").angleDeg).toBe(120);
      expect(ASPECTS.conjunction.defaultOrbDeg).toBe(10);
    });
  });

  describe("longitudeSeparation", () => {
    it("returns shortest arc 0–180°", () => {
      expect(longitudeSeparation(0, 90)).toBe(90);
      expect(longitudeSeparation(350, 10)).toBe(20);
      expect(longitudeSeparation(10, 350)).toBe(20);
    });
  });

  describe("orbFromExactSeparation", () => {
    it("measures distance from exact aspect angle", () => {
      expect(orbFromExactSeparation(88, 90)).toBe(2);
      expect(orbFromExactSeparation(182, 180)).toBe(2);
    });
  });

  describe("isWithinAspectOrb", () => {
    it("respects custom orb", () => {
      const ok = isWithinAspectOrb(0, 5, ASPECTS.conjunction, 10);
      expect(ok).toBe(true);
      const no = isWithinAspectOrb(0, 20, ASPECTS.conjunction, 5);
      expect(no).toBe(false);
    });
  });

  describe("aspectDisplayLongitude", () => {
    it("returns midpoint on shorter arc", () => {
      const mid = aspectDisplayLongitude(0, 90);
      expect(mid).toBeCloseTo(45, 5);
    });
  });

  describe("aspectPairTrackKey / parseAspectPairTrackKey", () => {
    it("round-trips sorted pair", () => {
      const key = aspectPairTrackKey("square", "Mars", "Venus");
      expect(key).toMatch(/^square:Mars–Venus|square:Venus–Mars$/);
      const parsed = parseAspectPairTrackKey(key);
      expect(parsed).toEqual({ aspectId: "square", pair: "Mars–Venus" });
    });
    it("returns null for invalid track", () => {
      expect(parseAspectPairTrackKey("")).toBe(null);
      expect(parseAspectPairTrackKey("nope:a–b")).toBe(null);
    });
  });
});
