import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE = 'future.siwe.nonce';

export async function GET() {
  const nonce = randomBytes(16).toString('hex');
  const jar = await cookies();
  jar.set(COOKIE, nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 300,
  });
  return NextResponse.json({ nonce });
}
