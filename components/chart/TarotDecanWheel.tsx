'use client';

import { useId, useMemo } from 'react';
import { ChartWheel } from '@/components/chart/ChartWheel';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import type { ChartResult } from '@/lib/astro/types';
import {
  TAROT_DECANS,
  chartWheelOuterRadiusPx,
  eclipticLongitudeToCanvasAngle,
  shortTarotLabel,
} from '@/lib/tarot/decans';

interface Props {
  result: ChartResult;
  /** Canvas side length for the natal wheel (px). */
  chartSize?: number;
}

/** Extra space around the wheel for decan labels and arrows (px). */
const RING = 200;

export function TarotDecanWheel({ result, chartSize = 420 }: Props) {
  const { theme } = useTheme();
  const markerId = useId().replace(/:/g, '');
  const asc = result.asc;

  const layout = useMemo(() => {
    const container = chartSize + 2 * RING;
    const cx = container / 2;
    const cy = container / 2;
    const wheelOuter = chartWheelOuterRadiusPx(chartSize);
    const arrowStart = wheelOuter + 4;
    const arrowEnd = wheelOuter + RING - 28;
    const labelR = arrowEnd + 4;
    return { container, cx, cy, wheelOuter, arrowStart, arrowEnd, labelR };
  }, [chartSize]);

  const decanSlots = useMemo(
    () =>
      TAROT_DECANS.map((d) => {
        const theta = eclipticLongitudeToCanvasAngle(d.midpointLon, asc);
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        return {
          ...d,
          theta,
          cos,
          sin,
          short: shortTarotLabel(d.name),
        };
      }),
    [asc],
  );

  const strokeColor =
    theme === 'light' ? 'rgba(100, 80, 140, 0.45)' : 'rgba(140, 120, 180, 0.4)';

  return (
    <div
      className="mx-auto max-w-full overflow-x-auto overflow-y-visible pb-4"
      aria-label="natal chart with tarot decan correspondences"
    >
      <div
        className="relative mx-auto shrink-0"
        style={{ width: layout.container, height: layout.container }}
      >
        <svg
          className="absolute inset-0 z-0 pointer-events-none"
          width={layout.container}
          height={layout.container}
          aria-hidden
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={theme === 'light' ? '#7c6a9e' : '#9b8ab8'} opacity={0.85} />
            </marker>
          </defs>
          {decanSlots.map((d) => {
            const x1 = layout.cx + d.cos * layout.arrowStart;
            const y1 = layout.cy + d.sin * layout.arrowStart;
            const x2 = layout.cx + d.cos * layout.arrowEnd;
            const y2 = layout.cy + d.sin * layout.arrowEnd;
            return (
              <line
                key={d.index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={1}
                markerEnd={`url(#${markerId})`}
              />
            );
          })}
        </svg>

        <div
          className="absolute z-10 flex items-center justify-center"
          style={{
            left: RING,
            top: RING,
            width: chartSize,
            height: chartSize,
          }}
        >
          <ChartWheel result={result} size={chartSize} />
        </div>

        {decanSlots.map((d) => {
          const lx = layout.cx + d.cos * layout.labelR;
          const ly = layout.cy + d.sin * layout.labelR;
          return (
            <div
              key={d.index}
              className={cn(
                'absolute z-20 flex flex-col items-center justify-center rounded-md border px-1.5 py-1 text-center shadow-sm min-w-[2.75rem]',
                theme === 'light'
                  ? 'border-violet-200/90 bg-white/95 text-violet-950'
                  : 'border-white/15 bg-[#14121c]/95 text-violet-100',
              )}
              style={{
                left: lx,
                top: ly,
                transform: 'translate(-50%, -50%)',
              }}
              title={d.name}
              aria-label={`${d.name}, ${d.midpointLon.toFixed(0)}° ecliptic`}
            >
              <span className="text-[10px] leading-tight font-semibold tracking-tight text-muted-foreground">
                {d.short}
              </span>
              <span className="text-[9px] leading-tight opacity-80 max-w-[3.5rem] truncate hidden sm:block">
                {d.name.replace(/^\d+\s+/, '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
