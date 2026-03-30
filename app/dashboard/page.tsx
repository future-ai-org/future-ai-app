'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MiniChartWheel } from '@/components/chart/MiniChartWheel';
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
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center text-muted-foreground">loading…</div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6">
        <h1 className="text-4xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.dashboard.title}
        </h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">loading your charts…</p>
      ) : (
        <>
          {(() => {
            const primary = charts.find(c => c.isPrimary === true);
            if (!primary) return null;
            let result: ChartResult;
            try {
              result = JSON.parse(primary.chartResult) as ChartResult;
            } catch {
              return (
                <div className="flex items-center gap-3 mb-8">
                  <p className="text-muted-foreground text-sm">{primary.label}</p>
                  <Link href={`/chart/${primary.id}`}>
                    <Button variant="secondary" className="px-3 py-2 text-sm">
                      {copy.dashboard.view}
                    </Button>
                  </Link>
                </div>
              );
            }
            return (
              <div className="mb-8 flex flex-col items-center">
                <MiniChartWheel
                  result={reapplyWholeSignHouses(result)}
                  href={`/chart/${primary.id}`}
                  label={primary.label}
                />
                <Link
                  href={`/chart/${primary.id}/transits`}
                  className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {copy.chart.checkTransits}
                </Link>
                <button
                  type="button"
                  disabled={deletingId === primary.id}
                  onClick={() => handleDelete(primary.id)}
                  className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  {deletingId === primary.id ? '…' : copy.dashboard.delete}
                </button>
              </div>
            );
          })()}
          <section>
            <h2 className="text-sm font-bold text-violet-400 tracking-widest uppercase mb-3">
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
                              <h3 className="font-medium text-foreground truncate">
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
                            {!chart.isPrimary && (
                              <Button
                                variant="secondary"
                                type="button"
                                onClick={async () => {
                                  const res = await fetch(`/api/charts/${chart.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isPrimary: true }),
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    const newPrimaryId = data.chart?.id;
                                    setCharts(prev =>
                                      prev.map(c => ({
                                        ...c,
                                        isPrimary: Boolean(newPrimaryId && c.id === newPrimaryId),
                                      }))
                                    );
                                  }
                                }}
                              >
                                {copy.dashboard.setAsMyChart}
                              </Button>
                            )}
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
