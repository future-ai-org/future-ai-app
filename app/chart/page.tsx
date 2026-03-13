'use client';
import { useState } from 'react';
import { BirthDataForm } from '@/components/chart/BirthDataForm';
import { ChartResults } from '@/components/chart/ChartResults';
import { SaveChart } from '@/components/chart/SaveChart';
import { useChartCalculation } from '@/hooks/useChartCalculation';
import { copy } from '@/lib/copy';
import type { BirthData, ChartOptions } from '@/lib/astro/types';

export default function ChartPage() {
  const { state, calculate, reset } = useChartCalculation();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (data: BirthData, options: ChartOptions) => {
    calculate(data, options);
  };

  const handleSaved = () => {
    reset();
    setFormKey((k) => k + 1);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-4xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.titlePrefix} {copy.chart.title}
        </h1>
      </div>

      <BirthDataForm
        key={formKey}
        onSubmit={handleSubmit}
        isLoading={state.status === 'calculating'}
      />

      {state.status === 'error' && (
        <p className="text-red-400 text-sm text-center mt-4">{state.message}</p>
      )}

      {state.status === 'success' && (
        <>
          <ChartResults result={state.result} />
          <SaveChart result={state.result} onSaved={handleSaved} />
        </>
      )}
    </main>
  );
}
