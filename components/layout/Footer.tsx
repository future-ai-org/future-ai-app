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
        <p className="mt-6 pt-2 text-center text-base font-bold text-muted-foreground" title={moon.phaseName}>
          {moon.emoji} {moonLine}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-bold">
          <p className="text-[0.65rem] text-muted-foreground">{copyrightText}</p>
          <div className="flex items-center gap-4 text-[0.65rem] text-muted-foreground">
            <Link
              href="https://donationvonsteinkirchcom.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/80 transition-colors"
            >
              support this work
            </Link>
            <Link href="/privacy" className="hover:text-foreground/80 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground/80 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
