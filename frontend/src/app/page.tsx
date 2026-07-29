import type { Metadata } from 'next';
import { buildPageMetadata, SITE_TITLE } from '@/lib/seo';
import { HomePageClient } from './home-page-client';

export const metadata: Metadata = buildPageMetadata({
  title: SITE_TITLE,
  description:
    'Built by Gamers, For Gamers. Shop PlayStation, Nintendo, PC and retro games in the UK. Trade in consoles and games for cash or store credit. Free delivery on orders over £60.',
  path: '/',
  absoluteTitle: true,
  keywords: [
    'GAME MANIA UK',
    'buy PS5 games',
    'Nintendo games UK',
    'trade in console UK',
    'gaming store UK',
  ],
});

export default function HomePage() {
  return <HomePageClient />;
}
