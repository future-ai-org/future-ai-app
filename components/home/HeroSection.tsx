import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-8 opacity-80">✦</div>
      <h1 className="text-5xl md:text-7xl font-serif mb-6 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
        Your Cosmic Blueprint
      </h1>
      <p className="text-[#9d8ec0] text-lg md:text-xl max-w-xl mb-4 leading-relaxed">
        Discover your natal chart — the precise map of the sky at the moment you were born.
      </p>
      <p className="text-[#7c6b9e] text-sm mb-12 tracking-widest uppercase">
        Western Astrology · Placidus Houses · Tropical Zodiac
      </p>
      <Link href="/chart">
        <Button variant="primary" className="text-xl px-10 py-5">
          Calculate My Chart
        </Button>
      </Link>
      <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl text-[#7c6b9e] text-sm">
        {[
          { icon: '☉', label: 'Planetary Positions' },
          { icon: '⌂', label: 'Placidus Houses' },
          { icon: '↑', label: 'Ascendant & MC' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span className="text-2xl text-violet-400">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
