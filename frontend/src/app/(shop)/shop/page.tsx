import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { ShopClient } from './shop-client';

export default function ShopPage() {
  return (
    <Suspense fallback={<BrandLoader variant="page" size="lg" label="Loading shop…" />}>
      <ShopClient />
    </Suspense>
  );
}
