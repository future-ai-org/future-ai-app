import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export class InsufficientAstroCoinsError extends Error {
  constructor() {
    super('Insufficient astro coins');
    this.name = 'InsufficientAstroCoinsError';
  }
}

/**
 * Apply a balance change and append one ledger row. Call inside `prisma.$transaction`.
 * For debits, throws {@link InsufficientAstroCoinsError} if balance would go negative.
 */
export async function applyAstroCoinDelta(
  tx: Prisma.TransactionClient,
  userId: string,
  delta: number,
  reason: string,
  refId?: string | null,
): Promise<number> {
  if (!Number.isFinite(delta) || delta === 0) {
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { astroCoins: true },
    });
    return u?.astroCoins ?? 0;
  }

  if (delta < 0) {
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { astroCoins: true },
    });
    if (!u || u.astroCoins + delta < 0) {
      throw new InsufficientAstroCoinsError();
    }
  }

  const updated = await tx.user.update({
    where: { id: userId },
    data: { astroCoins: { increment: delta } },
    select: { astroCoins: true },
  });

  await tx.astroCoinLedger.create({
    data: {
      userId,
      delta,
      balanceAfter: updated.astroCoins,
      reason,
      refId: refId ?? null,
    },
  });

  return updated.astroCoins;
}

/** Debit coins (e.g. spend on a feature). Returns new balance or insufficient funds. */
export async function debitAstroCoins(
  userId: string,
  amount: number,
  reason: string,
  refId?: string | null,
): Promise<{ ok: true; balance: number } | { ok: false; error: 'insufficient' }> {
  const n = Math.floor(amount);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: 'insufficient' };
  }

  try {
    const balance = await prisma.$transaction(async tx =>
      applyAstroCoinDelta(tx, userId, -n, reason, refId ?? null),
    );
    return { ok: true, balance };
  } catch (e) {
    if (e instanceof InsufficientAstroCoinsError) {
      return { ok: false, error: 'insufficient' };
    }
    throw e;
  }
}
