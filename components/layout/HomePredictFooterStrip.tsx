'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type FooterBetItem = {
  questionId: number;
  question: string;
  leadingSide: string;
  leadingPercent: string;
  href: string;
};

function isFooterBetItem(value: unknown): value is FooterBetItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<FooterBetItem>;
  return (
    typeof v.questionId === 'number' &&
    typeof v.question === 'string' &&
    typeof v.leadingSide === 'string' &&
    typeof v.leadingPercent === 'string' &&
    typeof v.href === 'string'
  );
}

export function HomePredictFooterStrip() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [items, setItems] = useState<FooterBetItem[]>([]);

  useEffect(() => {
    if (!isHome) return;

    const controller = new AbortController();
    fetch('/api/predict/footer-bets', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== 'object' || data === null) return;
        const bets = (data as { bets?: unknown }).bets;
        if (!Array.isArray(bets)) return;
        setItems(bets.filter(isFooterBetItem));
      })
      .catch(() => {
        /* keep empty strip on request failure */
      });

    return () => controller.abort();
  }, [isHome]);

  const scrollingItems = useMemo(() => [...items, ...items], [items]);
  if (!isHome || items.length === 0) return null;

  return (
    <div className="overflow-hidden w-full py-1" aria-label="top predict bets">
      <div className="flex w-max animate-astro-scroll">
        {scrollingItems.map((item, i) => (
          <Link
            key={`${item.questionId}-${i}`}
            href={item.href}
            className="flex shrink-0 items-start gap-2 mx-3 py-2 px-3 rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 text-xs text-foreground/90 hover:bg-fuchsia-500/15 transition-colors max-w-[34rem]"
            title={item.question}
          >
            <span className="leading-relaxed break-words whitespace-normal">{item.question}</span>
            <span className="opacity-70 pt-0.5">-</span>
            <span className="opacity-90 pt-0.5">{item.leadingPercent}</span>
            <span className="font-semibold pt-0.5">{item.leadingSide}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
