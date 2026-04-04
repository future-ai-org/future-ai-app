'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type PredictQuestionItem = {
  id: number;
  question: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  question: PredictQuestionItem | null;
  cardIndex: number;
  side: 'yes' | 'no';
  onInvested: (cardIndex: number, side: 'yes' | 'no', coins: number) => void;
};

const NOT_ENOUGH_KEY = 'not_enough';

const choiceGradient =
  'bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent';

type PredictInvestCopy = typeof copy.predict & {
  investModalHowMany?: string;
  investBalanceLabel?: string;
  investSignInPrompt?: string;
  investGoDashboard?: string;
  investGoSignIn?: string;
  investAmountLabel?: string;
  investConfirm?: string;
  investCancel?: string;
  investSubmitting?: string;
  investSuccessToast?: string;
  investErrorGeneric?: string;
  investInvalidAmount?: string;
  investNotEnoughCoins?: string;
  investAddCoins?: string;
};

export function PredictInvestModal({
  open,
  onClose,
  question,
  cardIndex,
  side,
  onInvested,
}: Props) {
  const { status } = useSession();
  const titleId = useId();
  const p = copy.predict as PredictInvestCopy;

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
      const opts: RequestInit = {
        credentials: 'same-origin',
        cache: 'no-store',
      };

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
      const n =
        typeof data.coins === 'number' && Number.isFinite(data.coins)
          ? Math.max(0, Math.floor(data.coins))
          : 0;
      setBalance(n);
    } catch {
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, [status]);

  useEffect(() => {
    if (!open) return;
    setErrorKey(null);
    setAmount('1');
    setAuthRequired(false);
    if (status === 'authenticated') {
      void fetchBalance();
    } else {
      setBalance(0);
    }
  }, [open, status, fetchBalance]);

  useEffect(() => {
    if (!open || loadingBalance || status !== 'authenticated') return;
    if (balance >= 1) {
      setAmount(String(Math.min(10, balance)));
    }
  }, [open, loadingBalance, status, balance]);

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
    if (!question || status !== 'authenticated' || authRequired) return;
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
      const res = await fetch('/api/predict/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          questionId: question.id,
          side,
          coins: n,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        balance?: number;
      };
      if (res.status === 402) {
        setErrorKey(NOT_ENOUGH_KEY);
        void fetchBalance();
        return;
      }
      if (!res.ok) {
        setErrorKey('generic');
        return;
      }
      onInvested(cardIndex, side, n);
      if (typeof data.balance === 'number' && Number.isFinite(data.balance)) {
        setBalance(Math.max(0, Math.floor(data.balance)));
      }
      onClose();
    } catch {
      setErrorKey('generic');
    } finally {
      setSubmitting(false);
    }
  }

  function setQuick(v: number) {
    setAmount(String(Math.min(v, balance)));
  }

  if (!open || !question) return null;

  const sideLabel = side === 'yes' ? copy.predict.yes : copy.predict.no;
  const notEnoughMessage = p.investNotEnoughCoins ?? "you don't have enough coins.";
  const showInsufficient =
    !loadingBalance && status === 'authenticated' && !authRequired && balance < 1;
  const showForm =
    status === 'authenticated' && !authRequired && !loadingBalance && balance >= 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-hidden
      />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-question`}
        className={cn(
          'relative z-[101] w-full max-w-2xl border-violet-500/25 bg-card/95 p-5 sm:p-7 shadow-xl',
        )}
        onClick={e => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className={cn(
            'text-center text-5xl font-serif font-bold uppercase tracking-tight sm:text-7xl md:text-8xl',
            choiceGradient,
          )}
        >
          {sideLabel}
        </h2>
        <p
          id={`${titleId}-question`}
          className="mt-5 text-center text-xl font-semibold leading-snug text-foreground sm:mt-6 sm:text-2xl md:text-3xl md:leading-tight"
        >
          {question.question}
        </p>

        {status === 'unauthenticated' || status === 'loading' ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {p.investSignInPrompt ?? 'Sign in to invest.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/login?callbackUrl=/">
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
            <p className="text-sm text-muted-foreground">
              {p.investSignInPrompt ?? 'Sign in to continue.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/login?callbackUrl=/">
                <Button type="button" variant="primary" className="!px-4 !py-2 !text-sm">
                  {p.investGoSignIn ?? 'Sign in'}
                </Button>
              </Link>
              <Button type="button" variant="secondary" className="!px-4 !py-2 !text-sm" onClick={onClose}>
                {p.investCancel ?? 'Cancel'}
              </Button>
            </div>
          </div>
        ) : loadingBalance ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">loading balance…</p>
            <Button type="button" variant="secondary" className="!px-4 !py-2 !text-sm" onClick={onClose}>
              {p.investCancel ?? 'Cancel'}
            </Button>
          </div>
        ) : showInsufficient ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm font-bold text-muted-foreground">{notEnoughMessage}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/dashboard">
                <Button type="button" variant="primary" className="!px-4 !py-2 !text-sm">
                  {p.investAddCoins ?? p.investGoDashboard ?? 'Add coins'}
                </Button>
              </Link>
              <Button type="button" variant="secondary" className="!px-4 !py-2 !text-sm" onClick={onClose}>
                {p.investCancel ?? 'Cancel'}
              </Button>
            </div>
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              {p.investBalanceLabel ?? 'Balance'}:{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {balance.toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">{p.investModalHowMany}</p>
            <div>
              <label htmlFor="predict-invest-amount" className="mb-1 block text-xs font-medium text-muted-foreground">
                {p.investAmountLabel ?? 'Amount'}
              </label>
              <input
                id="predict-invest-amount"
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
            <div className="flex flex-wrap gap-2">
              {[1, 10, 25, 50].map(v => (
                <Button
                  key={v}
                  type="button"
                  variant="secondary"
                  className="!px-3 !py-1.5 !text-xs"
                  disabled={submitting || balance < v}
                  onClick={() => setQuick(v)}
                >
                  {v}
                </Button>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !py-1.5 !text-xs"
                disabled={submitting || balance < 1}
                onClick={() => setAmount(String(balance))}
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
            {errorKey === NOT_ENOUGH_KEY ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/dashboard">
                  <Button type="button" variant="primary" className="!px-4 !py-2 !text-sm">
                    {p.investAddCoins ?? p.investGoDashboard ?? 'Add coins'}
                  </Button>
                </Link>
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
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button type="submit" variant="primary" disabled={submitting} className="!px-4 !py-2 !text-sm">
                {submitting ? p.investSubmitting ?? '…' : p.investConfirm ?? 'Confirm'}
              </Button>
              {errorKey !== NOT_ENOUGH_KEY ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-4 !py-2 !text-sm"
                  disabled={submitting}
                  onClick={onClose}
                >
                  {p.investCancel ?? 'Cancel'}
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
