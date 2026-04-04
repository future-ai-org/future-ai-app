import Link from 'next/link';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl font-serif text-muted-foreground/60 mb-4">404</p>
      <h1 className="text-2xl font-serif mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">
        {copy.chart.titlePrefix} {copy.notFound.title} {copy.chart.titleSuffix}
      </h1>
      <p className="text-muted-foreground mb-8">
        {copy.notFound.message}
      </p>
      <Link
        href="/"
        className="inline-block text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 font-medium transition-colors"
      >
        {copy.notFound.backHome}
      </Link>
    </main>
  );
}
