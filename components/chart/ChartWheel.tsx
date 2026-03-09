'use client';
import { useRef, useEffect } from 'react';
import { drawChartWheel } from '@/lib/astro/draw';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  result: ChartResult;
}

export function ChartWheel({ result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 480;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    drawChartWheel(ctx, size, size, result);
  }, [result]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: 480, display: 'block', borderRadius: 12 }}
    />
  );
}
