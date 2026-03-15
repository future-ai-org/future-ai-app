import { ChartWheel } from './ChartWheel';
import { AscendantCard } from './AscendantCard';
import { PlanetTable } from './PlanetTable';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import type { ChartResult } from '@/lib/astro/types';

const DEFAULT_CHART_SIZE = 520;

interface Props {
  result: ChartResult;
  showAscendant?: boolean;
  /** When false, ASC/DSC/MC/IC are not drawn on the wheel. Defaults to same as showAscendant. */
  showAngles?: boolean;
  /** Canvas size in px for the chart wheel. Larger = more prominent, centered. */
  chartSize?: number;
  /** When set, shows birth time and ±15m / ±1 hr buttons under the wheel to nudge the chart. */
  onAdjustHours?: (delta: number) => void;
  /** When true, only render the chart wheel (and time controls); no planet table. Use when placing the wheel beside another panel. */
  wheelOnly?: boolean;
}

export function ChartResults({ result, showAscendant = true, showAngles = showAscendant, chartSize = DEFAULT_CHART_SIZE, onAdjustHours, wheelOnly = false }: Props) {
  const wheelBlock = (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <ChartWheel result={result} size={chartSize} showAngles={showAngles} />
      {onAdjustHours && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm w-full">
          <span className="text-muted-foreground font-bold mr-1">{copy.chart.birthTime}:</span>
          <span className="font-bold tabular-nums mr-2">
            {result.birthData.date} {result.birthData.time}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-sm" onClick={() => onAdjustHours(-1 / 4)}>{copy.chart.back15m}</Button>
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-sm" onClick={() => onAdjustHours(1 / 4)}>{copy.chart.forward15m}</Button>
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-sm" onClick={() => onAdjustHours(-1)}>{copy.chart.back1h}</Button>
            <Button type="button" variant="secondary" className="px-2.5 py-1.5 text-sm" onClick={() => onAdjustHours(1)}>{copy.chart.forward1h}</Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-8">
      {showAscendant && (
        <div className="flex justify-center mb-8">
          <AscendantCard result={result} />
        </div>
      )}
      {wheelOnly ? (
        wheelBlock
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {wheelBlock}
          <div className="min-w-0">
            <PlanetTable result={result} />
          </div>
        </div>
      )}
    </div>
  );
}
