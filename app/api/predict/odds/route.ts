import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  formatPermilleAsPercent,
  marketPermilleFromSideCoins,
} from '@/lib/predict-market-odds';

export const dynamic = 'force-dynamic';

type OddsEntry = {
  yesPermille: number;
  noPermille: number;
  yesCoins: number;
  noCoins: number;
  yesPercent: string;
  noPercent: string;
};

/**
 * Aggregates all `PredictBet` rows and returns yes/no market share per question
 * (permille 0–1000, plus formatted percents for buttons).
 */
export async function GET() {
  try {
    const rows = await prisma.predictBet.groupBy({
      by: ['questionId', 'side'],
      _sum: { coins: true },
    });

    const byQuestion = new Map<number, { yes: number; no: number }>();

    for (const row of rows) {
      const coins = row._sum.coins ?? 0;
      const cur = byQuestion.get(row.questionId) ?? { yes: 0, no: 0 };
      if (row.side === 'yes') cur.yes = coins;
      else if (row.side === 'no') cur.no = coins;
      byQuestion.set(row.questionId, cur);
    }

    const odds: Record<string, OddsEntry> = {};

    for (const [questionId, { yes: yesCoins, no: noCoins }] of byQuestion) {
      const { yesPermille, noPermille } = marketPermilleFromSideCoins(
        yesCoins,
        noCoins,
      );
      odds[String(questionId)] = {
        yesPermille,
        noPermille,
        yesCoins,
        noCoins,
        yesPercent: formatPermilleAsPercent(yesPermille),
        noPercent: formatPermilleAsPercent(noPermille),
      };
    }

    return NextResponse.json({ odds });
  } catch (err) {
    console.error('[predict/odds] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
