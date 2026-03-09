import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { copy } from '@/lib/copy';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: copy.site.title,
  description: copy.site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0d0d1a] text-[#e0d8f0] min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
