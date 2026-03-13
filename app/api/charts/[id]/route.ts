import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const chart = await prisma.savedChart.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!chart) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({
    chart: {
      id: chart.id,
      label: chart.label,
      isPrimary: chart.isPrimary,
      birthData: JSON.parse(chart.birthData),
      chartResult: JSON.parse(chart.chartResult),
      createdAt: chart.createdAt,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const chart = await prisma.savedChart.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!chart) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const updates: { isPrimary?: boolean; label?: string } = {};
    if (typeof body.isPrimary === 'boolean') {
      if (body.isPrimary) {
        await prisma.savedChart.updateMany({
          where: { userId: session.user.id },
          data: { isPrimary: false },
        });
      }
      updates.isPrimary = body.isPrimary;
    }
    if (typeof body.label === 'string') {
      const trimmed = body.label.trim();
      if (trimmed) updates.label = trimmed;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ chart: { id: chart.id, label: chart.label, isPrimary: chart.isPrimary } });
    }
    const updated = await prisma.savedChart.update({
      where: { id },
      data: updates,
      select: { id: true, label: true, isPrimary: true },
    });
    return NextResponse.json({ chart: updated });
  } catch (e) {
    console.error('Update chart error:', e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await prisma.savedChart.deleteMany({
    where: { id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
