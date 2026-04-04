import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  formatPermilleAsPercent,
  marketPermilleByChoice,
  marketPermilleFromSideCoins,
} from '@/lib/predict-market-odds';
import { getMcOptionsForQuestion, isValidBinaryPredictQuestionId } from '@/lib/predict-validate';

export const dynamic = 'force-dynamic';

type OddsEntry = {
  yesPermille: number;
  noPermille: number;
  yesCoins: number;
  noCoins: number;
  yesPercent: string;
  noPercent: string;
  /** Multiple-choice: option label → display percent (sums to ~100%). */
  choicePercents?: Record<string, string>;
};

/**
 * Aggregates `PredictBet` rows: yes/no per binary question; per-option for multiple choice.
 */
export async function GET() {
  try {
    const rows = await prisma.predictBet.groupBy({
      by: ['questionId', 'side'],
      _sum: { coins: true },
    });

    const coinsByQuestion = new Map<number, Map<string, number>>();

    for (const row of rows) {
      const coins = row._sum.coins ?? 0;
      const inner = coinsByQuestion.get(row.questionId) ?? new Map<string, number>();
      const key = isValidBinaryPredictQuestionId(row.questionId)
        ? row.side.trim().toLowerCase()
        : row.side;
      inner.set(key, (inner.get(key) ?? 0) + coins);
      coinsByQuestion.set(row.questionId, inner);
    }

    const odds: Record<string, OddsEntry> = {};

    for (const [questionId, sideMap] of coinsByQuestion) {
      if (isValidBinaryPredictQuestionId(questionId)) {
        const yesCoins = sideMap.get('yes') ?? 0;
        const noCoins = sideMap.get('no') ?? 0;
        const { yesPermille, noPermille } = marketPermilleFromSideCoins(yesCoins, noCoins);
        odds[String(questionId)] = {
          yesPermille,
          noPermille,
          yesCoins,
          noCoins,
          yesPercent: formatPermilleAsPercent(yesPermille),
          noPercent: formatPermilleAsPercent(noPermille),
        };
        continue;
      }

      const mcOptions = getMcOptionsForQuestion(questionId);
      if (!mcOptions) continue;

      const choiceMap = new Map<string, number>();
      for (const opt of mcOptions) {
        choiceMap.set(opt, sideMap.get(opt) ?? 0);
      }
      const permilles = marketPermilleByChoice(choiceMap, mcOptions);
      const choicePercents: Record<string, string> = {};
      for (const opt of mcOptions) {
        choicePercents[opt] = formatPermilleAsPercent(permilles.get(opt) ?? 0);
      }
      odds[String(questionId)] = {
        yesPermille: 0,
        noPermille: 0,
        yesCoins: 0,
        noCoins: 0,
        yesPercent: '50%',
        noPercent: '50%',
        choicePercents,
      };
    }

    return NextResponse.json({ odds });
  } catch (err) {
    console.error('[predict/odds] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
