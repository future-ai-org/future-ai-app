import type { ChartResult } from './types';
import { SIGN_GLYPHS, SIGN_COLORS, SIGNS, ELEMENT_COLORS, PLANET_GLYPHS } from './constants';
import { mod360 } from './math';

function signOf(lon: number): number {
  return Math.floor(lon / 30);
}

export function drawChartWheel(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  d: ChartResult,
): void {
  const cx = W / 2;
  const cy = H / 2;
  const R = W / 2 - 10;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fill();

  // ---- Draw zodiac wheel ----
  const outerR = R;
  const zodiacW = R * 0.18;
  const innerZR = outerR - zodiacW;

  // Zodiac sign sectors (12 equal 30° sectors)
  const ascDeg = d.asc;

  function eclToCanvas(lon: number): number {
    // ASC is at 9 o'clock (left, 180°), signs go counter-clockwise
    const angle = -(lon - ascDeg) * (Math.PI / 180) + Math.PI;
    return angle;
  }

  const elementColors: Record<string, string> = {
    fire: '#3a1515',
    earth: '#1a2a1a',
    air: '#1a1a2a',
    water: '#15152a',
  };
  const elementNames = ['fire', 'earth', 'air', 'water'];

  for (let s = 0; s < 12; s++) {
    const startAngle = eclToCanvas(s * 30);
    const endAngle   = eclToCanvas((s + 1) * 30);
    const elem = elementNames[s % 4];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, endAngle, true);
    ctx.closePath();
    ctx.fillStyle = elementColors[elem];
    ctx.fill();

    // Sign glyph
    const midAngle = eclToCanvas(s * 30 + 15);
    const glyphR = outerR - zodiacW * 0.5;
    ctx.fillStyle = ELEMENT_COLORS[s];
    ctx.font = `${R * 0.09}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SIGN_GLYPHS[s], cx + glyphR * Math.cos(midAngle), cy + glyphR * Math.sin(midAngle));
  }

  // Zodiac inner border
  ctx.beginPath();
  ctx.arc(cx, cy, innerZR, 0, 2 * Math.PI);
  ctx.strokeStyle = '#3a3470';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Zodiac outer border
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 1, 0, 2 * Math.PI);
  ctx.strokeStyle = '#3a3470';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Zodiac sign dividers (30° lines in zodiac band)
  for (let s = 0; s < 12; s++) {
    const a = eclToCanvas(s * 30);
    ctx.beginPath();
    ctx.moveTo(cx + innerZR * Math.cos(a), cy + innerZR * Math.sin(a));
    ctx.lineTo(cx + outerR * Math.cos(a), cy + outerR * Math.sin(a));
    ctx.strokeStyle = '#2a2450';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ---- House cusps ----
  const houseR = innerZR;
  const innerCircleR = R * 0.32;

  d.cusps.forEach((cusp, i) => {
    const a = eclToCanvas(cusp);
    const isAngular = [0, 3, 6, 9].includes(i);
    ctx.beginPath();
    ctx.moveTo(cx + innerCircleR * Math.cos(a), cy + innerCircleR * Math.sin(a));
    ctx.lineTo(cx + houseR * Math.cos(a), cy + houseR * Math.sin(a));
    ctx.strokeStyle = isAngular ? '#a78bfa' : '#4a4080';
    ctx.lineWidth = isAngular ? 1.5 : 0.8;
    ctx.stroke();

    // House numbers
    const nextCusp = d.cusps[(i + 1) % 12];
    const midLon = cusp + mod360(nextCusp - cusp) / 2;
    const midA = eclToCanvas(midLon);
    const numR = (innerCircleR + houseR) * 0.5;
    ctx.fillStyle = '#6b5f8a';
    ctx.font = `${R * 0.055}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), cx + numR * Math.cos(midA), cy + numR * Math.sin(midA));
  });

  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerCircleR, 0, 2 * Math.PI);
  ctx.strokeStyle = '#2a2450';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- Planets ----
  const planetR = R * 0.55;
  const usedAngles: number[] = [];

  function placeLabel(a: number): number {
    let angle = a;
    for (const ua of usedAngles) {
      const diff = angle - ua;
      if (Math.abs(diff) < 0.12) angle = ua + (diff >= 0 ? 0.12 : -0.12);
    }
    usedAngles.push(angle);
    return angle;
  }

  d.planets.forEach(p => {
    const rawA    = eclToCanvas(p.longitude);
    const placedA = placeLabel(rawA);

    // Dot on ecliptic
    const dotR = innerZR - 4;
    ctx.beginPath();
    ctx.arc(cx + dotR * Math.cos(rawA), cy + dotR * Math.sin(rawA), 3, 0, 2 * Math.PI);
    ctx.fillStyle = SIGN_COLORS[SIGNS[signOf(p.longitude)]];
    ctx.fill();

    // Line from dot to glyph
    const glyphR2 = planetR;
    ctx.beginPath();
    ctx.moveTo(cx + (dotR - 4) * Math.cos(rawA), cy + (dotR - 4) * Math.sin(rawA));
    ctx.lineTo(cx + glyphR2 * Math.cos(placedA), cy + glyphR2 * Math.sin(placedA));
    ctx.strokeStyle = '#2a2450';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Planet glyph
    ctx.fillStyle = SIGN_COLORS[SIGNS[signOf(p.longitude)]];
    ctx.font = `bold ${R * 0.075}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PLANET_GLYPHS[p.name], cx + glyphR2 * Math.cos(placedA), cy + glyphR2 * Math.sin(placedA));

    // Retrograde marker
    if (p.retrograde) {
      ctx.fillStyle = '#f87171';
      ctx.font = `${R * 0.045}px sans-serif`;
      ctx.fillText('℞', cx + (glyphR2 + R * 0.06) * Math.cos(placedA), cy + (glyphR2 + R * 0.06) * Math.sin(placedA));
    }
  });

  // ASC line
  const ascA = eclToCanvas(d.asc);
  ctx.beginPath();
  ctx.moveTo(cx - innerZR * Math.cos(ascA), cy - innerZR * Math.sin(ascA));
  ctx.lineTo(cx + innerZR * Math.cos(ascA), cy + innerZR * Math.sin(ascA));
  ctx.strokeStyle = '#f0abfc';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ASC/DSC labels
  ctx.fillStyle = '#f0abfc';
  ctx.font = `bold ${R * 0.055}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ASC', cx + (innerZR + 14) * Math.cos(ascA), cy + (innerZR + 14) * Math.sin(ascA));
  ctx.fillText('DSC', cx - (innerZR + 14) * Math.cos(ascA), cy - (innerZR + 14) * Math.sin(ascA));

  // MC / IC labels
  const mcA = eclToCanvas(d.mc);
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('MC', cx + (innerZR + 14) * Math.cos(mcA), cy + (innerZR + 14) * Math.sin(mcA));
  ctx.fillText('IC', cx - (innerZR + 14) * Math.cos(mcA), cy - (innerZR + 14) * Math.sin(mcA));
}
