'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Rule = {
  id: string;
  name: string;
  description?: string | null;
  minOrderAmount: number;
  maxOrderAmount?: number | null;
  rate: number;
  country: string;
  isActive: boolean;
  priority: number;
};

export default function ShippingPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setRules(await apiGet<Rule[]>('/admin/shipping-rules'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load shipping rules');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function save() {
    startTransition(async () => {
      try {
        setMessage(null);
        await apiPatch('/admin/shipping-rules', {
          rules: rules.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? undefined,
            minOrderAmount: r.minOrderAmount,
            maxOrderAmount: r.maxOrderAmount ?? null,
            rate: r.rate,
            country: r.country,
            isActive: r.isActive,
            priority: r.priority,
          })),
        });
        setMessage('Shipping rules saved.');
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  function updateRule(id: string, patch: Partial<Rule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <>
      <PageHeader
        title="Shipping"
        description="UK rates and free-shipping threshold (amounts in pence)."
        actions={
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save rules'}
          </button>
        }
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-300">{message}</p> : null}
      <div className="space-y-4">
        {rules.map((r) => (
          <Panel key={r.id} className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-xs text-[var(--admin-muted)]">
                Name
                <input
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                  value={r.name}
                  onChange={(e) => updateRule(r.id, { name: e.target.value })}
                />
              </label>
              <label className="block text-xs text-[var(--admin-muted)]">
                Min order (pence)
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
                  value={r.minOrderAmount}
                  onChange={(e) => updateRule(r.id, { minOrderAmount: Number(e.target.value) })}
                />
              </label>
              <label className="block text-xs text-[var(--admin-muted)]">
                Max order (pence, blank = none)
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
                  value={r.maxOrderAmount ?? ''}
                  onChange={(e) =>
                    updateRule(r.id, {
                      maxOrderAmount: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block text-xs text-[var(--admin-muted)]">
                Rate (pence) — {formatGbp(r.rate)}
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
                  value={r.rate}
                  onChange={(e) => updateRule(r.id, { rate: Number(e.target.value) })}
                />
              </label>
              <label className="block text-xs text-[var(--admin-muted)]">
                Priority
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm font-mono"
                  value={r.priority}
                  onChange={(e) => updateRule(r.id, { priority: Number(e.target.value) })}
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={r.isActive}
                  onChange={(e) => updateRule(r.id, { isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
