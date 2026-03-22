import { describe, it, expect } from "vitest";
import { calculateChart } from "./calculate";
import type { BirthData } from "./types";

const denver: BirthData = {
  date: "2000-06-15",
  time: "12:00",
  latitude: 39.7,
  longitude: -104.9,
  utcOffset: -6,
  cityLabel: "Denver",
};

describe("calculateChart", () => {
  it("returns planets, cusps, angles, and obliquity", () => {
    const r = calculateChart(denver);
    expect(r.planets).toHaveLength(10);
    expect(r.cusps).toHaveLength(12);
    expect(r.asc).toBeGreaterThanOrEqual(0);
    expect(r.asc).toBeLessThan(360);
    expect(r.mc).toBeGreaterThanOrEqual(0);
    expect(r.mc).toBeLessThan(360);
    expect(r.obliquity).toBeGreaterThan(22);
    expect(r.obliquity).toBeLessThan(25);
    r.planets.forEach((p) => {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    });
  });

  it("throws for invalid birth year", () => {
    expect(() =>
      calculateChart({ ...denver, date: "2200-01-01" }),
    ).toThrow(/Birth date year/);
  });

  it("uses ascendant override when provided", () => {
    const r = calculateChart(denver, {}, { ascendant: 45 });
    expect(r.asc).toBe(45);
  });

  it("sets calculation metadata when ascendant angle unknown", () => {
    const r = calculateChart(denver, {}, {
      ascendant: 45,
      ascendantAngleUnknown: true,
    });
    expect(r.calculation?.ascendantAngleUnknown).toBe(true);
  });

  it("includes optional points when options enabled", () => {
    const r = calculateChart(denver, {
      northNode: true,
      lotOfFortune: true,
    });
    const names = r.points?.map((p) => p.name) ?? [];
    expect(names).toContain("North Node");
    expect(names).toContain("Lot of Fortune");
  });
});
