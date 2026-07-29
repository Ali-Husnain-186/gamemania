import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { CartClient } from './cart-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'Your cart',
  description: 'Review items in your GAME MANIA cart before checkout.',
  path: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return <CartClient />;
}
