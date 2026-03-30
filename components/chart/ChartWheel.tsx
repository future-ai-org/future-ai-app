'use client';
import { useRef, useEffect } from 'react';
import { reapplyWholeSignHouses } from '@/lib/astro/calculate';
import { drawChartWheel } from '@/lib/astro/draw';
import type { ChartResult } from '@/lib/astro/types';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

interface Props {
  result: ChartResult;
  /** Canvas size in px. Default 520. Use a larger value (e.g. 700) for hero sections. */
  size?: number;
  /** When false, ASC/DSC/MC/IC are not drawn on the wheel. Default true. */
  showAngles?: boolean;
  /** When true, draw only ASC (hide DSC/MC/IC) on the wheel. */
  showAscOnly?: boolean;
}

const DEFAULT_SIZE = 520;

export function ChartWheel({ result, size = DEFAULT_SIZE, showAngles = true, showAscOnly = false }: Props) {
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
    drawChartWheel(ctx, size, size, reapplyWholeSignHouses(result), chartTheme, {
      showAngles,
      showAscOnly,
    });
  }, [result, size, chartTheme, showAngles, showAscOnly]);

  return (
    <div
      className="inline-block max-w-full transition-transform duration-200 ease-out origin-center md:hover:scale-110"
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
