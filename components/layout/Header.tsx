'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navLinkClass = (path: string) =>
    cn(
      'rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[#2a2450]/60 hover:text-[#e0d8f0]',
      pathname === path ? 'bg-[#2a2450]/50 text-violet-300' : 'text-[#9d8ec0]',
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2450]/80 bg-[#0d0d1a]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#e0d8f0] no-underline transition-opacity hover:opacity-90"
          aria-label={copy.site.title}
        >
          <span className="text-xl text-violet-400" aria-hidden>☽</span>
          <span className="font-semibold tracking-tight text-white">{copy.site.title}</span>
        </Link>
        <nav aria-label={copy.nav.ariaLabel} className="flex items-center gap-1">
          <Link href="/" className={navLinkClass('/')}>
            {copy.nav.home}
          </Link>
          <Link href="/chart" className={navLinkClass('/chart')}>
            {copy.nav.chart}
          </Link>
        </nav>
      </div>
    </header>
  );
}
