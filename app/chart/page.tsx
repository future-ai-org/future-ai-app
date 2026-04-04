'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BirthDataForm, type ChartFormMeta } from '@/components/chart/BirthDataForm';
import { Button } from '@/components/ui/Button';
import { ChartResults } from '@/components/chart/ChartResults';
import { SaveChart } from '@/components/chart/SaveChart';
import { useChartCalculation } from '@/hooks/useChartCalculation';
import { copy } from '@/lib/copy';
import type { BirthData, ChartOptions } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/constants';

const DEFAULT_CHART_META: ChartFormMeta = {
  timeNotKnown: false,
  cityNotKnown: false,
  ascendantKnown: false,
  ascendantSign: 'aries',
};

export default function ChartPage() {
  const { state, calculate, reset } = useChartCalculation();
  const [formKey, setFormKey] = useState(0);
  const [chartMeta, setChartMeta] = useState<ChartFormMeta>(DEFAULT_CHART_META);
  const [showDashboardAfterSave, setShowDashboardAfterSave] = useState(false);
  const hasUnknownTimeOrCity = chartMeta.timeNotKnown || chartMeta.cityNotKnown;

  const handleSubmit = (data: BirthData, options: ChartOptions, meta: ChartFormMeta) => {
    setShowDashboardAfterSave(false);
    setChartMeta(meta);
    const hasUnknownTimeOrCity = meta.timeNotKnown || meta.cityNotKnown;

    const ascendantIndex = SIGNS.indexOf(meta.ascendantSign);
    const ascendantOverride =
      meta.ascendantKnown && hasUnknownTimeOrCity && ascendantIndex >= 0
        ? ascendantIndex * 30 + 15
        : undefined;

    const opts: ChartOptions =
      hasUnknownTimeOrCity
        ? { ...options, lotOfFortune: false, lotOfSpirit: false, lotOfEros: false, lotOfVictory: false }
        : options;

    calculate(data, opts, {
      ascendant: ascendantOverride,
      ascendantAngleUnknown: typeof ascendantOverride === 'number',
    });
  };

  const handleSaved = () => {
    reset();
    setFormKey((k) => k + 1);
    setShowDashboardAfterSave(true);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-5xl md:text-6xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
          {copy.chart.titlePrefix} {copy.chart.title} {copy.chart.titleSuffix}
        </h1>
      </div>

      <BirthDataForm
        key={formKey}
        onSubmit={handleSubmit}
        isLoading={state.status === 'calculating'}
      />

      {showDashboardAfterSave && state.status === 'idle' ? (
        <div className="mt-8 flex justify-center">
          <Link href="/dashboard">
            <Button type="button" variant="secondary" className="!px-5 !py-2.5 !text-sm">
              {copy.saveChart.goToDashboard}
            </Button>
          </Link>
        </div>
      ) : null}

      {state.status === 'error' && (
        <p className="text-red-400 text-sm text-center mt-4">{state.message}</p>
      )}

      {state.status === 'success' && (
        <>
          <ChartResults
            result={state.result}
            showAscendant={!hasUnknownTimeOrCity || chartMeta.ascendantKnown}
            showAngles={!hasUnknownTimeOrCity || chartMeta.ascendantKnown}
            showAscOnly={hasUnknownTimeOrCity ? chartMeta.ascendantKnown : false}
          />
          <SaveChart result={state.result} onSaved={handleSaved} />
        </>
      )}
    </main>
  );
}
