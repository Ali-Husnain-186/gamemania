'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, getAccessToken, setAccessToken } from '@/lib/api';
import { formatDate, formatGBP } from '@/lib/format';
import { ErrorState } from '@/components/shared/error-state';

type MeUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  rewardPoints?: number;
  storeCredit?: number;
  role?: string;
  createdAt?: string;
};

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getAccessToken() : null;

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => {
      const data = await apiGet<MeUser | { user: MeUser }>('/auth/me');
      if (data && typeof data === 'object' && 'user' in data) {
        return (data as { user: MeUser }).user;
      }
      return data as MeUser;
    },
  });

  if (!mounted || (token && meQuery.isLoading)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading account">
          <div className="h-8 w-40 rounded bg-[var(--gm-border)]" />
          <div className="h-24 rounded-lg bg-[var(--gm-border)]" />
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
        <h1 className="gm-display text-3xl font-bold">Account</h1>
        <p className="mt-3 text-[var(--gm-muted)]">Sign in to view rewards, orders, and profile.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex rounded-md bg-[var(--gm-accent)] px-5 py-2.5 text-sm font-semibold text-[#042016] gm-focus"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex rounded-md border border-[var(--gm-border)] px-5 py-2.5 text-sm font-semibold gm-focus"
          >
            Register
          </Link>
        </div>
      </main>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <ErrorState
          title="Could not load profile"
          message={meQuery.error instanceof Error ? meQuery.error.message : 'Session expired.'}
          onRetry={() => meQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-[var(--gm-accent)] gm-focus rounded-sm"
            onClick={() => {
              setAccessToken(null);
              window.location.href = '/login';
            }}
          >
            Sign in again
          </button>
        </div>
      </main>
    );
  }

  const user = meQuery.data;

  return (
    <main className="mx-auto max-w-lg px-4 py-12 md:px-6">
      <h1 className="gm-display text-3xl font-bold">
        Hello{user.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mt-2 text-[var(--gm-muted)]">{user.email}</p>
      {user.createdAt ? (
        <p className="mt-1 text-xs text-[var(--gm-muted)]">
          Member since {formatDate(user.createdAt)}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--gm-border)] p-4">
          <dt className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">Reward points</dt>
          <dd className="mt-2 text-2xl font-semibold text-[var(--gm-accent)]">
            {user.rewardPoints ?? 0}
          </dd>
        </div>
        <div className="rounded-lg border border-[var(--gm-border)] p-4">
          <dt className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">Store credit</dt>
          <dd className="mt-2 text-2xl font-semibold">{formatGBP(user.storeCredit ?? 0)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="mt-8 text-sm text-[var(--gm-muted)] underline gm-focus rounded-sm"
        onClick={() => {
          setAccessToken(null);
          window.location.href = '/';
        }}
      >
        Sign out
      </button>
    </main>
  );
}
