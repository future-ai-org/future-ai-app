import Link from 'next/link';
import { copy } from '@/lib/copy';

export function Footer() {
  const year = new Date().getFullYear();
  const copyrightText = copy.footer.copyright.replace('{year}', String(year));

  return (
    <footer className="mt-auto w-full border-t border-[#2a2450]/80 bg-[#0a0a14]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-[#7c6b9e]">
              {copy.footer.tagline}
            </p>
            <p className="mt-1 text-sm text-[#6b5b8a]">{copyrightText}</p>
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            {copy.footer.links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-[#9d8ec0] transition-colors hover:text-violet-400"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
