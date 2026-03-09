import { ChartWheel } from './ChartWheel';
import { AscendantCard } from './AscendantCard';
import { PlanetTable } from './PlanetTable';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  result: ChartResult;
}

export function ChartResults({ result }: Props) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div>
        <ChartWheel result={result} />
      </div>
      <div>
        <AscendantCard result={result} />
        <PlanetTable result={result} />
      </div>
    </div>
  );
}
