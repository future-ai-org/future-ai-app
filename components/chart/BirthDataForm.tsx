'use client';
import { useState, useCallback, FormEvent } from 'react';
import { CitySearch } from './CitySearch';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { BirthData, GeoResult } from '@/lib/astro/types';

interface Props {
  onSubmit: (data: BirthData) => void;
  isLoading?: boolean;
}

export function BirthDataForm({ onSubmit, isLoading }: Props) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [utcOffset, setUtcOffset] = useState('');
  const [error, setError] = useState('');

  const handleGeoResult = useCallback((r: GeoResult) => {
    setGeoResult(r);
    setUtcOffset(String(r.utcOffset));
  }, []);

  const handleGeoReset = useCallback(() => {
    setGeoResult(null);
    setUtcOffset('');
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!date) { setError('Please enter your birth date.'); return; }
    if (!time) { setError('Please enter your birth time.'); return; }
    if (!geoResult) { setError('Please search for and select a birth city.'); return; }

    const parsedOffset = parseFloat(utcOffset);
    if (isNaN(parsedOffset)) { setError('Please enter a valid UTC offset.'); return; }

    onSubmit({
      date,
      time,
      latitude: geoResult.latitude,
      longitude: geoResult.longitude,
      utcOffset: parsedOffset,
      cityLabel: geoResult.displayName,
    });
  }

  return (
    <Card className="mb-6">
      <h2 className="text-sm text-violet-400 tracking-widest uppercase mb-5">Birth Data</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#9d8ec0] tracking-wider">Date of Birth</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-[#0d0d1a] border border-[#2a2450] rounded-lg px-3 py-2.5 text-[#e0d8f0] text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#9d8ec0] tracking-wider">Time of Birth</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="bg-[#0d0d1a] border border-[#2a2450] rounded-lg px-3 py-2.5 text-[#e0d8f0] text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs text-[#9d8ec0] tracking-wider">Birth City</label>
            <CitySearch onResult={handleGeoResult} onReset={handleGeoReset} />
          </div>

          {geoResult && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#9d8ec0] tracking-wider">
                UTC Offset — adjust if DST applies
              </label>
              <input
                type="number"
                step="0.5"
                value={utcOffset}
                onChange={e => setUtcOffset(e.target.value)}
                placeholder="e.g. -5 or +1"
                className="bg-[#0d0d1a] border border-[#2a2450] rounded-lg px-3 py-2.5 text-[#e0d8f0] text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full justify-center text-base py-3"
        >
          {isLoading ? 'Calculating…' : 'Calculate My Chart'}
        </Button>
      </form>
    </Card>
  );
}
