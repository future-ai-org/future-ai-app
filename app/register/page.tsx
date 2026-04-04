'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';

export default function RegisterPage() {
  const [oauthProviders, setOauthProviders] = useState<{ google: boolean; github: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((res) => res.json())
      .then((data) => setOauthProviders({ google: !!data.google, github: !!data.github }))
      .catch(() => setOauthProviders({ google: false, github: false }));
  }, []);

  async function handleGoogleSignIn() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  async function handleGitHubSignIn() {
    await signIn('github', { callbackUrl: '/dashboard' });
  }

  if (oauthProviders === null) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <Link href="/" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
            ← {copy.site.title}
          </Link>
          <h1 className="text-3xl font-serif mt-4 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
            {copy.chart.titlePrefix} {copy.auth.registerTitle} {copy.chart.titleSuffix}
          </h1>
        </div>
        <Card>
          <p className="text-muted-foreground text-sm">loading…</p>
        </Card>
      </main>
    );
  }

  if (!oauthProviders.google && !oauthProviders.github) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <Link href="/" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
            ← {copy.site.title}
          </Link>
          <h1 className="text-3xl font-serif mt-4 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
            {copy.chart.titlePrefix} {copy.auth.registerTitle} {copy.chart.titleSuffix}
          </h1>
        </div>
        <Card>
          <p className="text-muted-foreground text-sm text-center">
            OAuth sign-in is not configured. Please set provider environment variables (e.g. AUTH_GOOGLE_ID /
            AUTH_GOOGLE_SECRET, AUTH_GITHUB_ID / AUTH_GITHUB_SECRET).
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Link href="/" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
          ← {copy.site.title}
        </Link>
        <h1 className="text-3xl font-serif mt-4 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.titlePrefix} {copy.auth.registerTitle} {copy.chart.titleSuffix}
        </h1>
      </div>
      <Card>
        <div className="space-y-4">
          {oauthProviders.google && (
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={handleGoogleSignIn}
            >
              {copy.auth.signUpWithGoogle}
            </Button>
          )}
          {oauthProviders.github && (
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={handleGitHubSignIn}
            >
              {copy.auth.signUpWithGitHub}
            </Button>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {copy.auth.hasAccount}{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            {copy.auth.loginLink}
          </Link>
        </p>
      </Card>
    </main>
  );
}
