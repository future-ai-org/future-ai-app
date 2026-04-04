'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { adjustBetAmountInput, parseBetAmountInput } from '@/lib/predict-bet-amount-step';
import { cn } from '@/lib/utils';
import type { DashboardPredictionBet } from '@/components/dashboard/MyPredictionsSection';

const predictTitleRainbow =
  'bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent';

const NOT_ENOUGH_KEY = 'not_enough';

type PredictCopy = typeof copy.predict & {
  investBalanceLabel?: string;
  investAmountLabel?: string;
  investConfirm?: string;
  investCancel?: string;
  investSubmitting?: string;
  investErrorGeneric?: string;
  investInvalidAmount?: string;
  investNotEnoughCoins?: string;
  investAddCoins?: string;
  investGoDashboard?: string;
  investLoadingBalance?: string;
  investSignInPrompt?: string;
  investGoSignIn?: string;
};

type Props = {
  open: boolean;
  bet: DashboardPredictionBet | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function PredictBetMoreModal({ open, bet, onClose, onSuccess }: Props) {
  const { status } = useSession();
  const titleId = useId();
  const p = copy.predict as PredictCopy;
  const d = copy.dashboard;

  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [amount, setAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoadingBalance(true);
    setAuthRequired(false);
    try {
      const opts: RequestInit = { credentials: 'same-origin', cache: 'no-store' };
      let res = await fetch('/api/astro-coins', opts);
      if (res.status === 401) {
        setAuthRequired(true);
        setBalance(0);
        return;
      }
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch('/api/astro-coins', opts);
      }
      if (res.status === 401) {
        setAuthRequired(true);
        setBalance(0);
        return;
      }
      if (!res.ok) {
        setBalance(0);
        return;
      }
      const data = (await res.json()) as { coins?: number };
      if (typeof data.coins === 'number' && Number.isFinite(data.coins)) {
        setBalance(Math.max(0, Math.floor(data.coins)));
      }
    } catch {
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, [status]);

  useEffect(() => {
    if (!open || !bet) return;
    setErrorKey(null);
    setAmount('1');
    setAuthRequired(false);
    if (status === 'authenticated') void fetchBalance();
    else setBalance(0);
  }, [open, bet, status, fetchBalance]);

  useEffect(() => {
    if (!open || loadingBalance || status !== 'authenticated' || !bet) return;
    if (balance >= 1) {
      setAmount(String(Math.min(10, balance)));
    }
  }, [open, loadingBalance, status, balance, bet]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bet || status !== 'authenticated' || authRequired) return;
    setErrorKey(null);
    const n = Number.parseInt(amount.replace(/\D/g, ''), 10);
    if (!Number.isFinite(n) || n < 1) {
      setErrorKey('invalid');
      return;
    }
    if (n > balance) {
      setErrorKey(NOT_ENOUGH_KEY);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/predict/bets/${bet.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ coins: n }),
      });
      if (res.status === 402) {
        setErrorKey(NOT_ENOUGH_KEY);
        void fetchBalance();
        return;
      }
      if (!res.ok) {
        setErrorKey('generic');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setErrorKey('generic');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !bet) return null;

  const sideNorm = bet.side.trim().toLowerCase();
  if (sideNorm !== 'yes' && sideNorm !== 'no') return null;

  const sideLabel = sideNorm === 'yes' ? copy.predict.yes : copy.predict.no;
  const notEnoughMessage = p.investNotEnoughCoins ?? "you don't have enough coins.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-[101] w-full max-w-2xl border-violet-500/25 bg-card/95 p-5 sm:p-7 shadow-xl',
        )}
        onClick={e => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className={cn(
            'text-center text-4xl font-serif font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl',
            predictTitleRainbow,
          )}
        >
          {sideLabel}
        </h2>
        <p className="mt-5 text-center text-xl font-semibold leading-snug text-foreground sm:mt-6 sm:text-2xl md:text-3xl md:leading-tight">
          {bet.question}
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {d.myPredictionsBetMoreCurrent}:{' '}
          <span className="font-semibold tabular-nums text-foreground">
            {bet.coins.toLocaleString()}
          </span>{' '}
          {d.myPredictionsCoins} {d.myPredictionsOn} {sideLabel}
        </p>

        {status === 'unauthenticated' || status === 'loading' ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{p.investSignInPrompt ?? 'Sign in.'}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/login?callbackUrl=/dashboard">
                <Button type="button" variant="primary" className="!px-4 !py-2 !text-sm">
                  {p.investGoSignIn ?? 'Sign in'}
                </Button>
              </Link>
              <Button type="button" variant="secondary" className="!px-4 !py-2 !text-sm" onClick={onClose}>
                {p.investCancel ?? 'Cancel'}
              </Button>
            </div>
          </div>
        ) : authRequired ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{p.investSignInPrompt ?? 'Sign in.'}</p>
            <Link href="/login?callbackUrl=/dashboard">
              <Button type="button" variant="primary" className="!px-4 !py-2 !text-sm">
                {p.investGoSignIn ?? 'Sign in'}
              </Button>
            </Link>
          </div>
        ) : loadingBalance ? (
          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-muted-foreground">
              {p.investLoadingBalance ?? 'loading…'}
            </p>
          </div>
        ) : balance < 1 ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm font-bold text-muted-foreground">{notEnoughMessage}</p>
            <Link href="/dashboard">
              <Button type="button" variant="primary" className="!px-4 !py-2 !text-sm">
                {p.investAddCoins ?? p.investGoDashboard ?? 'Add coins'}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              {p.investBalanceLabel ?? 'Balance'}:{' '}
              <span className="font-semibold tabular-nums text-foreground">{balance.toLocaleString()}</span>
            </p>
            <p className="text-sm text-muted-foreground">{d.myPredictionsBetMoreHowMany}</p>
            <div>
              <label
                htmlFor="predict-bet-more-amount"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                {p.investAmountLabel ?? 'Amount'}
              </label>
              <input
                id="predict-bet-more-amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  if (errorKey != null) setErrorKey(null);
                }}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-violet-500/50 focus:ring-2 ring-violet-500/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                aria-label="Decrease coins"
                className="!min-w-10 !px-3 !py-2 !text-lg font-semibold tabular-nums leading-none"
                disabled={submitting || parseBetAmountInput(amount, balance) <= 1}
                onClick={() => {
                  setAmount(adjustBetAmountInput(amount, -1, balance));
                  if (errorKey != null) setErrorKey(null);
                }}
              >
                −
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label="Increase coins"
                className="!min-w-10 !px-3 !py-2 !text-lg font-semibold tabular-nums leading-none"
                disabled={submitting || parseBetAmountInput(amount, balance) >= balance}
                onClick={() => {
                  setAmount(adjustBetAmountInput(amount, 1, balance));
                  if (errorKey != null) setErrorKey(null);
                }}
              >
                +
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !py-2 !text-sm"
                disabled={submitting || balance < 1}
                onClick={() => {
                  setAmount(String(balance));
                  if (errorKey != null) setErrorKey(null);
                }}
              >
                max
              </Button>
            </div>
            {errorKey === 'invalid' ? (
              <p className="text-sm text-red-400/90">{p.investInvalidAmount ?? 'Invalid amount.'}</p>
            ) : null}
            {errorKey === NOT_ENOUGH_KEY ? (
              <p className="text-sm font-bold text-red-400/90">{notEnoughMessage}</p>
            ) : null}
            {errorKey === 'generic' ? (
              <p className="text-sm text-red-400/90">{p.investErrorGeneric ?? 'Error'}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button type="submit" variant="primary" disabled={submitting} className="!px-4 !py-2 !text-sm">
                {submitting ? p.investSubmitting ?? '…' : p.investConfirm ?? 'Confirm'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!px-4 !py-2 !text-sm"
                disabled={submitting}
                onClick={onClose}
              >
                {p.investCancel ?? 'Cancel'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
