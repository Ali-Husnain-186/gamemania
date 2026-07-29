'use client';

import { useEffect, useState, useTransition } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { apiDelete, apiGet, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Customer = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  rewardPoints: number;
  storeCredit: number;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  async function load(q = search) {
    setLoading(true);
    try {
      const query = q ? `&search=${encodeURIComponent(q)}` : '';
      const data = await apiGet<{ items: Customer[] }>(`/admin/customers?limit=50${query}`);
      setCustomers(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void load(search);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function remove(c: Customer) {
    if (!window.confirm(`Delete customer ${c.email}? They will no longer be able to sign in.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await apiDelete(`/admin/customers/${c.id}`);
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Delete failed');
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer accounts with loyalty balances."
        actions={
          <input
            className="rounded-md border border-[var(--admin-border)] bg-black/20 px-3 py-2 text-sm"
            placeholder="Search email / name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="flex justify-center p-8">
            <BrandLoader variant="inline" size="sm" label="Loading…" showWordmark={false} />
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Store credit</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--admin-border)]/70 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono">{c._count.orders}</td>
                    <td className="px-4 py-3 font-mono">{c.rewardPoints}</td>
                    <td className="px-4 py-3 font-mono">{formatGbp(c.storeCredit)}</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">
                      {new Date(c.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-sm text-[var(--admin-danger)] hover:underline disabled:opacity-50"
                        disabled={pending}
                        onClick={() => remove(c)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
