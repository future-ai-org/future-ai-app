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
        <div className="mt-6 pt-2 pb-4 sm:pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[0.65rem] text-muted-foreground">{copyrightText}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-[0.65rem] font-bold text-muted-foreground leading-snug">
            <span className="text-center sm:text-right max-w-[min(100%,28rem)]" title={moon.phaseName}>
              {moon.emoji} {moonLine}
            </span>
            <Link href="/privacy" className="hover:text-foreground/80 transition-colors shrink-0">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground/80 transition-colors shrink-0">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
