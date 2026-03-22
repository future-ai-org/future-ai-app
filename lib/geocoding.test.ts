import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeCity } from "./geocoding";

describe("geocodeCity", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws when query is empty", async () => {
    await expect(geocodeCity("   ")).rejects.toThrow(/City not found/);
  });

  it("returns coordinates and offset from nominatim and timezone API", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return {
          ok: true,
          json: async () => [
            {
              lat: "40.7",
              lon: "-74.0",
              display_name: "New York, United States",
            },
          ],
        } as Response;
      }
      if (url.includes("/api/timezone")) {
        return {
          ok: true,
          json: async () => ({
            timeZone: "America/New_York",
            gmtOffset: -18000,
          }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const r = await geocodeCity("New York");
    expect(r.latitude).toBeCloseTo(40.7);
    expect(r.longitude).toBeCloseTo(-74);
    expect(r.displayName).toBe("New York");
    expect(r.timeZone).toBe("America/New_York");
    expect(r.utcOffset).toBe(-5);
  });

  it("uses longitude-based offset when timezone API omits offset", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return {
          ok: true,
          json: async () => [
            {
              lat: "51.5",
              lon: "-0.12",
              display_name: "London",
            },
          ],
        } as Response;
      }
      if (url.includes("/api/timezone")) {
        return {
          ok: true,
          json: async () => ({ timeZone: "Europe/London" }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const r = await geocodeCity("London");
    expect(r.utcOffset).toBe(Math.round(-0.12 / 15));
  });
});
