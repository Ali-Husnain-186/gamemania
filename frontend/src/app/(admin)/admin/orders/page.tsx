'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  email: string;
  createdAt: string;
  user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
};

const STATUSES = [
  'PENDING',
  'AWAITING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<{ items: Order[] }>('/admin/orders?limit=50');
      setOrders(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateStatus(id: string, status: string) {
    startTransition(async () => {
      try {
        await apiPatch(`/admin/orders/${id}`, { status });
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Update failed');
      }
    });
  }

  return (
    <>
      <PageHeader title="Orders" description="Update fulfillment status for customer orders." />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--admin-muted)]">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-[var(--admin-border)]/70 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-3">{o.user?.email ?? o.email}</td>
                      <td className="px-4 py-3 font-mono">{formatGbp(o.grandTotal)}</td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                          value={o.status}
                          disabled={pending}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">
                        {new Date(o.createdAt).toLocaleString('en-GB')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
