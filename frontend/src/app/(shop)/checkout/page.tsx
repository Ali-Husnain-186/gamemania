'use client';

import { Suspense } from 'react';
import { ProtectedLayout } from '@/components/auth/protected-layout';
import { CheckoutClient } from './checkout-client';

export default function CheckoutPage() {
  return (
    <ProtectedLayout>
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-[var(--gm-muted)]">
            Loading checkout…
          </div>
        }
      >
        <CheckoutClient />
      </Suspense>
    </ProtectedLayout>
  );
}
