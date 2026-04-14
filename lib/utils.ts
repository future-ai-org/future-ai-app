import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { copy } from '@/lib/copy';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Saved chart name in page titles: "lex" → "lex's chart"; leaves "my chart" and labels already ending in "… chart" as-is. */
export function savedChartHeadingLabel(label: string): string {
  const t = label.trim();
  if (t.toLowerCase() === copy.dashboard.myChart) return t;
  if (/\schart$/i.test(t)) return t;
  return `${t}'s chart`;
}
