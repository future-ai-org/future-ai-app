'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChartWheel } from '@/components/chart/ChartWheel';
import type { ChartResult } from '@/lib/astro/types';

/** Default diameter for dashboard / profile-style previews. */
export const MINI_CHART_WHEEL_DEFAULT_SIZE = 400;

interface Props {
  result: ChartResult;
  href: string;
  /** Shown under the wheel when `footer` is not set. */
  label?: string;
  /** Replaces `label` when set (e.g. actions under the chart). */
  footer?: ReactNode;
  className?: string;
  /** Canvas diameter in px. */
  size?: number;
}

export function MiniChartWheel({
  result,
  href,
  label,
  footer,
  className = '',
  size = MINI_CHART_WHEEL_DEFAULT_SIZE,
}: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [diameter, setDiameter] = useState(size);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      setDiameter(Math.min(size, Math.max(120, w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  return (
    <div
      className={`w-full rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-[0_0_24px_-6px_rgba(99,102,241,0.2)] transition-all hover:border-violet-500/50 hover:shadow-[0_0_32px_-4px_rgba(139,92,246,0.35)] ${className}`}
    >
      <Link
        href={href}
        className="block w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-label={label ? `View ${label}` : 'View chart'}
      >
        <div ref={measureRef} className="w-full">
          <ChartWheel result={result} size={diameter} />
        </div>
      </Link>
      {footer ? (
        <div className="mt-4">{footer}</div>
      ) : (
        label && (
          <p
            className="mt-3 text-center text-sm font-medium text-muted-foreground truncate mx-auto"
            style={{ maxWidth: diameter }}
          >
            {label}
          </p>
        )
      )}
    </div>
  );
}
