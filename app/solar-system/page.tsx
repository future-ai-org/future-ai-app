'use client';

import dynamic from 'next/dynamic';
import { copy } from '@/lib/copy';

const SolarSystemClient = dynamic(() => import('@/components/solar-system/SolarSystemClient'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[min(72dvh,640px)] min-h-[420px] animate-pulse rounded-xl border border-border bg-muted sm:h-[min(78dvh,720px)] sm:min-h-[480px]"
      aria-hidden
    />
  ),
});

export default function SolarSystemPage() {
  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 pb-6">
      <header className="pt-8 pb-6 text-center scroll-mt-20">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif mt-4 mb-1 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
          {copy.chart.titlePrefix} {copy.solarSystem.title} {copy.chart.titleSuffix}
        </h1>
      </header>
      <SolarSystemClient />
    </div>
  );
}
