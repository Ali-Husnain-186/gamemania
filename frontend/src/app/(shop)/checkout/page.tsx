'use client';

import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { CheckoutClient } from './checkout-client';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<BrandLoader variant="page" size="md" label="Loading checkout…" />}>
      <CheckoutClient />
    </Suspense>
  );
}
