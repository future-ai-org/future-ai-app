'use client';

import type { CurrentTransit } from '@/lib/astro/currentTransits';
import { PLANET_GLYPHS } from '@/lib/astro/constants';

interface AstroFooterStripProps {
  transits: CurrentTransit[];
}

export function AstroFooterStrip({ transits }: AstroFooterStripProps) {
  const items = transits.map((t) => ({
    planet: t.planet,
    sign: t.sign,
    degree: t.degree,
    retrograde: t.retrograde,
    glyph: PLANET_GLYPHS[t.planet] ?? '',
  }));

  return (
    <div className="overflow-hidden w-full py-1" aria-label="current planetary positions">
      <div className="flex w-max animate-astro-scroll">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item.planet}-${i}`}
            className="flex shrink-0 items-center gap-2 mx-3 py-2 px-3 rounded-full border border-violet-500/40 bg-violet-500/10 text-xs text-foreground/90"
          >
            <span className="opacity-90" aria-hidden>
              {item.glyph}
            </span>
            <span className="font-medium">{item.planet}</span>
            <span className="opacity-70">in</span>
            <span className="opacity-90">{item.sign}</span>
            <span className="opacity-70">at</span>
            <span className="opacity-80">{item.degree}°</span>
            {item.retrograde && (
              <span className="text-amber-400/90 font-semibold" title="retrograde">R</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
