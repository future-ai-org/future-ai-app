'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { TransitsWheel } from '@/components/chart/TransitsWheel';
import { TransitsTable } from '@/components/chart/TransitsTable';
import { TransitNatalAspectsSnapshot } from '@/components/chart/TransitNatalAspectsSnapshot';
import { TransitNatalGaussianPlot } from '@/components/chart/TransitNatalGaussianPlot';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { savedChartHeadingLabel } from '@/lib/utils';
import { calculateChart } from '@/lib/astro/calculate';
import { CHART_OF_MOMENT_OPTIONS } from '@/lib/astro/types';
import type { BirthData, ChartResult } from '@/lib/astro/types';

function birthDataForDate(
  date: Date,
  lat: number,
  lon: number,
  cityLabel: string,
): BirthData {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const dateStr = `${y}-${pad(m)}-${pad(d)}`;
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return {
    date: dateStr,
    time,
    latitude: lat,
    longitude: lon,
    utcOffset: 0,
    cityLabel,
  };
}

function formatTransitDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export default function ChartTransitsPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const id = typeof params.id === 'string' ? params.id : '';
  const [chart, setChart] = useState<{
    label: string;
    isPrimary?: boolean;
    chartResult: ChartResult;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transitDate, setTransitDate] = useState<Date>(() => new Date());

  const adjustDate = useCallback((unit: 'day' | 'month' | 'year', delta: number) => {
    setTransitDate((prev) => {
      const next = new Date(prev);
      if (unit === 'day') next.setUTCDate(next.getUTCDate() + delta);
      else if (unit === 'month') next.setUTCMonth(next.getUTCMonth() + delta);
      else next.setUTCFullYear(next.getUTCFullYear() + delta);
      return next;
    });
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }
    if (status !== 'authenticated' || !id) return;

    let cancelled = false;
    fetch(`/api/charts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (!cancelled && data.chart) setChart(data.chart);
      })
      .catch(() => {
        if (!cancelled) setError('chart not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, status, router]);

  const transitResult = useMemo(() => {
    if (!chart?.chartResult?.birthData) return null;
    const b = chart.chartResult.birthData;
    const data = birthDataForDate(transitDate, b.latitude, b.longitude, b.cityLabel);
    return calculateChart(data, CHART_OF_MOMENT_OPTIONS);
  }, [chart?.chartResult?.birthData, transitDate]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">loading…</div>
      </main>
    );
  }

  if (loading || error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <Link href="/dashboard" className="text-violet-400 text-sm hover:text-violet-300">
          ← {copy.dashboard.backToDashboard}
        </Link>
        <p className={`text-center mt-8 ${error ? 'text-red-400' : 'text-muted-foreground'}`}>{error || 'loading…'}</p>
      </main>
    );
  }

  if (!chart || !transitResult) return null;

  const today = new Date();
  const isToday = isSameCalendarDay(transitDate, today);
  const transitLabel = transitDate.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const transitsHeadingText = chart.isPrimary
    ? copy.chart.transitsForMyChart
    : copy.chart.transitsForSavedChart(savedChartHeadingLabel(chart.label));

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <Link
          href="/dashboard"
          className="text-muted-foreground text-sm hover:text-violet-400 transition-colors"
        >
          ← {copy.dashboard.backToDashboard}
        </Link>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight px-2 break-words">
          {copy.chart.titlePrefix} {transitsHeadingText} {copy.chart.titleSuffix}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 font-bold">
          {copy.chart.transitsSubtitle(transitLabel)}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 font-bold">
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjustDate('year', -1)} title={copy.today.prevYear} aria-label={copy.today.prevYear}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">year</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjustDate('month', -1)} title={copy.today.prevMonth} aria-label={copy.today.prevMonth}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">month</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjustDate('day', -1)} title={copy.today.prevDay} aria-label={copy.today.prevDay}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">day</span></Button>
          </div>
          <span className="min-w-[140px] text-foreground font-bold tabular-nums">
            {formatTransitDate(transitDate)}
          </span>
          <Button variant="ghost" className={`!py-1.5 !px-2.5 text-sm font-bold ${isToday ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground'}`} onClick={() => setTransitDate(new Date())} title={copy.today.goToToday} aria-label={copy.today.goToToday}>
            today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjustDate('day', 1)} title={copy.today.nextDay} aria-label={copy.today.nextDay}><span className="text-sm text-muted-foreground mr-0.5">day</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjustDate('month', 1)} title={copy.today.nextMonth} aria-label={copy.today.nextMonth}><span className="text-sm text-muted-foreground mr-0.5">month</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-1.5 !px-2.5 text-lg leading-none font-bold" onClick={() => adjustDate('year', 1)} title={copy.today.nextYear} aria-label={copy.today.nextYear}><span className="text-sm text-muted-foreground mr-0.5">year</span><span className="text-foreground">→</span></Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 mt-8">
        <div className="flex flex-col items-center gap-6 shrink-0">
          <TransitsWheel natal={chart.chartResult} transit={transitResult} size={420} />
          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground text-center">
            <span><strong className="text-foreground">Outer wheel</strong> — current transits</span>
            <span><strong className="text-foreground">Inner wheel</strong> — My chart (natal)</span>
          </div>
        </div>
        <div className="w-full lg:max-w-xl shrink-0">
          <TransitsTable natal={chart.chartResult} transit={transitResult} />
        </div>
      </div>
      <TransitNatalAspectsSnapshot natal={chart.chartResult} transit={transitResult} />
      <TransitNatalGaussianPlot
          natal={chart.chartResult}
          transitDate={transitDate}
          onAdjustDate={adjustDate}
          onToday={() => setTransitDate(new Date())}
        />
    </main>
  );
}
