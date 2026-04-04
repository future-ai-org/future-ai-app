'use client';

import { useState, useCallback, useMemo } from 'react';
import { ChartWheel } from '@/components/chart/ChartWheel';
import { PlanetTable } from '@/components/chart/PlanetTable';
import { Button } from '@/components/ui/Button';
import { calculateChart } from '@/lib/astro/calculate';
import { type BirthData, type ChartResult, CHART_OF_MOMENT_OPTIONS } from '@/lib/astro/types';
import { copy } from '@/lib/copy';

const SAN_FRANCISCO_TZ = 'America/Los_Angeles';
const SAN_FRANCISCO_LAT = 37.7749;
const SAN_FRANCISCO_LON = -122.4194;

function buildBirthDataForMoment(moment: Date): BirthData {
  const parts = moment.toLocaleString('sv-SE', { timeZone: SAN_FRANCISCO_TZ }).split(' ');
  const [datePart, timePart] = parts;
  const [y, m, d] = datePart.split('-');
  const [hh, mm] = timePart.split(':');
  const localHours = parseInt(hh, 10) + parseInt(mm, 10) / 60;
  const utcHours = moment.getUTCHours() + moment.getUTCMinutes() / 60;
  const utcOffset = Math.round((localHours - utcHours) * 2) / 2;
  return {
    date: `${y}-${m}-${d}`,
    time: `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`,
    latitude: SAN_FRANCISCO_LAT,
    longitude: SAN_FRANCISCO_LON,
    utcOffset,
    cityLabel: 'San Francisco',
  };
}

function formatChartDate(d: Date): string {
  return d.toLocaleDateString('en-US', { timeZone: SAN_FRANCISCO_TZ, month: 'short', day: 'numeric', year: 'numeric' });
}

export function TodayChartSection() {
  const [chartMoment, setChartMoment] = useState<Date>(() => new Date());
  const result = useMemo<ChartResult | null>(() => {
    const data = buildBirthDataForMoment(chartMoment);
    return calculateChart(data, CHART_OF_MOMENT_OPTIONS);
  }, [chartMoment]);

  const adjust = useCallback((unit: 'day' | 'month' | 'year', delta: number) => {
    setChartMoment((prev) => {
      const next = new Date(prev);
      if (unit === 'day') next.setDate(next.getDate() + delta);
      else if (unit === 'month') next.setMonth(next.getMonth() + delta);
      else next.setFullYear(next.getFullYear() + delta);
      return next;
    });
  }, []);

  if (!result) {
    return (
      <section id="today" className="w-full border-t border-border/50 bg-footer/80 py-24 min-h-[400px] flex items-center justify-center">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-muted-foreground text-sm">loading today’s chart…</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="today"
      className="w-full border-t border-border/50 bg-gradient-to-b from-footer/80 to-background py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
            {copy.chart.titlePrefix} {copy.today.title} {copy.chart.titleSuffix}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-2 tracking-wide max-w-xl mx-auto">
            {copy.today.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 font-bold">
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjust('day', -1)} title={copy.today.prevDay} aria-label={copy.today.prevDay}><span className="text-foreground">←</span><span className="text-xs text-muted-foreground ml-0.5">day</span></Button>
              <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjust('month', -1)} title={copy.today.prevMonth} aria-label={copy.today.prevMonth}><span className="text-foreground">←</span><span className="text-xs text-muted-foreground ml-0.5">month</span></Button>
              <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjust('year', -1)} title={copy.today.prevYear} aria-label={copy.today.prevYear}><span className="text-foreground">←</span><span className="text-xs text-muted-foreground ml-0.5">year</span></Button>
            </div>
            <span className="min-w-[140px] text-foreground font-bold tabular-nums">
              {formatChartDate(chartMoment)}
            </span>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-xs text-muted-foreground font-bold" onClick={() => setChartMoment(new Date())} title={copy.today.goToToday} aria-label={copy.today.goToToday}>
              today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjust('day', 1)} title={copy.today.nextDay} aria-label={copy.today.nextDay}><span className="text-xs text-muted-foreground mr-0.5">day</span><span className="text-foreground">→</span></Button>
              <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjust('month', 1)} title={copy.today.nextMonth} aria-label={copy.today.nextMonth}><span className="text-xs text-muted-foreground mr-0.5">month</span><span className="text-foreground">→</span></Button>
              <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjust('year', 1)} title={copy.today.nextYear} aria-label={copy.today.nextYear}><span className="text-xs text-muted-foreground mr-0.5">year</span><span className="text-foreground">→</span></Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
          <div className="flex justify-center lg:justify-center w-full">
            <ChartWheel result={result} size={820} />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <PlanetTable result={result} />
          </div>
        </div>
      </div>
    </section>
  );
}
