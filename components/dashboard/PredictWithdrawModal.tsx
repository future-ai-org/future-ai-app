'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import type { DashboardPredictionBet } from '@/components/dashboard/MyPredictionsSection';

type Props = {
  open: boolean;
  bet: DashboardPredictionBet | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function PredictWithdrawModal({ open, bet, onClose, onSuccess }: Props) {
  const titleId = useId();
  const [amount, setAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxCoins = bet?.coins ?? 0;

  useEffect(() => {
    if (!open || !bet) return;
    setAmount(String(Math.min(10, maxCoins)));
    setError(null);
  }, [open, bet, maxCoins]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bet) return;
      setError(null);
      const n = Number.parseInt(amount.replace(/\D/g, ''), 10);
      if (!Number.isFinite(n) || n < 1) {
        setError(copy.dashboard.myPredictionsWithdrawInvalid);
        return;
      }
      if (n > bet.coins) {
        setError(copy.dashboard.myPredictionsWithdrawTooMany);
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch(`/api/predict/bets/${bet.id}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ coins: n }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(
            typeof data.error === 'string' && data.error.trim() !== ''
              ? data.error
              : copy.dashboard.myPredictionsWithdrawError,
          );
          return;
        }
        onSuccess();
        onClose();
      } catch {
        setError(copy.dashboard.myPredictionsWithdrawError);
      } finally {
        setSubmitting(false);
      }
    },
    [amount, bet, onClose, onSuccess],
  );

  if (!open || !bet) return null;

  const sideLabel =
    bet.side === 'yes' ? copy.predict.yes : bet.side === 'no' ? copy.predict.no : bet.side;

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
          'relative z-[101] w-full max-w-md border-violet-500/25 bg-card/95 p-5 sm:p-6 shadow-xl',
        )}
        onClick={e => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {copy.dashboard.myPredictionsWithdraw}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-snug">{bet.question}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {copy.dashboard.myPredictionsWithdrawStaked}{' '}
          <span className="font-bold tabular-nums text-foreground">{bet.coins.toLocaleString()}</span>{' '}
          {copy.dashboard.myPredictionsCoins} {copy.dashboard.myPredictionsOn}{' '}
          <span className="font-bold text-foreground">{sideLabel}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="predict-withdraw-amount"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {copy.dashboard.myPredictionsWithdrawLabel}
            </label>
            <input
              id="predict-withdraw-amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-violet-500/50 focus:ring-2 ring-violet-500/20 disabled:opacity-50"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {copy.dashboard.myPredictionsWithdrawHint}
            </p>
          </div>

          {error ? <p className="text-sm text-red-400/90">{error}</p> : null}

          <div className="flex flex-wrap gap-2 justify-end">
            <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
              {copy.dashboard.myPredictionsWithdrawCancel}
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting
                ? copy.dashboard.myPredictionsWithdrawSubmitting
                : copy.dashboard.myPredictionsWithdrawConfirm}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
