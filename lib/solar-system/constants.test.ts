import { describe, expect, it } from "vitest";

import {
  ANIMATION_SPEED,
  BODY_RADIUS,
  EARTH_YEAR_SECONDS,
  ORBIT,
  ORBIT_PHASE,
  ORBITAL_PERIOD_YEARS,
  ORBITERS_IN_ORDER,
  PLANETS_IN_ORDER,
  PLANET_SPIN_SCALE,
  SPIN_BOOST,
  SUN_RADIUS,
  TEXTURES,
} from "./constants";

describe("solar-system constants", () => {
  it("keeps planets ordered by orbit radius", () => {
    const radii = Object.values(ORBIT);
    const sorted = [...radii].sort((a, b) => a - b);
    expect(radii).toEqual(sorted);
  });

  it("uses earth orbital period as 1 year relative to other planets", () => {
    expect(ORBITAL_PERIOD_YEARS.earth).toBe(1);
    expect(ORBITAL_PERIOD_YEARS.mercury).toBeLessThan(ORBITAL_PERIOD_YEARS.earth);
    expect(ORBITAL_PERIOD_YEARS.neptune).toBeGreaterThan(ORBITAL_PERIOD_YEARS.earth);
  });

  it("keeps positive scene scales", () => {
    expect(SUN_RADIUS).toBeGreaterThan(0);
    expect(EARTH_YEAR_SECONDS).toBeGreaterThan(0);
    expect(SPIN_BOOST).toBeGreaterThan(0);
    expect(PLANET_SPIN_SCALE).toBeGreaterThan(0);
    expect(PLANET_SPIN_SCALE).toBeLessThanOrEqual(1);
    expect(ANIMATION_SPEED).toBeGreaterThan(0);
    expect(ANIMATION_SPEED).toBeLessThanOrEqual(1);
    for (const r of Object.values(BODY_RADIUS)) {
      expect(r).toBeGreaterThan(0);
    }
  });

  it("aligns orbit phase keys with orbit radii", () => {
    expect(Object.keys(ORBIT_PHASE).sort()).toEqual(Object.keys(ORBIT).sort());
    expect(PLANETS_IN_ORDER.length).toBe(Object.keys(ORBIT).length);
    for (const p of PLANETS_IN_ORDER) {
      expect(ORBIT[p]).toBeDefined();
      expect(ORBIT_PHASE[p]).toBeDefined();
    }
    expect(ORBITERS_IN_ORDER.length).toBe(PLANETS_IN_ORDER.length + 1);
    expect(ORBITERS_IN_ORDER.at(-1)).toBe("moon");
  });

  it("points texture URLs at public solar-system assets", () => {
    for (const url of Object.values(TEXTURES)) {
      expect(url).toMatch(/^\/solar-system\/textures\//);
    }
    expect(TEXTURES.earthDay).toContain("earth_day_4096");
  });
});
