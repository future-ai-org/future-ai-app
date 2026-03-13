import Link from 'next/link';
import { copy } from '@/lib/copy';
import { getCurrentTransits } from '@/lib/astro/currentTransits';
import { getMoonPhaseInfo } from '@/lib/astro/moonPhase';
import { AstroFooterStrip } from './AstroFooterStrip';

export function Footer() {
  const now = new Date();
  const year = now.getFullYear();
  const copyrightText = copy.footer.copyright.replace('{year}', String(year));
  const transits = getCurrentTransits(now);
  const moon = getMoonPhaseInfo(now);
  const moonTargetLabel = moon.nextTarget === 'full' ? copy.footer.moonTargetFull : copy.footer.moonTargetNew;
  const daysText = `${Math.round(moon.daysToNext)} days to ${moonTargetLabel} moon`;

  return (
    <footer className="mt-auto w-full border-t border-border/80 bg-footer">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pb-12">
        <AstroFooterStrip transits={transits} />
        <p className="mt-4 text-center text-sm font-bold text-muted-foreground" title={moon.phaseName}>
          {moon.emoji} · {daysText}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
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
