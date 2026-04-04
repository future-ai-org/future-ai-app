import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getPredictQuestionMeta } from '@/lib/predict-question-map';
import {
  formatPermilleAsPercent,
  marketPermilleByChoice,
  marketPermilleFromSideCoins,
} from '@/lib/predict-market-odds';
import { getMcOptionsForQuestion, isValidBinaryPredictQuestionId } from '@/lib/predict-validate';

export const dynamic = 'force-dynamic';

function leadingMarketPercentForQuestion(
  fullMap: Map<number, Map<string, number>>,
  questionId: number,
): string {
  const sideMap = fullMap.get(questionId);
  if (!sideMap || sideMap.size === 0) return '50%';

  if (isValidBinaryPredictQuestionId(questionId)) {
    const yes = sideMap.get('yes') ?? 0;
    const no = sideMap.get('no') ?? 0;
    const { yesPermille, noPermille } = marketPermilleFromSideCoins(yes, no);
    return formatPermilleAsPercent(Math.max(yesPermille, noPermille));
  }

  const opts = getMcOptionsForQuestion(questionId);
  if (opts) {
    const permilles = marketPermilleByChoice(sideMap, opts);
    const maxP = Math.max(0, ...permilles.values());
    return formatPermilleAsPercent(maxP);
  }

  const total = [...sideMap.values()].reduce((a, b) => a + b, 0);
  if (total <= 0) return '50%';
  const maxCoins = Math.max(...sideMap.values());
  return formatPermilleAsPercent(Math.round((maxCoins / total) * 1000));
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

    const byQuestion = new Map<number, Map<string, number>>();
    if (questionIds.length > 0) {
      const agg = await prisma.predictBet.groupBy({
        by: ['questionId', 'side'],
        where: { questionId: { in: questionIds } },
        _sum: { coins: true },
      });
      for (const row of agg) {
        const coins = row._sum.coins ?? 0;
        const inner = byQuestion.get(row.questionId) ?? new Map<string, number>();
        const key = isValidBinaryPredictQuestionId(row.questionId)
          ? row.side.trim().toLowerCase()
          : row.side;
        inner.set(key, (inner.get(key) ?? 0) + coins);
        byQuestion.set(row.questionId, inner);
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
        leadingMarketPercent: leadingMarketPercentForQuestion(byQuestion, row.questionId),
      };
    });

    return NextResponse.json({ bets });
  } catch (err) {
    console.error('[predict/bets] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
