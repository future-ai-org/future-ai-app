'use client';

import dynamic from 'next/dynamic';

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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">solar system</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          our small corner of a beautiful, dark, and vast universe
        </p>
      </header>
      <SolarSystemClient />
    </div>
  );
}
