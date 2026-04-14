// Load .env first so AUTH_SECRET is available when this module runs (e.g. under next dev/start)
import 'dotenv/config';

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { prisma } from '@/lib/db';

// Do not throw at top level: that prevents the auth route from loading and /api/auth/*
// would 404, returning HTML and causing "Unexpected token '<', '<!DOCTYPE'..." on the client.
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login/error',
  },
  callbacks: {
    signIn: async ({ user }) => {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          (user as { id?: string }).id = existing.id;
          return true;
        }
        const created = await prisma.user.create({
          data: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            passwordHash: null,
          },
        });
        (user as { id?: string }).id = created.id;
        return true;
      } catch (err) {
        console.error('[auth] OAuth signIn callback error:', err);
        return false;
      }
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = (token?.id as string) ?? '';
        session.user.email = (token?.email as string) ?? null;
      }
      return session;
    },
  },
});
