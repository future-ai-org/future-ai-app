import { copy } from '@/lib/copy';

/** Gradient on ✦ + title (matches other page titles). */
const predictHeroGradient =
  'bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-12 pb-4 md:pt-20 md:pb-6">
      <h1 className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:gap-x-4 text-center max-w-5xl">
        <span
          className={`text-5xl sm:text-6xl md:text-7xl leading-none shrink-0 ${predictHeroGradient}`}
          aria-hidden
        >
          {copy.predict.heroIcon}
        </span>
        <span
          className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif leading-tight ${predictHeroGradient}`}
        >
          {copy.predict.title}
        </span>
        <span
          className={`text-5xl sm:text-6xl md:text-7xl leading-none shrink-0 ${predictHeroGradient}`}
          aria-hidden
        >
          {copy.predict.titleSuffix}
        </span>
      </h1>
      <p className="mt-5 md:mt-6 max-w-4xl text-xl sm:text-2xl md:text-3xl font-serif font-medium text-muted-foreground text-center leading-snug tracking-tight px-2">
        {copy.predict.subtitle}
      </p>
    </section>
  );
}
