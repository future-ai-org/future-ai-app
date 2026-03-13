'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { TransitsWheel } from '@/components/chart/TransitsWheel';
import { TransitsTable } from '@/components/chart/TransitsTable';
import { copy } from '@/lib/copy';
import { calculateChart } from '@/lib/astro/calculate';
import { CHART_OF_MOMENT_OPTIONS } from '@/lib/astro/types';
import type { BirthData, ChartResult } from '@/lib/astro/types';

function nowBirthData(lat: number, lon: number, cityLabel: string): BirthData {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  const time = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
  return {
    date,
    time,
    latitude: lat,
    longitude: lon,
    utcOffset: 0,
    cityLabel,
  };
}

export default function ChartTransitsPage() {
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

  const transitResult = useMemo(() => {
    if (!chart?.chartResult?.birthData) return null;
    const b = chart.chartResult.birthData;
    const nowData = nowBirthData(b.latitude, b.longitude, b.cityLabel);
    return calculateChart(nowData, CHART_OF_MOMENT_OPTIONS);
  }, [chart?.chartResult?.birthData]);

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

  if (!chart || !transitResult) return null;

  const now = new Date();
  const transitLabel = now.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <Link
          href={`/chart/${id}`}
          className="text-muted-foreground text-sm hover:text-violet-400 transition-colors"
        >
          ← {chart.label}
        </Link>
        <h1 className="text-4xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.transitsTitle}
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          {copy.chart.transitsSubtitle(transitLabel)}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 mt-8">
        <div className="flex flex-col items-center gap-6 shrink-0">
          <TransitsWheel natal={chart.chartResult} transit={transitResult} size={420} />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">Outer wheel</strong> — current transits</span>
            <span><strong className="text-foreground">Inner wheel</strong> — {chart.label} (natal)</span>
          </div>
        </div>
        <div className="w-full lg:max-w-xl shrink-0">
          <TransitsTable natal={chart.chartResult} transit={transitResult} />
        </div>
      </div>
    </main>
  );
}
