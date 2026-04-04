import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { coinsFromAmountTotalCents } from '@/lib/astro-coins';
import { getAppBaseUrl } from '@/lib/app-base-url';
import { getStripeClient, getStripeSecretKey } from '@/lib/stripe-server';

const MIN_USD = 10;
const MAX_USD = 500;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!getStripeSecretKey()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const raw =
    typeof body === 'object' &&
    body !== null &&
    'amountUsd' in body &&
    (typeof (body as { amountUsd: unknown }).amountUsd === 'number' ||
      typeof (body as { amountUsd: unknown }).amountUsd === 'string')
      ? (body as { amountUsd: number | string }).amountUsd
      : null;

  const amountUsd =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number.parseFloat(raw.replace(',', '.'))
        : Number.NaN;

  if (!Number.isFinite(amountUsd) || amountUsd < MIN_USD || amountUsd > MAX_USD) {
    return NextResponse.json(
      { error: `Amount must be between $${MIN_USD} and $${MAX_USD}` },
      { status: 400 },
    );
  }

  const amountCents = Math.round(amountUsd * 100);
  if (amountCents < Math.round(MIN_USD * 100)) {
    return NextResponse.json({ error: 'Amount too small' }, { status: 400 });
  }

  const coinsPreview = coinsFromAmountTotalCents(amountCents);
  if (coinsPreview <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const base = getAppBaseUrl();
  const stripe = getStripeClient();

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: 'Astro coins',
              description: `${coinsPreview.toLocaleString()} astro coins`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/dashboard?astro_purchase=success`,
      cancel_url: `${base}/dashboard?astro_purchase=cancelled`,
      metadata: {
        userId: session.user.id,
      },
    });
  } catch (e) {
    console.error('[stripe checkout]', e);
    return NextResponse.json(
      { error: 'Could not start checkout' },
      { status: 502 },
    );
  }

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: 'Could not create checkout session' },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
