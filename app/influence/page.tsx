'use client';

import { useEffect, useMemo, useState } from 'react';
import { ConjunctionPlot } from '@/components/chart/ConjunctionPlot';
import { copy } from '@/lib/copy';

export default function InfluencePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const { monthStart, monthEnd } = useMemo(() => {
    if (!mounted) return { monthStart: null as Date | null, monthEnd: null as Date | null };
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { monthStart: start, monthEnd: end };
  }, [mounted]);

  return (
    <main className="max-w-4xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6">
        <h1 className="text-5xl md:text-6xl font-serif mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.influence.title}
        </h1>
        <p className="text-muted-foreground">
          {copy.influence.subtitle}
        </p>
      </div>
      {mounted && monthStart && monthEnd ? (
        <ConjunctionPlot defaultStart={monthStart} defaultEnd={monthEnd} />
      ) : (
        <div className="min-h-[320px] flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground text-sm">
          Loading…
        </div>
      )}
    </main>
  );
}
