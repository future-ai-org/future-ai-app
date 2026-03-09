'use client';
import Link from 'next/link';
import { BirthDataForm } from '@/components/chart/BirthDataForm';
import { ChartResults } from '@/components/chart/ChartResults';
import { useChartCalculation } from '@/hooks/useChartCalculation';

export default function ChartPage() {
  const { state, calculate } = useChartCalculation();

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20">
      <div className="pt-8 pb-6 text-center">
        <Link href="/" className="text-[#7c6b9e] text-sm hover:text-violet-400 transition-colors">
          ← Back
        </Link>
        <h1 className="text-4xl font-serif mt-4 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          ✦ Natal Chart
        </h1>
        <p className="text-[#7c6b9e] text-sm tracking-widest uppercase">
          Western Astrology · Placidus Houses · Tropical Zodiac
        </p>
      </div>

      <BirthDataForm onSubmit={calculate} isLoading={state.status === 'calculating'} />

      {state.status === 'error' && (
        <p className="text-red-400 text-sm text-center mt-4">{state.message}</p>
      )}

      {state.status === 'success' && <ChartResults result={state.result} />}
    </main>
  );
}
