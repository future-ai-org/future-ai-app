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
import {
  MyPredictionsSection,
  type DashboardPredictionBet,
} from '@/components/dashboard/MyPredictionsSection';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
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

type Props = {
  initialAstroCoins: number;
};

export default function DashboardClient({ initialAstroCoins }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [charts, setCharts] = useState<SavedChartItem[]>([]);
  const [predictions, setPredictions] = useState<DashboardPredictionBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [walletRefreshTick, setWalletRefreshTick] = useState(0);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch('/api/charts').then(r => r.json()),
      fetch('/api/predict/bets', { credentials: 'same-origin', cache: 'no-store' }).then(r =>
        r.ok ? r.json() : Promise.resolve({ bets: [] }),
      ),
    ])
      .then(([chartsData, betsData]) => {
        if (cancelled) return;
        if (chartsData.charts) setCharts(chartsData.charts);
        const raw = betsData as { bets?: unknown };
        if (Array.isArray(raw.bets)) {
          setPredictions(raw.bets as DashboardPredictionBet[]);
        } else {
          setPredictions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router, dataRefreshKey]);

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

      <AstroCoinsPanel initialCoins={initialAstroCoins} walletRefreshTick={walletRefreshTick} />

      {loading ? (
        <p className="text-muted-foreground text-sm">loading your dashboard…</p>
      ) : (
        <>
          <MyPredictionsSection
            bets={predictions}
            onPredictionsRefresh={() => setDataRefreshKey(k => k + 1)}
            onWalletRefresh={() => setWalletRefreshTick(t => t + 1)}
          />
          {(() => {
            const primary = charts.find(c => c.isPrimary === true);
            if (!primary) return null;
            const showPrimaryTitle =
              primary.label.trim().toLowerCase() !== copy.dashboard.myChart;
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
                    {showPrimaryTitle ? (
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          'bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent',
                          'dark:from-violet-400 dark:to-fuchsia-300',
                        )}
                      >
                        {primary.label}
                      </p>
                    ) : null}
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
                {showPrimaryTitle ? (
                  <p
                    className={cn(
                      'mb-6 mx-auto max-w-2xl text-center text-2xl sm:text-3xl font-semibold tracking-tight px-2 text-balance',
                      'bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent',
                      'dark:from-violet-400 dark:to-fuchsia-300',
                    )}
                  >
                    {primary.label}
                  </p>
                ) : null}
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
                  <Button variant="secondary">{copy.dashboard.addNewChart}</Button>
                </Link>
              </Card>
            ) : (
              <>
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
                              <h3
                                className={cn(
                                  'text-xl sm:text-2xl font-semibold truncate leading-tight',
                                  'bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent',
                                  'dark:from-violet-400 dark:to-fuchsia-300',
                                )}
                              >
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
                <div className="mt-8 flex justify-center">
                  <Link href="/chart">
                    <Button variant="primary" className="px-6 py-3 text-base">
                      {copy.dashboard.addNewChart}
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
