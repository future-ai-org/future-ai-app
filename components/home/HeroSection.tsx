import { copy } from '@/lib/copy';

/** Gradient on ✦ + title (matches other page titles). Subtitle: soft gray, lighter than nav muted links. */
const predictHeroGradient =
  'bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-12 pb-6 md:pt-20 md:pb-10">
      <h1 className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4 text-center max-w-4xl">
        <span className={`text-5xl md:text-6xl leading-none shrink-0 ${predictHeroGradient}`} aria-hidden>
          {copy.predict.heroIcon}
        </span>
        <span className={`text-3xl sm:text-5xl md:text-7xl font-serif leading-tight ${predictHeroGradient}`}>
          {copy.predict.title}
        </span>
        <span className={`text-5xl md:text-6xl leading-none shrink-0 ${predictHeroGradient}`} aria-hidden>
          {copy.predict.titleSuffix}
        </span>
      </h1>
      <p className="mt-5 max-w-2xl text-xl sm:text-2xl md:text-3xl font-normal leading-snug px-2 text-foreground/45 dark:text-foreground/58">
        {copy.predict.subtitle}
      </p>
    </section>
  );
}
