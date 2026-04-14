'use client';

import { useCallback, useMemo, useState } from 'react';
import { aspectDisplayLongitude, INFLUENCE_PLOT_SELECTABLE_ASPECTS, type InfluencePlotAspectKind } from '@/lib/astro/aspects';
import { findNextNAspects, type PlanetPairAspectEvent } from '@/lib/astro/conjunctions';
import { formatLon } from '@/lib/astro/format';
import type { PlanetName } from '@/lib/astro/types';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

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

const UPCOMING_PER_ASPECT = 10;
const UPCOMING_ORB_DEG = 3;

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UpcomingTable({ events }: { events: PlanetPairAspectEvent[] }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border/60 text-left text-muted-foreground text-xs uppercase tracking-wide">
          <th className="py-2 pr-3 font-bold">Date</th>
          <th className="py-2 pr-3 font-bold">Objects</th>
          <th className="py-2 font-bold">Angles</th>
        </tr>
      </thead>
      <tbody>
        {events.length === 0 ? (
          <tr>
            <td colSpan={3} className="py-6 text-center text-muted-foreground">
              None in range
            </td>
          </tr>
        ) : (
          events.map((event, i) => {
            const lon = aspectDisplayLongitude(event.lon1, event.lon2);
            const { sign, deg } = formatLon(lon);
            return (
              <tr
                key={`${event.planet1}-${event.planet2}-${event.date.getTime()}-${i}`}
                className="border-b border-border/60 last:border-0"
              >
                <td className="py-1.5 pr-3 font-bold text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatEventDate(event.date)}
                </td>
                <td className="py-1.5 pr-3 font-medium whitespace-nowrap">
                  <span style={{ color: PLANET_COLORS[event.planet1] }}>{event.planet1}</span>
                  {' – '}
                  <span style={{ color: PLANET_COLORS[event.planet2] }}>{event.planet2}</span>
                </td>
                <td className="py-1.5 font-bold text-muted-foreground whitespace-nowrap">
                  {deg}° {sign}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export function NextConjunctions() {
  const eventsByAspect = useMemo(() => {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    const out = {} as Record<InfluencePlotAspectKind, PlanetPairAspectEvent[]>;
    for (const aspectId of INFLUENCE_PLOT_SELECTABLE_ASPECTS) {
      out[aspectId] = findNextNAspects(aspectId, from, UPCOMING_PER_ASPECT, UPCOMING_ORB_DEG);
    }
    return out;
  }, []);

  const [slide, setSlide] = useState(0);
  const slides = useMemo(
    () =>
      INFLUENCE_PLOT_SELECTABLE_ASPECTS.map((id) => ({
        id,
        title: copy.nextConjunctions.slideByAspect[id].title,
        events: eventsByAspect[id],
      })),
    [eventsByAspect]
  );

  const goTo = useCallback((index: number) => {
    setSlide(((index % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  return (
    <section
      id="next-conjunctions"
      className="w-full mt-12 scroll-mt-24"
      aria-roledescription="carousel"
      aria-label={copy.nextConjunctions.title}
    >
      <h2 className="text-3xl font-serif font-bold text-center text-violet-400 mb-6">
        {copy.nextConjunctions.title}
      </h2>

      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => goTo(slide - 1)}
            aria-label={copy.nextConjunctions.carouselPrevious}
            className={cn(
              'group flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11',
              'border border-violet-400/35 bg-card/90 text-violet-400 shadow-[0_0_20px_-4px_rgba(139,92,246,0.35)]',
              'transition-all motion-reduce:transition-none',
              'hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-300',
              'active:scale-95',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400'
            )}
          >
            <ChevronLeftIcon className="transition-transform group-hover:-translate-x-0.5" />
          </button>

          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-card/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div
              className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{
                width: `${slides.length * 100}%`,
                transform: `translateX(-${(slide * 100) / slides.length}%)`,
              }}
              aria-live="polite"
            >
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  className="shrink-0 px-4 pb-4 pt-5 sm:px-5"
                  style={{ width: `${100 / slides.length}%` }}
                  aria-hidden={slide !== i}
                >
                  <h3 className="text-center text-lg font-serif font-bold text-violet-400/95 mb-4">
                    {s.title}
                  </h3>
                  <div className="overflow-x-auto">
                    <UpcomingTable events={s.events} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => goTo(slide + 1)}
            aria-label={copy.nextConjunctions.carouselNext}
            className={cn(
              'group flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11',
              'border border-violet-400/35 bg-card/90 text-violet-400 shadow-[0_0_20px_-4px_rgba(139,92,246,0.35)]',
              'transition-all motion-reduce:transition-none',
              'hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-300',
              'active:scale-95',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400'
            )}
          >
            <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div
          className="mt-5 flex items-center justify-center gap-2.5"
          role="group"
          aria-label="Aspect table"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-current={slide === i ? 'true' : undefined}
              aria-label={copy.nextConjunctions.slideByAspect[s.id].goToAria}
              className={cn(
                'h-2 rounded-full transition-all motion-reduce:transition-none',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400',
                slide === i
                  ? 'w-9 bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.45)]'
                  : 'w-2 bg-muted-foreground/35 hover:bg-muted-foreground/55'
              )}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
