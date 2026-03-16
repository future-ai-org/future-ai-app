'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { findTransitNatalConjunctionsInRange } from '@/lib/astro/conjunctions';
import { formatLon } from '@/lib/astro/format';
import { copy } from '@/lib/copy';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import type { ChartResult } from '@/lib/astro/types';

const DEFAULT_PLOT_WIDTH = 800;
const MARGIN = { top: 24, right: 24, bottom: 56 };
const MARGIN_LEFT = 52;
const MIN_PLOT_HEIGHT = 280;
const INNER_HEIGHT_GAUSS = 320;
const MIN_PX_PER_X_LABEL = 72;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GAUSS_SIGMA_MS = 4 * MS_PER_DAY;
const GAUSS_VISIBLE_THRESHOLD = 0.2;
const GAUSS_SAMPLES = 120;
const ORB_DEG = 10;

const PAIR_COLORS = [
  '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f97316', '#22d3ee', '#c084fc', '#4ade80', '#fb923c',
];

const PLANET_INTENSITY: Record<string, number> = {
  Moon: 0.1, Mercury: 0.2, Venus: 0.25, Sun: 0.3, Mars: 0.4, Jupiter: 0.6, Saturn: 0.75, Uranus: 0.9, Neptune: 0.95, Pluto: 1,
};

function pairIntensity(pair: string): number {
  const [a, b] = pair.split('–');
  const ia = PLANET_INTENSITY[a] ?? 0.5;
  const ib = PLANET_INTENSITY[b] ?? 0.5;
  return Math.max(ia, ib);
}

function formatAxisDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function smoothPathThrough(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  const d = 1 / 6;
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) * d;
    const c1y = p1.y + (p2.y - p0.y) * d;
    const c2x = p2.x - (p3.x - p1.x) * d;
    const c2y = p2.y - (p3.y - p1.y) * d;
    path += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return path;
}

function formatTransitDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

interface Props {
  natal: ChartResult;
  transitDate: Date;
  /** When provided, date controls (←year/month/day, today, day/month/year→) are shown above the plot. */
  onAdjustDate?: (unit: 'day' | 'month' | 'year', delta: number) => void;
  onToday?: () => void;
}

export function TransitNatalGaussianPlot({ natal, transitDate, onAdjustDate, onToday }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(DEFAULT_PLOT_WIDTH);
  const [tooltip, setTooltip] = useState<{ pair: string; x: number; y: number } | null>(null);
  const clipId = useId();

  const startDate = useMemo(() => {
    const d = new Date(transitDate);
    d.setMonth(d.getMonth() - 2);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [transitDate]);
  const endDate = useMemo(() => {
    const d = new Date(transitDate);
    d.setMonth(d.getMonth() + 2);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [transitDate]);

  const events = useMemo(
    () => findTransitNatalConjunctionsInRange(natal, startDate, endDate, ORB_DEG),
    [natal, startDate, endDate]
  );

  const { pairs, seriesByPair, pairTooltipInfo } = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      set.add(`${e.transitPlanet}–${e.natalPlanet}`);
    }
    const pairs = Array.from(set).sort();
    const seriesByPair = new Map<string, { date: Date; separationDeg: number }[]>();
    const pairTooltipInfo = new Map<
      string,
      { transitPlanet: string; natalPlanet: string; lon: number; date: Date; separationDeg: number }
    >();
    for (const e of events) {
      const key = `${e.transitPlanet}–${e.natalPlanet}`;
      if (!seriesByPair.has(key)) seriesByPair.set(key, []);
      seriesByPair.get(key)!.push({ date: e.date, separationDeg: e.separationDeg });
      const existing = pairTooltipInfo.get(key);
      const midLon = (e.lonTransit + e.lonNatal) / 2;
      const lonNorm = midLon < 0 ? midLon + 360 : midLon >= 360 ? midLon - 360 : midLon;
      if (!existing || e.separationDeg < existing.separationDeg) {
        pairTooltipInfo.set(key, {
          transitPlanet: e.transitPlanet,
          natalPlanet: e.natalPlanet,
          lon: lonNorm,
          date: e.date,
          separationDeg: e.separationDeg,
        });
      }
    }
    for (const arr of seriesByPair.values()) {
      arr.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    return { pairs, seriesByPair, pairTooltipInfo };
  }, [events]);

  const seriesWithExactPeak = useMemo(() => {
    const out = new Map<string, { date: Date; separationDeg: number }[]>();
    for (const [pair, points] of seriesByPair) {
      if (points.length === 0) {
        out.set(pair, []);
        continue;
      }
      const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
      const minIdx = sorted.reduce((best, p, i) => (p.separationDeg < sorted[best].separationDeg ? i : best), 0);
      const sMin = sorted[minIdx].separationDeg;
      if (sMin <= 0) {
        out.set(pair, sorted);
        continue;
      }
      const tMin = sorted[minIdx].date.getTime();
      let tExact: number | null = null;
      if (minIdx > 0) {
        const t0 = sorted[minIdx - 1].date.getTime();
        const s0 = sorted[minIdx - 1].separationDeg;
        if (s0 > sMin) {
          tExact = t0 + ((0 - s0) / (sMin - s0)) * (tMin - t0);
        }
      }
      if (tExact == null && minIdx < sorted.length - 1) {
        const t1 = sorted[minIdx + 1].date.getTime();
        const s1 = sorted[minIdx + 1].separationDeg;
        if (s1 > sMin) {
          tExact = tMin + ((0 - sMin) / (s1 - sMin)) * (t1 - tMin);
        }
      }
      if (tExact != null && Number.isFinite(tExact)) {
        const withExact = [...sorted, { date: new Date(tExact), separationDeg: 0 }];
        withExact.sort((a, b) => a.date.getTime() - b.date.getTime());
        out.set(pair, withExact);
      } else {
        out.set(pair, sorted);
      }
    }
    return out;
  }, [seriesByPair]);

  const pairsWithGaussian = useMemo(() => {
    const sigmaSq = GAUSS_SIGMA_MS * GAUSS_SIGMA_MS;
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    return pairs.filter((pair) => {
      const points = seriesWithExactPeak.get(pair);
      if (!points || points.length === 0) return false;
      let peakDates = points.filter((p) => p.separationDeg === 0).map((p) => p.date.getTime());
      if (peakDates.length === 0) {
        const minSep = Math.min(...points.map((p) => p.separationDeg));
        const minPoint = points.find((p) => p.separationDeg === minSep);
        if (!minPoint) return false;
        peakDates = [minPoint.date.getTime()];
      }
      let maxVal = 0;
      for (let i = 0; i <= 80; i++) {
        const t = t0 + (i / 80) * (t1 - t0);
        let value = 0;
        for (const tPeak of peakDates) {
          const diff = t - tPeak;
          value += Math.exp(-(diff * diff) / (2 * sigmaSq));
        }
        if (value > maxVal) maxVal = value;
      }
      return maxVal >= GAUSS_VISIBLE_THRESHOLD;
    });
  }, [pairs, seriesWithExactPeak, startDate, endDate]);

  const plotHeight = MARGIN.top + MARGIN.bottom + INNER_HEIGHT_GAUSS;
  const innerWidth = plotWidth - MARGIN_LEFT - MARGIN.right;
  const innerHeight = plotHeight - MARGIN.top - MARGIN.bottom;

  const xScale = (d: Date) => {
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    return MARGIN_LEFT + (innerWidth * (d.getTime() - t0)) / (t1 - t0);
  };
  const yScale = (intensity: number) =>
    plotHeight - MARGIN.bottom - intensity * innerHeight;

  const gaussianLabelPositions = useMemo(() => {
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    const xScaleL = (t: number) => MARGIN_LEFT + (innerWidth * (t - t0)) / (t1 - t0);
    const yScaleL = (intensity: number) => plotHeight - MARGIN.bottom - intensity * innerHeight;
    const PAD = 6;
    const LABEL_H = 18;
    const NUDGE = 14;
    const yMin = MARGIN.top + LABEL_H / 2 + PAD;
    const yMax = plotHeight - MARGIN.bottom - LABEL_H / 2 - PAD;
    type Box = { pair: string; x: number; y: number; w: number; h: number };
    const overlaps = (a: Box, b: Box) =>
      a.x - a.w / 2 - PAD < b.x + b.w / 2 + PAD &&
      b.x - b.w / 2 - PAD < a.x + a.w / 2 + PAD &&
      a.y - a.h / 2 - PAD < b.y + b.h / 2 + PAD &&
      b.y - b.h / 2 - PAD < a.y + a.h / 2 + PAD;
    const initial: Box[] = [];
    for (const pair of pairsWithGaussian) {
      const points = seriesWithExactPeak.get(pair);
      if (!points?.length) continue;
      let peakDates = points.filter((p) => p.separationDeg === 0).map((p) => p.date.getTime());
      if (peakDates.length === 0) {
        const minSep = Math.min(...points.map((p) => p.separationDeg));
        const minPoint = points.find((p) => p.separationDeg === minSep);
        if (minPoint) peakDates = [minPoint.date.getTime()];
      }
      const peakT = peakDates[0];
      if (peakT == null) continue;
      const baseInt = pairIntensity(pair);
      initial.push({
        pair,
        x: xScaleL(peakT),
        y: yScaleL(baseInt) - 8,
        w: Math.max(60, pair.length * 6.5),
        h: LABEL_H,
      });
    }
    initial.sort((a, b) => a.x - b.x);
    const placed: Box[] = [];
    for (const box of initial) {
      const tryY = (y: number) => !placed.some((p) => overlaps({ ...box, y }, p));
      let y = Math.max(yMin, Math.min(yMax, box.y));
      if (!tryY(y)) {
        for (let k = 1; k <= 20; k++) {
          const up = Math.max(yMin, Math.min(yMax, box.y - NUDGE * k));
          if (tryY(up)) { y = up; break; }
          const down = Math.max(yMin, Math.min(yMax, box.y + NUDGE * k));
          if (tryY(down)) { y = down; break; }
        }
      }
      placed.push({ ...box, y });
    }
    const map = new Map<string, { x: number; y: number }>();
    for (const b of placed) map.set(b.pair, { x: b.x, y: b.y });
    return map;
  }, [pairsWithGaussian, startDate, endDate, plotWidth, seriesWithExactPeak, innerWidth]);

  const xTicks = useMemo(() => {
    const out: Date[] = [];
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    const span = t1 - t0;
    if (!Number.isFinite(span) || span < 0) return out;
    const numDaysInclusive = Math.floor(span / MS_PER_DAY) + 1;
    const safeWidth = Number.isFinite(innerWidth) && innerWidth > 0 ? innerWidth : DEFAULT_PLOT_WIDTH - MARGIN_LEFT - MARGIN.right;
    const maxTicks = Math.max(2, Math.floor(safeWidth / MIN_PX_PER_X_LABEL));
    if (numDaysInclusive <= maxTicks) {
      for (let i = 0; i < numDaysInclusive; i++) out.push(new Date(t0 + i * MS_PER_DAY));
      return out;
    }
    const stepDays = Math.max(1, Math.ceil(numDaysInclusive / maxTicks));
    for (let i = 0; i < numDaysInclusive; i += stepDays) {
      out.push(new Date(t0 + i * MS_PER_DAY));
    }
    const lastDay = new Date(t0 + (numDaysInclusive - 1) * MS_PER_DAY);
    if (out.length > 0 && out[out.length - 1].getTime() !== lastDay.getTime()) out.push(lastDay);
    while (out.length > maxTicks) out.pop();
    return out;
  }, [startDate, endDate, innerWidth]);

  function getPeakDatesForPair(pair: string): number[] {
    const points = seriesWithExactPeak.get(pair);
    if (!points || points.length === 0) return [];
    let peakDates = points.filter((p) => p.separationDeg === 0).map((p) => p.date.getTime());
    if (peakDates.length === 0) {
      const minSep = Math.min(...points.map((p) => p.separationDeg));
      const minPoint = points.find((p) => p.separationDeg === minSep);
      if (!minPoint) return [];
      peakDates = [minPoint.date.getTime()];
    }
    return peakDates;
  }

  function buildGaussianPath(pair: string): string {
    const peakDates = getPeakDatesForPair(pair);
    if (peakDates.length === 0) return '';
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    const baseIntensity = pairIntensity(pair);
    const yBottom = yScale(0);
    const linePoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= GAUSS_SAMPLES; i++) {
      const t = t0 + (i / GAUSS_SAMPLES) * (t1 - t0);
      let value = 0;
      for (const tPeak of peakDates) {
        const diff = t - tPeak;
        value += Math.exp(-(diff * diff) / (2 * GAUSS_SIGMA_MS * GAUSS_SIGMA_MS));
      }
      const intensity = baseIntensity * Math.min(1, value);
      linePoints.push({ x: xScale(new Date(t)), y: yScale(intensity) });
    }
    const curvePath = smoothPathThrough(linePoints);
    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];
    return `M ${first.x},${yBottom} L ${first.x},${first.y} ${curvePath.replace(/^M [\d.,]+ /, '')} L ${last.x},${yBottom} Z`;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0]?.contentRect ?? {};
      if (typeof width === 'number' && width > 0) setPlotWidth(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardClass =
    theme === 'light'
      ? 'border-border bg-card shadow-[0_0_40px_-8px_rgba(99,102,241,0.2)]'
      : 'border-white/10 bg-[#0a0a14] shadow-[0_8px_32px_rgba(0,0,0,0.4)]';

  const today = new Date();
  const isToday = isSameCalendarDay(transitDate, today);
  const showDateControls = onAdjustDate != null && onToday != null;

  return (
    <section className="mt-16 w-full">
      <h2 className="text-center text-xl font-serif font-bold text-foreground mb-6">
        {copy.chart.transitsGaussianTitle}
      </h2>
      {showDateControls && (
        <div className="mt-2 mb-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 font-bold">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => onAdjustDate('year', -1)} title={copy.today.prevYear} aria-label={copy.today.prevYear}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">year</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => onAdjustDate('month', -1)} title={copy.today.prevMonth} aria-label={copy.today.prevMonth}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">month</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => onAdjustDate('day', -1)} title={copy.today.prevDay} aria-label={copy.today.prevDay}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">day</span></Button>
          </div>
          <span className="min-w-[140px] text-foreground font-bold tabular-nums text-center">
            {formatTransitDate(transitDate)}
          </span>
          <Button variant="ghost" className={`!py-1.5 !px-2.5 text-sm font-bold ${isToday ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground'}`} onClick={onToday} title={copy.today.goToToday} aria-label={copy.today.goToToday}>
            today
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => onAdjustDate('day', 1)} title={copy.today.nextDay} aria-label={copy.today.nextDay}><span className="text-sm text-muted-foreground mr-0.5">day</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => onAdjustDate('month', 1)} title={copy.today.nextMonth} aria-label={copy.today.nextMonth}><span className="text-sm text-muted-foreground mr-0.5">month</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => onAdjustDate('year', 1)} title={copy.today.nextYear} aria-label={copy.today.nextYear}><span className="text-sm text-muted-foreground mr-0.5">year</span><span className="text-foreground">→</span></Button>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full max-w-full overflow-x-auto rounded-2xl border p-4 ${cardClass}`}
        onMouseLeave={() => setTooltip(null)}
      >
        {tooltip && (() => {
          const info = pairTooltipInfo.get(tooltip.pair);
          if (!info) return null;
          const { sign, deg, glyph } = formatLon(info.lon);
          const dateStr = formatTransitDate(info.date);
          return (
            <div
              className="pointer-events-none fixed z-50 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground shadow-lg"
              style={{ left: tooltip.x + 12, top: tooltip.y + 8 }}
            >
              <div>Transit <strong>{info.transitPlanet}</strong> conjunct natal <strong>{info.natalPlanet}</strong></div>
              <div className="text-muted-foreground font-normal mt-1">
                {deg}° {glyph} {sign} · {dateStr}
              </div>
            </div>
          );
        })()}
        {pairsWithGaussian.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No transit–natal conjunctions (within {ORB_DEG}°) in this range.
          </p>
        ) : (
          <svg width={plotWidth} height={plotHeight} className="min-w-0 block">
            <defs>
              <clipPath id={clipId}>
                <rect x={MARGIN_LEFT} y={MARGIN.top} width={innerWidth} height={innerHeight} />
              </clipPath>
            </defs>
            <line
              x1={MARGIN_LEFT}
              y1={plotHeight - MARGIN.bottom}
              x2={MARGIN_LEFT + innerWidth}
              y2={plotHeight - MARGIN.bottom}
              stroke="#3d3560"
              strokeWidth={1}
            />
            {xTicks.map((d, i) => (
              <text
                key={i}
                x={xScale(d)}
                y={plotHeight - MARGIN.bottom + 22}
                textAnchor="middle"
                className="fill-[#7c6b9e] text-[9px]"
              >
                {formatAxisDate(d)}
              </text>
            ))}
            <line
              x1={MARGIN_LEFT}
              y1={MARGIN.top}
              x2={MARGIN_LEFT}
              y2={plotHeight - MARGIN.bottom}
              stroke="#3d3560"
              strokeWidth={1}
            />
            <text
              x={MARGIN_LEFT - 8}
              y={MARGIN.top + innerHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[#7c6b9e] text-[10px] uppercase tracking-wide"
              transform={`rotate(-90, ${MARGIN_LEFT - 8}, ${MARGIN.top + innerHeight / 2})`}
            >
              Intensity
            </text>
            <g clipPath={`url(#${clipId})`}>
              {pairsWithGaussian.map((pair, idx) => {
                const pathD = buildGaussianPath(pair);
                const color = PAIR_COLORS[idx % PAIR_COLORS.length];
                const labelPos = gaussianLabelPositions.get(pair);
                return (
                  <g key={pair}>
                    <path
                      d={pathD}
                      fill={color}
                      fillOpacity={0.5}
                      stroke={color}
                      strokeWidth={2.5}
                      strokeOpacity={0.9}
                      onMouseEnter={(e) =>
                        setTooltip({ pair, x: e.clientX, y: e.clientY })
                      }
                      onMouseMove={(e) =>
                        setTooltip((prev) =>
                          prev && prev.pair === pair
                            ? { ...prev, x: e.clientX, y: e.clientY }
                            : prev
                        )
                      }
                    />
                    {labelPos != null && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-[#c4b5e0] text-[11px] font-bold pointer-events-none"
                        style={{ paintOrder: 'stroke', stroke: '#1a1625', strokeWidth: 2 }}
                      >
                        {pair}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </section>
  );
}
