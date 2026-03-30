'use client';

import { useRef, useEffect } from 'react';
import { reapplyWholeSignHouses } from '@/lib/astro/calculate';
import { drawTransitWheel } from '@/lib/astro/draw';
import type { ChartResult } from '@/lib/astro/types';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

interface Props {
  natal: ChartResult;
  transit: ChartResult;
  /** Canvas size in px. */
  size?: number;
}

const DEFAULT_SIZE = 560;

export function TransitsWheel({ natal, transit, size = DEFAULT_SIZE }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const chartTheme = theme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    drawTransitWheel(ctx, size, size, reapplyWholeSignHouses(natal), transit, chartTheme);
  }, [natal, transit, size, chartTheme]);

  return (
    <div
      className="inline-block transition-transform duration-200 ease-out origin-center hover:scale-150"
      style={{ maxWidth: size }}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'rounded-2xl border shadow-[0_0_40px_-8px_rgba(99,102,241,0.2)]',
          theme === 'light'
            ? 'border-border bg-card'
            : 'border-white/10 bg-[#0a0a14] shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        )}
        style={{ width: '100%', maxWidth: size, display: 'block' }}
      />
    </div>
  );
}
