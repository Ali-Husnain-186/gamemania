import { Suspense } from 'react';
import { ShopClient } from './shop-client';

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-[var(--gm-muted)]">Loading shop…</div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
