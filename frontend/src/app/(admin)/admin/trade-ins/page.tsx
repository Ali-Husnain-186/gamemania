'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiDelete, apiGet, apiPatch, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type TradeRequest = {
  id: string;
  requestNumber: string;
  status: string;
  payoutMethod: string;
  quotedCash: number;
  quotedCredit: number;
  finalAmount?: number | null;
  createdAt: string;
  user?: { email: string } | null;
  option?: {
    storage: string;
    model?: { name: string };
  } | null;
};

const STATUSES = [
  'QUOTED',
  'SUBMITTED',
  'RECEIVED',
  'GRADED',
  'APPROVED',
  'ADJUSTED',
  'REJECTED',
  'PAID',
  'CANCELLED',
] as const;

export default function TradeInsPage() {
  const [items, setItems] = useState<TradeRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<TradeRequest[]>('/admin/trade-in/requests');
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load trade-ins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function update(id: string, status: string) {
    startTransition(async () => {
      try {
        await apiPatch(`/admin/trade-in/requests/${id}`, { status });
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Update failed');
      }
    });
  }

  function remove(id: string, ref: string) {
    if (!window.confirm(`Delete trade-in ${ref}?`)) return;
    startTransition(async () => {
      try {
        await apiDelete(`/admin/trade-in/requests/${id}`);
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Delete failed');
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Trade-ins"
        description="Approve & mark PAID: store credit is applied to the customer account automatically. Cash payouts are sent manually by bank transfer."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium">Quote</th>
                  <th className="px-4 py-3 font-medium">Payout</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[var(--admin-muted)]">
                      No trade-in requests
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--admin-border)]/70 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{t.requestNumber}</td>
                      <td className="px-4 py-3">{t.user?.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        {t.option?.model?.name ?? '—'} {t.option?.storage ?? ''}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        Cash {formatGbp(t.finalAmount ?? t.quotedCash)} / Credit{' '}
                        {formatGbp(t.quotedCredit)}
                      </td>
                      <td className="px-4 py-3">{t.payoutMethod}</td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                          value={t.status}
                          disabled={pending}
                          onChange={(e) => update(t.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-sm text-[var(--admin-danger)] hover:underline disabled:opacity-50"
                          disabled={pending}
                          onClick={() => remove(t.id, t.requestNumber)}
                        >
                          Delete
                        </button>
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
