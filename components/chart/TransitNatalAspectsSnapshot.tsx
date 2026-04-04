'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { ASPECTS } from '@/lib/astro/aspects';
import { computeTransitNatalAspectsAtMoment } from '@/lib/astro/transitNatalAspects';
import { PLANET_GLYPHS } from '@/lib/astro/constants';
import { formatLon } from '@/lib/astro/format';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  natal: ChartResult;
  transit: ChartResult;
}

export function TransitNatalAspectsSnapshot({ natal, transit }: Props) {
  const rows = useMemo(
    () => computeTransitNatalAspectsAtMoment(natal, transit),
    [natal, transit]
  );
  const c = copy.chart;

  return (
    <section className="mt-16 w-full flex flex-col items-center">
      <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
        <span className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent via-violet-400/30 to-violet-400/60 rounded-full" />
        <span className="flex items-center gap-0.5 text-violet-400/90 text-sm drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]">
          <span className="opacity-70">✧</span>
          <span className="text-base">✦</span>
          <span className="opacity-70">✧</span>
        </span>
        <span className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent via-violet-400/30 to-violet-400/60 rounded-full" />
      </div>
      <h2 className="text-2xl font-serif font-bold text-center text-violet-400 mb-6">
        {c.transitNatalInfluencesTableTitle}
      </h2>
      <Card className="w-full max-w-lg min-w-0">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center">{c.transitNatalSnapshotNone}</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left text-[11px] text-muted-foreground font-normal tracking-wider pb-2 px-0.5">
                    {c.natalAspectsColAspect}
                  </th>
                  <th className="text-left text-[11px] text-muted-foreground font-normal tracking-wider pb-2 px-0.5">
                    {c.transitNatalSnapshotColTransit}
                  </th>
                  <th className="text-left text-[11px] text-muted-foreground font-normal tracking-wider pb-2 px-0.5">
                    {c.transitNatalSnapshotColNatal}
                  </th>
                  <th className="text-left text-[11px] text-muted-foreground font-normal tracking-wider pb-2 px-0.5">
                    {c.transitNatalSnapshotColSigns}
                  </th>
                  <th className="text-center text-[11px] text-muted-foreground font-normal tracking-wider pb-2 px-0.5 tabular-nums">
                    {c.transitNatalSnapshotColNatalHouse}
                  </th>
                  <th className="text-right text-[11px] text-muted-foreground font-normal tracking-wider pb-2 px-0.5 tabular-nums">
                    {c.natalAspectsColOrb}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const transitSign = formatLon(r.transitLongitude);
                  const natalSign = formatLon(r.natalLongitude);
                  return (
                  <tr
                    key={`${r.aspectId}-${r.transitPlanet}-${r.natalPlanet}`}
                    className="border-b border-[#1e1b38] last:border-0"
                  >
                    <td className="py-1 px-0.5 text-muted-foreground [overflow-wrap:anywhere]">{ASPECTS[r.aspectId].label}</td>
                    <td className="py-1 px-0.5 font-medium whitespace-nowrap">
                      <span className="font-symbols mr-0.5 text-[#2d1b4e] dark:text-[#8b7ab8] text-sm">
                        {PLANET_GLYPHS[r.transitPlanet]}
                      </span>
                      {r.transitPlanet}
                    </td>
                    <td className="py-1 px-0.5 font-medium whitespace-nowrap">
                      <span className="font-symbols mr-0.5 text-[#2d1b4e] dark:text-[#8b7ab8] text-sm">
                        {PLANET_GLYPHS[r.natalPlanet]}
                      </span>
                      {r.natalPlanet}
                    </td>
                    <td className="py-1 px-0.5 text-muted-foreground whitespace-nowrap">
                      <span className="font-symbols text-[#2d1b4e] dark:text-[#8b7ab8]" title={transitSign.sign}>
                        {transitSign.glyph}
                      </span>
                      <span className="text-muted-foreground/70 mx-0.5">/</span>
                      <span className="font-symbols text-[#2d1b4e] dark:text-[#8b7ab8]" title={natalSign.sign}>
                        {natalSign.glyph}
                      </span>
                    </td>
                    <td className="py-1 px-0.5 text-center tabular-nums text-muted-foreground">
                      {r.natalHouse}
                    </td>
                    <td className="py-1 px-0.5 text-right tabular-nums text-muted-foreground">
                      {r.orbFromExactDeg.toFixed(1)}°
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
