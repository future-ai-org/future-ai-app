import { copy } from '@/lib/copy';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-12 pb-6 md:pt-20 md:pb-10">
      <h1 className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4 text-center max-w-4xl">
        <span className="text-5xl md:text-6xl opacity-80 leading-none shrink-0" aria-hidden>
          {copy.predict.heroIcon}
        </span>
        <span className="text-3xl sm:text-5xl md:text-7xl font-serif bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
          {copy.predict.title}
        </span>
      </h1>
    </section>
  );
}
