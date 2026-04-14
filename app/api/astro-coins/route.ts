import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getStripeSecretKey } from '@/lib/stripe-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { astroCoins: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      coins: user.astroCoins,
      stripeEnabled: Boolean(getStripeSecretKey()),
    });
  } catch (err) {
    console.error('[astro-coins] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
