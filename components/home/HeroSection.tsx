import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-16 pb-12 md:pt-20 md:pb-16">
      <div className="text-6xl mb-6 opacity-80">{copy.home.heroIcon}</div>
      <h1 className="text-5xl md:text-7xl font-serif mb-4 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
        {copy.home.title}
      </h1>
      <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
        {copy.home.subtitle}
      </p>
      <Link href="/chart">
        <Button variant="primary" className="text-xl px-10 py-5">
          {copy.home.cta}
        </Button>
      </Link>
      <div className="mt-10 grid grid-cols-2 gap-8 max-w-2xl text-muted-foreground text-base">
        {copy.home.features.map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-3 min-h-[4.5rem]">
            <div className="flex h-8 items-center justify-center shrink-0">
            {icon === 'handshake' ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-violet-500 dark:text-violet-400"
                aria-hidden
              >
                <path d="M5 19 L9 13 L12 14" />
                <path d="M19 19 L15 13 L12 14" />
                <path d="M9 13 L12 10 L15 13" />
              </svg>
            ) : (
              <span className="text-2xl text-violet-500 dark:text-violet-400">{icon}</span>
            )}
            </div>
            <span className="text-center leading-snug">{label}</span>
          </div>
        ))}
      </div>
      <Link
        href="/today"
        className="mt-10 inline-flex items-center gap-2 text-lg text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-300 hover:scale-105 dark:hover:drop-shadow-[0_0_12px_rgba(196,181,253,0.5)]"
      >
        <span className="animate-bounce" aria-hidden>↓</span>
        check today’s chart
      </Link>
    </section>
  );
}
