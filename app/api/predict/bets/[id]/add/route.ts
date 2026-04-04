import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  applyAstroCoinDelta,
  InsufficientAstroCoinsError,
} from '@/lib/astro-coins-ledger';
import {
  getMcOptionsForQuestion,
  isValidBinaryPredictQuestionId,
  isValidPredictQuestionId,
} from '@/lib/predict-validate';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_COINS_PER_BET = 1_000_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: betId } = await params;
  if (!betId || typeof betId !== 'string') {
    return NextResponse.json({ error: 'Invalid bet id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const coinsRaw =
    typeof body === 'object' &&
    body !== null &&
    'coins' in body &&
    typeof (body as { coins: unknown }).coins === 'number'
      ? (body as { coins: number }).coins
      : Number.NaN;

  const coins = Math.floor(Number(coinsRaw));
  if (!Number.isFinite(coins) || coins < 1 || coins > MAX_COINS_PER_BET) {
    return NextResponse.json(
      { error: `Add between 1 and ${MAX_COINS_PER_BET} coins` },
      { status: 400 },
    );
  }

  try {
    const balance = await prisma.$transaction(async tx => {
      const bet = await tx.predictBet.findFirst({
        where: { id: betId, userId: session.user.id },
        select: { id: true, questionId: true, side: true, coins: true },
      });

      if (!bet) {
        throw new Error('NOT_FOUND');
      }

      if (!isValidPredictQuestionId(bet.questionId)) {
        throw new Error('BAD_QUESTION');
      }
      if (isValidBinaryPredictQuestionId(bet.questionId)) {
        const side = bet.side.trim().toLowerCase();
        if (side !== 'yes' && side !== 'no') throw new Error('BAD_QUESTION');
      } else {
        const opts = getMcOptionsForQuestion(bet.questionId);
        if (!opts || !opts.includes(bet.side)) throw new Error('BAD_QUESTION');
      }

      const refId = `add:${bet.id}`;
      const afterDebit = await applyAstroCoinDelta(
        tx,
        session.user.id,
        -coins,
        'predict_bet',
        refId,
      );

      await tx.predictBet.update({
        where: { id: bet.id },
        data: { coins: { increment: coins } },
      });

      return afterDebit;
    });

    return NextResponse.json({ balance });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }
    if (e instanceof Error && e.message === 'BAD_QUESTION') {
      return NextResponse.json({ error: 'Question no longer available' }, { status: 400 });
    }
    if (e instanceof InsufficientAstroCoinsError) {
      return NextResponse.json(
        { error: 'Not enough astro coins' },
        { status: 402 },
      );
    }
    throw e;
  }
}
