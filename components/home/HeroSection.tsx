import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-8 opacity-80">{copy.home.heroIcon}</div>
      <h1 className="text-5xl md:text-7xl font-serif mb-6 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
        {copy.home.title}
      </h1>
      <p className="text-[#9d8ec0] text-lg md:text-xl max-w-xl mb-4 leading-relaxed">
        {copy.home.subtitle}
      </p>
      <p className="text-[#7c6b9e] text-sm mb-12 tracking-widest uppercase">
        {copy.home.tagline}
      </p>
      <Link href="/chart">
        <Button variant="primary" className="text-xl px-10 py-5">
          {copy.home.cta}
        </Button>
      </Link>
      <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl text-[#7c6b9e] text-sm">
        {copy.home.features.map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span className="text-2xl text-violet-400">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
