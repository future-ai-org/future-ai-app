'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { findConjunctionsInRange } from '@/lib/astro/conjunctions';
import { formatLon } from '@/lib/astro/format';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';

const DEFAULT_PLOT_WIDTH = 800;
const MARGIN = { top: 24, right: 24, bottom: 56 };
/** Bands view: left margin for pair labels. Gaussian view: smaller margin. */
const MARGIN_LEFT_BANDS = 148;
const MARGIN_LEFT_LINES = 52;
const MIN_ROW_HEIGHT = 40;
const MIN_PLOT_HEIGHT = 280;
/** Min horizontal pixels per x-axis date label so they never overlap */
const MIN_PX_PER_X_LABEL = 72;

const PAIR_COLORS = [
  '#a78bfa', // violet
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#f97316', // orange
  '#22d3ee', // cyan
  '#c084fc', // purple
  '#4ade80', // green
  '#fb923c', // orange-2
];

function pairKey(p1: string, p2: string): string {
  return [p1, p2].sort().join('–');
}

/** Intensity by distance from sun (outer planets = stronger influence). 0–1 scale. */
const PLANET_INTENSITY: Record<string, number> = {
  Moon: 0.1,
  Mercury: 0.2,
  Venus: 0.25,
  Sun: 0.3,
  Mars: 0.4,
  Jupiter: 0.6,
  Saturn: 0.75,
  Uranus: 0.9,
  Neptune: 0.95,
  Pluto: 1,
};

function pairIntensity(pair: string): number {
  const [a, b] = pair.split('–');
  const ia = PLANET_INTENSITY[a] ?? 0.5;
  const ib = PLANET_INTENSITY[b] ?? 0.5;
  // When Moon or Sun is involved, use least intensity (min); otherwise outer planet = stronger (max).
  if (a === 'Moon' || b === 'Moon' || a === 'Sun' || b === 'Sun') return Math.min(ia, ib);
  return Math.max(ia, ib);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Gaussian sigma for influence bells (~4 days half-width). */
const GAUSS_SIGMA_MS = 4 * MS_PER_DAY;
/** Min peak value in range to consider the Gaussian "visible" (hide flat lines). */
const GAUSS_VISIBLE_THRESHOLD = 0.2;

function formatAxisDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as local date (avoids UTC midnight causing wrong day in some zones). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, day] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function formatChartDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface ConjunctionPlotProps {
  /** Initial start date (default: 1 month ago) */
  defaultStart?: Date;
  /** Initial end date (default: 1 year from now) */
  defaultEnd?: Date;
  /** When true, hide From/To controls and use defaultStart/defaultEnd as the fixed range (e.g. for one-day sidebar). */
  hideDateControls?: boolean;
  /** Optional title shown above the plot when hideDateControls (e.g. "Influences for Mar 12, 2026"). */
  title?: string;
}

export function ConjunctionPlot({ defaultStart, defaultEnd, hideDateControls = false, title }: ConjunctionPlotProps = {}) {
  const today = useMemo(() => new Date(), []);
  const fallbackStart = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return d;
  }, [today]);
  const fallbackEnd = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }, [today]);

  const initialStart = defaultStart ?? fallbackStart;
  const initialEnd = defaultEnd ?? fallbackEnd;

  const containerRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(DEFAULT_PLOT_WIDTH);
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

  const [startStr, setStartStr] = useState(() => toDateString(initialStart));
  const [endStr, setEndStr] = useState(() => toDateString(initialEnd));
  const [tooltip, setTooltip] = useState<{
    pair: string;
    exactDate: Date | undefined;
    minSep: number;
    lon1?: number;
    lon2?: number;
    planet1?: string;
    planet2?: string;
    x: number;
    y: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'bands' | 'lines'>('bands');

  const startDate = useMemo(() => {
    if (hideDateControls && defaultStart) return new Date(defaultStart.getFullYear(), defaultStart.getMonth(), defaultStart.getDate());
    return parseLocalDate(startStr);
  }, [hideDateControls, defaultStart, startStr]);
  const endDate = useMemo(() => {
    if (hideDateControls && defaultEnd) return new Date(defaultEnd.getFullYear(), defaultEnd.getMonth(), defaultEnd.getDate());
    return parseLocalDate(endStr);
  }, [hideDateControls, defaultEnd, endStr]);

  const adjustStart = useCallback((unit: 'day' | 'month' | 'year', delta: number) => {
    setStartStr((prev) => {
      const d = parseLocalDate(prev);
      if (unit === 'day') d.setDate(d.getDate() + delta);
      else if (unit === 'month') d.setMonth(d.getMonth() + delta);
      else d.setFullYear(d.getFullYear() + delta);
      return toDateString(d);
    });
  }, []);
  const adjustEnd = useCallback((unit: 'day' | 'month' | 'year', delta: number) => {
    setEndStr((prev) => {
      const d = parseLocalDate(prev);
      if (unit === 'day') d.setDate(d.getDate() + delta);
      else if (unit === 'month') d.setMonth(d.getMonth() + delta);
      else d.setFullYear(d.getFullYear() + delta);
      return toDateString(d);
    });
  }, []);

  const arrowDisabled = useMemo(() => {
    const startNextDay = new Date(startDate);
    startNextDay.setDate(startNextDay.getDate() + 1);
    const startNextMonth = new Date(startDate);
    startNextMonth.setMonth(startNextMonth.getMonth() + 1);
    const startNextYear = new Date(startDate);
    startNextYear.setFullYear(startNextYear.getFullYear() + 1);
    const endPrevDay = new Date(endDate);
    endPrevDay.setDate(endPrevDay.getDate() - 1);
    const endPrevMonth = new Date(endDate);
    endPrevMonth.setMonth(endPrevMonth.getMonth() - 1);
    const endPrevYear = new Date(endDate);
    endPrevYear.setFullYear(endPrevYear.getFullYear() - 1);
    return {
      fromDayForward: startNextDay.getTime() >= endDate.getTime(),
      fromMonthForward: startNextMonth.getTime() >= endDate.getTime(),
      fromYearForward: startNextYear.getTime() >= endDate.getTime(),
      toDayBack: endPrevDay.getTime() <= startDate.getTime(),
      toMonthBack: endPrevMonth.getTime() <= startDate.getTime(),
      toYearBack: endPrevYear.getTime() <= startDate.getTime(),
    };
  }, [startDate, endDate]);

  const events = useMemo(() => {
    if (startDate >= endDate) return [];
    return findConjunctionsInRange(startDate, endDate, 10);
  }, [startDate, endDate]);

  const ORB_DEG = 10;

  const { pairs, seriesByPair } = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      set.add(pairKey(e.planet1, e.planet2));
    }
    const pairs = Array.from(set).sort();
    const seriesByPair = new Map<string, { date: Date; separationDeg: number }[]>();
    for (const e of events) {
      const key = pairKey(e.planet1, e.planet2);
      if (!seriesByPair.has(key)) seriesByPair.set(key, []);
      seriesByPair.get(key)!.push({ date: e.date, separationDeg: e.separationDeg });
    }
    for (const arr of seriesByPair.values()) {
      arr.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    return { pairs, seriesByPair };
  }, [events]);

  // Add an interpolated point at exact conjunction (sep=0) so the curve peaks at the right time
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

  /** In Gaussian view, only show pairs that have a visible Gaussian (peak in range, not a flat line). */
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

  const displayPairs = useMemo(
    () => (viewMode === 'lines' ? pairsWithGaussian : pairs),
    [viewMode, pairs, pairsWithGaussian]
  );

  const displayPairIndex = useMemo(() => {
    const m = new Map<string, number>();
    displayPairs.forEach((p, i) => m.set(p, i));
    return m;
  }, [displayPairs]);

  const marginLeft = viewMode === 'bands' ? MARGIN_LEFT_BANDS : MARGIN_LEFT_LINES;

  const { plotHeight, innerHeight } = useMemo(() => {
    if (viewMode === 'bands') {
      const n = Math.max(1, pairs.length);
      const height = Math.max(MIN_PLOT_HEIGHT, MARGIN.top + MARGIN.bottom + n * MIN_ROW_HEIGHT);
      return { plotHeight: height, innerHeight: height - MARGIN.top - MARGIN.bottom };
    }
    const height = Math.max(MIN_PLOT_HEIGHT, MARGIN.top + MARGIN.bottom + 320);
    return { plotHeight: height, innerHeight: height - MARGIN.top - MARGIN.bottom };
  }, [viewMode, pairs.length]);

  const innerWidth = plotWidth - marginLeft - MARGIN.right;

  const xScale = (d: Date) => {
    const t = d.getTime();
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    return marginLeft + (innerWidth * (t - t0)) / (t1 - t0);
  };
  /** Bands view: row center y for a pair. */
  const yCenter = (pair: string) => {
    const i = displayPairIndex.get(pair) ?? 0;
    const n = Math.max(1, displayPairs.length);
    const step = innerHeight / n;
    return MARGIN.top + step * (i + 0.5);
  };
  /** Gaussian view: y pixel for intensity 0..1 (0 = bottom, 1 = top). */
  const yScale = (intensity: number) => {
    const y = plotHeight - MARGIN.bottom - intensity * innerHeight;
    return y;
  };

  /** Gaussian labels: positions nudged so they never overlap (uses lines-view dimensions). */
  const gaussianLabelPositions = useMemo(() => {
    const left = MARGIN_LEFT_LINES;
    const linesInnerWidth = plotWidth - left - MARGIN.right;
    const linesInnerHeight = 320;
    const linesPlotHeight = MARGIN.top + MARGIN.bottom + linesInnerHeight;
    const t0 = startDate.getTime();
    const t1 = endDate.getTime();
    const xScaleL = (t: number) => left + (linesInnerWidth * (t - t0)) / (t1 - t0);
    const yScaleL = (intensity: number) => linesPlotHeight - MARGIN.bottom - intensity * linesInnerHeight;

    const PAD = 6;
    const LABEL_H = 18;
    const NUDGE = 14;
    const yMin = MARGIN.top + LABEL_H / 2 + PAD;
    const yMax = linesPlotHeight - MARGIN.bottom - LABEL_H / 2 - PAD;

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
      const x = xScaleL(peakT);
      const y = yScaleL(baseInt) - 8;
      const w = Math.max(60, pair.length * 6.5);
      const h = LABEL_H;
      initial.push({ pair, x, y, w, h });
    }
    initial.sort((a, b) => a.x - b.x);

    const placed: Box[] = [];
    for (const box of initial) {
      const tryY = (y: number) => !placed.some((p) => overlaps({ ...box, y }, p));
      let y = Math.max(yMin, Math.min(yMax, box.y));
      if (!tryY(y)) {
        for (let k = 1; k <= 20; k++) {
          const up = Math.max(yMin, Math.min(yMax, box.y - NUDGE * k));
          if (tryY(up)) {
            y = up;
            break;
          }
          const down = Math.max(yMin, Math.min(yMax, box.y + NUDGE * k));
          if (tryY(down)) {
            y = down;
            break;
          }
        }
      }
      placed.push({ ...box, y });
    }

    const map = new Map<string, { x: number; y: number }>();
    for (const b of placed) map.set(b.pair, { x: b.x, y: b.y });
    return map;
  }, [pairsWithGaussian, startDate, endDate, plotWidth, seriesWithExactPeak]);

  const { xTicks } = useMemo(() => {
    const out: Date[] = [];
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const t0 = start.getTime();
    const t1 = end.getTime();
    const span = t1 - t0;
    if (!Number.isFinite(span) || span < 0) return { xTicks: out };
    const numDaysInclusive = Math.floor(span / MS_PER_DAY) + 1;
    const safeWidth = Number.isFinite(innerWidth) && innerWidth > 0 ? innerWidth : DEFAULT_PLOT_WIDTH - marginLeft - MARGIN.right;
    const maxTicks = Math.max(2, Math.floor(safeWidth / MIN_PX_PER_X_LABEL));
    if (numDaysInclusive <= maxTicks) {
      for (let i = 0; i < numDaysInclusive; i++) {
        out.push(new Date(t0 + i * MS_PER_DAY));
      }
      return { xTicks: out };
    }
    const stepDays = Math.max(1, Math.ceil(numDaysInclusive / maxTicks));
    for (let i = 0; i < numDaysInclusive; i += stepDays) {
      out.push(new Date(t0 + i * MS_PER_DAY));
    }
    const lastDay = new Date(t0 + (numDaysInclusive - 1) * MS_PER_DAY);
    if (out.length > 0 && out[out.length - 1].getTime() !== lastDay.getTime()) {
      out.push(lastDay);
    }
    while (out.length > maxTicks) out.pop();
    return { xTicks: out };
  }, [startDate, endDate, innerWidth, marginLeft]);

  const clipId = useId();

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

  /** Bands view: one row per pair, smooth round bulge (tapered to baseline at both ends). */
  function buildCurvePath(pair: string): string {
    const points = seriesWithExactPeak.get(pair);
    if (!points || points.length === 0) return '';
    const n = Math.max(1, displayPairs.length);
    const rowHeight = innerHeight / n;
    const maxHalfHeight = rowHeight * 0.4;
    const yC = yCenter(pair);
    const top: { x: number; y: number }[] = [];
    const bottom: { x: number; y: number }[] = [];
    for (const p of points) {
      const x = xScale(p.date);
      const intensity = 1 - p.separationDeg / ORB_DEG;
      const halfH = maxHalfHeight * intensity;
      top.push({ x, y: yC - halfH });
      bottom.push({ x, y: yC + halfH });
    }
    const firstX = top[0].x;
    const lastX = top[top.length - 1].x;
    top.unshift({ x: firstX, y: yC });
    top.push({ x: lastX, y: yC });
    bottom.unshift({ x: firstX, y: yC });
    bottom.push({ x: lastX, y: yC });
    const topPath = smoothPathThrough(top);
    const bottomReversed = [...bottom].reverse();
    const bottomPath = smoothPathThrough(bottomReversed).replace(/^M [\d.,]+ /, '');
    const lastBottom = bottom[bottom.length - 1];
    return `${topPath} L ${lastBottom.x},${lastBottom.y} ${bottomPath} Z`;
  }

  /** Gaussian view: one bell curve per conjunction; y=0 at row baseline, peak at conjunction day; path closed for fill. */
  const GAUSS_SAMPLES = 120; // samples across the range for smooth curves

  function getPeakDatesForPair(pair: string): number[] {
    const points = seriesWithExactPeak.get(pair);
    if (!points || points.length === 0) return [];
    const peakDates = points.filter((p) => p.separationDeg === 0).map((p) => p.date.getTime());
    if (peakDates.length === 0) {
      const minSep = Math.min(...points.map((p) => p.separationDeg));
      const minPoint = points.find((p) => p.separationDeg === minSep);
      if (!minPoint) return [];
      peakDates.push(minPoint.date.getTime());
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

  const viewToggle = (
    <div className="flex items-center gap-2 justify-center flex-wrap mb-4">
      <Button
        variant={viewMode === 'bands' ? 'secondary' : 'ghost'}
        className="!py-2 !px-3 text-sm font-bold"
        onClick={() => setViewMode('bands')}
        title={copy.influence.viewBandsHint}
        aria-pressed={viewMode === 'bands'}
      >
        {copy.influence.viewBands}
      </Button>
      <Button
        variant={viewMode === 'lines' ? 'secondary' : 'ghost'}
        className="!py-2 !px-3 text-sm font-bold"
        onClick={() => {
          // Keep the same date range so the x-axis starts at the same place
          // across both view modes.
          setViewMode('lines');
        }}
        title={copy.influence.viewLinesHint}
        aria-pressed={viewMode === 'lines'}
      >
        {copy.influence.viewLines}
      </Button>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {hideDateControls && title && (
        <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wide mb-2 w-full text-center">
          {title}
        </h3>
      )}
      {viewToggle}
      {!hideDateControls && (
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 font-bold">
          <span className="text-sm font-bold text-violet-400 mr-1 uppercase tracking-wide">From</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustStart('year', -1)} title={copy.today.prevYear} aria-label={copy.today.prevYear}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">year</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustStart('month', -1)} title={copy.today.prevMonth} aria-label={copy.today.prevMonth}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">month</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustStart('day', -1)} title={copy.today.prevDay} aria-label={copy.today.prevDay}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">day</span></Button>
          </div>
          <span className="min-w-[140px] text-lg text-foreground font-bold tabular-nums text-center">
            {formatChartDate(startDate)}
          </span>
          <Button variant="ghost" className="!py-2 !px-3 text-sm text-muted-foreground font-bold" onClick={() => setStartStr(toDateString(new Date()))} title={copy.today.goToToday} aria-label={`From ${copy.today.goToToday}`}>
            today
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustStart('day', 1)} title={copy.today.nextDay} aria-label={copy.today.nextDay} disabled={arrowDisabled.fromDayForward}><span className="text-sm text-muted-foreground mr-0.5">day</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustStart('month', 1)} title={copy.today.nextMonth} aria-label={copy.today.nextMonth} disabled={arrowDisabled.fromMonthForward}><span className="text-sm text-muted-foreground mr-0.5">month</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustStart('year', 1)} title={copy.today.nextYear} aria-label={copy.today.nextYear} disabled={arrowDisabled.fromYearForward}><span className="text-sm text-muted-foreground mr-0.5">year</span><span className="text-foreground">→</span></Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 font-bold">
          <span className="text-sm font-bold text-violet-400 mr-1 uppercase tracking-wide">To</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustEnd('year', -1)} title={copy.today.prevYear} aria-label={copy.today.prevYear} disabled={arrowDisabled.toYearBack}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">year</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustEnd('month', -1)} title={copy.today.prevMonth} aria-label={copy.today.prevMonth} disabled={arrowDisabled.toMonthBack}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">month</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustEnd('day', -1)} title={copy.today.prevDay} aria-label={copy.today.prevDay} disabled={arrowDisabled.toDayBack}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">day</span></Button>
          </div>
          <span className="min-w-[140px] text-lg text-foreground font-bold tabular-nums text-center">
            {formatChartDate(endDate)}
          </span>
          <Button variant="ghost" className="!py-2 !px-3 text-sm text-muted-foreground font-bold" onClick={() => setEndStr(toDateString(new Date()))} title={copy.today.goToToday} aria-label={`To ${copy.today.goToToday}`}>
            today
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustEnd('day', 1)} title={copy.today.nextDay} aria-label={copy.today.nextDay}><span className="text-sm text-muted-foreground mr-0.5">day</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustEnd('month', 1)} title={copy.today.nextMonth} aria-label={copy.today.nextMonth}><span className="text-sm text-muted-foreground mr-0.5">month</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjustEnd('year', 1)} title={copy.today.nextYear} aria-label={copy.today.nextYear}><span className="text-sm text-muted-foreground mr-0.5">year</span><span className="text-foreground">→</span></Button>
          </div>
        </div>
      </div>
      )}

      {startDate >= endDate ? (
        <p className="text-muted-foreground text-sm text-center w-full">Choose an end date after the start date.</p>
      ) : (
        <>
          <div
            ref={containerRef}
            className="w-full max-w-full overflow-x-auto rounded-xl border border-border bg-card p-4 relative"
            onMouseLeave={() => setTooltip(null)}
          >
            {tooltip && (
              <div
                className="pointer-events-none fixed z-50 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground shadow-lg"
                style={{ left: tooltip.x + 12, top: tooltip.y + 8 }}
              >
                {tooltip.pair}
                {tooltip.lon1 != null ? (
                  <> — peak at {formatLon(tooltip.lon1).deg}° {formatLon(tooltip.lon1).sign}</>
                ) : (
                  <> — peak at sign and angle</>
                )}
                {tooltip.exactDate != null && (
                  <> · {formatEventDate(tooltip.exactDate)}</>
                )}
              </div>
            )}
            <svg width={plotWidth} height={plotHeight} className="min-w-0 block">
              <defs>
                <clipPath id={clipId}>
                  <rect x={marginLeft} y={MARGIN.top} width={innerWidth} height={plotHeight - MARGIN.top - MARGIN.bottom} />
                </clipPath>
              </defs>
              {/* Grid and axis only in inner area; dashed verticals only in bands view */}
              {viewMode === 'bands' &&
                xTicks.map((d, i) => (
                  <line
                    key={i}
                    x1={xScale(d)}
                    y1={MARGIN.top}
                    x2={xScale(d)}
                    y2={plotHeight - MARGIN.bottom}
                    stroke="#2a2450"
                    strokeDasharray="4 4"
                  />
                ))}
              <line
                x1={marginLeft}
                y1={plotHeight - MARGIN.bottom}
                x2={marginLeft + innerWidth}
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
              {/* Bands: pair labels on left. Gaussian: intensity y-axis. */}
              {viewMode === 'bands' &&
                displayPairs.map((pair) => (
                  <text
                    key={pair}
                    x={marginLeft - 12}
                    y={yCenter(pair)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-[#c4b5e0] text-xs font-bold"
                  >
                    {pair}
                  </text>
                ))}
              {viewMode === 'lines' && (
                <>
                  <line
                    x1={marginLeft}
                    y1={MARGIN.top}
                    x2={marginLeft}
                    y2={plotHeight - MARGIN.bottom}
                    stroke="#3d3560"
                    strokeWidth={1}
                  />
                  <text
                    x={marginLeft - 8}
                    y={MARGIN.top + (plotHeight - MARGIN.top - MARGIN.bottom) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[#7c6b9e] text-[10px] uppercase tracking-wide"
                    transform={`rotate(-90, ${marginLeft - 8}, ${MARGIN.top + (plotHeight - MARGIN.top - MARGIN.bottom) / 2})`}
                  >
                    Intensity
                  </text>
                </>
              )}
              <g clipPath={`url(#${clipId})`}>
              {displayPairs.map((pair, idx) => {
                const pathD = viewMode === 'bands' ? buildCurvePath(pair) : buildGaussianPath(pair);
                const color = PAIR_COLORS[idx % PAIR_COLORS.length];
                const points = seriesByPair.get(pair) ?? [];
                const pointsWithPeak = seriesWithExactPeak.get(pair) ?? [];
                const minSep = points.length ? Math.min(...points.map((p) => p.separationDeg)) : 0;
                const exactDate =
                  pointsWithPeak.find((p) => p.separationDeg === 0)?.date ??
                  points.find((p) => p.separationDeg === minSep)?.date;
                const dayOfMin = points.find((p) => p.separationDeg === minSep)?.date;
                const eventAtExact = dayOfMin
                  ? events.find(
                      (ev) =>
                        pairKey(ev.planet1, ev.planet2) === pair &&
                        ev.date.getTime() === dayOfMin.getTime()
                    )
                  : undefined;
                const isLines = viewMode === 'lines';
                const labelPos = isLines ? gaussianLabelPositions.get(pair) : null;
                return (
                  <g key={pair}>
                    <path
                      d={pathD}
                      fill={color}
                      fillOpacity={isLines ? 0.5 : 0.6}
                      stroke={color}
                      strokeWidth={isLines ? 2.5 : 1.5}
                      strokeOpacity={0.9}
                      onMouseEnter={(e) => {
                        setTooltip({
                          pair,
                          exactDate,
                          minSep,
                          lon1: eventAtExact?.lon1,
                          lon2: eventAtExact?.lon2,
                          planet1: eventAtExact?.planet1,
                          planet2: eventAtExact?.planet2,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e) => {
                        setTooltip((prev) =>
                          prev && prev.pair === pair
                            ? { ...prev, x: e.clientX, y: e.clientY }
                            : prev
                        );
                      }}
                    />
                    {viewMode === 'lines' && labelPos != null && (
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
          </div>
          {events.length === 0 && (
            <p className="mt-4 text-muted-foreground text-sm text-center w-full">
              No conjunctions (within 10°) in this date range.
            </p>
          )}
        </>
      )}
    </div>
  );
}
