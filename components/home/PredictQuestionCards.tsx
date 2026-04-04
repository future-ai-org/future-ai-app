'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PredictInvestModal } from '@/components/home/PredictInvestModal';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type PredictOutcomeType = 'Binary' | 'Multiple Choice';

type PredictQuestionItem = {
  id: number;
  category: string;
  question: string;
  outcome_type: PredictOutcomeType;
  /** ISO date (YYYY-MM-DD), e.g. market close / resolution window. */
  expiresAt: string;
  options?: string[];
};

function formatQuestionExpires(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Matches `grid-cols-2 lg:grid-cols-4` (Tailwind lg = 1024px). */
const LG_MEDIA_QUERY = '(min-width: 1024px)';

function useCardsPerRow(): number {
  return useSyncExternalStore(
    onStoreChange => {
      const mq = window.matchMedia(LG_MEDIA_QUERY);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => (window.matchMedia(LG_MEDIA_QUERY).matches ? 4 : 2),
    () => 2,
  );
}

/** Deterministic “random” percentage per card (stable SSR + hydration). */
function randomEstimationPercent(cardIndex: number): number {
  let s = (cardIndex + 1) * 0x6d2b79f5 + 0x9e3779b9;
  s ^= s << 13;
  s ^= s >>> 7;
  s ^= s << 17;
  return ((s >>> 0) % 73) + 18;
}

/** Shown on yes/no buttons before odds load or when a question has no bets yet. */
const MARKET_ODDS_PLACEHOLDER = '50%';

/** Equal-split placeholder % per choice so options sum to 100 (e.g. 4 → 25% each). */
function equalOptionPercent(optionIndex: number, optionCount: number): number {
  if (optionCount <= 0) return 0;
  const base = Math.floor(100 / optionCount);
  const remainder = 100 - base * optionCount;
  return optionIndex < remainder ? base + 1 : base;
}

function isPredictQuestionItem(q: unknown): q is PredictQuestionItem {
  return (
    typeof q === 'object' &&
    q !== null &&
    'id' in q &&
    typeof (q as PredictQuestionItem).id === 'number' &&
    'category' in q &&
    typeof (q as PredictQuestionItem).category === 'string' &&
    'question' in q &&
    typeof (q as PredictQuestionItem).question === 'string' &&
    'outcome_type' in q &&
    ((q as PredictQuestionItem).outcome_type === 'Binary' ||
      (q as PredictQuestionItem).outcome_type === 'Multiple Choice') &&
    'expiresAt' in q &&
    typeof (q as PredictQuestionItem).expiresAt === 'string'
  );
}

function normalizePool(raw: unknown): PredictQuestionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isPredictQuestionItem);
}

function selectionAt(map: Record<number, string>, i: number): string | null {
  const v = map[i];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

type InvestState = {
  item: PredictQuestionItem;
  index: number;
} & (
  | { kind: 'binary'; side: 'yes' | 'no' }
  | { kind: 'mc'; choice: string }
);

type MarketOddsRow = { yes: string; no: string; choicePercents?: Record<string, string> };

export function PredictQuestionCards() {
  const pool = useMemo(() => normalizePool(copy.predict.questions), []);
  const cardsPerRow = useCardsPerRow();
  /** Number of grid rows currently shown (each load more adds one row). */
  const [rowsShown, setRowsShown] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [invest, setInvest] = useState<InvestState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [marketOdds, setMarketOdds] = useState<Record<number, MarketOddsRow>>({});
  const [oddsRefreshKey, setOddsRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/predict/odds', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data || typeof data !== 'object' || data === null) return;
        const raw = (data as { odds?: unknown }).odds;
        if (typeof raw !== 'object' || raw === null) return;
        const next: Record<number, MarketOddsRow> = {};
        for (const [key, entry] of Object.entries(raw)) {
          const id = Number(key);
          if (!Number.isFinite(id)) continue;
          if (
            typeof entry !== 'object' ||
            entry === null ||
            !('yesPercent' in entry) ||
            !('noPercent' in entry)
          ) {
            continue;
          }
          const yesPercent = (entry as { yesPercent?: unknown }).yesPercent;
          const noPercent = (entry as { noPercent?: unknown }).noPercent;
          if (typeof yesPercent !== 'string' || typeof noPercent !== 'string') continue;
          const row: MarketOddsRow = { yes: yesPercent, no: noPercent };
          const cp = (entry as { choicePercents?: unknown }).choicePercents;
          if (typeof cp === 'object' && cp !== null && !Array.isArray(cp)) {
            const choicePercents: Record<string, string> = {};
            for (const [k, v] of Object.entries(cp)) {
              if (typeof v === 'string') choicePercents[k] = v;
            }
            if (Object.keys(choicePercents).length > 0) row.choicePercents = choicePercents;
          }
          next[id] = row;
        }
        setMarketOdds(next);
      })
      .catch(() => {
        /* keep previous odds */
      });
    return () => {
      cancelled = true;
    };
  }, [oddsRefreshKey]);

  const visibleCount = Math.min(rowsShown * cardsPerRow, pool.length);

  const questions = useMemo(() => pool.slice(0, visibleCount), [pool, visibleCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith('predict-question-')) return;
    const idNum = Number(hash.replace('predict-question-', ''));
    if (!Number.isFinite(idNum)) return;
    const idx = pool.findIndex(q => q.id === idNum);
    if (idx < 0) return;
    const perRow = Math.max(1, cardsPerRow);
    const needRows = Math.ceil((idx + 1) / perRow);
    if (needRows > rowsShown) {
      const expand = window.setTimeout(() => setRowsShown(needRows), 0);
      return () => window.clearTimeout(expand);
    }
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [pool, rowsShown, cardsPerRow]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qRaw = params.get('predict');
    const sideRaw = params.get('side')?.toLowerCase();
    if (!qRaw || (sideRaw !== 'yes' && sideRaw !== 'no')) return;

    const idNum = Number(qRaw);
    if (!Number.isFinite(idNum)) {
      params.delete('predict');
      params.delete('side');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
      );
      return;
    }

    const idx = pool.findIndex(
      x => x.id === idNum && x.outcome_type === 'Binary',
    );
    if (idx < 0) {
      params.delete('predict');
      params.delete('side');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
      );
      return;
    }

    const item = pool[idx];
    const perRow = Math.max(1, cardsPerRow);
    const needRows = Math.ceil((idx + 1) / perRow);
    if (needRows > rowsShown) {
      const expand = window.setTimeout(() => setRowsShown(needRows), 0);
      return () => window.clearTimeout(expand);
    }

    params.delete('predict');
    params.delete('side');
    const qs = params.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
    );

    const open = window.setTimeout(() => {
      setInvest({
        item,
        index: idx,
        kind: 'binary',
        side: sideRaw as 'yes' | 'no',
      });
    }, 0);
    return () => window.clearTimeout(open);
  }, [pool, rowsShown, cardsPerRow]);

  function handleLoadMore() {
    setRowsShown((r) => r + 1);
  }

  const canLoadMore = visibleCount < pool.length;

  function setSelection(index: number, value: string) {
    setAnswers(prev => ({ ...prev, [index]: value }));
  }

  function openInvestModal(
    item: PredictQuestionItem,
    index: number,
    bet: { kind: 'binary'; side: 'yes' | 'no' } | { kind: 'mc'; choice: string },
  ) {
    setInvest({ item, index, ...bet });
  }

  return (
    <>
      <PredictInvestModal
        open={invest !== null}
        onClose={() => setInvest(null)}
        question={invest?.item ?? null}
        cardIndex={invest?.index ?? 0}
        betKind={invest?.kind ?? 'binary'}
        side={invest ? (invest.kind === 'binary' ? invest.side : invest.choice) : 'yes'}
        onInvested={(cardIndex, side, coins) => {
          setSelection(cardIndex, side);
          setOddsRefreshKey(k => k + 1);
          const predictCopy = copy.predict as { investSuccessToast?: string };
          const tpl = predictCopy.investSuccessToast ?? '';
          const sideDisplay =
            side === 'yes' ? copy.predict.yes : side === 'no' ? copy.predict.no : side;
          const msg = tpl
            .replace('{coins}', String(coins))
            .replace('{side}', sideDisplay);
          setToast(msg.trim() !== '' ? msg : `Invested ${coins} on ${sideDisplay}.`);
          window.setTimeout(() => setToast(null), 5000);
        }}
      />
      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[102] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-card/95 px-4 py-3 text-center text-sm text-foreground shadow-lg backdrop-blur-sm"
          role="status"
        >
          {toast}
        </div>
      ) : null}
      <ul
        aria-label={copy.predict.questionsAria}
        className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 w-full max-w-6xl mx-auto px-4 list-none"
      >
        {questions.map((item, i) => {
          const pct = randomEstimationPercent(i);
          const selected = selectionAt(answers, i);
          const isBinary = item.outcome_type === 'Binary';
          const oddsRow = marketOdds[item.id];
          const yesBtnPct = oddsRow?.yes ?? MARKET_ODDS_PLACEHOLDER;
          const noBtnPct = oddsRow?.no ?? MARKET_ODDS_PLACEHOLDER;
          const options = item.options ?? [];
          const cardKey = `${item.id}-${item.question.slice(0, 24)}`;
          const isMc = item.outcome_type === 'Multiple Choice' && options.length > 0;

          return (
            <li
              key={cardKey}
              id={`predict-question-${item.id}`}
              className="min-w-0 flex justify-center scroll-mt-24"
            >
              <Card
                className={cn(
                  'w-full max-w-[13.5rem] sm:max-w-[15rem] lg:max-w-none flex flex-col p-3.5 sm:p-4 min-h-0',
                  'aspect-[10/11] max-h-[min(100vw,30rem)]',
                  'border-violet-500/20 bg-card/80',
                )}
              >
                <p className="shrink-0 text-left text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-5 sm:line-clamp-6">
                  {item.question}
                </p>

                <div className="flex-1 min-h-0 flex flex-col">
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center text-center px-0.5 gap-2',
                      isMc ? 'shrink-0 py-2 sm:py-3' : 'min-h-0 flex-1 py-5 sm:py-6',
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm sm:text-base font-bold text-muted-foreground leading-tight tracking-wide',
                        isMc ? 'pt-1' : 'pt-3 sm:pt-4',
                      )}
                    >
                      {copy.predict.estimationPrefix}
                    </p>
                    <p
                      className={cn(
                        'text-4xl sm:text-5xl font-serif font-bold tabular-nums leading-none tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent',
                        isMc ? 'pb-1' : 'pb-3 sm:pb-4',
                      )}
                      aria-hidden
                    >
                      {pct}%
                    </p>
                  </div>

                  {isBinary ? (
                  <div
                    className="shrink-0 flex justify-center gap-1.5 sm:gap-2 w-full pt-1"
                    role="group"
                    aria-label={item.question}
                  >
                    <Button
                      type="button"
                      variant={selected === 'yes' ? 'primary' : 'secondary'}
                      className={cn(
                        '!px-3.5 !py-2.5 !text-sm sm:!text-base min-w-0 !leading-tight whitespace-nowrap',
                        selected === 'yes' &&
                          'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                      )}
                      aria-pressed={selected === 'yes'}
                      onClick={() => openInvestModal(item, i, { kind: 'binary', side: 'yes' })}
                    >
                      <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
                        <span>{copy.predict.yes}</span>
                        <span className="opacity-90">{yesBtnPct}</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={selected === 'no' ? 'primary' : 'secondary'}
                      className={cn(
                        '!px-3.5 !py-2.5 !text-sm sm:!text-base min-w-0 !leading-tight whitespace-nowrap',
                        selected === 'no' &&
                          'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                      )}
                      aria-pressed={selected === 'no'}
                      onClick={() => openInvestModal(item, i, { kind: 'binary', side: 'no' })}
                    >
                      <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
                        <span>{copy.predict.no}</span>
                        <span className="opacity-90">{noBtnPct}</span>
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain w-full pt-1 -mx-0.5 px-0.5 [scrollbar-gutter:stable]"
                    role="group"
                    aria-label={item.question}
                  >
                    <div className="grid grid-cols-1 gap-1 w-full pb-0.5">
                      {options.map((opt, optIdx) => {
                        const mcPct =
                          oddsRow?.choicePercents?.[opt] ??
                          equalOptionPercent(optIdx, options.length) + '%';
                        return (
                          <Button
                            key={opt}
                            type="button"
                            variant={selected === opt ? 'primary' : 'secondary'}
                            className={cn(
                              '!px-2.5 !py-1.5 !text-[0.65rem] sm:!text-xs min-w-0 !leading-tight text-left justify-start',
                              selected === opt &&
                                'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                            )}
                            aria-pressed={selected === opt}
                            onClick={() => openInvestModal(item, i, { kind: 'mc', choice: opt })}
                          >
                            <span className="font-bold tabular-nums truncate w-full">
                              {opt}{' '}
                              <span className="opacity-90 font-bold">{mcPct}</span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                </div>

                <div className="shrink-0 pt-4 flex flex-row items-baseline justify-between gap-x-2 gap-y-1 w-full min-w-0">
                  <span className="min-w-0 text-left text-[0.6rem] sm:text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground leading-tight line-clamp-1">
                    {item.category}
                  </span>
                  <span className="shrink-0 text-right text-[0.55rem] sm:text-xs font-bold text-muted-foreground/90 leading-tight tabular-nums">
                    {copy.predict.questionExpiresPrefix}{' '}
                    {formatQuestionExpires(item.expiresAt)}
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      {canLoadMore && (
        <div className="flex justify-center px-4 pb-4 mt-10 sm:mt-14 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-fit min-w-[12rem] justify-center px-8 py-3 text-base rounded-xl"
            onClick={handleLoadMore}
          >
            {copy.predict.loadMore}
          </Button>
        </div>
      )}
    </>
  );
}
