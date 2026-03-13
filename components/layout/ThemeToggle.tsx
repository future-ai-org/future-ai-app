'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? copy.nav.themeLight : copy.nav.themeDark}
      aria-label={isDark ? copy.nav.themeLight : copy.nav.themeDark}
      className={cn(
        'rounded-lg p-2 text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground',
        className,
      )}
    >
      {isDark ? (
        <span className="text-lg leading-none" aria-hidden>☀️</span>
      ) : (
        <span className="text-lg leading-none" aria-hidden>🌙</span>
      )}
    </button>
  );
}
