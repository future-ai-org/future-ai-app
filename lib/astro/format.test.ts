import { describe, it, expect } from "vitest";
import { signOf, degInSign, formatLon } from "./format";

describe("format", () => {
  describe("signOf", () => {
    it("returns 0 for 0° (Aries)", () => {
      expect(signOf(0)).toBe(0);
      expect(signOf(29.99)).toBe(0);
    });
    it("returns sign index for 30° steps", () => {
      expect(signOf(30)).toBe(1);
      expect(signOf(60)).toBe(2);
      expect(signOf(90)).toBe(3);
      expect(signOf(330)).toBe(11);
    });
    it("handles negative longitude by flooring", () => {
      expect(signOf(-1)).toBe(-1); // -1/30 = -0.033, floor = -1
    });
  });

  describe("degInSign", () => {
    it("returns degrees within 0-30", () => {
      expect(degInSign(0)).toBe(0);
      expect(degInSign(30)).toBe(0);
      expect(degInSign(45)).toBe(15);
      expect(degInSign(359)).toBe(29);
    });
  });

  describe("formatLon", () => {
    it("formats longitude with sign name and glyph", () => {
      const r = formatLon(0);
      expect(r.sign).toBe("Aries");
      expect(r.glyph).toBe("♈");
      expect(r.deg).toBe(0);
      expect(r.min).toBe(0);
      expect(r.full).toMatch(/0°0' ♈/);
    });
    it("formats 45° as 15° in Taurus", () => {
      const r = formatLon(45);
      expect(r.sign).toBe("Taurus");
      expect(r.glyph).toBe("♉");
      expect(r.deg).toBe(15);
      expect(r.full).toMatch(/15°0' ♉/);
    });
    it("includes minutes when fractional", () => {
      const r = formatLon(12.5); // 12°30' Aries
      expect(r.sign).toBe("Aries");
      expect(r.deg).toBe(12);
      expect(r.min).toBe(30);
    });
  });
});
