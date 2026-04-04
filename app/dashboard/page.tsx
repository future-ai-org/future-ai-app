'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MiniChartWheel } from '@/components/chart/MiniChartWheel';
import { DashboardTransitNews } from '@/components/chart/DashboardTransitNews';
import { AstroCoinsPanel } from '@/components/dashboard/AstroCoinsPanel';
import { copy } from '@/lib/copy';
import { reapplyWholeSignHouses } from '@/lib/astro/calculate';
import type { ChartResult } from '@/lib/astro/types';

interface SavedChartItem {
  id: string;
  label: string;
  isPrimary: boolean;
  birthData: string;
  chartResult: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [charts, setCharts] = useState<SavedChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    fetch('/api/charts')
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.charts) setCharts(data.charts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/charts/${id}`, { method: 'DELETE' });
      if (res.ok) setCharts(prev => prev.filter(c => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">loading…</div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
          {copy.chart.titlePrefix} {copy.dashboard.title} {copy.chart.titleSuffix}
        </h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">loading your charts…</p>
      ) : (
        <>
          <AstroCoinsPanel />
          {(() => {
            const primary = charts.find(c => c.isPrimary === true);
            if (!primary) return null;
            const primarySectionHeading = (
              <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-violet-500 dark:text-violet-400 tracking-widest uppercase mb-8">
                {copy.dashboard.yourChartAndTransits}
              </h2>
            );
            let result: ChartResult;
            try {
              result = JSON.parse(primary.chartResult) as ChartResult;
            } catch {
              return (
                <section className="mb-12 mx-auto w-full max-w-6xl">
                  {primarySectionHeading}
                  <div className="flex items-center gap-3">
                    <p className="text-muted-foreground text-sm">{primary.label}</p>
                    <Link href={`/chart/${primary.id}`}>
                      <Button variant="secondary" className="px-3 py-2 text-sm">
                        {copy.dashboard.view}
                      </Button>
                    </Link>
                  </div>
                </section>
              );
            }
            const displayResult = reapplyWholeSignHouses(result);
            return (
              <section className="mb-12 mx-auto w-full max-w-6xl">
                {primarySectionHeading}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-12 lg:items-center justify-items-center">
                  <div className="flex w-full flex-col items-center text-center">
                    <div className="w-full max-w-[min(420px,100%)]">
                      <MiniChartWheel
                        result={displayResult}
                        href={`/chart/${primary.id}`}
                        className="mx-auto"
                        footer={
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Link href={`/chart/${primary.id}/transits`}>
                              <Button variant="secondary" type="button">
                                {copy.chart.checkTransits}
                              </Button>
                            </Link>
                            <Button
                              variant="secondary"
                              type="button"
                              disabled={deletingId === primary.id}
                              onClick={() => handleDelete(primary.id)}
                            >
                              {deletingId === primary.id ? '…' : copy.dashboard.delete}
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  </div>
                  <DashboardTransitNews
                    natal={displayResult}
                    className="w-full min-w-0 max-w-lg lg:max-w-none justify-self-stretch"
                  />
                </div>
              </section>
            );
          })()}
          <section>
            <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-violet-500 dark:text-violet-400 tracking-widest uppercase mb-4">
              {copy.dashboard.otherCharts}
            </h2>
            {charts.filter(c => c.isPrimary !== true).length === 0 ? (
              <Card className="py-6 text-center">
                <p className="text-muted-foreground text-sm mb-3">{copy.dashboard.noCharts}</p>
                <Link href="/chart">
                  <Button variant="secondary">{copy.dashboard.newChart}</Button>
                </Link>
              </Card>
            ) : (
              <ul className="space-y-3">
                {charts
                  .filter(c => c.isPrimary !== true)
                  .map(chart => {
                    let birthLabel = '';
                    try {
                      const b = JSON.parse(chart.birthData) as {
                        date?: string;
                      };
                      birthLabel = b.date || chart.label;
                    } catch {
                      birthLabel = chart.label;
                    }
                    return (
                      <li key={chart.id}>
                        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                              <h3 className="text-xl sm:text-2xl font-semibold text-foreground truncate leading-tight">
                                {chart.label}
                              </h3>
                            <p className="text-sm text-muted-foreground truncate">{birthLabel}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {copy.dashboard.createdAt}{' '}
                                {new Date(chart.createdAt).toLocaleDateString(undefined, {
                                  dateStyle: 'medium',
                                })}
                              </p>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <Link href={`/chart/${chart.id}`}>
                              <Button variant="secondary" type="button">
                                {copy.dashboard.view}
                              </Button>
                            </Link>
                            <Link href={`/chart/${chart.id}/transits`}>
                              <Button variant="secondary" type="button">
                                {copy.chart.checkTransits}
                              </Button>
                            </Link>
                            <Link href={`/compatibility?chart=${chart.id}`}>
                              <Button variant="secondary" type="button">
                                {copy.compatibility.compatibility}
                              </Button>
                            </Link>
                            <Button
                              variant="secondary"
                              type="button"
                              disabled={deletingId === chart.id}
                              onClick={() => handleDelete(chart.id)}
                            >
                              {deletingId === chart.id ? '…' : copy.dashboard.delete}
                            </Button>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
