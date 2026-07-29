import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { buildPageMetadata } from '@/lib/seo';
import { CheckoutClient } from './checkout-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'Checkout',
  description: 'Secure checkout for GAME MANIA orders.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <Suspense fallback={<BrandLoader variant="page" size="md" label="Loading checkout…" />}>
      <CheckoutClient />
    </Suspense>
  );
}
