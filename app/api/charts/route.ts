import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const charts = await prisma.savedChart.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      label: true,
      isPrimary: true,
      birthData: true,
      chartResult: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ charts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const isPrimary = body.isPrimary === true;
    const label =
      typeof body.label === 'string'
        ? body.label.trim()
        : isPrimary
          ? 'my chart'
          : '';
    const birthData = body.birthData;
    const chartResult = body.chartResult;

    if (!label) {
      return NextResponse.json(
        { error: 'A label is required' },
        { status: 400 }
      );
    }
    if (!birthData || !chartResult) {
      return NextResponse.json(
        { error: 'Birth data and chart result are required' },
        { status: 400 }
      );
    }

    if (isPrimary) {
      await prisma.savedChart.updateMany({
        where: { userId: session.user.id },
        data: { isPrimary: false },
      });
    }

    const birthDataJson =
      typeof birthData === 'string' ? birthData : JSON.stringify(birthData);
    const chartResultJson =
      typeof chartResult === 'string' ? chartResult : JSON.stringify(chartResult);

    const saved = await prisma.savedChart.create({
      data: {
        userId: session.user.id,
        label,
        isPrimary,
        birthData: birthDataJson,
        chartResult: chartResultJson,
      },
      select: {
        id: true,
        label: true,
        isPrimary: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ chart: saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong';
    console.error('Save chart error:', e);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
