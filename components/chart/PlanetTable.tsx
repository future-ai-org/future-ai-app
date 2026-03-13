import { Card } from '@/components/ui/Card';
import { copy } from '@/lib/copy';
import { PLANET_GLYPHS } from '@/lib/astro/constants';
import { formatLon } from '@/lib/astro/format';
import type { ChartResult } from '@/lib/astro/types';

interface Props {
  result: ChartResult;
}

export function PlanetTable({ result }: Props) {
  return (
    <Card>
      <h2 className="text-xs text-violet-400 tracking-widest uppercase mb-3 border-b border-border pb-2">
        {copy.planetTable.title}
      </h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">{copy.planetTable.planet}</th>
            <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">{copy.planetTable.sign}</th>
            <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">{copy.planetTable.degree}</th>
            <th className="text-left text-xs text-muted-foreground font-normal tracking-wider pb-2 px-1">{copy.planetTable.house}</th>
          </tr>
        </thead>
        <tbody>
          {result.planets.map(p => {
            const f = formatLon(p.longitude);
            return (
              <tr key={p.name} className="border-b border-[#1e1b38] last:border-0">
                <td className="py-1.5 px-1">
                  <span className="text-base mr-1">{PLANET_GLYPHS[p.name]}</span>
                  {p.name}
                </td>
                <td className="py-1.5 px-1">
                  <span className="font-symbols mr-1 text-[#2d1b4e] dark:text-[#8b7ab8]">{f.glyph}</span>
                  {f.sign}
                </td>
                <td className="py-1.5 px-1">
                  {f.deg}°{f.min}&apos;{' '}
                  {p.retrograde && (
                    <span className="text-red-400 text-xs">℞</span>
                  )}
                </td>
                <td className="py-1.5 px-1">
                  <span className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                    {p.house}
                  </span>
                </td>
              </tr>
            );
          })}
          {(result.points ?? []).map(p => {
            const f = formatLon(p.longitude);
            const glyph = PLANET_GLYPHS[p.name] ?? p.name.charAt(0);
            return (
              <tr key={p.name} className="border-b border-[#1e1b38] last:border-0">
                <td className="py-1.5 px-1">
                  <span className="text-base mr-1">{glyph}</span>
                  {p.name}
                </td>
                <td className="py-1.5 px-1">
                  <span className="font-symbols mr-1 text-[#2d1b4e] dark:text-[#8b7ab8]">{f.glyph}</span>
                  {f.sign}
                </td>
                <td className="py-1.5 px-1">
                  {f.deg}°{f.min}&apos;{' '}
                  {p.retrograde && (
                    <span className="text-red-400 text-xs">℞</span>
                  )}
                </td>
                <td className="py-1.5 px-1">
                  <span className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                    {p.house}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
