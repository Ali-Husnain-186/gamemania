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
    default: 'GAME MANIA | Trade. Play. Repeat.',
    template: '%s | GAME MANIA',
  },
  description:
    'Built by Gamers, For Gamers. Buy games, consoles and accessories. Trade in for store credit or cash. Free UK shipping on orders £60+. 3-month warranty on all products.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  icons: {
    icon: [{ url: '/brand/game-mania-logo.png', type: 'image/png' }],
    shortcut: '/brand/game-mania-logo.png',
    apple: '/brand/game-mania-logo.png',
  },
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
