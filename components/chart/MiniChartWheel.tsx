'use client';

import Link from 'next/link';
import { ChartWheel } from '@/components/chart/ChartWheel';
import type { ChartResult } from '@/lib/astro/types';

const MINI_SIZE = 140;

interface Props {
  result: ChartResult;
  href: string;
  label?: string;
  className?: string;
}

export function MiniChartWheel({ result, href, label, className = '' }: Props) {
  return (
    <Link
      href={href}
      className={`inline-block w-fit rounded-2xl border border-border bg-card p-2 shadow-[0_0_24px_-6px_rgba(99,102,241,0.2)] transition-all hover:border-violet-500/50 hover:shadow-[0_0_32px_-4px_rgba(139,92,246,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${className}`}
      aria-label={label ? `View ${label}` : 'View chart'}
    >
      <ChartWheel result={result} size={MINI_SIZE} />
      {label && (
        <p className="mt-2 text-center text-xs font-medium text-muted-foreground truncate max-w-[140px] mx-auto">
          {label}
        </p>
      )}
    </Link>
  );
}
