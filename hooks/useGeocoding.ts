'use client';
import { useState, useCallback } from 'react';
import { geocodeCity } from '@/lib/geocoding';
import type { GeoResult } from '@/lib/astro/types';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: GeoResult }
  | { status: 'error'; message: string };

export function useGeocoding() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const search = useCallback(async (city: string) => {
    if (!city.trim()) return;
    setState({ status: 'loading' });
    try {
      const result = await geocodeCity(city);
      setState({ status: 'success', result });
    } catch {
      setState({ status: 'error', message: 'City not found. Try a different spelling.' });
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, search, reset };
}
