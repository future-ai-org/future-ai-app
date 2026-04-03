import type { Metadata } from 'next';
import Script from 'next/script';
import { Ubuntu, Noto_Sans_Symbols_2 } from 'next/font/google';
import { copy } from '@/lib/copy';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
});

const notoSansSymbols2 = Noto_Sans_Symbols_2({
  subsets: ['latin', 'symbols'],
  weight: ['400'],
  variable: '--font-symbols',
});

export const metadata: Metadata = {
  title: copy.site.tabTitle,
  description: copy.site.description,
};

const themeScript = `(function(){var t=localStorage.getItem('future-theme');if(t==='light'||t==='dark'){document.documentElement.classList.add(t);}else{document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${notoSansSymbols2.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased font-sans">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <SessionProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
