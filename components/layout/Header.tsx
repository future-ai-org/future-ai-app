'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();

  const navLinkClass = (path: string) =>
    cn(
      'rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base font-bold whitespace-nowrap transition-colors hover:bg-border/60 hover:text-foreground',
      pathname === path
        ? 'bg-border/50 text-violet-800 dark:text-violet-300'
        : 'text-muted-foreground',
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground no-underline transition-opacity hover:opacity-90"
          aria-label={`${copy.site.title} — ${copy.nav.home}`}
        >
          <span className="inline-block text-xl sm:text-2xl text-violet-500 dark:text-violet-400 scale-x-[-1]" aria-hidden>☽</span>
          <span className="hidden sm:inline text-base sm:text-lg font-semibold tracking-tight text-foreground">{copy.site.title}</span>
        </Link>
        <nav aria-label={copy.nav.ariaLabel} className="flex max-w-[70vw] items-center gap-1 overflow-x-auto">
          <Link href="/chart" className={navLinkClass('/chart')}>
            {copy.nav.chart}
          </Link>
          <Link href="/today" className={navLinkClass('/today')}>
            {copy.nav.chartOfMoment}
          </Link>
          {status === 'authenticated' && (
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              {copy.nav.dashboard}
            </Link>
          )}
          {status === 'authenticated' ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className={cn(navLinkClass(''), 'border-0 bg-transparent cursor-pointer')}
            >
              {copy.nav.signOut}
            </button>
          ) : (
            <Link href="/login" className={navLinkClass('/login')}>
              {copy.nav.signIn}
            </Link>
          )}
          <ThemeToggle className="ml-1" />
        </nav>
      </div>
    </header>
  );
}
