'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiPost, setAccessToken } from '@/lib/api';
import { safeReturnUrl } from '@/features/auth/components/require-auth';
import { useAuth } from '@/providers/auth-provider';

export function GoogleCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('accessToken');
    const requestedReturn = searchParams.get('returnUrl');

    if (!token) {
      setError('Google sign-in did not return a session.');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setAccessToken(token);
        await apiPost('/cart/merge').catch(() => undefined);
        const user = await refreshUser();
        const returnUrl = safeReturnUrl(requestedReturn, user?.role);
        if (!cancelled) {
          router.replace(returnUrl);
        }
      } catch {
        if (!cancelled) {
          setError('Could not finish Google sign-in.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, refreshUser]);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 text-center">
        <h1 className="gm-display text-3xl text-[var(--gm-yellow)]">Sign-in failed</h1>
        <p className="mt-3 text-sm text-[var(--gm-danger)]">{error}</p>
        <a href="/login" className="mt-6 font-bold text-[var(--gm-cyan)] underline">
          Back to sign in
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 text-center">
      <div
        className="mx-auto h-8 w-48 animate-pulse rounded bg-[var(--gm-border)]"
        aria-busy="true"
      />
      <p className="mt-4 text-sm text-[var(--gm-muted)]">Finishing Google sign-in…</p>
    </main>
  );
}
