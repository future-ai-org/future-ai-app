import { describe, it, expect, vi } from "vitest";
import { drawChartWheel, drawTransitWheel } from "./draw";
import type { ChartResult, BirthData } from "./types";

function mockCanvasContext(): CanvasRenderingContext2D {
  const chain = {
    addColorStop: vi.fn(),
  };
  return {
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => chain),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function minimalChart(asc: number): ChartResult {
  const birth: BirthData = {
    date: "1990-06-01",
    time: "12:00",
    latitude: 40,
    longitude: -74,
    utcOffset: -4,
    cityLabel: "Test",
  };
  const planets = [
    { name: "Sun" as const, longitude: 70, retrograde: false, house: 3 },
    { name: "Moon" as const, longitude: 100, retrograde: false, house: 4 },
  ];
  return {
    asc,
    mc: 200,
    obliquity: 23.4,
    cusps: Array.from({ length: 12 }, (_, i) => (asc + i * 30) % 360),
    planets,
    birthData: birth,
  };
}

describe("draw", () => {
  it("drawChartWheel runs without throwing", () => {
    const ctx = mockCanvasContext();
    const chart = minimalChart(30);
    expect(() =>
      drawChartWheel(ctx, 400, 400, chart, "dark", { showAngles: true }),
    ).not.toThrow();
  });

  it("drawTransitWheel runs without throwing", () => {
    const ctx = mockCanvasContext();
    const natal = minimalChart(15);
    const transit = minimalChart(15);
    expect(() => drawTransitWheel(ctx, 400, 400, natal, transit, "light")).not.toThrow();
  });
});
