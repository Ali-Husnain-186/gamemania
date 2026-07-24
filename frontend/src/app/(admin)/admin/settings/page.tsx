'use client';

import { useEffect, useState, useTransition } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

const KEYS = [
  { key: 'store.name', label: 'Store name' },
  { key: 'shipping.free_threshold_pence', label: 'Free shipping threshold (pence)' },
  { key: 'loyalty.points_per_pound', label: 'Loyalty points per £1' },
] as const;

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      try {
        const entries = await Promise.all(
          KEYS.map(async ({ key }) => {
            const row = await apiGet<{ key: string; value: unknown }>(`/admin/settings/${key}`);
            return [key, String(row.value ?? '')] as const;
          }),
        );
        setValues(Object.fromEntries(entries));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load settings');
      }
    })();
  }, []);

  function save(key: string) {
    startTransition(async () => {
      try {
        setMessage(null);
        const raw = values[key] ?? '';
        const value = /^\d+$/.test(raw) ? Number(raw) : raw;
        await apiPatch(`/admin/settings/${key}`, { value });
        setMessage(`Saved ${key}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Save failed');
      }
    });
  }

  return (
    <>
      <PageHeader title="Settings" description="Store configuration keys." />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-300">{message}</p> : null}
      <div className="space-y-4">
        {KEYS.map(({ key, label }) => (
          <Panel key={key} className="flex flex-wrap items-end gap-3 p-5">
            <label className="min-w-[240px] flex-1 text-xs text-[var(--admin-muted)]">
              {label}
              <span className="mt-0.5 block font-mono text-[10px] opacity-70">{key}</span>
              <input
                className="mt-2 w-full rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
                value={values[key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => save(key)}
              className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              Save
            </button>
          </Panel>
        ))}
      </div>
    </>
  );
}
