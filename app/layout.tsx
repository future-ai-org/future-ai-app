import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Natal Chart Calculator',
  description: 'Calculate your Western astrology natal chart with precise planetary positions and Placidus house system.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className="bg-[#0d0d1a] text-[#e0d8f0] min-h-screen antialiased">{children}</body>
    </html>
  );
}
