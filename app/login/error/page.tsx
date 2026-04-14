'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const isAccessDenied = error === 'AccessDenied';
  const hint = isAccessDenied ? copy.auth.errors.accessDeniedHint : copy.auth.errors.configHint;
  return (
    <Card>
      <p className="text-foreground text-sm mb-4">
        {hint}
      </p>
      {!isAccessDenied && (
        <p className="text-muted-foreground text-xs mt-4">
          In .env use <code className="bg-border px-1 rounded">AUTH_SECRET=your-secret</code> with no quotes and no space after the equals sign. Restart the dev server after changing .env.
        </p>
      )}
      {error && (
        <p className="text-muted-foreground text-xs mt-2">
          Error code: <code className="bg-border px-1.5 py-0.5 rounded">{error}</code>
        </p>
      )}
    </Card>
  );
}

export default function LoginErrorPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Link href="/login" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
          {copy.auth.errors.backToLogin}
        </Link>
        <h1 className="text-4xl font-serif mt-4 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
          {copy.chart.titlePrefix} {copy.auth.errors.configTitle} {copy.chart.titleSuffix}
        </h1>
      </div>
      <Suspense fallback={<Card><p className="text-muted-foreground text-sm">loading…</p></Card>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
