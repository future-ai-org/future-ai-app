import { ChartWheel } from './ChartWheel';
import { AscendantCard } from './AscendantCard';
import { PlanetTable } from './PlanetTable';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import type { ChartResult } from '@/lib/astro/types';

const DEFAULT_CHART_SIZE = 520;

interface Props {
  result: ChartResult;
  /** When false, the ascendant (rising sign) card is hidden. Default true. */
  showAscendant?: boolean;
  /** When false, ASC/DSC/MC/IC are not drawn on the wheel. Defaults to same as showAscendant. */
  showAngles?: boolean;
  /** When true, render only the ASC marker/label on the wheel (hide DSC/MC/IC). */
  showAscOnly?: boolean;
  /** When false, the house column is hidden in the planet table. Defaults to same as showAscendant. */
  showHouses?: boolean;
  /** Canvas size in px for the chart wheel. Larger = more prominent, centered. */
  chartSize?: number;
  /** When set, shows birth time and ±15m / ±1 hr buttons under the wheel to nudge the chart. */
  onAdjustHours?: (delta: number) => void;
  /** When true, only render the chart wheel (and time controls); no planet table. Use when placing the wheel beside another panel. */
  wheelOnly?: boolean;
}

export function ChartResults({ result, showAscendant = true, showAngles = showAscendant, showAscOnly = false, showHouses = showAscendant, chartSize = DEFAULT_CHART_SIZE, onAdjustHours, wheelOnly = false }: Props) {
  const ascAngleUnknown = result.calculation?.ascendantAngleUnknown === true;
  const effectiveShowAscOnly = ascAngleUnknown || showAscOnly;

  const wheelBlock = (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <ChartWheel
        result={result}
        size={chartSize}
        showAngles={showAngles}
        showAscOnly={effectiveShowAscOnly}
      />
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
          <AscendantCard result={result} showMc={!ascAngleUnknown} />
        </div>
      )}
      {ascAngleUnknown && (
        <p className="text-center text-sm text-muted-foreground font-bold mb-6 max-w-md mx-auto">
          {copy.ascendantAngleUnknownNote}
        </p>
      )}
      {!showAngles && !ascAngleUnknown && (
        <p className="text-center text-sm text-muted-foreground font-bold mb-6 max-w-md mx-auto">
          {copy.noAnglesNote}
        </p>
      )}
      {wheelOnly ? (
        wheelBlock
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {wheelBlock}
          <div className="min-w-0">
            <PlanetTable result={result} showHouses={showHouses} />
          </div>
        </div>
      )}
    </div>
  );
}
