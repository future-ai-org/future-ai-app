'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

const STORAGE_KEY = 'future-theme';

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /** Matches default in layout theme script; explicit `light`/`dark` in localStorage overrides. */
  const [theme, setThemeState] = useState<Theme>('dark');

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const resolved: Theme =
      stored === 'light' || stored === 'dark' ? stored : 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from localStorage (default dark for SSR/first paint)
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
