'use client';
import { useState, useCallback } from 'react';
import { calculateChart } from '@/lib/astro/calculate';
import type { BirthData, ChartResult, ChartOptions } from '@/lib/astro/types';

type ChartState =
  | { status: 'idle' }
  | { status: 'calculating' }
  | { status: 'success'; result: ChartResult }
  | { status: 'error'; message: string };

export function useChartCalculation() {
  const [state, setState] = useState<ChartState>({ status: 'idle' });

  const calculate = useCallback((data: BirthData, options?: ChartOptions) => {
    setState({ status: 'calculating' });
    try {
      const result = calculateChart(data, options ?? {});
      setState({ status: 'success', result });
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Calculation failed' });
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, calculate, reset };
}
