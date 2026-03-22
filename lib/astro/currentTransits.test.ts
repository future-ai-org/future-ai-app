import { describe, it, expect } from "vitest";
import { getCurrentTransits } from "./currentTransits";

describe("currentTransits", () => {
  it("returns all major planets with sign and degree", () => {
    const rows = getCurrentTransits(new Date(Date.UTC(2024, 3, 22, 12, 0, 0)));
    expect(rows).toHaveLength(10);
    const names = rows.map((r) => r.planet).sort();
    expect(names[0]).toBe("Jupiter");
    rows.forEach((r) => {
      expect(r.sign.length).toBeGreaterThan(0);
      expect(r.degree).toBeGreaterThanOrEqual(0);
      expect(r.degree).toBeLessThan(30);
      expect(typeof r.retrograde).toBe("boolean");
    });
  });
});
