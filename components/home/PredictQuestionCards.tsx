'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

const INITIAL_QUESTION_COUNT = 5;
const LOAD_MORE_BATCH = 5;

/** Deterministic “random” percentage per card (stable SSR + hydration). */
function randomEstimationPercent(cardIndex: number): number {
  let s = (cardIndex + 1) * 0x6d2b79f5 + 0x9e3779b9;
  s ^= s << 13;
  s ^= s >>> 7;
  s ^= s << 17;
  return ((s >>> 0) % 73) + 18;
}

/** Placeholder % on yes/no buttons until real odds exist (same for every card). */
const BUTTON_PLACEHOLDER_PCT = 50;

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

export function PredictQuestionCards() {
  const pool = useMemo(() => normalizePool(copy.predict.questions), []);
  const [extraShown, setExtraShown] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const visibleCount = Math.min(INITIAL_QUESTION_COUNT + extraShown, pool.length);

  const questions = useMemo(() => pool.slice(0, visibleCount), [pool, visibleCount]);

  const maxExtra = Math.max(0, pool.length - INITIAL_QUESTION_COUNT);

  function handleLoadMore() {
    setExtraShown((n) => Math.min(n + LOAD_MORE_BATCH, maxExtra));
  }

  const canLoadMore = visibleCount < pool.length;

  function setSelection(index: number, value: string) {
    setAnswers((prev) => {
      const cur = prev[index];
      const nextVal = cur === value ? undefined : value;
      const out = { ...prev };
      if (nextVal === undefined) {
        delete out[index];
      } else {
        out[index] = nextVal;
      }
      return out;
    });
  }

  return (
    <>
      <ul
        aria-label={copy.predict.questionsAria}
        className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 w-full max-w-6xl mx-auto px-4 list-none"
      >
        {questions.map((item, i) => {
          const pct = randomEstimationPercent(i);
          const selected = selectionAt(answers, i);
          const isBinary = item.outcome_type === 'Binary';
          const options = item.options ?? [];
          const cardKey = `${item.id}-${item.question.slice(0, 24)}`;
          const isMc = item.outcome_type === 'Multiple Choice' && options.length > 0;

          return (
            <li key={cardKey} className="min-w-0 flex justify-center">
              <Card
                className={cn(
                  'w-full max-w-[11.5rem] sm:max-w-[13rem] flex flex-col p-3 sm:p-4 min-h-0',
                  isMc
                    ? 'min-h-[15.75rem] sm:min-h-[17.25rem]'
                    : 'aspect-[10/11] max-h-[min(100vw,27rem)]',
                  'border-violet-500/20 bg-card/80',
                )}
              >
                <p className="shrink-0 text-left text-[0.5rem] sm:text-[0.55rem] font-semibold uppercase tracking-wide text-muted-foreground leading-tight line-clamp-1 mb-0.5">
                  {item.category}
                </p>
                <p className="shrink-0 text-left text-[0.65rem] sm:text-[0.7rem] font-bold text-foreground leading-tight line-clamp-5 sm:line-clamp-6">
                  {item.question}
                </p>

                <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-0.5 py-6 sm:py-7 gap-1.5">
                  <p className="text-[0.55rem] sm:text-[0.6rem] font-bold text-muted-foreground leading-tight">
                    {copy.predict.estimationPrefix}
                  </p>
                  <p
                    className="text-3xl sm:text-4xl font-serif font-bold tabular-nums leading-none tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent"
                    aria-hidden
                  >
                    {pct}%
                  </p>
                </div>

                {isBinary ? (
                  <div
                    className="shrink-0 flex justify-center gap-1 sm:gap-1.5 w-full pt-1"
                    role="group"
                    aria-label={item.question}
                  >
                    <Button
                      type="button"
                      variant={selected === 'yes' ? 'primary' : 'secondary'}
                      className={cn(
                        '!px-2 !py-1.5 !text-[0.65rem] sm:!text-xs min-w-0 !leading-tight whitespace-nowrap',
                        selected === 'yes' &&
                          'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                      )}
                      aria-pressed={selected === 'yes'}
                      onClick={() => setSelection(i, 'yes')}
                    >
                      <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
                        <span>{copy.predict.yes}</span>
                        <span className="opacity-90">{BUTTON_PLACEHOLDER_PCT}%</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={selected === 'no' ? 'primary' : 'secondary'}
                      className={cn(
                        '!px-2 !py-1.5 !text-[0.65rem] sm:!text-xs min-w-0 !leading-tight whitespace-nowrap',
                        selected === 'no' &&
                          'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                      )}
                      aria-pressed={selected === 'no'}
                      onClick={() => setSelection(i, 'no')}
                    >
                      <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
                        <span>{copy.predict.no}</span>
                        <span className="opacity-90">{BUTTON_PLACEHOLDER_PCT}%</span>
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="shrink-0 grid grid-cols-1 gap-1 w-full pt-1"
                    role="group"
                    aria-label={item.question}
                  >
                    {options.map((opt, optIdx) => (
                      <Button
                        key={opt}
                        type="button"
                        variant={selected === opt ? 'primary' : 'secondary'}
                        className={cn(
                          '!px-2 !py-1 !text-[0.6rem] sm:!text-[0.65rem] min-w-0 !leading-tight text-left justify-start',
                          selected === opt &&
                            'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                        )}
                        aria-pressed={selected === opt}
                        onClick={() => setSelection(i, opt)}
                      >
                        <span className="font-bold tabular-nums truncate w-full">
                          {opt}{' '}
                          <span className="opacity-90 font-bold">
                            {equalOptionPercent(optIdx, options.length)}%
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
                <p className="shrink-0 pt-2 text-center text-[0.45rem] sm:text-[0.5rem] text-muted-foreground/90 leading-tight tabular-nums">
                  {copy.predict.questionExpiresPrefix}{' '}
                  {formatQuestionExpires(item.expiresAt)}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
      {pool.length > INITIAL_QUESTION_COUNT && canLoadMore && (
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
