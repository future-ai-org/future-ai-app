import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { coinsFromAmountTotalCents } from '@/lib/astro-coins';
import { prisma } from '@/lib/db';
import { getStripeClient, getStripeSecretKey } from '@/lib/stripe-server';

export const runtime = 'nodejs';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== 'payment') return;
  if (session.payment_status !== 'paid') return;

  const userId = session.metadata?.userId?.trim();
  if (!userId) {
    console.error('[stripe webhook] missing metadata.userId', session.id);
    return;
  }

  const amountTotal = session.amount_total;
  if (amountTotal == null) {
    console.error('[stripe webhook] missing amount_total', session.id);
    return;
  }

  const coins = coinsFromAmountTotalCents(amountTotal);
  if (coins <= 0) {
    console.error('[stripe webhook] zero coins for session', session.id);
    return;
  }

  try {
    await prisma.$transaction(async tx => {
      await tx.stripePurchase.create({
        data: {
          sessionId: session.id,
          userId,
          coins,
          amountUsdCents: amountTotal,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { astroCoins: { increment: coins } },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      console.error('[stripe webhook] user not found for session', session.id, userId);
      return;
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  if (!getStripeSecretKey()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillCheckoutSession(session);
  }

  return NextResponse.json({ received: true });
}
