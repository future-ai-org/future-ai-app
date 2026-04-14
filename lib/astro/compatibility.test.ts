import { describe, it, expect } from "vitest";
import { computeCompatibility, planetGlyph } from "./compatibility";
import { getSymmetricPlacementScore } from "./compatibilityInterpretations";
import type { ChartResult, BirthData } from "./types";

function minimalChart(asc: number, label: string): ChartResult {
  const birth: BirthData = {
    date: "1990-01-01",
    time: "12:00",
    latitude: 0,
    longitude: 0,
    utcOffset: 0,
    cityLabel: label,
  };
  return {
    asc,
    mc: 0,
    obliquity: 23.4,
    cusps: Array.from({ length: 12 }, (_, i) => (asc + i * 30) % 360),
    planets: [
      { name: "Sun", longitude: 10, retrograde: false, house: 1 },
      { name: "Moon", longitude: 100, retrograde: false, house: 4 },
    ],
    birthData: birth,
  };
}

describe("compatibility", () => {
  it("maps each chart’s planets into the other’s houses", () => {
    const a = minimalChart(0, "A");
    const b = minimalChart(90, "B");
    const r = computeCompatibility(a, b, "You", "Them");
    expect(r.chartALabel).toBe("You");
    expect(r.chartBLabel).toBe("Them");
    expect(r.aInB).toHaveLength(2);
    expect(r.bInA).toHaveLength(2);
    expect(r.aInB[0].inSign).toBeTruthy();
    expect(r.aInB[0].glyph).toBeTruthy();
  });

  describe("planetGlyph", () => {
    it("uses glyph map when present", () => {
      expect(planetGlyph("Sun")).toBeTruthy();
    });
    it("falls back to first letter for unknown names", () => {
      expect(planetGlyph("Xyzzy")).toBe("X");
    });
  });

  describe("getSymmetricPlacementScore", () => {
    it("uses 8 for earth–water or fire–air (complementary) element pairs", () => {
      expect(
        getSymmetricPlacementScore("Sun", 6, 12, undefined, "complementary").score,
      ).toBe(8);
      expect(
        getSymmetricPlacementScore("Venus", 1, 1, undefined, "complementary").score,
      ).toBe(8);
    });
  });
});
