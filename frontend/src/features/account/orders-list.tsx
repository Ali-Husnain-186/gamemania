'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { BrandLoader } from '@/components/ui/brand-loader';

type Order = {
  orderNumber: string;
  status: string;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
};

export function OrdersList() {
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiGet<Order[]>('/orders'),
  });

  return (
    <div>
      <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Orders</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">Your recent GAME MANIA purchases.</p>

      {ordersQuery.isLoading ? (
        <BrandLoader
          variant="page"
          size="sm"
          label="Loading orders…"
          className="!min-h-[28vh] !py-8"
        />
      ) : ordersQuery.isError ? (
        <div className="mt-8">
          <ErrorState
            title="Could not load orders"
            message={
              ordersQuery.error instanceof Error
                ? ordersQuery.error.message
                : 'Something went wrong.'
            }
            onRetry={() => void ordersQuery.refetch()}
          />
        </div>
      ) : !ordersQuery.data?.length ? (
        <div className="mt-8">
          <EmptyState title="No orders yet" description="When you checkout, orders show up here." />
          <Link href="/shop" className="mt-6 inline-block text-sm font-bold text-[var(--gm-cyan)]">
            Browse shop →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {ordersQuery.data.map((o) => (
            <li key={o.orderNumber}>
              <Link
                href={`/account/orders/${encodeURIComponent(o.orderNumber)}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--gm-border)] bg-black/40 px-4 py-4 transition hover:border-[var(--gm-cyan)] gm-focus"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-white">{o.orderNumber}</p>
                  <p className="text-xs text-[var(--gm-muted)]">
                    {o.itemCount} items · {o.status} ·{' '}
                    {new Date(o.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <p className="gm-display text-lg text-[var(--gm-yellow)]">
                  {formatGBP(o.grandTotal)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
