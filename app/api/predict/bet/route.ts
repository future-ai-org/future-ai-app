import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  applyAstroCoinDelta,
  InsufficientAstroCoinsError,
} from '@/lib/astro-coins-ledger';
import { isValidBinaryPredictQuestionId } from '@/lib/predict-validate';
import { prisma } from '@/lib/db';

const MAX_COINS_PER_BET = 1_000_000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const questionId =
    typeof body === 'object' &&
    body !== null &&
    'questionId' in body &&
    typeof (body as { questionId: unknown }).questionId === 'number'
      ? (body as { questionId: number }).questionId
      : Number.NaN;

  const sideRaw =
    typeof body === 'object' &&
    body !== null &&
    'side' in body &&
    typeof (body as { side: unknown }).side === 'string'
      ? (body as { side: string }).side.trim().toLowerCase()
      : '';

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
      { error: `Invest between 1 and ${MAX_COINS_PER_BET} coins` },
      { status: 400 },
    );
  }

  if (sideRaw !== 'yes' && sideRaw !== 'no') {
    return NextResponse.json({ error: 'side must be yes or no' }, { status: 400 });
  }

  if (!isValidBinaryPredictQuestionId(questionId)) {
    return NextResponse.json({ error: 'Unknown question' }, { status: 400 });
  }

  const refId = `${questionId}:${sideRaw}`;

  try {
    const balance = await prisma.$transaction(async tx => {
      const afterDebit = await applyAstroCoinDelta(
        tx,
        session.user.id,
        -coins,
        'predict_bet',
        refId,
      );
      await tx.predictBet.create({
        data: {
          userId: session.user.id,
          questionId,
          side: sideRaw,
          coins,
        },
      });
      return afterDebit;
    });
    return NextResponse.json({ balance });
  } catch (e) {
    if (e instanceof InsufficientAstroCoinsError) {
      return NextResponse.json(
        { error: 'Not enough astro coins' },
        { status: 402 },
      );
    }
    throw e;
  }
}
