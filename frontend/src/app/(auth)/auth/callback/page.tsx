import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GoogleCallbackClient } from './google-callback-client';

export const metadata: Metadata = {
  title: 'Signing in',
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[50vh] w-full max-w-md items-center justify-center px-4">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--gm-border)]" aria-busy="true" />
        </main>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  );
}
