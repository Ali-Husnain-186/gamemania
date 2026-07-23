'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, ApiError, getAccessToken } from '@/lib/api';
import { formatGbpFromPence } from '@/lib/money';

type Order = {
  orderNumber: string;
  status: string;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      setError('Sign in to view orders.');
      return;
    }
    void (async () => {
      try {
        setOrders(await apiGet<Order[]>('/orders'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load orders');
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[var(--gm-ink)]">Orders</h1>
          <p className="mt-2 text-[var(--gm-muted)]">Your recent GAME-MANIA purchases.</p>
        </div>
        <Link href="/account" className="text-sm text-[var(--gm-muted)] underline">
          Back to account
        </Link>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-red-700">
          {error}{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-[var(--gm-muted)]">No orders yet.</p>
      ) : (
        <ul className="mt-10 space-y-3">
          {orders.map((o) => (
            <li
              key={o.orderNumber}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--gm-line)] bg-white/70 px-4 py-4"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-[var(--gm-ink)]">
                  {o.orderNumber}
                </p>
                <p className="text-xs text-[var(--gm-muted)]">
                  {o.itemCount} items · {o.status} ·{' '}
                  {new Date(o.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>
              <p className="font-display text-lg">{formatGbpFromPence(o.grandTotal)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
