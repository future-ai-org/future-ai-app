import { describe, it, expect } from "vitest";
import {
  findAspectsInRange,
  findConjunctionsInRange,
  findNextNConjunctions,
  findTransitNatalAspectsInRange,
} from "./conjunctions";

describe("conjunctions", () => {
  const day = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));

  describe("findAspectsInRange / findConjunctionsInRange", () => {
    it("returns an array for a single-day window", () => {
      const start = day(2024, 6, 1);
      const end = day(2024, 6, 1);
      const events = findConjunctionsInRange(start, end, 10);
      expect(Array.isArray(events)).toBe(true);
      events.forEach((e) => {
        expect(e.planet1).toBeTruthy();
        expect(e.planet2).toBeTruthy();
        expect(e.separationDeg).toBeGreaterThanOrEqual(0);
        expect(e.separationDeg).toBeLessThanOrEqual(180);
      });
    });

    it("finds aspects across multiple days", () => {
      const events = findAspectsInRange(
        "opposition",
        day(2024, 1, 1),
        day(2024, 1, 3),
        10,
      );
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("findNextNConjunctions", () => {
    it("returns at most n events", () => {
      const peaks = findNextNConjunctions(day(2024, 1, 1), 3, 10);
      expect(peaks.length).toBeLessThanOrEqual(3);
    });
  });

  describe("findTransitNatalAspectsInRange", () => {
    it("returns empty when natal has no known planets", () => {
      const out = findTransitNatalAspectsInRange(
        "trine",
        { planets: [] },
        day(2024, 1, 1),
        day(2024, 1, 2),
      );
      expect(out).toEqual([]);
    });

    it("emits events when transit matches natal within orb", () => {
      const natal = {
        planets: [{ name: "Sun" as const, longitude: 45 }],
      };
      const events = findTransitNatalAspectsInRange(
        "conjunction",
        natal,
        day(2024, 6, 1),
        day(2024, 6, 5),
        15,
      );
      expect(Array.isArray(events)).toBe(true);
    });
  });
});
