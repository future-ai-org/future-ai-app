'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  result: ChartResult;
  /** Called after a chart is successfully saved (clears form on chart page) */
  onSaved?: () => void;
}

export function SaveChart({ result, onSaved }: Props) {
  const { status } = useSession();
  const [label, setLabel] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveAsPrimaryStatus, setSaveAsPrimaryStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [hasPrimaryChart, setHasPrimaryChart] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/charts')
      .then((res) => (res.ok ? res.json() : { charts: [] }))
      .then((data: { charts?: { isPrimary?: boolean }[] }) => {
        if (!cancelled && Array.isArray(data.charts)) {
          setHasPrimaryChart(data.charts.some((c) => c.isPrimary === true));
        }
      })
      .catch(() => {
        if (!cancelled) setHasPrimaryChart(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, saveAsPrimaryStatus]);

  if (status === 'loading') return null;
  if (status !== 'authenticated') {
    return (
      <Card className="mt-6">
        <p className="text-muted-foreground text-sm mb-2">{copy.saveChart.signInToSave}</p>
        <Link href={`/login?callbackUrl=${encodeURIComponent('/chart')}`}>
          <Button variant="secondary" type="button">
            {copy.nav.signIn}
          </Button>
        </Link>
      </Card>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    setError('');
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: trimmed,
          birthData: result.birthData,
          chartResult: result,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to save');
        setSaveStatus('error');
        return;
      }
      setSaveStatus('saved');
      onSaved?.();
    } catch {
      setError('Something went wrong');
      setSaveStatus('error');
    }
  }

  async function handleSaveToMyChart() {
    setError('');
    setSaveAsPrimaryStatus('saving');
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'My chart',
          isPrimary: true,
          birthData: result.birthData,
          chartResult: result,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? 'Failed to save');
        setSaveAsPrimaryStatus('error');
        return;
      }
      setSaveAsPrimaryStatus('saved');
      setHasPrimaryChart(true);
      onSaved?.();
    } catch {
      setError('Something went wrong');
      setSaveAsPrimaryStatus('error');
    }
  }

  return (
    <Card className="mt-6">
      <h3 className="text-sm text-violet-400 tracking-widest uppercase mb-3">
        {copy.dashboard.saveChart}
      </h3>

      {/* Save as my chart (hidden if user already has a primary) */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        {saveAsPrimaryStatus === 'saved' && (
          <p className="text-emerald-400 text-sm">{copy.saveChart.success}</p>
        )}
        {saveAsPrimaryStatus !== 'saved' && hasPrimaryChart !== true && (
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveToMyChart}
            disabled={saveAsPrimaryStatus === 'saving'}
          >
            {saveAsPrimaryStatus === 'saving'
              ? copy.saveChart.saving
              : copy.saveChart.saveToMyChart}
          </Button>
        )}
      </div>

      {/* Save with custom label */}
      <p className="text-xs text-muted-foreground mb-2">{copy.saveChart.saveWithLabel}</p>
      {saveStatus === 'saved' ? (
        <p className="text-emerald-400 text-sm">{copy.saveChart.success}</p>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="sr-only">{copy.saveChart.label}</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={copy.saveChart.placeholder}
              disabled={saveStatus === 'saving'}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm outline-none focus:border-violet-500 transition-colors disabled:opacity-60"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={saveStatus === 'saving' || !label.trim()}
            className="shrink-0"
          >
            {saveStatus === 'saving' ? copy.saveChart.saving : copy.saveChart.button}
          </Button>
        </form>
      )}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </Card>
  );
}
