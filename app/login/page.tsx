'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [oauthProviders, setOauthProviders] = useState<{ google: boolean; github: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((res) => res.json())
      .then((data) => setOauthProviders({ google: !!data.google, github: !!data.github }))
      .catch(() => setOauthProviders({ google: false, github: false }));
  }, []);

  async function handleGoogleSignIn() {
    await signIn('google', { callbackUrl });
  }

  async function handleGitHubSignIn() {
    await signIn('github', { callbackUrl });
  }

  if (oauthProviders === null) {
    return (
      <Card>
        <p className="text-muted-foreground text-sm">loading…</p>
      </Card>
    );
  }

  if (!oauthProviders.google && !oauthProviders.github) {
    return (
      <Card>
        <p className="text-muted-foreground text-sm text-center">
          OAuth sign-in is not configured. Please set provider environment variables (e.g. AUTH_GOOGLE_ID /
          AUTH_GOOGLE_SECRET, AUTH_GITHUB_ID / AUTH_GITHUB_SECRET).
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {oauthProviders.google && (
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center"
            onClick={handleGoogleSignIn}
          >
            {copy.auth.signInWithGoogle}
          </Button>
        )}
        {oauthProviders.github && (
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center"
            onClick={handleGitHubSignIn}
          >
            {copy.auth.signInWithGitHub}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Link href="/" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
          ← {copy.site.title}
        </Link>
        <h1 className="text-4xl font-serif mt-4 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.titlePrefix} {copy.auth.loginTitle} {copy.chart.titleSuffix}
        </h1>
      </div>
      <Suspense fallback={<Card><p className="text-muted-foreground text-sm">loading…</p></Card>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
