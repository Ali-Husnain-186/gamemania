import type { Metadata } from 'next';
import { Bangers, Nunito } from 'next/font/google';
import { SiteChrome } from '@/components/layout/site-chrome';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bangers',
});

export const metadata: Metadata = {
  title: {
    default: 'GAME MANIA | UK Gaming Marketplace',
    template: '%s | GAME MANIA',
  },
  description:
    'Buy games, consoles and accessories. Trade in for store credit or cash bank transfer. Free UK shipping on orders £60+. Use code GAMEMANIA10 for 10% off.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${nunito.variable} ${bangers.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <AppProviders>
          <SiteChrome>{children}</SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
