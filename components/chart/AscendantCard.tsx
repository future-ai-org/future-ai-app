import { Card } from '@/components/ui/Card';
import { formatLon } from '@/lib/astro/format';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  result: ChartResult;
}

export function AscendantCard({ result }: Props) {
  const ascInfo = formatLon(result.asc);
  const mcInfo  = formatLon(result.mc);

  return (
    <Card className="mb-4">
      <h2 className="text-xs text-violet-400 tracking-widest uppercase mb-3 border-b border-[#2a2450] pb-2">
        Ascendant (Rising Sign)
      </h2>

      <div className="text-center py-3 mb-4">
        <div className="text-4xl text-fuchsia-300 mb-1">
          {ascInfo.glyph} {ascInfo.sign}
        </div>
        <div className="text-sm text-[#9d8ec0]">
          {ascInfo.deg}° {ascInfo.min}&apos; — your rising sign
        </div>
      </div>

      <div className="text-xs text-[#7c6b9e] leading-relaxed">
        <p className="mb-2">
          <span className="text-fuchsia-400 font-medium">MC (Midheaven):</span>{' '}
          {mcInfo.glyph} {mcInfo.deg}°{mcInfo.min}&apos; {mcInfo.sign}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {result.cusps.map((c, i) => {
            const ci = formatLon(c);
            return (
              <span key={i}>
                <span className="text-[#9d8ec0]">House {i + 1}:</span>{' '}
                {ci.glyph} {ci.deg}°{ci.min}&apos;
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
