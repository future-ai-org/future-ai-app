'use client';

import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { PLANET_GLYPHS } from '@/lib/astro/constants';
import { reapplyWholeSignHouses } from '@/lib/astro/calculate';
import { formatLon } from '@/lib/astro/format';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  natal: ChartResult;
  transit: ChartResult;
}

type RowPosition = { name: string; longitude: number; house: number; retrograde?: boolean };

function byName(
  result: ChartResult,
): Map<string, RowPosition> {
  const map = new Map<string, RowPosition>();
  for (const p of result.planets) {
    map.set(p.name, { name: p.name, longitude: p.longitude, house: p.house, retrograde: p.retrograde });
  }
  for (const p of result.points ?? []) {
    map.set(p.name, { name: p.name, longitude: p.longitude, house: p.house, retrograde: p.retrograde });
  }
  return map;
}

const TRANSITS_TABLE_EXCLUDED = new Set([
  'Lot of Fortune',
  'Lot of Spirit',
  'Lot of Eros',
  'Lot of Victory',
]);

function allNames(natal: ChartResult, transit: ChartResult): string[] {
  const set = new Set<string>();
  const add = (name: string) => { if (!TRANSITS_TABLE_EXCLUDED.has(name)) set.add(name); };
  for (const p of natal.planets) add(p.name);
  for (const p of natal.points ?? []) add(p.name);
  for (const p of transit.planets) add(p.name);
  for (const p of transit.points ?? []) add(p.name);
  const order: string[] = [];
  for (const p of natal.planets) if (set.has(p.name)) { order.push(p.name); set.delete(p.name); }
  for (const p of natal.points ?? []) if (set.has(p.name)) { order.push(p.name); set.delete(p.name); }
  for (const p of transit.planets) if (set.has(p.name)) { order.push(p.name); set.delete(p.name); }
  for (const p of transit.points ?? []) if (set.has(p.name)) { order.push(p.name); set.delete(p.name); }
  return order;
}

function PositionCell({ pos }: { pos: RowPosition | undefined }) {
  if (!pos) {
    return <td className="py-1.5 px-1 text-muted-foreground whitespace-nowrap">—</td>;
  }
  const f = formatLon(pos.longitude);
  return (
    <td className="py-1.5 px-1 whitespace-nowrap">
      <span className="font-symbols mr-1 text-[#2d1b4e] dark:text-[#8b7ab8]">{f.glyph}</span>
      {f.sign} {f.deg}°{f.min}&apos;
      {pos.retrograde && <span className="text-red-400 text-xs ml-0.5">℞</span>}
      {' · '}
      <span className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground">
        {copy.planetTable.house} {pos.house}
      </span>
    </td>
  );
}

export function TransitsTable({ natal, transit }: Props) {
  const natalDisplay = reapplyWholeSignHouses(natal);
  const natalByName = byName(natalDisplay);
  const transitByName = byName(transit);
  const names = allNames(natalDisplay, transit);

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[320px]">
          <thead>
            <tr>
              <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">
                {copy.planetTable.planet}
              </th>
              <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">
                {copy.chart.transitsTableNatal}
              </th>
              <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">
                {copy.chart.transitsTableTransits}
              </th>
            </tr>
          </thead>
          <tbody>
            {names.map(name => {
              const natalPos = natalByName.get(name);
              const transitPos = transitByName.get(name);
              const glyph = PLANET_GLYPHS[name] ?? name.charAt(0);
              return (
                <tr key={name} className="border-b border-border last:border-0">
                  <td className="py-1.5 px-1 whitespace-nowrap">
                    <span className="text-base mr-1">{glyph}</span>
                    {name}
                  </td>
                  <PositionCell pos={natalPos} />
                  <PositionCell pos={transitPos} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
