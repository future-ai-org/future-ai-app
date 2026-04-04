'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type PanelProps = {
  className?: string;
  /** From server (Prisma → Postgres / Supabase); avoids a false “0” before the client fetch completes. */
  initialCoins?: number;
  /** Increment after wallet-changing actions (e.g. predict withdraw) to refetch balance. */
  walletRefreshTick?: number;
};

export function AstroCoinsPanel({ className, initialCoins, walletRefreshTick = 0 }: PanelProps) {
  const { status } = useSession();
  const [coins, setCoins] = useState<number>(() =>
    typeof initialCoins === 'number' && Number.isFinite(initialCoins)
      ? Math.max(0, Math.floor(initialCoins))
      : 0,
  );
  const [usd, setUsd] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(
    () => typeof initialCoins !== 'number',
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const lastWalletTick = useRef(0);

  const fetchBalance = useCallback(async () => {
    if (status !== 'authenticated') return;
    const quiet =
      typeof initialCoins === 'number' && Number.isFinite(initialCoins);
    if (!quiet) setLoadingBalance(true);
    const opts: RequestInit = {
      credentials: 'same-origin',
      cache: 'no-store',
    };
    try {
      let res = await fetch('/api/astro-coins', opts);
      if (res.status === 401) return;
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch('/api/astro-coins', opts);
      }
      if (!res.ok) return;
      const data = (await res.json()) as { coins?: number };
      if (typeof data.coins === 'number' && Number.isFinite(data.coins)) {
        setCoins(Math.max(0, Math.floor(data.coins)));
      }
    } catch {
      /* keep existing balance */
    } finally {
      setLoadingBalance(false);
    }
  }, [status, initialCoins]);

  useEffect(() => {
    if (walletRefreshTick > 0 && walletRefreshTick !== lastWalletTick.current) {
      lastWalletTick.current = walletRefreshTick;
      void fetchBalance();
    }
  }, [walletRefreshTick, fetchBalance]);

  useEffect(() => {
    if (status === 'authenticated') void fetchBalance();
  }, [fetchBalance, status]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('astro_purchase');
    if (status === 'success') {
      setFlash(copy.dashboard.astroCoinsPurchaseSuccess);
      void fetchBalance();
    } else if (status === 'cancelled') {
      setFlash(copy.dashboard.astroCoinsPurchaseCancelled);
    }
    if (status != null) {
      const url = new URL(window.location.href);
      url.searchParams.delete('astro_purchase');
      const next = url.pathname + (url.search ? url.search : '');
      window.history.replaceState({}, '', next);
    }
  }, [fetchBalance]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setFlash(null);
    const amount = Number.parseFloat(usd.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFlash(copy.dashboard.astroCoinsAmountRequired);
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: amount }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || typeof data.url !== 'string') {
        const serverMsg =
          typeof data.error === 'string' && data.error.trim() !== ''
            ? data.error
            : null;
        setFlash(serverMsg ?? copy.dashboard.astroCoinsCheckoutError);
        return;
      }
      window.location.href = data.url;
    } catch {
      setFlash(copy.dashboard.astroCoinsCheckoutError);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <Card
      className={cn(
        'mb-10 border-violet-500/20 bg-violet-500/[0.04] dark:bg-violet-500/[0.07]',
        className,
      )}
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          <h2 className="text-base font-extrabold uppercase tracking-widest text-violet-500 dark:text-violet-400">
            {copy.dashboard.astroCoinsTitle}
          </h2>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                'text-5xl font-bold tabular-nums tracking-tight leading-none sm:text-6xl md:text-7xl lg:text-8xl',
                'bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent',
                'dark:from-violet-400 dark:to-fuchsia-300',
              )}
            >
              {loadingBalance ? '…' : coins.toLocaleString()}
            </span>
            <span className="text-xl font-medium text-violet-700 dark:text-muted-foreground sm:text-2xl md:text-3xl">
              {copy.dashboard.astroCoinsLabel}
            </span>
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col items-stretch gap-4 sm:w-auto sm:max-w-md sm:shrink-0 sm:justify-center">
          <form
            onSubmit={handleCheckout}
            className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
          >
            <div className="min-w-0 flex-1 text-left">
              <label
                htmlFor="astro-amount-usd"
                className="mb-1.5 block text-left text-xs font-medium text-muted-foreground sm:text-sm"
              >
                {copy.dashboard.astroCoinsAmountLabel}
              </label>
              <input
                id="astro-amount-usd"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder={copy.dashboard.astroCoinsAmountPlaceholder}
                value={usd}
                onChange={e => setUsd(e.target.value)}
                disabled={checkoutLoading}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-violet-500/30 placeholder:text-muted-foreground focus:border-violet-500/50 focus:ring-2 disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              disabled={checkoutLoading}
              className="w-full shrink-0 px-4 py-2.5 text-sm sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 dark:from-violet-600 dark:to-fuchsia-600"
            >
              {checkoutLoading ? 'redirecting…' : copy.dashboard.astroCoinsBuyStripe}
            </Button>
          </form>

          <p className="text-left text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
            {copy.dashboard.astroCoinsBuyStripeHint}
          </p>

          {flash ? (
            <p className="text-left text-xs text-muted-foreground">{flash}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
