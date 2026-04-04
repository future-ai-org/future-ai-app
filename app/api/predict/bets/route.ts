import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getPredictQuestionMeta } from '@/lib/predict-question-map';

export const dynamic = 'force-dynamic';

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
      };
    });

    return NextResponse.json({ bets });
  } catch (err) {
    console.error('[predict/bets] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
