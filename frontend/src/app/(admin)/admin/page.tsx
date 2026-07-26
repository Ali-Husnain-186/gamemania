'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel, StatCard } from '@/features/admin/components/page-shell';

type Stats = {
  products: number;
  orders: number;
  customers: number;
  openTradeRequests: number;
  revenuePaidPence: number;
};

const QUICK_LINKS = [
  { href: '/admin/products', label: 'Products', desc: 'Catalog & inventory' },
  { href: '/admin/orders', label: 'Orders', desc: 'Fulfillment queue' },
  { href: '/admin/trade-ins', label: 'Trade-ins', desc: 'Grade & payout' },
  { href: '/admin/cms', label: 'CMS', desc: 'Pages & content' },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setStats(await apiGet<Stats>('/admin/dashboard/stats'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load stats');
      }
    })();
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" description="Live operations overview for your store." />

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (paid)"
          value={stats ? formatGbp(stats.revenuePaidPence) : '…'}
          hint="Succeeded payments"
        />
        <StatCard label="Orders" value={stats ? String(stats.orders) : '…'} />
        <StatCard label="Open trade-ins" value={stats ? String(stats.openTradeRequests) : '…'} />
        <StatCard
          label="Active products"
          value={stats ? String(stats.products) : '…'}
          hint={stats ? `${stats.customers} customers` : undefined}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--admin-muted)]">
          Quick links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              <Panel className="p-4 transition hover:border-[var(--admin-accent)]/50">
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">{item.desc}</p>
              </Panel>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
