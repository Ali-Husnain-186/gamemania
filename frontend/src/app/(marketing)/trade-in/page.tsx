import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { TradeInClient } from './trade-in-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'Trade in games & consoles',
  description:
    'Get an instant trade-in quote for games and consoles. Choose cash or store credit. Fast, trusted UK trade-in with GAME MANIA.',
  path: '/trade-in',
  image: '/brand/hero-trade-in.jpg',
  keywords: [
    'trade in PS5',
    'trade in Nintendo Switch',
    'sell games UK',
    'console trade in',
    'GAME MANIA trade in',
  ],
});

export default function TradeInPage() {
  return <TradeInClient />;
}
