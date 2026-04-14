import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { astroCoins: true },
  });

  const initialAstroCoins =
    typeof user?.astroCoins === 'number' && Number.isFinite(user.astroCoins)
      ? Math.max(0, Math.floor(user.astroCoins))
      : 0;

  return <DashboardClient initialAstroCoins={initialAstroCoins} />;
}
