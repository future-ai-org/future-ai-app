import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getPredictQuestionMeta } from '@/lib/predict-question-map';
import {
  formatPermilleAsPercent,
  marketPermilleFromSideCoins,
} from '@/lib/predict-market-odds';

export const dynamic = 'force-dynamic';

function leadingMarketPercentForQuestion(
  byQuestion: Map<number, { yes: number; no: number }>,
  questionId: number,
): string {
  const cur = byQuestion.get(questionId) ?? { yes: 0, no: 0 };
  const { yesPermille, noPermille } = marketPermilleFromSideCoins(cur.yes, cur.no);
  const leadingPermille = Math.max(yesPermille, noPermille);
  return formatPermilleAsPercent(leadingPermille);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await prisma.predictBet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        questionId: true,
        side: true,
        coins: true,
        createdAt: true,
      },
    });

    const questionIds = [...new Set(rows.map(r => r.questionId))];

    const byQuestion = new Map<number, { yes: number; no: number }>();
    if (questionIds.length > 0) {
      const agg = await prisma.predictBet.groupBy({
        by: ['questionId', 'side'],
        where: { questionId: { in: questionIds } },
        _sum: { coins: true },
      });
      for (const row of agg) {
        const coins = row._sum.coins ?? 0;
        const cur = byQuestion.get(row.questionId) ?? { yes: 0, no: 0 };
        if (row.side === 'yes') cur.yes = coins;
        else if (row.side === 'no') cur.no = coins;
        byQuestion.set(row.questionId, cur);
      }
    }

    const bets = rows.map(row => {
      const meta = getPredictQuestionMeta(row.questionId);
      return {
        id: row.id,
        questionId: row.questionId,
        side: row.side,
        coins: row.coins,
        createdAt: row.createdAt.toISOString(),
        question:
          meta && meta.question.trim() !== ''
            ? meta.question
            : `question #${row.questionId}`,
        category: meta && meta.category.trim() !== '' ? meta.category : null,
        expiresAt: meta && meta.expiresAt.trim() !== '' ? meta.expiresAt : null,
        leadingMarketPercent: leadingMarketPercentForQuestion(
          byQuestion,
          row.questionId,
        ),
      };
    });

    return NextResponse.json({ bets });
  } catch (err) {
    console.error('[predict/bets] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
