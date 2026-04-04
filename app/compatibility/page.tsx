'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BirthDataForm } from '@/components/chart/BirthDataForm';
import { useChartCalculation } from '@/hooks/useChartCalculation';
import { copy } from '@/lib/copy';
import { computeCompatibility, planetGlyph } from '@/lib/astro/compatibility';
import {
  getMergedCrossChartExplanation,
  getSymmetricPlacementScore,
  getOverallScore,
  getSameSignPlanets,
  getElementRelationPerPlanet,
} from '@/lib/astro/compatibilityInterpretations';
import type { ChartResult } from '@/lib/astro/types';
import type { PlanetName } from '@/lib/astro/types';

type ChartSlot =
  | { type: 'saved'; id: string; label: string; result: ChartResult }
  | { type: 'calculated'; label: string; result: ChartResult }
  | null;

interface SavedChartItem {
  id: string;
  label: string;
  birthData: string;
  chartResult: string;
}

/** Selected chart 1 / chart 2 mode tab — same ink as body text; violet wash only on the background. */
const compatModeToggleActiveClass =
  'bg-violet-500/15 text-foreground ring-1 ring-violet-500/30 dark:bg-violet-400/10 dark:text-foreground dark:ring-violet-400/25';

/** Unselected tab — same ink as body; only the background differs from active. */
const compatModeToggleInactiveClass = 'text-foreground';

/** Primary chart label may be stored as "My chart"; show copy.dashboard.myChart on this page. */
function compatibilityChartLabel(label: string): string {
  if (label.trim().toLowerCase() === 'my chart') return copy.dashboard.myChart;
  return label;
}

function CompatibilityContent() {
  const searchParams = useSearchParams();
  const prefillChartId = searchParams.get('chart');
  const { status } = useSession();
  const [savedCharts, setSavedCharts] = useState<SavedChartItem[]>([]);
  const [chartA, setChartA] = useState<ChartSlot>(null);
  const [chartB, setChartB] = useState<ChartSlot>(null);
  const [modeA, setModeA] = useState<'saved' | 'new'>('saved');
  const [modeB, setModeB] = useState<'saved' | 'new'>('saved');
  const [calculatingSlot, setCalculatingSlot] = useState<'a' | 'b' | null>(null);
  const { state: calcState, calculate, reset } = useChartCalculation();

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/charts')
      .then(res => res.json())
      .then(data => {
        if (data.charts) setSavedCharts(data.charts);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (prefillChartId && savedCharts.length > 0 && !chartA) {
      const c = savedCharts.find(ch => ch.id === prefillChartId);
      if (c) {
        try {
          const result = JSON.parse(c.chartResult) as ChartResult;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setChartA({ type: 'saved', id: c.id, label: c.label, result });
        } catch {
          // ignore
        }
      }
    }
  }, [prefillChartId, savedCharts, chartA]);

  const handleCalculated = useCallback(
    (result: ChartResult, slot: 'a' | 'b') => {
      const label = `${result.birthData.cityLabel} · ${result.birthData.date}`;
      if (slot === 'a') setChartA({ type: 'calculated', label, result });
      else setChartB({ type: 'calculated', label, result });
      setCalculatingSlot(null);
      reset();
    },
    [reset],
  );

  const calcResult = calcState.status === 'success' ? calcState.result : undefined;
  useEffect(() => {
    if (calcResult && calculatingSlot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleCalculated(calcResult, calculatingSlot);
    }
  }, [calcResult, calculatingSlot, handleCalculated]);

  const compatibilityResult =
    chartA && chartB
      ? computeCompatibility(
          chartA.result,
          chartB.result,
          compatibilityChartLabel(chartA.label),
          compatibilityChartLabel(chartB.label),
        )
      : null;

  return (
    <main className="max-w-4xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <Link
          href="/dashboard"
          className="text-muted-foreground text-sm hover:text-violet-400 transition-colors"
        >
          ← {copy.dashboard.backToDashboard}
        </Link>
        <h1 className="text-6xl md:text-7xl font-serif mt-4 mb-8 md:mb-10 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
          {copy.chart.titlePrefix} {copy.compatibility.title} {copy.chart.titleSuffix}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Chart 1 */}
        <Card className="p-4">
          <h2 className="text-base font-extrabold text-violet-900 dark:text-violet-300 tracking-widest uppercase mb-3">
            {copy.compatibility.chart1}
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setModeA('saved')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeA === 'saved' ? compatModeToggleActiveClass : compatModeToggleInactiveClass}`}
            >
              {copy.compatibility.selectSaved}
            </button>
            <button
              type="button"
              onClick={() => setModeA('new')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeA === 'new' ? compatModeToggleActiveClass : compatModeToggleInactiveClass}`}
            >
              {copy.compatibility.calculateNew}
            </button>
          </div>
          {modeA === 'saved' && (
            <>
              <select
                value={chartA?.type === 'saved' ? chartA.id : ''}
                onChange={e => {
                  const id = e.target.value;
                  if (!id) {
                    setChartA(null);
                    return;
                  }
                  const c = savedCharts.find(ch => ch.id === id);
                  if (c) {
                    try {
                      const result = JSON.parse(c.chartResult) as ChartResult;
                      setChartA({ type: 'saved', id: c.id, label: c.label, result });
                      if (chartB?.type === 'saved' && chartB.id === c.id) {
                        setChartB(null);
                      }
                    } catch {
                      setChartA(null);
                    }
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-2"
              >
                <option value="" disabled hidden />
                {savedCharts
                  .filter(c => !(chartB?.type === 'saved' && c.id === chartB.id))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {compatibilityChartLabel(c.label)}
                    </option>
                  ))}
              </select>
              {status !== 'authenticated' && (
                <p className="text-xs text-muted-foreground">{copy.compatibility.noCharts}</p>
              )}
            </>
          )}
          {modeA === 'new' && (
            <>
              {calculatingSlot !== 'a' ? (
                <div>
                  {chartA && chartA.type === 'calculated' && (
                    <p className="text-sm text-muted-foreground mb-2">{chartA.label}</p>
                  )}
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() => setCalculatingSlot('a')}
                  >
                    {chartA ? 'Recalculate' : copy.compatibility.calculateNew}
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <BirthDataForm
                    onSubmit={(data, options) => calculate(data, options)}
                    isLoading={calcState.status === 'calculating'}
                  />
                  <button
                    type="button"
                    onClick={() => setCalculatingSlot(null)}
                    className="text-xs text-muted-foreground hover:text-violet-400 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
          {chartA && modeA === 'saved' && (
            <p className="text-sm text-violet-800 dark:text-violet-200 mt-2">✓ {compatibilityChartLabel(chartA.label)}</p>
          )}
        </Card>

        {/* Chart 2 */}
        <Card className="p-4">
          <h2 className="text-base font-extrabold text-violet-900 dark:text-violet-300 tracking-widest uppercase mb-3">
            {copy.compatibility.chart2}
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setModeB('saved')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeB === 'saved' ? compatModeToggleActiveClass : compatModeToggleInactiveClass}`}
            >
              {copy.compatibility.selectSaved}
            </button>
            <button
              type="button"
              onClick={() => setModeB('new')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeB === 'new' ? compatModeToggleActiveClass : compatModeToggleInactiveClass}`}
            >
              {copy.compatibility.calculateNew}
            </button>
          </div>
          {modeB === 'saved' && (
            <>
              <select
                value={chartB?.type === 'saved' ? chartB.id : ''}
                onChange={e => {
                  const id = e.target.value;
                  if (!id) {
                    setChartB(null);
                    return;
                  }
                  const c = savedCharts.find(ch => ch.id === id);
                  if (c) {
                    try {
                      const result = JSON.parse(c.chartResult) as ChartResult;
                      setChartB({ type: 'saved', id: c.id, label: c.label, result });
                      if (chartA?.type === 'saved' && chartA.id === c.id) {
                        setChartA(null);
                      }
                    } catch {
                      setChartB(null);
                    }
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-2"
              >
                <option value="" disabled hidden />
                {savedCharts
                  .filter(c => !(chartA?.type === 'saved' && c.id === chartA.id))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {compatibilityChartLabel(c.label)}
                    </option>
                  ))}
              </select>
              {status !== 'authenticated' && (
                <p className="text-xs text-muted-foreground">{copy.compatibility.noCharts}</p>
              )}
            </>
          )}
          {modeB === 'new' && (
            <>
              {calculatingSlot !== 'b' ? (
                <div>
                  {chartB && chartB.type === 'calculated' && (
                    <p className="text-sm text-muted-foreground mb-2">{chartB.label}</p>
                  )}
                  <Button
                    variant="secondary"
                    className="text-sm"
                    onClick={() => setCalculatingSlot('b')}
                  >
                    {chartB ? 'Recalculate' : copy.compatibility.calculateNew}
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <BirthDataForm
                    onSubmit={(data, options) => calculate(data, options)}
                    isLoading={calcState.status === 'calculating'}
                  />
                  <button
                    type="button"
                    onClick={() => setCalculatingSlot(null)}
                    className="text-xs text-muted-foreground hover:text-violet-400 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
          {chartB && modeB === 'saved' && (
            <p className="text-sm text-violet-800 dark:text-violet-200 mt-2">✓ {compatibilityChartLabel(chartB.label)}</p>
          )}
        </Card>
      </div>

      {/* Compatibility result */}
      {compatibilityResult && (() => {
        const sameSignPlanets = getSameSignPlanets(compatibilityResult.aInB, compatibilityResult.bInA);
        const elementRelationByPlanet = getElementRelationPerPlanet(
          compatibilityResult.aInB,
          compatibilityResult.bInA,
        );
        const overall = getOverallScore(compatibilityResult.aInB, compatibilityResult.bInA);
        const scoreLabelClass = (label: string) =>
          label === 'high'
            ? 'text-emerald-400'
            : label === 'medium'
              ? 'text-amber-400'
              : 'text-muted-foreground';
        return (
          <section>
            <Card className="p-4 mb-6">
              <h3 className="text-xs text-violet-400 tracking-widest uppercase mb-2">
                {copy.compatibility.overall}
              </h3>
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <span className="text-4xl font-serif text-fuchsia-300">
                  {overall.scoreOutOf100}
                </span>
                <span className="text-muted-foreground text-sm">/ 100</span>
                <span className="text-sm text-violet-300 font-medium">
                  {overall.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{overall.summary}</p>
            </Card>
            <Card className="p-4 overflow-hidden">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-sm min-w-[44rem] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-3 align-bottom whitespace-nowrap" rowSpan={2}>
                        {copy.compatibility.planet}
                      </th>
                      <th
                        className="pb-2 pr-2 align-bottom whitespace-nowrap w-[4.5rem]"
                        rowSpan={2}
                      >
                        {copy.compatibility.score}
                      </th>
                      <th
                        className="pb-2 pr-4 align-bottom min-w-[10rem] max-w-[18rem]"
                        rowSpan={2}
                      >
                        {copy.compatibility.explanation}
                      </th>
                      <th
                        className="pb-2 px-3 align-bottom text-fuchsia-300 font-medium border-l border-border/60"
                        colSpan={2}
                      >
                        {compatibilityResult.chartALabel}
                      </th>
                      <th
                        className="pb-2 pl-3 align-bottom text-fuchsia-300 font-medium border-l border-border/60"
                        colSpan={2}
                      >
                        {compatibilityResult.chartBLabel}
                      </th>
                    </tr>
                    <tr className="text-left text-muted-foreground border-b border-border text-xs">
                      <th className="pb-2 pr-2 pt-1 whitespace-nowrap border-l border-border/60 pl-3">
                        {copy.compatibility.sign}
                      </th>
                      <th className="pb-2 pr-2 pt-1 whitespace-nowrap">{copy.compatibility.house}</th>
                      <th className="pb-2 pr-2 pt-1 whitespace-nowrap border-l border-border/60 pl-3">
                        {copy.compatibility.sign}
                      </th>
                      <th className="pb-2 pt-1 whitespace-nowrap">{copy.compatibility.house}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compatibilityResult.aInB.map((rowA) => {
                      const rowB = compatibilityResult.bInA.find((r) => r.planet.name === rowA.planet.name);
                      if (!rowB) return null;
                      const name = rowA.planet.name as PlanetName;
                      const placement = getSymmetricPlacementScore(
                        name,
                        rowA.house,
                        rowB.house,
                        sameSignPlanets,
                        elementRelationByPlanet.get(name) ?? 'none',
                      );
                      return (
                        <tr key={rowA.planet.name} className="border-b border-border/50 align-top">
                          <td className="py-2.5 pr-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <span aria-hidden>{planetGlyph(rowA.planet.name)}</span>
                              {rowA.planet.name}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 whitespace-nowrap align-top">
                            <span
                              className={`text-sm font-medium tabular-nums ${scoreLabelClass(placement.label)}`}
                            >
                              {placement.score}/10
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground text-xs leading-snug align-top max-w-[22rem]">
                            <span className="font-medium text-violet-200/90">{placement.note}</span>
                            {' '}
                            {getMergedCrossChartExplanation(
                              name,
                              rowA.house,
                              rowB.house,
                              compatibilityResult.chartALabel,
                              compatibilityResult.chartBLabel,
                            )}
                          </td>
                          <td className="py-2.5 pr-2 border-l border-border/40 pl-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <span aria-hidden>{rowA.glyph}</span>
                              {rowA.inSign}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 whitespace-nowrap">house {rowA.house}</td>
                          <td className="py-2.5 pr-2 border-l border-border/40 pl-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <span aria-hidden>{rowB.glyph}</span>
                              {rowB.inSign}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 whitespace-nowrap">house {rowB.house}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        );
      })()}
    </main>
  );
}

export default function CompatibilityPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-20 text-muted-foreground">Loading…</div>}>
      <CompatibilityContent />
    </Suspense>
  );
}
