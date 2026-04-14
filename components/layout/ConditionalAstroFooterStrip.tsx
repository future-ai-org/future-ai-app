'use client';

import { usePathname } from 'next/navigation';
import type { CurrentTransit } from '@/lib/astro/currentTransits';
import { AstroFooterStrip } from '@/components/layout/AstroFooterStrip';

type Props = {
  transits: CurrentTransit[];
};

/** Hides the scrolling planet strip on predict (home) and dashboard only. */
export function ConditionalAstroFooterStrip({ transits }: Props) {
  const pathname = usePathname();
  const hideStrip =
    pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  if (hideStrip) return null;
  return <AstroFooterStrip transits={transits} />;
}
