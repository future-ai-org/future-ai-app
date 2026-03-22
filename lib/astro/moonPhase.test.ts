import { describe, it, expect } from "vitest";
import { getMoonPhaseInfo } from "./moonPhase";

describe("moonPhase", () => {
  it("returns structured phase info for a UTC date", () => {
    const info = getMoonPhaseInfo(new Date(Date.UTC(2024, 5, 15, 12, 0, 0)));
    expect(info.phaseName).toBeTruthy();
    expect(info.emoji).toBeTruthy();
    expect(info.daysSinceNew).toBeGreaterThanOrEqual(0);
    expect(info.daysSinceNew).toBeLessThan(30);
    expect(["new", "full"]).toContain(info.nextTarget);
    expect(info.daysToNext).toBeGreaterThan(0);
  });
});
