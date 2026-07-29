import type { Metadata } from 'next';
import { Bangers, Nunito } from 'next/font/google';
import { SiteChrome } from '@/components/layout/site-chrome';
import { JsonLd } from '@/components/seo/json-ld';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_TITLE,
  absoluteUrl,
  getSiteUrl,
  organizationJsonLd,
  websiteJsonLd,
} from '@/lib/seo';
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

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'shopping',
  keywords: [
    'GAME MANIA UK',
    'buy games UK',
    'PS5 games',
    'Nintendo Switch games',
    'trade in games',
    'trade in console',
    'gaming accessories UK',
    'pre-owned games',
    'retro games UK',
  ],
  alternates: {
    canonical: absoluteUrl('/'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'GAME MANIA UK — games, consoles and trade-ins',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [{ url: '/brand/game-mania-logo.png', type: 'image/png' }],
    shortcut: '/brand/game-mania-logo.png',
    apple: '/brand/game-mania-logo.png',
  },
  other: {
    'geo.region': 'GB',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${nunito.variable} ${bangers.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AppProviders>
          <SiteChrome>{children}</SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
