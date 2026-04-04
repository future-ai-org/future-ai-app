'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type Answer = 'yes' | 'no' | null;

export function PredictQuestionCards() {
  const questions = copy.predict.questions;
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null));

  function setAnswer(index: number, value: 'yes' | 'no') {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = prev[index] === value ? null : value;
      return next;
    });
  }

  return (
    <ul
      aria-label={copy.predict.questionsAria}
      className="mt-14 w-full max-w-xl mx-auto flex flex-col gap-5 px-4 pb-8 list-none"
    >
      {questions.map((question, i) => (
        <li key={i}>
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="text-left text-sm sm:text-base font-bold text-foreground leading-snug flex-1">
              {question}
            </p>
            <div
              className="flex shrink-0 gap-2 justify-center sm:justify-end"
              role="group"
              aria-label={question}
            >
              <Button
                type="button"
                variant={answers[i] === 'yes' ? 'primary' : 'secondary'}
                className={cn(
                  '!px-6 !py-2.5 !text-sm min-w-[4.5rem]',
                  answers[i] === 'yes' && 'ring-2 ring-violet-400/60 ring-offset-2 ring-offset-background',
                )}
                aria-pressed={answers[i] === 'yes'}
                onClick={() => setAnswer(i, 'yes')}
              >
                {copy.predict.yes}
              </Button>
              <Button
                type="button"
                variant={answers[i] === 'no' ? 'primary' : 'secondary'}
                className={cn(
                  '!px-6 !py-2.5 !text-sm min-w-[4.5rem]',
                  answers[i] === 'no' && 'ring-2 ring-violet-400/60 ring-offset-2 ring-offset-background',
                )}
                aria-pressed={answers[i] === 'no'}
                onClick={() => setAnswer(i, 'no')}
              >
                {copy.predict.no}
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
