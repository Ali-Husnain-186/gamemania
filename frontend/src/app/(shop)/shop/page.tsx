import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { buildPageMetadata } from '@/lib/seo';
import { ShopClient } from './shop-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shop games, consoles & accessories',
  description:
    'Browse PlayStation, Nintendo, PC, retro games and gaming accessories. New releases, pre-orders and genuine stock with free UK shipping on orders £60+.',
  path: '/shop',
  keywords: [
    'buy games online UK',
    'PS5 games shop',
    'Nintendo Switch games',
    'gaming accessories',
    'pre-owned games UK',
  ],
});

export default function ShopPage() {
  return (
    <Suspense fallback={<BrandLoader variant="page" size="lg" label="Loading shop…" />}>
      <ShopClient />
    </Suspense>
  );
}
