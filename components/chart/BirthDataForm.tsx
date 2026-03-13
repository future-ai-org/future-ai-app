'use client';
import { useState, useCallback, FormEvent } from 'react';
import { CitySearch } from './CitySearch';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { validateBirthDate } from '@/lib/astro/validate';
import type { BirthData, GeoResult, ChartOptions } from '@/lib/astro/types';

const DENVER_LAT = 39.7392;
const DENVER_LON = -104.9903;
const DENVER_UTC_OFFSET = -7; // Mountain Time (MST)

const DEFAULT_OPTIONS: ChartOptions = {
  lilith: true,
  juno: true,
  chiron: true,
  northNode: true,
  southNode: true,
  lotOfFortune: true,
  lotOfSpirit: true,
  lotOfEros: true,
  lotOfVictory: true,
};

interface Props {
  onSubmit: (data: BirthData, options: ChartOptions) => void;
  isLoading?: boolean;
}

export function BirthDataForm({ onSubmit, isLoading }: Props) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [timeNotKnown, setTimeNotKnown] = useState(false);
  const [cityNotKnown, setCityNotKnown] = useState(false);
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [utcOffset, setUtcOffset] = useState('');
  const [error, setError] = useState('');
  const [options, setOptions] = useState<ChartOptions>(DEFAULT_OPTIONS);

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

    if (!date) { setError(copy.form.errors.noDate); return; }
    if (!validateBirthDate(date).valid) { setError(copy.form.errors.invalidYear); return; }
    const birthTime = timeNotKnown ? '12:00' : time;
    if (!timeNotKnown && !time) { setError(copy.form.errors.noTime); return; }
    if (!cityNotKnown && !geoResult) { setError(copy.form.errors.noCity); return; }

    const latitude = cityNotKnown ? DENVER_LAT : geoResult!.latitude;
    const longitude = cityNotKnown ? DENVER_LON : geoResult!.longitude;
    const parsedOffset = cityNotKnown
      ? (Number(utcOffset) || DENVER_UTC_OFFSET)
      : parseFloat(utcOffset);
    const cityLabel = cityNotKnown ? 'Denver' : geoResult!.displayName;

    if (isNaN(parsedOffset)) { setError(copy.form.errors.invalidUtc); return; }

    onSubmit(
      {
        date,
        time: birthTime,
        latitude,
        longitude,
        utcOffset: parsedOffset,
        cityLabel,
      },
      options,
    );
  }

  function toggleOption(key: keyof ChartOptions) {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Card className="mb-6">
      <h2 className="text-sm text-violet-400 tracking-widest uppercase mb-5">{copy.form.sectionTitle}</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground tracking-wider">{copy.form.dateLabel}</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min="1900-01-01"
              max="2100-12-31"
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground tracking-wider">{copy.form.timeLabel}</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              disabled={timeNotKnown}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm outline-none focus:border-violet-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={timeNotKnown}
                onChange={e => {
                  setTimeNotKnown(e.target.checked);
                  if (e.target.checked) setTime('12:00');
                }}
                className="rounded border-border bg-background text-violet-500 focus:ring-violet-500"
              />
              <span className="text-xs text-muted-foreground">{copy.form.timeNotKnown}</span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs text-muted-foreground tracking-wider">{copy.form.cityLabel}</label>
            <CitySearch onResult={handleGeoResult} onReset={handleGeoReset} disabled={cityNotKnown} />
            <label className="flex items-center gap-2 cursor-pointer w-fit mt-2">
              <input
                type="checkbox"
                checked={cityNotKnown}
                onChange={e => {
                  const checked = e.target.checked;
                  setCityNotKnown(checked);
                  if (checked) {
                    setGeoResult(null);
                    setUtcOffset(String(DENVER_UTC_OFFSET));
                  } else {
                    setUtcOffset('');
                  }
                }}
                className="rounded border-border bg-background text-violet-500 focus:ring-violet-500"
              />
              <span className="text-xs text-muted-foreground">{copy.form.cityNotKnown}</span>
            </label>
          </div>

          {(geoResult || cityNotKnown) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground tracking-wider">
                {copy.form.utcLabel}
              </label>
              <input
                type="number"
                step="0.5"
                value={utcOffset}
                onChange={e => setUtcOffset(e.target.value)}
                placeholder={copy.form.utcPlaceholder}
                className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}
        </div>

        <fieldset className="mb-4 pt-4 border-t border-border">
          <legend className="text-sm text-violet-400 tracking-widest uppercase mb-3">
            {copy.chartOptions.sectionTitle}
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
            {(['lilith', 'juno', 'chiron'] as const).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key] ?? false}
                  onChange={() => toggleOption(key)}
                  className="rounded border-border bg-background text-violet-500 focus:ring-violet-500"
                />
                <span className="text-sm text-muted-foreground">{copy.chartOptions[key]}</span>
              </label>
            ))}
            {(['northNode', 'southNode'] as const).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key] ?? false}
                  onChange={() => toggleOption(key)}
                  className="rounded border-border bg-background text-violet-500 focus:ring-violet-500"
                />
                <span className="text-sm text-muted-foreground">{copy.chartOptions[key]}</span>
              </label>
            ))}
            {(['lotOfFortune', 'lotOfSpirit', 'lotOfEros', 'lotOfVictory'] as const).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key] ?? false}
                  onChange={() => toggleOption(key)}
                  className="rounded border-border bg-background text-violet-500 focus:ring-violet-500"
                />
                <span className="text-sm text-muted-foreground">{copy.chartOptions[key]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="flex justify-center pt-1">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-fit min-w-[12rem] justify-center px-8 py-3 text-base rounded-xl"
          >
            {isLoading ? copy.form.calculating : copy.form.submit}
          </Button>
        </div>
      </form>
    </Card>
  );
}
