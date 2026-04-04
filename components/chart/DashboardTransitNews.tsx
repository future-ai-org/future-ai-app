'use client';

import { useMemo } from 'react';
import {
  findNextNTransitNatalAspectsChronological,
  type TransitNatalAspectEvent,
} from '@/lib/astro/conjunctions';
import { formatLon } from '@/lib/astro/format';
import { copy } from '@/lib/copy';
import type { ChartResult, PlanetName } from '@/lib/astro/types';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const UPCOMING_COUNT = 8;

const PLANET_COLORS: Record<PlanetName, string> = {
  Sun: '#f87171',
  Moon: '#93c5fd',
  Mercury: '#f9a8d4',
  Venus: '#22c55e',
  Mars: '#dc2626',
  Jupiter: '#f59e0b',
  Saturn: '#78716c',
  Uranus: '#22d3ee',
  Neptune: '#3b82f6',
  Pluto: '#a855f7',
};

function formatNewsDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function signLabel(lon: number): string {
  const s = formatLon(lon).sign;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function aspectVerbFor(ev: TransitNatalAspectEvent): string {
  const m = copy.dashboard.transitNewsAspectVerb;
  return m[ev.aspectId as keyof typeof m];
}

interface Props {
  natal: ChartResult;
  className?: string;
}

export function DashboardTransitNews({ natal, className }: Props) {
  const from = useMemo(() => {
    const d = new Date();
    d.setUTCHours(12, 0, 0, 0);
    return d;
  }, []);

  const upcoming = useMemo(
    () => findNextNTransitNatalAspectsChronological(natal, from, UPCOMING_COUNT),
    [natal, from],
  );

  return (
    <Card className={cn('w-full min-w-0', className)}>
      <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-violet-500 dark:text-violet-400 tracking-widest uppercase mb-6">
        {copy.dashboard.transitNewsTitle}
      </h2>
      <ul className="space-y-4 text-xs sm:text-sm leading-relaxed">
        {upcoming.length === 0 ? (
          <li>
            <p className="text-muted-foreground">{copy.dashboard.transitNewsNoneInRange}</p>
          </li>
        ) : (
          upcoming.map((ev, i) => {
            const aspectVerb = aspectVerbFor(ev);
            const natalPos = formatLon(ev.lonNatal);
            return (
              <li
                key={`${ev.aspectId}-${ev.transitPlanet}-${ev.natalPlanet}-${ev.date.getTime()}-${i}`}
              >
                <p className="text-foreground break-words [overflow-wrap:anywhere]">
                  <span style={{ color: PLANET_COLORS[ev.transitPlanet] }} className="font-semibold">
                    {ev.transitPlanet}
                  </span>
                  {' '}
                  <span className="text-muted-foreground">in {signLabel(ev.lonTransit)}</span>
                  {' '}
                  <span className="text-muted-foreground">{aspectVerb}</span>
                  {' '}
                  <span style={{ color: PLANET_COLORS[ev.natalPlanet] }} className="font-semibold">
                    {ev.natalPlanet}
                  </span>
                  {' '}
                  <span className="text-muted-foreground">{copy.dashboard.transitNewsNatal}</span>
                  {' '}
                  <span className="text-muted-foreground">in {signLabel(ev.lonNatal)}</span>
                  <span className="text-muted-foreground">,</span>{' '}
                  <span className="font-bold text-foreground">
                    on {formatNewsDate(ev.date)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {' '}
                    at {natalPos.deg}°{natalPos.min}&apos;{' '}
                    <span className="font-symbols text-[#2d1b4e] dark:text-[#8b7ab8]">
                      {natalPos.glyph}
                    </span>
                  </span>
                </p>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
