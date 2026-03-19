import type { ChartResult } from './types';
import { SIGN_GLYPHS, PLANET_GLYPHS } from './constants';
import { mod360 } from './math';

function signOf(lon: number): number {
  return Math.floor(lon / 30);
}

export type ChartWheelTheme = 'light' | 'dark';

const CHART_PADDING = 38;

export interface DrawChartWheelOptions {
  /** When false, ASC/DSC/MC/IC are not drawn (e.g. when birth time or place unknown). Default true. */
  showAngles?: boolean;
  /** When true, draw only ASC marker/label on the wheel. */
  showAscOnly?: boolean;
}

export function drawChartWheel(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  d: ChartResult,
  theme: ChartWheelTheme = 'dark',
  options: DrawChartWheelOptions = {},
): void {
  const { showAngles = true, showAscOnly = false } = options;
  const cx = W / 2;
  const cy = H / 2;
  const available = Math.min(W, H) - 2 * CHART_PADDING;
  const R = available / 2;
  const outerR = R;
  const zodiacW = R * 0.16;
  const innerZR = outerR - zodiacW;
  const houseBandOuter = innerZR;
  const houseBandInner = R * 0.38;
  const innerCircleR = R * 0.28;
  const isLight = theme === 'light';

  ctx.clearRect(0, 0, W, H);

  const ascNorm = mod360(d.asc);
  const wheelRef = Math.floor(ascNorm / 30) * 30;
  const drawCusps = Array.from({ length: 12 }, (_, h) => mod360(wheelRef + h * 30));

  // Longitude → canvas angle (radians). 0° = right (3 o'clock), π = left (9 o'clock = ASC side).
  // Same formula for wedges and planets so positions line up exactly.
  function eclToCanvas(lon: number): number {
    const lonNorm = mod360(lon);
    const diff = mod360(lonNorm - wheelRef + 360); // degrees from wheelRef, in [0, 360)
    const angle = Math.PI - (diff * Math.PI) / 180; // PI at wheelRef, decreasing clockwise
    return angle >= 0 ? angle : angle + 2 * Math.PI;
  }

  // ---- Background ----
  const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
  if (isLight) {
    bgGradient.addColorStop(0, '#faf8fc');
    bgGradient.addColorStop(0.5, '#f2eef8');
    bgGradient.addColorStop(1, '#e8e4f0');
  } else {
    bgGradient.addColorStop(0, '#1a1825');
    bgGradient.addColorStop(0.5, '#121118');
    bgGradient.addColorStop(1, '#0c0a0f');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.05, 0, 2 * Math.PI);
  ctx.fillStyle = bgGradient;
  ctx.fill();

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(100, 90, 130, 0.45)' : 'rgba(120, 110, 140, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 2, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.3)' : 'rgba(90, 82, 110, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- Zodiac band ----
  const zodiacFills = isLight
    ? [
        'rgba(200, 192, 220, 0.7)', 'rgba(210, 202, 228, 0.65)', 'rgba(190, 182, 212, 0.72)',
        'rgba(205, 198, 222, 0.68)', 'rgba(195, 186, 216, 0.7)', 'rgba(208, 200, 225, 0.66)',
        'rgba(188, 178, 208, 0.71)', 'rgba(202, 194, 218, 0.69)', 'rgba(198, 190, 214, 0.7)',
        'rgba(206, 198, 224, 0.67)', 'rgba(192, 184, 210, 0.71)', 'rgba(204, 196, 220, 0.68)',
      ]
    : [
        'rgba(80, 72, 100, 0.4)', 'rgba(100, 90, 120, 0.35)', 'rgba(60, 55, 75, 0.45)',
        'rgba(90, 80, 110, 0.38)', 'rgba(70, 65, 90, 0.42)', 'rgba(95, 85, 115, 0.36)',
        'rgba(65, 58, 82, 0.43)', 'rgba(85, 78, 105, 0.37)', 'rgba(75, 68, 95, 0.41)',
        'rgba(88, 82, 108, 0.38)', 'rgba(62, 56, 78, 0.44)', 'rgba(92, 86, 112, 0.36)',
      ];
  for (let h = 0; h < 12; h++) {
    const startAngle = eclToCanvas(drawCusps[h]);
    const endAngle = eclToCanvas(drawCusps[(h + 1) % 12]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
    ctx.arc(cx, cy, innerZR, endAngle, startAngle, false);
    ctx.closePath();
    ctx.fillStyle = zodiacFills[h];
    ctx.fill();
  }
  // Sign/house dividers
  for (let h = 0; h < 12; h++) {
    const a = eclToCanvas(drawCusps[h]);
    ctx.beginPath();
    ctx.moveTo(cx + innerZR * Math.cos(a), cy + innerZR * Math.sin(a));
    ctx.lineTo(cx + outerR * Math.cos(a), cy + outerR * Math.sin(a));
    ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.5)' : 'rgba(70, 65, 85, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Sign glyphs (dark purple)
  const zodiacGlyphColor = isLight ? '#2d1b4e' : '#8b7ab8';
  for (let h = 0; h < 12; h++) {
    const cusp = drawCusps[h];
    const nextCusp = drawCusps[(h + 1) % 12];
    const midLon = cusp + mod360(nextCusp - cusp) / 2;
    const midAngle = eclToCanvas(midLon);
    const glyphR = outerR - zodiacW * 0.5;
    const signIndex = signOf(drawCusps[h]);
    ctx.fillStyle = zodiacGlyphColor;
    ctx.font = `bold ${R * 0.082}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_GLYPHS[signIndex], cx + glyphR * Math.cos(midAngle), cy + glyphR * Math.sin(midAngle));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, innerZR, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(110, 100, 140, 0.5)' : 'rgba(100, 92, 120, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- House sectors ----
  const houseFill = isLight ? 'rgba(230, 224, 242, 0.95)' : 'rgba(45, 40, 58, 0.9)';
  for (let h = 0; h < 12; h++) {
    const startAngle = eclToCanvas(drawCusps[h]);
    const endAngle = eclToCanvas(drawCusps[(h + 1) % 12]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, houseBandOuter, startAngle, endAngle, false);
    ctx.arc(cx, cy, houseBandInner, endAngle, startAngle, false);
    ctx.closePath();
    ctx.fillStyle = houseFill;
    ctx.fill();
  }
  // House cusp lines
  drawCusps.forEach((cusp, i) => {
    const a = eclToCanvas(cusp);
    const isAngular = [0, 3, 6, 9].includes(i);
    ctx.beginPath();
    ctx.moveTo(cx + houseBandInner * Math.cos(a), cy + houseBandInner * Math.sin(a));
    ctx.lineTo(cx + houseBandOuter * Math.cos(a), cy + houseBandOuter * Math.sin(a));
    ctx.strokeStyle = isLight
      ? (isAngular ? 'rgba(100, 85, 150, 0.7)' : 'rgba(100, 90, 130, 0.55)')
      : (isAngular ? 'rgba(160, 148, 190, 0.75)' : 'rgba(85, 78, 100, 0.65)');
    ctx.lineWidth = isAngular ? 1.8 : 0.8;
    ctx.stroke();

    const nextCusp = drawCusps[(i + 1) % 12];
    const midLon = cusp + mod360(nextCusp - cusp) / 2;
    const midA = eclToCanvas(midLon);
    const numR = (innerCircleR + houseBandInner) * 0.5;
    ctx.fillStyle = isLight ? 'rgba(60, 50, 90, 0.95)' : 'rgba(190, 182, 210, 0.95)';
    ctx.font = `600 ${R * 0.048}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), cx + numR * Math.cos(midA), cy + numR * Math.sin(midA));
  });
  // Inner house circle
  ctx.beginPath();
  ctx.arc(cx, cy, houseBandInner, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.45)' : 'rgba(110, 100, 130, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Center circle ----
  ctx.beginPath();
  ctx.arc(cx, cy, innerCircleR, 0, 2 * Math.PI);
  ctx.fillStyle = isLight ? 'rgba(248, 246, 252, 0.98)' : 'rgba(18, 16, 26, 0.98)';
  ctx.fill();
  ctx.strokeStyle = isLight ? 'rgba(110, 100, 140, 0.4)' : 'rgba(100, 90, 125, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- ASC / DSC / MC / IC: small thin circles + labels (omit when showAngles false) ----
  if (showAngles) {
    const ascA = eclToCanvas(d.asc);
    const dotR = 3; // radius of each small circle
    ctx.strokeStyle = isLight ? 'rgba(80, 65, 120, 0.5)' : 'rgba(200, 190, 220, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    if (showAscOnly) {
      const x = cx + outerR * Math.cos(ascA);
      const y = cy + outerR * Math.sin(ascA);
      ctx.moveTo(x + dotR, y);
      ctx.arc(x, y, dotR, 0, 2 * Math.PI);
      ctx.stroke();

      const fontPx = Math.max(9, R * 0.032);
      const labelR = outerR + fontPx * 1.8;
      ctx.font = `700 ${fontPx}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLight ? 'rgba(70, 55, 110, 0.95)' : 'rgba(200, 190, 220, 0.95)';
      ctx.fillText('ASC', cx + labelR * Math.cos(ascA), cy + labelR * Math.sin(ascA));
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    } else {
      const mcA = eclToCanvas(d.mc);
      const axisAngles = [ascA, ascA + Math.PI, mcA, mcA + Math.PI];

      axisAngles.forEach((a) => {
        const x = cx + outerR * Math.cos(a);
        const y = cy + outerR * Math.sin(a);
        ctx.moveTo(x + dotR, y);
        ctx.arc(x, y, dotR, 0, 2 * Math.PI);
      });
      ctx.stroke();

      const fontPx = Math.max(9, R * 0.032);
      const labelR = outerR + fontPx * 1.8;
      ctx.font = `700 ${fontPx}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLight ? 'rgba(70, 55, 110, 0.95)' : 'rgba(200, 190, 220, 0.95)';
      ctx.fillText('ASC', cx + labelR * Math.cos(ascA), cy + labelR * Math.sin(ascA));
      ctx.fillText('DSC', cx - labelR * Math.cos(ascA), cy - labelR * Math.sin(ascA));
      ctx.fillStyle = isLight ? 'rgba(80, 65, 120, 0.9)' : 'rgba(185, 178, 205, 0.95)';
      ctx.fillText('MC', cx + labelR * Math.cos(mcA), cy + labelR * Math.sin(mcA));
      ctx.fillText('IC', cx - labelR * Math.cos(mcA), cy - labelR * Math.sin(mcA));
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  // ---- Planets and points (drawn last so they are never covered) ----
  const planetRBase = R * 0.76; // just inward so glyphs don’t touch innerZR (0.84R)
  const radialStep = R * 0.052; // stagger inward when multiple in same sign; larger step = more space between rings
  type Placement = { name: string; longitude: number; retrograde: boolean };
  const allPlacements: Placement[] = [
    ...d.planets.map(p => ({ name: p.name, longitude: p.longitude, retrograde: p.retrograde })),
    ...(d.points ?? []).map(p => ({ name: p.name, longitude: p.longitude, retrograde: p.retrograde ?? false })),
  ];

  // Group by sign; within each sign sort by longitude for stable radial order (outer = first by degree)
  const signGroups = new Map<number, { p: Placement; lon: number }[]>();
  for (const p of allPlacements) {
    const rawLon = Number.isFinite(p.longitude) ? p.longitude : 0;
    const lon = mod360(rawLon);
    const signIdx = signOf(lon);
    const list = signGroups.get(signIdx) ?? [];
    list.push({ p, lon });
    signGroups.set(signIdx, list);
  }
  for (const list of signGroups.values()) {
    list.sort((a, b) => a.lon - b.lon);
  }

  // Draw order: outer rings first so inner labels aren’t covered
  const drawOrder = [...allPlacements].sort((a, b) => {
    const sa = signOf(mod360(Number.isFinite(a.longitude) ? a.longitude : 0));
    const sb = signOf(mod360(Number.isFinite(b.longitude) ? b.longitude : 0));
    if (sa !== sb) return sa - sb;
    const listA = signGroups.get(sa) ?? [];
    const listB = signGroups.get(sb) ?? [];
    const ia = listA.findIndex((e) => e.p === a);
    const ib = listB.findIndex((e) => e.p === b);
    return ia - ib;
  });

  const wedgeMargin = 2.8; // degrees: keep glyphs inside the wedge and add space from cusp lines
  const wedgeCenterLon = (signIdx: number) => signIdx * 30 + 15;

  drawOrder.forEach((p) => {
    const rawLon = Number.isFinite(p.longitude) ? p.longitude : 0;
    const lon = mod360(rawLon);
    const signIdx = signOf(lon);
    const list = signGroups.get(signIdx) ?? [];
    const n = list.length;
    const indexInSign = list.findIndex((e) => e.p === p);
    const i = indexInSign >= 0 ? indexInSign : 0;

    // Single radius for the whole sign so the group sits symmetrically in the wedge
    const radiusOffset = n <= 1 ? 0 : (n - 1) * radialStep * 0.5;
    const planetR = planetRBase - radiusOffset;

    // Angular position: 1 = center of wedge; 2+ = spread evenly inside the wedge
    const wedgeCenter = wedgeCenterLon(signIdx);
    const spreadDeg = 30 - 2 * wedgeMargin;
    const lonForAngle =
      n <= 1
        ? wedgeCenter
        : wedgeCenter + (i - (n - 1) / 2) * (spreadDeg / Math.max(1, n - 1));
    const angle = eclToCanvas(lonForAngle);

    const glyph = PLANET_GLYPHS[p.name] ?? p.name.charAt(0);
    ctx.fillStyle = isLight ? '#2d2640' : '#e0d8f0';
    ctx.font = `${R * 0.078}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, cx + planetR * Math.cos(angle), cy + planetR * Math.sin(angle));
  });
}

/** Bi-wheel: outer = transit chart (current sky), inner = natal chart. Signs aligned (same tropical zodiac). */
export function drawTransitWheel(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  natal: ChartResult,
  transit: ChartResult,
  theme: ChartWheelTheme = 'dark',
): void {
  const cx = W / 2;
  const cy = H / 2;
  const available = Math.min(W, H) - 2 * CHART_PADDING;
  const R = available / 2;
  const isLight = theme === 'light';

  // Radii: outer zodiac, transit ring, divider, inner zodiac, house band, center
  const zodiacW = R * 0.12;
  const outerZodiacInner = R - zodiacW;
  const transitPlanetR = outerZodiacInner - R * 0.06;
  const innerWheelOuterR = R * 0.58;
  const innerZodiacW = R * 0.12;
  const innerZodiacInner = innerWheelOuterR - innerZodiacW;
  const houseBandInner = R * 0.22;
  const innerCircleR = R * 0.16;

  ctx.clearRect(0, 0, W, H);

  // Shared zodiac reference (tropical, 0° = aries)
  const wheelRef = 0;
  const drawCusps = Array.from({ length: 12 }, (_, h) => (wheelRef + h * 30) % 360);

  function eclToCanvas(lon: number): number {
    const lonNorm = mod360(lon);
    const diff = mod360(lonNorm - wheelRef + 360);
    const angle = Math.PI - (diff * Math.PI) / 180;
    return angle >= 0 ? angle : angle + 2 * Math.PI;
  }

  // ---- Background ----
  const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
  if (isLight) {
    bgGradient.addColorStop(0, '#faf8fc');
    bgGradient.addColorStop(0.5, '#f2eef8');
    bgGradient.addColorStop(1, '#e8e4f0');
  } else {
    bgGradient.addColorStop(0, '#1a1825');
    bgGradient.addColorStop(0.5, '#121118');
    bgGradient.addColorStop(1, '#0c0a0f');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.05, 0, 2 * Math.PI);
  ctx.fillStyle = bgGradient;
  ctx.fill();

  // ---- Outer circle + outer zodiac band ----
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(100, 90, 130, 0.45)' : 'rgba(120, 110, 140, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const zodiacFills = isLight
    ? [
        'rgba(200, 192, 220, 0.7)', 'rgba(210, 202, 228, 0.65)', 'rgba(190, 182, 212, 0.72)',
        'rgba(205, 198, 222, 0.68)', 'rgba(195, 186, 216, 0.7)', 'rgba(208, 200, 225, 0.66)',
        'rgba(188, 178, 208, 0.71)', 'rgba(202, 194, 218, 0.69)', 'rgba(198, 190, 214, 0.7)',
        'rgba(206, 198, 224, 0.67)', 'rgba(192, 184, 210, 0.71)', 'rgba(204, 196, 220, 0.68)',
      ]
    : [
        'rgba(80, 72, 100, 0.4)', 'rgba(100, 90, 120, 0.35)', 'rgba(60, 55, 75, 0.45)',
        'rgba(90, 80, 110, 0.38)', 'rgba(70, 65, 90, 0.42)', 'rgba(95, 85, 115, 0.36)',
        'rgba(65, 58, 82, 0.43)', 'rgba(85, 78, 105, 0.37)', 'rgba(75, 68, 95, 0.41)',
        'rgba(88, 82, 108, 0.38)', 'rgba(62, 56, 78, 0.44)', 'rgba(92, 86, 112, 0.36)',
      ];
  for (let h = 0; h < 12; h++) {
    const startAngle = eclToCanvas(drawCusps[h]);
    const endAngle = eclToCanvas(drawCusps[(h + 1) % 12]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle, false);
    ctx.arc(cx, cy, outerZodiacInner, endAngle, startAngle, false);
    ctx.closePath();
    ctx.fillStyle = zodiacFills[h];
    ctx.fill();
  }
  // Ring where transit planets sit: same solid color as inner house band (your chart’s planet ring)
  const planetRingFill = isLight ? 'rgba(230, 224, 242, 0.95)' : 'rgba(45, 40, 58, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, outerZodiacInner, 0, 2 * Math.PI);
  ctx.arc(cx, cy, innerWheelOuterR, 0, 2 * Math.PI, true);
  ctx.fillStyle = planetRingFill;
  ctx.fill('evenodd');
  // Radial dividers for the full outer chart (zodiac band + transit ring), from inner edge to R
  for (let h = 0; h < 12; h++) {
    const a = eclToCanvas(drawCusps[h]);
    ctx.beginPath();
    ctx.moveTo(cx + innerWheelOuterR * Math.cos(a), cy + innerWheelOuterR * Math.sin(a));
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.5)' : 'rgba(70, 65, 85, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const zodiacGlyphColor = isLight ? '#2d1b4e' : '#8b7ab8';
  for (let h = 0; h < 12; h++) {
    const cusp = drawCusps[h];
    const nextCusp = drawCusps[(h + 1) % 12];
    const midLon = cusp + mod360(nextCusp - cusp) / 2;
    const midAngle = eclToCanvas(midLon);
    const glyphR = R - zodiacW * 0.5;
    ctx.fillStyle = zodiacGlyphColor;
    ctx.font = `bold ${R * 0.065}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_GLYPHS[h], cx + glyphR * Math.cos(midAngle), cy + glyphR * Math.sin(midAngle));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, outerZodiacInner, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(110, 100, 140, 0.5)' : 'rgba(100, 92, 120, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Transit planets (outer ring) ----
  type Placement = { name: string; longitude: number; retrograde: boolean };
  const transitPlacements: Placement[] = transit.planets.map(p => ({ name: p.name, longitude: p.longitude, retrograde: p.retrograde }));
  const radialStep = R * 0.04;
  const signGroupsTransit = new Map<number, { p: Placement; lon: number }[]>();
  for (const p of transitPlacements) {
    const lon = mod360(Number.isFinite(p.longitude) ? p.longitude : 0);
    const signIdx = signOf(lon);
    const list = signGroupsTransit.get(signIdx) ?? [];
    list.push({ p, lon });
    signGroupsTransit.set(signIdx, list);
  }
  for (const list of signGroupsTransit.values()) list.sort((a, b) => a.lon - b.lon);
  const wedgeCenterLon = (signIdx: number) => signIdx * 30 + 15;
  const wedgeMargin = 2.8;
  transitPlacements.forEach((p) => {
    const lon = mod360(Number.isFinite(p.longitude) ? p.longitude : 0);
    const signIdx = signOf(lon);
    const list = signGroupsTransit.get(signIdx) ?? [];
    const n = list.length;
    const indexInSign = list.findIndex((e) => e.p === p);
    const i = indexInSign >= 0 ? indexInSign : 0;
    const radiusOffset = n <= 1 ? 0 : (n - 1) * radialStep * 0.5;
    const planetR = transitPlanetR - radiusOffset;
    const wedgeCenter = wedgeCenterLon(signIdx);
    const spreadDeg = 30 - 2 * wedgeMargin;
    const lonForAngle = n <= 1 ? wedgeCenter : wedgeCenter + (i - (n - 1) / 2) * (spreadDeg / Math.max(1, n - 1));
    const angle = eclToCanvas(lonForAngle);
    const glyph = PLANET_GLYPHS[p.name] ?? p.name.charAt(0);
    ctx.fillStyle = isLight ? '#2d2640' : '#e0d8f0';
    ctx.font = `${R * 0.062}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, cx + planetR * Math.cos(angle), cy + planetR * Math.sin(angle));
  });

  // ---- Divider circle (between transit and natal) ----
  ctx.beginPath();
  ctx.arc(cx, cy, innerWheelOuterR, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.6)' : 'rgba(140, 130, 170, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Inner (natal) wheel: same sign divisions as outer (0°, 30°, 60°...) so everything aligns ----
  const risingSignIndex = signOf(natal.asc); // whole-sign: house 1 = this sign, house 2 = next, etc.
  const innerZodiacFills = isLight
    ? ['rgba(200, 192, 220, 0.6)', 'rgba(210, 202, 228, 0.55)', 'rgba(190, 182, 212, 0.62)', 'rgba(205, 198, 222, 0.58)', 'rgba(195, 186, 216, 0.6)', 'rgba(208, 200, 225, 0.56)', 'rgba(188, 178, 208, 0.61)', 'rgba(202, 194, 218, 0.59)', 'rgba(198, 190, 214, 0.6)', 'rgba(206, 198, 224, 0.57)', 'rgba(192, 184, 210, 0.61)', 'rgba(204, 196, 220, 0.58)']
    : ['rgba(80, 72, 100, 0.35)', 'rgba(100, 90, 120, 0.3)', 'rgba(60, 55, 75, 0.4)', 'rgba(90, 80, 110, 0.33)', 'rgba(70, 65, 90, 0.37)', 'rgba(95, 85, 115, 0.31)', 'rgba(65, 58, 82, 0.38)', 'rgba(85, 78, 105, 0.32)', 'rgba(75, 68, 95, 0.36)', 'rgba(88, 82, 108, 0.33)', 'rgba(62, 56, 78, 0.39)', 'rgba(92, 86, 112, 0.31)'];
  // Inner zodiac band (sign wedges aligned with outer)
  for (let h = 0; h < 12; h++) {
    const startAngle = eclToCanvas(drawCusps[h]);
    const endAngle = eclToCanvas(drawCusps[(h + 1) % 12]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, innerWheelOuterR, startAngle, endAngle, false);
    ctx.arc(cx, cy, innerZodiacInner, endAngle, startAngle, false);
    ctx.closePath();
    ctx.fillStyle = innerZodiacFills[h];
    ctx.fill();
  }
  // Radial dividers for inner zodiac (same angles as outer)
  for (let h = 0; h < 12; h++) {
    const a = eclToCanvas(drawCusps[h]);
    ctx.beginPath();
    ctx.moveTo(cx + innerZodiacInner * Math.cos(a), cy + innerZodiacInner * Math.sin(a));
    ctx.lineTo(cx + innerWheelOuterR * Math.cos(a), cy + innerWheelOuterR * Math.sin(a));
    ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.5)' : 'rgba(70, 65, 85, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Sign glyphs in inner band (same positions as outer)
  for (let h = 0; h < 12; h++) {
    const cusp = drawCusps[h];
    const nextCusp = drawCusps[(h + 1) % 12];
    const midLon = cusp + mod360(nextCusp - cusp) / 2;
    const midAngle = eclToCanvas(midLon);
    const glyphR = innerWheelOuterR - innerZodiacW * 0.5;
    ctx.fillStyle = zodiacGlyphColor;
    ctx.font = `bold ${R * 0.048}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_GLYPHS[h], cx + glyphR * Math.cos(midAngle), cy + glyphR * Math.sin(midAngle));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, innerZodiacInner, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(110, 100, 140, 0.5)' : 'rgba(100, 92, 120, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Inner house band: same sign boundaries (so pie aligns); house numbers by whole-sign (1 = rising sign) ----
  const houseFill = isLight ? 'rgba(230, 224, 242, 0.95)' : 'rgba(45, 40, 58, 0.9)';
  for (let h = 0; h < 12; h++) {
    const startAngle = eclToCanvas(drawCusps[h]);
    const endAngle = eclToCanvas(drawCusps[(h + 1) % 12]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, innerZodiacInner, startAngle, endAngle, false);
    ctx.arc(cx, cy, houseBandInner, endAngle, startAngle, false);
    ctx.closePath();
    ctx.fillStyle = houseFill;
    ctx.fill();
  }
  for (let h = 0; h < 12; h++) {
    const a = eclToCanvas(drawCusps[h]);
    ctx.beginPath();
    ctx.moveTo(cx + houseBandInner * Math.cos(a), cy + houseBandInner * Math.sin(a));
    ctx.lineTo(cx + innerZodiacInner * Math.cos(a), cy + innerZodiacInner * Math.sin(a));
    ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.5)' : 'rgba(70, 65, 85, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (let h = 0; h < 12; h++) {
    const houseNum = 1 + (h - risingSignIndex + 12) % 12;
    const midLon = drawCusps[h] + 15;
    const midA = eclToCanvas(midLon);
    const numR = (innerCircleR + houseBandInner) * 0.5;
    ctx.fillStyle = isLight ? 'rgba(60, 50, 90, 0.95)' : 'rgba(190, 182, 210, 0.95)';
    ctx.font = `600 ${R * 0.036}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(houseNum), cx + numR * Math.cos(midA), cy + numR * Math.sin(midA));
  }
  ctx.beginPath();
  ctx.arc(cx, cy, houseBandInner, 0, 2 * Math.PI);
  ctx.strokeStyle = isLight ? 'rgba(120, 110, 150, 0.45)' : 'rgba(110, 100, 130, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Center circle ----
  ctx.beginPath();
  ctx.arc(cx, cy, innerCircleR, 0, 2 * Math.PI);
  ctx.fillStyle = isLight ? 'rgba(248, 246, 252, 0.98)' : 'rgba(18, 16, 26, 0.98)';
  ctx.fill();
  ctx.strokeStyle = isLight ? 'rgba(110, 100, 140, 0.4)' : 'rgba(100, 90, 125, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- Natal planets (inner ring) at exact longitude so chart is correct and aligned with signs ----
  const natalPlacements: Placement[] = [
    ...natal.planets.map(p => ({ name: p.name, longitude: p.longitude, retrograde: p.retrograde })),
    ...(natal.points ?? []).map(p => ({ name: p.name, longitude: p.longitude, retrograde: p.retrograde ?? false })),
  ];
  const natalPlanetRBase = innerZodiacInner - R * 0.03;
  const natalRadialStep = R * 0.028;
  const signGroupsNatal = new Map<number, { p: Placement; lon: number }[]>();
  for (const p of natalPlacements) {
    const lon = mod360(Number.isFinite(p.longitude) ? p.longitude : 0);
    const signIdx = signOf(lon);
    const list = signGroupsNatal.get(signIdx) ?? [];
    list.push({ p, lon });
    signGroupsNatal.set(signIdx, list);
  }
  for (const list of signGroupsNatal.values()) list.sort((a, b) => a.lon - b.lon);
  natalPlacements.forEach((p) => {
    const lon = mod360(Number.isFinite(p.longitude) ? p.longitude : 0);
    const signIdx = signOf(lon);
    const list = signGroupsNatal.get(signIdx) ?? [];
    const n = list.length;
    const radiusOffset = n <= 1 ? 0 : (n - 1) * natalRadialStep * 0.5;
    const planetR = natalPlanetRBase - radiusOffset;
    const angle = eclToCanvas(lon);
    const glyph = PLANET_GLYPHS[p.name] ?? p.name.charAt(0);
    ctx.fillStyle = isLight ? '#2d2640' : '#c8b8e0';
    ctx.font = `${R * 0.045}px "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, cx + planetR * Math.cos(angle), cy + planetR * Math.sin(angle));
  });
}
