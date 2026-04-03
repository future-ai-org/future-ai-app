import { describe, expect, it } from "vitest";

import {
  ASPECT_ORB_RAD,
  allPairwiseOrbiterAspects,
  aspectsFromOrbiter,
  aspectsFromSunGeo,
  classifyMajorAspect,
  geoEclipticRimPointXZ,
  heliocentricLongitude,
  moonPositionXZ,
  nextAspectPeakTimeSim,
  separationBetweenOrbiters,
  separationSunOrbiterGeo,
  smallestAngularSeparation,
  sunGeoLongitudeRad,
} from "./heliocentricAspects";

describe("smallestAngularSeparation", () => {
  it("returns 0 for identical angles", () => {
    expect(smallestAngularSeparation(1, 1)).toBe(0);
    expect(smallestAngularSeparation(0, 2 * Math.PI)).toBe(0);
  });

  it("returns π for opposite directions", () => {
    expect(smallestAngularSeparation(0, Math.PI)).toBeCloseTo(Math.PI);
    expect(smallestAngularSeparation(Math.PI / 4, (5 * Math.PI) / 4)).toBeCloseTo(Math.PI);
  });
});

describe("heliocentricLongitude", () => {
  it("advances with time for earth", () => {
    const a = heliocentricLongitude(0, "earth");
    const b = heliocentricLongitude(10, "earth");
    expect(b).toBeGreaterThan(a);
  });
});

describe("classifyMajorAspect", () => {
  it("classifies exact major angles", () => {
    expect(classifyMajorAspect(0)).toBe("conjunction");
    expect(classifyMajorAspect(Math.PI / 3)).toBe("sextile");
    expect(classifyMajorAspect(Math.PI / 2)).toBe("square");
    expect(classifyMajorAspect((2 * Math.PI) / 3)).toBe("trine");
    expect(classifyMajorAspect(Math.PI)).toBe("opposition");
  });

  it("returns null outside orb", () => {
    expect(classifyMajorAspect(Math.PI / 4)).toBeNull();
  });

  it("accepts values just inside orb", () => {
    const ε = ASPECT_ORB_RAD * 0.5;
    expect(classifyMajorAspect(ε)).toBe("conjunction");
    expect(classifyMajorAspect(Math.PI - ε)).toBe("opposition");
  });
});

describe("moonPositionXZ", () => {
  it("stays near earth orbit radius", () => {
    const m = moonPositionXZ(12);
    const r = Math.hypot(m.x, m.z);
    expect(r).toBeGreaterThan(10);
    expect(r).toBeLessThan(16);
  });
});

describe("aspectsFromOrbiter", () => {
  it("includes self only as anchor, never in others list", () => {
    const rows = aspectsFromOrbiter(0, "earth");
    expect(rows.every((r) => r.other !== "earth")).toBe(true);
  });
});

describe("geoEclipticRimPointXZ", () => {
  it("places the sun on the rim at geocentric longitude from Earth", () => {
    const T = 0.2;
    const R = 5;
    const ex = 10;
    const ez = -3;
    const p = geoEclipticRimPointXZ(T, "sun", ex, ez, R);
    const λ = sunGeoLongitudeRad(T);
    expect(p.x).toBeCloseTo(ex + R * Math.cos(λ));
    expect(p.z).toBeCloseTo(ez + R * Math.sin(λ));
  });
});

describe("aspectsFromSunGeo", () => {
  it("never lists earth as the other body", () => {
    const T = 0.1;
    const rows = aspectsFromSunGeo(T);
    expect(rows.every((r) => r.other !== "earth")).toBe(true);
  });

  it("matches Sun–body separation used for classification", () => {
    const T = 0.05;
    for (const row of aspectsFromSunGeo(T)) {
      const sep = separationSunOrbiterGeo(T, row.other);
      expect(classifyMajorAspect(sep)).toBe(row.kind);
    }
  });
});

describe("allPairwiseOrbiterAspects", () => {
  it("finds at least one pair in aspect over a time sweep", () => {
    let hits = 0;
    for (let t = 0; t < 900; t += 0.35) {
      if (allPairwiseOrbiterAspects(t).length > 0) hits++;
    }
    expect(hits).toBeGreaterThan(0);
  });
});

describe("separationBetweenOrbiters", () => {
  it("is symmetric", () => {
    const t = 40;
    expect(separationBetweenOrbiters(t, "earth", "mars")).toBeCloseTo(
      separationBetweenOrbiters(t, "mars", "earth"),
    );
  });
});

describe("nextAspectPeakTimeSim", () => {
  it("returns a future time for a planet pair in aspect", () => {
    const t0 = 12;
    const peak = nextAspectPeakTimeSim(t0, "mercury", "venus", "conjunction");
    expect(peak).not.toBeNull();
    if (peak != null) {
      expect(peak).toBeGreaterThanOrEqual(t0 - 3);
    }
  });
});
