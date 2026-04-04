import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { copy } from '@/lib/copy';
import { getCurrentTransits } from '@/lib/astro/currentTransits';
import { getMoonPhaseInfo } from '@/lib/astro/moonPhase';
import { AstroFooterStrip } from './AstroFooterStrip';

export function Footer() {
  // Without this, production can prerender/cache the layout with `new Date()` from build time.
  noStore();
  const now = new Date();
  const year = now.getFullYear();
  const copyrightText = copy.footer.copyright.replace('{year}', String(year));
  const transits = getCurrentTransits(now);
  const moon = getMoonPhaseInfo(now);
  const moonTransit = transits.find((t) => t.planet === 'Moon');
  const currentMoonSign = moonTransit
    ? `${moonTransit.sign.charAt(0).toUpperCase()}${moonTransit.sign.slice(1)}`
    : moon.phaseName;
  const moonTargetLabel = moon.nextTarget === 'full' ? copy.footer.moonTargetFull : copy.footer.moonTargetNew;
  const nextMoonEmoji = moon.nextTarget === 'full' ? '🌕' : '🌑';
  const nextTargetDate = new Date(now.getTime() + moon.daysToNext * 24 * 60 * 60 * 1000);
  const nextTargetTransits = getCurrentTransits(nextTargetDate);
  const nextTargetMoonTransit = nextTargetTransits.find((t) => t.planet === 'Moon');
  const nextTargetSign = nextTargetMoonTransit
    ? `${nextTargetMoonTransit.sign.charAt(0).toUpperCase()}${nextTargetMoonTransit.sign.slice(1)}`
    : 'Unknown';
  const moonLine = `current moon in ${currentMoonSign} · ${Math.round(moon.daysToNext)} days for ${moonTargetLabel} moon in ${nextTargetSign} ${nextMoonEmoji}`;

  return (
    <footer className="mt-auto w-full border-t border-border/80 bg-footer">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pb-12">
        <AstroFooterStrip transits={transits} />
        <p className="mt-6 pt-2 pb-4 text-center text-sm font-bold text-muted-foreground sm:pb-6" title={moon.phaseName}>
          {moon.emoji} {moonLine}
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-bold">
          <p className="text-[0.65rem] text-muted-foreground">{copyrightText}</p>
          <div className="flex items-center gap-4 text-[0.65rem] text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground/80 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground/80 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
