import { NextResponse } from 'next/server';

/**
 * Dev-only: check if auth env vars are loaded. Open /api/auth/debug in the browser.
 * Helps diagnose "server configuration" / 500 on /api/auth/session (usually AUTH_SECRET missing).
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  const secret = process.env.AUTH_SECRET;
  return NextResponse.json({
    AUTH_SECRET: secret ? `set (${secret.length} chars)` : 'MISSING or empty',
    AUTH_URL: process.env.AUTH_URL || 'not set',
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? 'set' : 'not set',
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ? 'set' : 'not set',
    hint: !secret?.length
      ? 'Add AUTH_SECRET to .env (run: npx auth secret), then restart the dev server.'
      : undefined,
  });
}
