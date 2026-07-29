import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { GoogleCallbackClient } from './google-callback-client';

export const metadata: Metadata = {
  title: 'Signing in',
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[50vh] w-full max-w-md items-center justify-center px-4">
          <BrandLoader variant="inline" size="md" label="Signing you in…" />
        </main>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  );
}
