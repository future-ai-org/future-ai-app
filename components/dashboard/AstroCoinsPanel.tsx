'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'future-ai-astro-coins';
/** Demo conversion: USD → astro coins (no real payments). */
const COINS_PER_USD = 100;

export function AstroCoinsPanel({ className }: { className?: string }) {
  const [coins, setCoins] = useState(0);
  const [usd, setUsd] = useState('');
  const [buyNotice, setBuyNotice] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) return;
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n) && n >= 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydrate from localStorage after mount
        setCoins(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(coins));
    } catch {
      /* ignore */
    }
  }, [coins]);

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number.parseFloat(usd.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return;
    const added = Math.floor(amount * COINS_PER_USD);
    if (added <= 0) return;
    setCoins((c) => c + added);
    setUsd('');
  }

  return (
    <Card
      className={cn(
        'mb-10 border-violet-500/20 bg-violet-500/[0.04] dark:bg-violet-500/[0.07]',
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-violet-500 dark:text-violet-400">
            {copy.dashboard.astroCoinsTitle}
          </h2>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground leading-none sm:text-6xl md:text-7xl lg:text-8xl">
              {coins.toLocaleString()}
            </span>
            <span className="text-xl font-medium text-muted-foreground sm:text-2xl md:text-3xl">
              {copy.dashboard.astroCoinsLabel}
            </span>
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4 sm:w-auto sm:max-w-md sm:shrink-0">
          <form onSubmit={handleDeposit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="astro-deposit-usd" className="mb-1 block text-xs font-medium text-muted-foreground">
                {copy.dashboard.astroCoinsDepositLabel}
              </label>
              <input
                id="astro-deposit-usd"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder={copy.dashboard.astroCoinsDepositPlaceholder}
                value={usd}
                onChange={(e) => setUsd(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-violet-500/30 placeholder:text-muted-foreground focus:border-violet-500/50 focus:ring-2"
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full shrink-0 sm:w-auto">
              {copy.dashboard.astroCoinsDeposit}
            </Button>
          </form>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 sm:w-auto"
              onClick={() => {
                setBuyNotice(true);
              }}
            >
              {copy.dashboard.astroCoinsBuy}
            </Button>
            {buyNotice ? (
              <p className="text-xs text-muted-foreground">{copy.dashboard.astroCoinsBuyNotice}</p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
