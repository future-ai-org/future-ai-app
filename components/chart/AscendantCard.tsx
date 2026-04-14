import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { formatLon } from '@/lib/astro/format';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  result: ChartResult;
  showMc?: boolean;
}

export function AscendantCard({ result, showMc = true }: Props) {
  const ascInfo = formatLon(result.asc);
  const mcInfo = formatLon(result.mc);

  return (
    <Card className="mb-4 min-w-[20rem] w-full max-w-lg">
      <h2 className="text-xs font-bold text-violet-400 tracking-widest uppercase mb-3 border-b border-border pb-2">
        {copy.ascendant.title}
      </h2>

      <div className="text-center py-3 mb-4">
        <div className="text-4xl text-fuchsia-300 mb-1">
          {ascInfo.glyph} {ascInfo.sign}
        </div>
        <div className="text-sm font-bold text-foreground">
          {ascInfo.deg}° {ascInfo.min}&apos;
        </div>
      </div>

      {showMc && (
        <div className="text-xs text-muted-foreground leading-relaxed text-center">
          <p>
            <span className="text-fuchsia-400 font-medium">{copy.ascendant.mcLabel}</span>{' '}
            {mcInfo.glyph} {mcInfo.deg}°{mcInfo.min}&apos; {mcInfo.sign}
          </p>
        </div>
      )}
    </Card>
  );
}
