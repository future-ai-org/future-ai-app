'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ChartResults } from '@/components/chart/ChartResults';
import { ConjunctionPlot } from '@/components/chart/ConjunctionPlot';
import { NextConjunctions } from '@/components/chart/NextConjunctions';
import { CitySearch } from '@/components/chart/CitySearch';
import { Button } from '@/components/ui/Button';
import { calculateChart } from '@/lib/astro/calculate';
import { type BirthData, type ChartResult, type GeoResult, CHART_OF_MOMENT_OPTIONS } from '@/lib/astro/types';
import { copy } from '@/lib/copy';

const AUSTIN_TZ = 'America/Chicago';
const AUSTIN_LAT = 30.2672;
const AUSTIN_LON = -97.7431;
const AUSTIN_UTC_OFFSET = -6; // Central Time (standard)
const DENVER_TZ = 'America/Denver';

type TodayLocation = {
  latitude: number;
  longitude: number;
  utcOffset: number;
  cityLabel: string;
  timeZone?: string;
};

const DEFAULT_LOCATION: TodayLocation = {
  latitude: AUSTIN_LAT,
  longitude: AUSTIN_LON,
  utcOffset: AUSTIN_UTC_OFFSET,
  cityLabel: 'Austin',
  timeZone: AUSTIN_TZ,
};

function inferTimeZone(cityLabel: string): string | undefined {
  const name = cityLabel.toLowerCase();
  if (name.includes('austin')) return AUSTIN_TZ;
  if (name.includes('denver')) return DENVER_TZ;
  // Fallback: simple US guess by longitude if needed later
  return undefined;
}

function buildBirthDataForMoment(moment: Date, location: TodayLocation): BirthData {
  if (location.timeZone) {
    const parts = moment.toLocaleString('sv-SE', { timeZone: location.timeZone }).split(' ');
    const [datePart, timePart] = parts;
    const [y, m, d] = datePart.split('-');
    const [hh, mm] = timePart.split(':');
    const localHours = parseInt(hh, 10) + parseInt(mm, 10) / 60;
    const utcHours = moment.getUTCHours() + moment.getUTCMinutes() / 60;
    const utcOffset = Math.round((localHours - utcHours) * 2) / 2;
    return {
      date: `${y}-${m}-${d}`,
      time: `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`,
      latitude: location.latitude,
      longitude: location.longitude,
      utcOffset,
      cityLabel: location.cityLabel,
    };
  }

  const utcMs = moment.getTime();
  const localMs = utcMs + location.utcOffset * 3600 * 1000;
  const local = new Date(localMs);

  const y = local.getUTCFullYear();
  const m = local.getUTCMonth() + 1;
  const d = local.getUTCDate();
  const hh = local.getUTCHours();
  const mm = local.getUTCMinutes();

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    latitude: location.latitude,
    longitude: location.longitude,
    utcOffset: location.utcOffset,
    cityLabel: location.cityLabel,
  };
}

function formatChartDate(d: Date, location: TodayLocation): string {
  if (location.timeZone) {
    return d.toLocaleDateString('en-US', {
      timeZone: location.timeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const utcMs = d.getTime();
  const localMs = utcMs + location.utcOffset * 3600 * 1000;
  const local = new Date(localMs);

  return local.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Home() {
  const { data: session, status } = useSession();
  const [chartMoment, setChartMoment] = useState<Date>(() => new Date());
  const [location, setLocation] = useState<TodayLocation>(DEFAULT_LOCATION);
  const [showCustomize, setShowCustomize] = useState(false);

  // Load saved city for authenticated users from localStorage on mount / auth change.
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    const key = `future:todayCity:${session.user.id}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<TodayLocation>;
      if (
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        typeof parsed.utcOffset === 'number' &&
        typeof parsed.cityLabel === 'string'
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocation({
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          utcOffset: parsed.utcOffset,
          cityLabel: parsed.cityLabel,
          timeZone: parsed.timeZone ?? inferTimeZone(parsed.cityLabel),
        });
      }
    } catch {
      // ignore
    }
  }, [status, session?.user?.id]);

  // When not authenticated, always fall back to the Austin default.
  useEffect(() => {
    if (status !== 'authenticated') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation(DEFAULT_LOCATION);
    }
  }, [status]);

  const result = useMemo<ChartResult | null>(() => {
    const data = buildBirthDataForMoment(chartMoment, location);
    return calculateChart(data, CHART_OF_MOMENT_OPTIONS);
  }, [chartMoment, location]);

  const adjust = useCallback((unit: 'day' | 'month' | 'year', delta: number) => {
    setChartMoment((prev) => {
      const next = new Date(prev);
      if (unit === 'day') next.setDate(next.getDate() + delta);
      else if (unit === 'month') next.setMonth(next.getMonth() + delta);
      else next.setFullYear(next.getFullYear() + delta);
      return next;
    });
  }, []);

  const adjustHours = useCallback((deltaHours: number) => {
    setChartMoment((prev) => new Date(prev.getTime() + deltaHours * 3600 * 1000));
  }, []);

  const influenceRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, []);

  const todaySubtitle =
    location.cityLabel === 'Austin'
      ? copy.today.subtitle
      : `current transits in ${location.cityLabel}`;

  function handleCityResult(geo: GeoResult) {
    const next: TodayLocation = {
      latitude: geo.latitude,
      longitude: geo.longitude,
      utcOffset: geo.utcOffset,
      cityLabel: geo.displayName,
      timeZone: inferTimeZone(geo.displayName),
    };
    setLocation(next);
    if (status !== 'authenticated' || !session?.user?.id) return;
    const key = `future:todayCity:${session.user.id}`;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function handleCityReset() {
    const next = DEFAULT_LOCATION;
    setLocation(next);
    if (status !== 'authenticated' || !session?.user?.id) return;
    const key = `future:todayCity:${session.user.id}`;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pb-20 flex flex-col items-center">
      <div id="chart-of-the-moment" className="pt-8 pb-6 text-center scroll-mt-20">
        <h1 className="text-6xl font-serif mt-4 mb-1 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.titlePrefix} {copy.today.title}
        </h1>
        <div className="mt-2 pb-3 flex items-center justify-center gap-3">
          <p className="text-muted-foreground text-sm font-bold">
            {todaySubtitle}
          </p>
          {status === 'authenticated' && (
            <button
              type="button"
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline-offset-4 hover:underline"
              onClick={() => setShowCustomize(prev => !prev)}
            >
              customize
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4 font-bold">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjust('year', -1)} title={copy.today.prevYear} aria-label={copy.today.prevYear}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">year</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjust('month', -1)} title={copy.today.prevMonth} aria-label={copy.today.prevMonth}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">month</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjust('day', -1)} title={copy.today.prevDay} aria-label={copy.today.prevDay}><span className="text-foreground">←</span><span className="text-sm text-muted-foreground ml-0.5">day</span></Button>
          </div>
          <span className="min-w-[160px] text-base text-foreground font-bold tabular-nums">
            {formatChartDate(chartMoment, location)}
          </span>
          <Button variant="ghost" className="!py-2 !px-3 text-sm text-muted-foreground font-bold" onClick={() => setChartMoment(new Date())} title={copy.today.goToToday} aria-label={copy.today.goToToday}>
            today
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjust('day', 1)} title={copy.today.nextDay} aria-label={copy.today.nextDay}><span className="text-sm text-muted-foreground mr-0.5">day</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjust('month', 1)} title={copy.today.nextMonth} aria-label={copy.today.nextMonth}><span className="text-sm text-muted-foreground mr-0.5">month</span><span className="text-foreground">→</span></Button>
            <Button variant="ghost" className="!py-2 !px-3 text-xl leading-none font-bold" onClick={() => adjust('year', 1)} title={copy.today.nextYear} aria-label={copy.today.nextYear}><span className="text-sm text-muted-foreground mr-0.5">year</span><span className="text-foreground">→</span></Button>
          </div>
        </div>

        {status === 'authenticated' && showCustomize && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <div className="w-full max-w-xs flex items-center gap-2">
              <CitySearch onResult={handleCityResult} onReset={handleCityReset} />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-3 py-2 text-xs"
                onClick={() => setShowCustomize(false)}
              >
                select
              </Button>
            </div>
          </div>
        )}
      </div>

      {result ? (
        <div className="w-full flex justify-center">
          <ChartResults result={result} chartSize={720} onAdjustHours={adjustHours} showAscendant={false} showAngles showHouses />
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12">loading…</p>
      )}

      <div className="mt-12 pt-8 flex items-center justify-center gap-2" aria-hidden>
        <span className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent via-violet-400/30 to-violet-400/60 rounded-full" />
        <span className="flex items-center gap-0.5 text-violet-400/90 text-sm drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" aria-hidden>
          <span className="opacity-70">✧</span>
          <span className="text-base">✦</span>
          <span className="opacity-70">✧</span>
        </span>
        <span className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent via-violet-400/30 to-violet-400/60 rounded-full" />
      </div>

      <NextConjunctions />

      <section id="influences" className="w-full mt-20 scroll-mt-24">
        <ConjunctionPlot defaultStart={influenceRange.start} defaultEnd={influenceRange.end} />
      </section>
    </main>
  );
}
