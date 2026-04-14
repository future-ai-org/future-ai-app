import { NextResponse } from 'next/server';
import { getHomepageFooterBets } from '@/lib/predict-footer-bets';

export async function GET() {
  try {
    const bets = await getHomepageFooterBets();
    return NextResponse.json(
      { bets },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('[predict/footer-bets] GET', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
