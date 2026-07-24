'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatDate, formatGBP } from '@/lib/format';
import { ErrorState } from '@/components/shared/error-state';
import { useAuth } from '@/providers/auth-provider';

type TradeRequest = {
  id: string;
  requestNumber: string;
  status: string;
  payoutMethod: string;
  quotedCash: number;
  quotedCredit: number;
  finalAmount?: number | null;
};

export function AccountOverview() {
  const { user, refreshUser } = useAuth();

  const tradesQuery = useQuery({
    queryKey: ['trade-requests', 'me'],
    queryFn: () => apiGet<TradeRequest[]>('/trade-in/requests'),
    retry: false,
  });

  if (!user) return null;

  const trades = tradesQuery.data ?? [];

  return (
    <div>
      <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">
        Hello{user.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mt-2 text-[var(--gm-muted)]">{user.email}</p>
      {user.createdAt ? (
        <p className="mt-1 text-xs text-[var(--gm-muted)]">
          Member since {formatDate(user.createdAt)}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-[var(--gm-cyan)] bg-black/40 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-[var(--gm-cyan)]">
            Store credit
          </dt>
          <dd className="gm-display mt-2 text-3xl text-white">
            {formatGBP(user.storeCredit ?? 0)}
          </dd>
          <p className="mt-2 text-xs text-[var(--gm-muted)]">
            From approved trade-ins. Applied automatically at checkout.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-[var(--gm-magenta)]">
            Reward points
          </dt>
          <dd className="gm-display mt-2 text-3xl text-[var(--gm-yellow)]">
            {user.rewardPoints ?? 0}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/account/orders" className="btn-primary px-4 py-2 text-xs">
          View orders
        </Link>
        <Link href="/account/addresses" className="btn-cyan-outline px-4 py-2 text-xs">
          Addresses
        </Link>
        <Link href="/account/profile" className="btn-cyan-outline px-4 py-2 text-xs">
          Edit profile
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="gm-display text-xl text-[var(--gm-cyan)]">Trade-ins</h2>
          <Link href="/trade-in" className="text-xs font-bold uppercase text-[var(--gm-yellow)]">
            New quote →
          </Link>
        </div>
        {tradesQuery.isError ? (
          <div className="mt-4">
            <ErrorState
              title="Could not load trade-ins"
              message={
                tradesQuery.error instanceof Error
                  ? tradesQuery.error.message
                  : 'Something went wrong.'
              }
              onRetry={() => {
                void tradesQuery.refetch();
                void refreshUser();
              }}
            />
          </div>
        ) : trades.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--gm-muted)]">
            No trade-ins yet. Submit a device and choose store credit or cash bank transfer.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {trades.slice(0, 5).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--gm-border)] px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-mono text-xs font-bold">{t.requestNumber}</p>
                  <p className="text-xs text-[var(--gm-muted)]">
                    {t.payoutMethod === 'STORE_CREDIT' ? 'Store credit' : 'Cash transfer'} ·{' '}
                    {t.status}
                  </p>
                </div>
                <p className="font-bold text-[var(--gm-yellow)]">
                  {formatGBP(
                    t.finalAmount ??
                      (t.payoutMethod === 'STORE_CREDIT' ? t.quotedCredit : t.quotedCash),
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
