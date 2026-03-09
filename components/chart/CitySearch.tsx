'use client';
import { useState, useEffect, KeyboardEvent } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';
import type { GeoResult } from '@/lib/astro/types';

interface Props {
  onResult: (r: GeoResult) => void;
  onReset: () => void;
}

export function CitySearch({ onResult, onReset }: Props) {
  const [city, setCity] = useState('');
  const { state, search, reset } = useGeocoding();

  useEffect(() => {
    if (state.status === 'success') {
      onResult(state.result);
    }
  }, [state, onResult]);

  function handleSearch() {
    search(city);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }

  function handleChange(value: string) {
    setCity(value);
    reset();
    onReset();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-stretch">
        <input
          type="text"
          value={city}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. New York, London, Tokyo"
          className="flex-1 bg-[#0d0d1a] border border-[#2a2450] rounded-lg px-3 py-2.5 text-[#e0d8f0] text-sm outline-none focus:border-violet-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={state.status === 'loading'}
          className="bg-[#2a2450] border border-violet-500 rounded-lg text-violet-400 px-4 py-2 text-sm whitespace-nowrap hover:bg-[#3a3470] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {state.status === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </div>

      {state.status === 'success' && (
        <p className="text-green-400 text-xs">✓ {state.result.displayName}</p>
      )}
      {state.status === 'error' && (
        <p className="text-red-400 text-xs">{state.message}</p>
      )}
    </div>
  );
}
