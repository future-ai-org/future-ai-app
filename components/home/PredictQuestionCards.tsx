'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type Answer = 'yes' | 'no' | null;

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

/** Placeholder % shown on each button (not tied to selection). */
function dumbButtonPercents(index: number): { yes: number; no: number } {
  const yes = 52 + ((index * 23) % 41);
  const no = 18 + ((index * 19) % 37);
  return { yes, no };
}

function answerAt(map: Record<number, Exclude<Answer, null>>, i: number): Answer {
  const v = map[i];
  return v === 'yes' || v === 'no' ? v : null;
}

export function PredictQuestionCards() {
  const pool = copy.predict.questions;
  const [extraShown, setExtraShown] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Exclude<Answer, null>>>({});

  const visibleCount = Math.min(INITIAL_QUESTION_COUNT + extraShown, pool.length);

  const questions = useMemo(() => pool.slice(0, visibleCount), [pool, visibleCount]);

  const maxExtra = Math.max(0, pool.length - INITIAL_QUESTION_COUNT);

  function handleLoadMore() {
    setExtraShown((n) => Math.min(n + LOAD_MORE_BATCH, maxExtra));
  }

  const canLoadMore = visibleCount < pool.length;

  function setAnswer(index: number, value: 'yes' | 'no') {
    setAnswers((prev) => {
      const cur = answerAt(prev, index);
      const nextVal = cur === value ? null : value;
      const out = { ...prev };
      if (nextVal === null) {
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
        {questions.map((question, i) => {
          const pct = randomEstimationPercent(i);
          const dumb = dumbButtonPercents(i);
          const a = answerAt(answers, i);
          return (
            <li key={`${i}-${question.slice(0, 24)}`} className="min-w-0 flex justify-center">
              <Card
                className={cn(
                  'w-full max-w-[11.5rem] sm:max-w-[13rem] aspect-square flex flex-col p-3 sm:p-4 min-h-0',
                  'border-violet-500/20 bg-card/80',
                )}
              >
                <p className="shrink-0 text-left text-[0.7rem] sm:text-xs font-bold text-foreground leading-snug line-clamp-4 sm:line-clamp-5">
                  {question}
                </p>

                <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-0.5 py-1 gap-0">
                  <p className="text-[0.6rem] sm:text-[0.65rem] font-bold text-muted-foreground leading-tight mb-1">
                    {copy.predict.estimationPrefix}
                  </p>
                  <p
                    className="text-4xl sm:text-5xl font-serif font-bold tabular-nums leading-none tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent"
                    aria-hidden
                  >
                    {pct}%
                  </p>
                </div>

                <div
                  className="shrink-0 flex justify-center gap-1 sm:gap-1.5 w-full pt-1"
                  role="group"
                  aria-label={question}
                >
                  <Button
                    type="button"
                    variant={a === 'yes' ? 'primary' : 'secondary'}
                    className={cn(
                      '!px-2 !py-1.5 !text-[0.65rem] sm:!text-xs min-w-0 !leading-tight whitespace-nowrap',
                      a === 'yes' && 'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                    )}
                    aria-pressed={a === 'yes'}
                    onClick={() => setAnswer(i, 'yes')}
                  >
                    <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
                      <span>{copy.predict.yes}</span>
                      <span className="opacity-90">{dumb.yes}%</span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={a === 'no' ? 'primary' : 'secondary'}
                    className={cn(
                      '!px-2 !py-1.5 !text-[0.65rem] sm:!text-xs min-w-0 !leading-tight whitespace-nowrap',
                      a === 'no' && 'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-background',
                    )}
                    aria-pressed={a === 'no'}
                    onClick={() => setAnswer(i, 'no')}
                  >
                    <span className="inline-flex items-baseline gap-1 font-bold tabular-nums">
                      <span>{copy.predict.no}</span>
                      <span className="opacity-90">{dumb.no}%</span>
                    </span>
                  </Button>
                </div>
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
