'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { TarotDecanWheel } from '@/components/chart/TarotDecanWheel';
import { copy } from '@/lib/copy';
import type { ChartResult } from '@/lib/astro/types';

export default function ChartTarotPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const id = typeof params.id === 'string' ? params.id : '';
  const [chart, setChart] = useState<{ label: string; chartResult: ChartResult } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }
    if (status !== 'authenticated' || !id) return;

    let cancelled = false;
    fetch(`/api/charts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (!cancelled && data.chart) setChart(data.chart);
      })
      .catch(() => {
        if (!cancelled) setError('chart not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">loading…</div>
      </main>
    );
  }

  if (loading || error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <Link href="/dashboard" className="text-violet-400 text-sm hover:text-violet-300">
          ← {copy.dashboard.title}
        </Link>
        <p className={`text-center mt-8 ${error ? 'text-red-400' : 'text-muted-foreground'}`}>{error || 'loading…'}</p>
      </main>
    );
  }

  if (!chart) return null;

  return (
    <main className="max-w-6xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <Link
          href="/dashboard"
          className="text-muted-foreground text-sm hover:text-violet-400 transition-colors"
        >
          ← {copy.dashboard.title}
        </Link>
        <h1 className="text-5xl md:text-6xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.tarotTitle}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 font-bold">{copy.chart.tarotSubtitle}</p>
        <p className="text-foreground/90 mt-2 text-sm">
          {copy.chart.titlePrefix} {chart.label}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/chart/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-800 dark:text-violet-200 hover:bg-violet-500/20 transition-colors"
          >
            {copy.chart.goToNatalChart}
          </Link>
          <Link
            href={`/chart/${id}/transits`}
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            {copy.chart.checkTransits}
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <TarotDecanWheel result={chart.chartResult} chartSize={420} />
      </div>
    </main>
  );
}
