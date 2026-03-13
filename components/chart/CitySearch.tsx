'use client';
import { useState, useEffect, useRef } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';
import { copy } from '@/lib/copy';
import type { GeoResult } from '@/lib/astro/types';

const DEBOUNCE_MS = 500;
const MIN_LENGTH = 2;

interface Props {
  onResult: (r: GeoResult) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function CitySearch({ onResult, onReset, disabled }: Props) {
  const [city, setCity] = useState('');
  const { state, search, reset } = useGeocoding();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.status === 'success') {
      onResult(state.result);
    }
  }, [state, onResult]);

  // Auto-search when user stops typing (debounced)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = city.trim();
    if (trimmed.length < MIN_LENGTH) {
      reset();
      onReset();
      return;
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      search(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps -- search, reset, onReset are stable

  function handleChange(value: string) {
    setCity(value);
    reset();
    onReset();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={city}
        onChange={e => handleChange(e.target.value)}
        placeholder={copy.citySearch.placeholder}
        disabled={disabled}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm outline-none focus:border-violet-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        autoComplete="off"
      />

      {state.status === 'loading' && (
        <p className="text-muted-foreground text-xs">{copy.citySearch.searching}</p>
      )}
      {state.status === 'success' && (
        <p className="text-green-400 text-xs">
          {copy.citySearch.foundPrefix} {state.result.displayName}
        </p>
      )}
      {state.status === 'error' && (
        <p className="text-red-400 text-xs">{state.message}</p>
      )}
    </div>
  );
}
