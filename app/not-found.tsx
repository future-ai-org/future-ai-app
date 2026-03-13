import Link from 'next/link';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl font-serif text-muted-foreground/60 mb-4">404</p>
      <h1 className="text-2xl font-serif text-foreground mb-2">
        {copy.notFound.title}
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
