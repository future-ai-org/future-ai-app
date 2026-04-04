'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
};

export function MyPredictionsSection({ bets }: Props) {
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
      <h2 className={headingClass}>{copy.dashboard.myPredictions}</h2>
      <ul className="space-y-3 list-none p-0 m-0">
        {bets.map(bet => {
          const sideLabel =
            bet.side === 'yes' ? copy.predict.yes : bet.side === 'no' ? copy.predict.no : bet.side;
          return (
            <li key={bet.id}>
              <Card className="flex flex-row items-start gap-6 sm:gap-10 p-4 sm:p-5">
                <p
                  className="shrink-0 pt-0.5 text-4xl sm:text-5xl font-serif font-bold tabular-nums leading-none tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent"
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
                    <span className="font-bold tabular-nums">{bet.coins.toLocaleString()}</span>{' '}
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
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
