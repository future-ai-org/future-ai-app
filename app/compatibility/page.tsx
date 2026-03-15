'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BirthDataForm } from '@/components/chart/BirthDataForm';
import { useChartCalculation } from '@/hooks/useChartCalculation';
import { copy } from '@/lib/copy';
import { computeCompatibility, planetGlyph } from '@/lib/astro/compatibility';
import {
  getCompatibilityExplanation,
  getPlacementScore,
  getOverallScore,
  getSameSignPlanets,
  getElementCompatiblePlanets,
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
      ? computeCompatibility(chartA.result, chartB.result, chartA.label, chartB.label)
      : null;

  return (
    <main className="max-w-4xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6">
        <h1 className="text-4xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.compatibility.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Chart 1 */}
        <Card className="p-4">
          <h2 className="text-sm text-violet-400 tracking-widest uppercase mb-3">
            {copy.compatibility.chart1}
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setModeA('saved')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeA === 'saved' ? 'bg-border text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {copy.compatibility.selectSaved}
            </button>
            <button
              type="button"
              onClick={() => setModeA('new')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeA === 'new' ? 'bg-border text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:text-foreground'}`}
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
                    } catch {
                      setChartA(null);
                    }
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-2"
              >
                <option value="">{copy.compatibility.chooseChart}</option>
                {savedCharts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
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
            <p className="text-sm text-muted-foreground mt-2">✓ {chartA.label}</p>
          )}
        </Card>

        {/* Chart 2 */}
        <Card className="p-4">
          <h2 className="text-sm text-violet-400 tracking-widest uppercase mb-3">
            {copy.compatibility.chart2}
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setModeB('saved')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeB === 'saved' ? 'bg-border text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {copy.compatibility.selectSaved}
            </button>
            <button
              type="button"
              onClick={() => setModeB('new')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${modeB === 'new' ? 'bg-border text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:text-foreground'}`}
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
                    } catch {
                      setChartB(null);
                    }
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-2"
              >
                <option value="">{copy.compatibility.chooseChart}</option>
                {savedCharts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
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
            <p className="text-sm text-muted-foreground mt-2">✓ {chartB.label}</p>
          )}
        </Card>
      </div>

      {/* Compatibility result */}
      {compatibilityResult && (() => {
        const sameSignPlanets = getSameSignPlanets(compatibilityResult.aInB, compatibilityResult.bInA);
        const elementCompatiblePlanets = getElementCompatiblePlanets(compatibilityResult.aInB, compatibilityResult.bInA);
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
                <span className="text-3xl font-serif text-fuchsia-300">
                  {overall.scoreOutOf100}
                </span>
                <span className="text-muted-foreground text-sm">/ 100</span>
                <span className="text-sm text-violet-300 font-medium">
                  {overall.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{overall.summary}</p>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="text-xs text-fuchsia-300 font-medium mb-3">
                  {copy.compatibility.planetsInHouses(compatibilityResult.chartALabel)}
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-2">{copy.compatibility.planet}</th>
                      <th className="pb-2 pr-2">{copy.compatibility.sign}</th>
                      <th className="pb-2 pr-2">{copy.compatibility.house}</th>
                      <th className="pb-2 pr-2">{copy.compatibility.score}</th>
                      <th className="pb-2">{copy.compatibility.explanation}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compatibilityResult.aInB.map((row, i) => {
                      const placement = getPlacementScore(
                        row.planet.name as PlanetName,
                        row.house,
                        sameSignPlanets,
                        elementCompatiblePlanets,
                      );
                      return (
                        <tr
                          key={i}
                          className="border-b border-border/50 align-top"
                        >
                          <td className="py-2 pr-2">
                            {planetGlyph(row.planet.name)} {row.planet.name}
                          </td>
                          <td className="py-2 pr-2">
                            {row.glyph} {row.inSign}
                          </td>
                          <td className="py-2 pr-2">house {row.house}</td>
                          <td className="py-2 pr-2">
                            <span
                              className={`text-xs font-medium ${scoreLabelClass(placement.label)}`}
                              title={placement.note}
                            >
                              {placement.score}/10
                            </span>
                          </td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {getCompatibilityExplanation(
                              row.planet.name as PlanetName,
                              row.house,
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
              <Card className="p-4">
                <h3 className="text-xs text-fuchsia-300 font-medium mb-3">
                  {copy.compatibility.planetsInHouses(compatibilityResult.chartBLabel)}
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-2">{copy.compatibility.planet}</th>
                      <th className="pb-2 pr-2">{copy.compatibility.sign}</th>
                      <th className="pb-2 pr-2">{copy.compatibility.house}</th>
                      <th className="pb-2 pr-2">{copy.compatibility.score}</th>
                      <th className="pb-2">{copy.compatibility.explanation}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compatibilityResult.bInA.map((row, i) => {
                      const placement = getPlacementScore(
                        row.planet.name as PlanetName,
                        row.house,
                        sameSignPlanets,
                        elementCompatiblePlanets,
                      );
                      return (
                        <tr
                          key={i}
                          className="border-b border-border/50 align-top"
                        >
                          <td className="py-2 pr-2">
                            {planetGlyph(row.planet.name)} {row.planet.name}
                          </td>
                          <td className="py-2 pr-2">
                            {row.glyph} {row.inSign}
                          </td>
                          <td className="py-2 pr-2">house {row.house}</td>
                          <td className="py-2 pr-2">
                            <span
                              className={`text-xs font-medium ${scoreLabelClass(placement.label)}`}
                              title={placement.note}
                            >
                              {placement.score}/10
                            </span>
                          </td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {getCompatibilityExplanation(
                              row.planet.name as PlanetName,
                              row.house,
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
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
