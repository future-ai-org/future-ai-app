'use client';

import { useMemo } from 'react';
import { findNatalMajorAspects, type NatalMajorAspect } from '@/lib/astro/natalAspects';
import { ASPECTS } from '@/lib/astro/aspects';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import type { ChartResult } from '@/lib/astro/types';
import { cn } from '@/lib/utils';

interface Props {
  result: ChartResult;
  className?: string;
}

function rowKey(r: NatalMajorAspect, i: number): string {
  return `${r.aspectId}-${r.bodyA}-${r.bodyB}-${i}`;
}

export function NatalAspectsTable({ result, className }: Props) {
  const rows = useMemo(() => findNatalMajorAspects(result), [result]);
  const c = copy.chart;

  return (
    <Card className={cn('w-full min-w-0', className)}>
      <h2 className="text-xs font-bold text-violet-400 tracking-widest uppercase mb-4 border-b border-border pb-2">
        {c.natalAspectsTitle}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.natalAspectsNone}</p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">
                  {c.natalAspectsColPoint1}
                </th>
                <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">
                  {c.natalAspectsColAspect}
                </th>
                <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">
                  {c.natalAspectsColPoint2}
                </th>
                <th className="text-right text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1 tabular-nums">
                  {c.natalAspectsColOrb}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={rowKey(r, i)} className="border-b border-[#1e1b38] last:border-0">
                  <td className="py-1.5 px-1 font-medium [overflow-wrap:anywhere]">{r.bodyA}</td>
                  <td className="py-1.5 px-1 text-muted-foreground">{ASPECTS[r.aspectId].label}</td>
                  <td className="py-1.5 px-1 font-medium [overflow-wrap:anywhere]">{r.bodyB}</td>
                  <td className="py-1.5 px-1 text-right tabular-nums text-muted-foreground">
                    {r.orbFromExactDeg.toFixed(1)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
