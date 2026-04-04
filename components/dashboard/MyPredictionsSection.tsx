'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PredictBetMoreModal } from '@/components/dashboard/PredictBetMoreModal';
import { PredictWithdrawModal } from '@/components/dashboard/PredictWithdrawModal';
import { copy } from '@/lib/copy';

export type DashboardPredictionBet = {
  id: string;
  questionId: number;
  side: string;
  question: string;
  category: string | null;
  expiresAt: string | null;
  coins: number;
  createdAt: string;
  /** Larger of yes/no market share (same engine as predict cards). */
  leadingMarketPercent?: string;
};

function formatExpires(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  bets: DashboardPredictionBet[];
  onPredictionsRefresh: () => void;
  onWalletRefresh: () => void;
};

export function MyPredictionsSection({
  bets,
  onPredictionsRefresh,
  onWalletRefresh,
}: Props) {
  const [withdrawBet, setWithdrawBet] = useState<DashboardPredictionBet | null>(null);
  const [betMoreBet, setBetMoreBet] = useState<DashboardPredictionBet | null>(null);
  const headingClass =
    'text-sm sm:text-base md:text-lg font-extrabold text-violet-500 dark:text-violet-400 tracking-widest uppercase mb-8';

  if (bets.length === 0) {
    return (
      <section className="mb-12 mx-auto w-full max-w-6xl">
        <h2 className={headingClass}>{copy.dashboard.myPredictions}</h2>
        <Card className="py-6 text-center">
          <p className="text-muted-foreground text-sm mb-3">{copy.dashboard.myPredictionsEmpty}</p>
          <Link href="/">
            <Button variant="secondary">{copy.dashboard.myPredictionsBrowse}</Button>
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-12 mx-auto w-full max-w-6xl">
      <PredictWithdrawModal
        open={withdrawBet !== null}
        bet={withdrawBet}
        onClose={() => setWithdrawBet(null)}
        onSuccess={() => {
          onPredictionsRefresh();
          onWalletRefresh();
        }}
      />
      <PredictBetMoreModal
        open={betMoreBet !== null}
        bet={betMoreBet}
        onClose={() => setBetMoreBet(null)}
        onSuccess={() => {
          onPredictionsRefresh();
          onWalletRefresh();
        }}
      />
      <h2 className={headingClass}>{copy.dashboard.myPredictions}</h2>
      <ul className="space-y-3 list-none p-0 m-0">
        {bets.map(bet => {
          const sideLabel =
            bet.side === 'yes' ? copy.predict.yes : bet.side === 'no' ? copy.predict.no : bet.side;
          return (
            <li key={bet.id}>
              <Card className="flex flex-row items-stretch gap-4 sm:gap-8 p-4 sm:p-5">
                <p
                  className="shrink-0 self-start pt-0.5 text-4xl sm:text-5xl font-serif font-bold tabular-nums leading-none tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent"
                  aria-label={`Leading market share ${bet.leadingMarketPercent ?? '50%'}`}
                >
                  {bet.leadingMarketPercent ?? '50%'}
                </p>
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  {bet.category ? (
                    <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
                      {bet.category}
                    </p>
                  ) : null}
                  <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                    {bet.question}
                  </h3>
                  <p className="text-base sm:text-lg text-foreground leading-snug">
                    <span className="inline-flex items-center rounded-md border border-violet-500/45 bg-violet-500/[0.08] px-2 py-0.5 font-bold tabular-nums text-foreground dark:border-violet-400/40 dark:bg-violet-500/[0.12]">
                      {bet.coins.toLocaleString()}
                    </span>{' '}
                    {copy.dashboard.myPredictionsCoins}{' '}
                    <span className="font-bold">{copy.dashboard.myPredictionsOn}</span>{' '}
                    <span className="font-bold">{sideLabel}</span>
                    <span className="text-muted-foreground font-semibold sm:font-bold">
                      {' · '}
                      {copy.dashboard.myPredictionsInvested}{' '}
                      {new Date(bet.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </p>
                  {bet.expiresAt ? (
                    <p className="pt-3 text-sm sm:text-base font-bold text-muted-foreground/90 leading-tight tabular-nums">
                      {copy.predict.questionExpiresPrefix} {formatExpires(bet.expiresAt)}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 flex flex-col justify-center">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="whitespace-nowrap px-3 py-2 text-sm"
                      onClick={() => setWithdrawBet(bet)}
                    >
                      {copy.dashboard.myPredictionsWithdraw}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="whitespace-nowrap px-3 py-2 text-sm"
                      onClick={() => setBetMoreBet(bet)}
                    >
                      {copy.dashboard.myPredictionsBetMore}
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
