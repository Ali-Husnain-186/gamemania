'use client';

import { useEffect, useState, useTransition } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
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
  isManual?: boolean;
  manualCategory?: string | null;
  manualDescription?: string | null;
  bankAccountName?: string | null;
  bankSortCode?: string | null;
  bankAccountNumber?: string | null;
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

  function update(id: string, status: string, finalAmount?: number) {
    startTransition(async () => {
      try {
        await apiPatch(`/admin/trade-in/requests/${id}`, {
          status,
          ...(finalAmount != null ? { finalAmount } : {}),
        });
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
        description="Mark PAID to apply store credit automatically (quote amount used if final amount is empty). Cash rows show bank details for manual transfer."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="flex justify-center p-8">
            <BrandLoader variant="inline" size="sm" label="Loading…" showWordmark={false} />
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Quote</th>
                  <th className="px-4 py-3 font-medium">Payout / Bank</th>
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
                  items.map((t) => {
                    const defaultFinal = t.payoutMethod === 'CASH' ? t.quotedCash : t.quotedCredit;
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-[var(--admin-border)]/70 last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs">{t.requestNumber}</td>
                        <td className="px-4 py-3">{t.user?.email ?? '—'}</td>
                        <td className="px-4 py-3">
                          {t.isManual ? (
                            <span>
                              Not listed · {t.manualCategory ?? 'Other'}
                              {t.manualDescription ? (
                                <span className="mt-1 block max-w-[220px] truncate text-xs text-[var(--admin-muted)]">
                                  {t.manualDescription}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <>
                              {t.option?.model?.name ?? '—'} {t.option?.storage ?? ''}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          Cash {formatGbp(t.quotedCash)} / Credit {formatGbp(t.quotedCredit)}
                          {t.finalAmount != null ? (
                            <span className="mt-1 block text-[var(--admin-accent)]">
                              Final {formatGbp(t.finalAmount)}
                            </span>
                          ) : null}
                          <label className="mt-2 block text-[10px] uppercase text-[var(--admin-muted)]">
                            Final £ (pence)
                            <input
                              type="number"
                              min={0}
                              defaultValue={t.finalAmount ?? defaultFinal}
                              className="mt-1 w-28 rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                              id={`final-${t.id}`}
                            />
                          </label>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <p>{t.payoutMethod}</p>
                          {t.payoutMethod === 'CASH' ? (
                            <p className="mt-1 text-[var(--admin-muted)]">
                              {t.bankAccountName ?? '—'}
                              <br />
                              {t.bankSortCode ?? '—'} / {t.bankAccountNumber ?? '—'}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                            value={t.status}
                            disabled={pending}
                            onChange={(e) => {
                              const el = document.getElementById(
                                `final-${t.id}`,
                              ) as HTMLInputElement | null;
                              const amount = el ? Number(el.value) : undefined;
                              update(
                                t.id,
                                e.target.value,
                                Number.isFinite(amount) ? amount : undefined,
                              );
                            }}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
