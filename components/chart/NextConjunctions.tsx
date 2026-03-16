'use client';

import { useMemo } from 'react';
import { findNextNConjunctions } from '@/lib/astro/conjunctions';
import { formatLon } from '@/lib/astro/format';
import { mod360 } from '@/lib/astro/math';
import type { PlanetName } from '@/lib/astro/types';
import { copy } from '@/lib/copy';

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** One color per planet so the same object is always the same color (e.g. Moon = blue, Sun = red). */
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

/** Longitude at exact conjunction (average of the two planets, handles wrap). */
function conjunctionLongitude(lon1: number, lon2: number): number {
  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return mod360(lon1 + diff / 2);
}

export function NextConjunctions() {
  const list = useMemo(() => {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    return findNextNConjunctions(from, 10, 3);
  }, []);

  return (
    <section id="next-conjunctions" className="w-full mt-12 scroll-mt-24">
      <h2 className="text-2xl font-serif font-bold text-center text-violet-400 mb-6">
        {copy.nextConjunctions.title}
      </h2>
      {copy.nextConjunctions.subtitle ? (
        <p className="text-muted-foreground text-sm text-center mb-6">
          {copy.nextConjunctions.subtitle}
        </p>
      ) : null}
      <div className="mx-auto max-w-md overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {list.map((event, i) => {
              const lon = conjunctionLongitude(event.lon1, event.lon2);
              const { sign, deg } = formatLon(lon);
              return (
                <tr
                  key={`${event.planet1}-${event.planet2}-${event.date.getTime()}-${i}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="py-1.5 pr-4 font-bold text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatEventDate(event.date)}
                  </td>
                  <td className="py-1.5 pr-4 font-medium whitespace-nowrap">
                    <span style={{ color: PLANET_COLORS[event.planet1] }}>{event.planet1}</span>
                    {' – '}
                    <span style={{ color: PLANET_COLORS[event.planet2] }}>{event.planet2}</span>
                  </td>
                  <td className="py-1.5 font-bold text-muted-foreground whitespace-nowrap">
                    {deg}° {sign}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
