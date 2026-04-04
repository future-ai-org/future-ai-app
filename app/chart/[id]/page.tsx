'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ChartResults } from '@/components/chart/ChartResults';
import { copy } from '@/lib/copy';
import type { ChartResult } from '@/lib/astro/types';

export default function ViewSavedChartPage() {
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
          ← {copy.dashboard.backToDashboard}
        </Link>
        <p className={`text-center mt-8 ${error ? 'text-red-400' : 'text-muted-foreground'}`}>{error || 'loading…'}</p>
      </main>
    );
  }

  if (!chart) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <Link
          href="/dashboard"
          className="text-muted-foreground text-sm hover:text-violet-400 transition-colors"
        >
          ← {copy.dashboard.backToDashboard}
        </Link>
        <h1 className="text-5xl md:text-6xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.titlePrefix} {chart.label}
        </h1>
      </div>
      <ChartResults result={chart.chartResult} />
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href={`/chart/${id}/transits`}
          className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
        >
          {copy.chart.checkTransits}
        </Link>
      </div>
    </main>
  );
}
