import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { applyAstroCoinDelta } from '@/lib/astro-coins-ledger';
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

  const remove = Math.floor(Number(coinsRaw));
  if (!Number.isFinite(remove) || remove < 1 || remove > MAX_COINS_PER_BET) {
    return NextResponse.json({ error: 'Invalid withdraw amount' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const bet = await tx.predictBet.findFirst({
        where: { id: betId, userId: session.user.id },
        select: { id: true, coins: true, questionId: true, side: true },
      });

      if (!bet) {
        return { type: 'not_found' as const };
      }

      if (remove > bet.coins) {
        return { type: 'too_many' as const };
      }

      const refId = `withdraw:${bet.id}`;
      const balance = await applyAstroCoinDelta(
        tx,
        session.user.id,
        remove,
        'predict_withdraw',
        refId,
      );

      if (remove === bet.coins) {
        await tx.predictBet.delete({ where: { id: bet.id } });
        return {
          type: 'ok' as const,
          balance,
          removed: remove,
          deleted: true,
          remainingCoins: 0,
        };
      }

      await tx.predictBet.update({
        where: { id: bet.id },
        data: { coins: bet.coins - remove },
      });

      return {
        type: 'ok' as const,
        balance,
        removed: remove,
        deleted: false,
        remainingCoins: bet.coins - remove,
      };
    });

    if (result.type === 'not_found') {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }
    if (result.type === 'too_many') {
      return NextResponse.json({ error: 'Cannot withdraw more than you staked' }, { status: 400 });
    }

    return NextResponse.json({
      balance: result.balance,
      removed: result.removed,
      deleted: result.deleted,
      remainingCoins: result.remainingCoins,
    });
  } catch (err) {
    console.error('[predict/bets/withdraw] POST', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
