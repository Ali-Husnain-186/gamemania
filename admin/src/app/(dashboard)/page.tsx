import Link from 'next/link';
import { PageHeader, Panel, StatCard } from '@/components/ui/page-shell';

const QUICK_LINKS = [
  { href: '/products', label: 'Products', desc: 'Catalog & inventory' },
  { href: '/orders', label: 'Orders', desc: 'Fulfillment queue' },
  { href: '/trade-ins', label: 'Trade-ins', desc: 'Grade & payout' },
  { href: '/shipping', label: 'Shipping', desc: 'Rates & free threshold' },
] as const;

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operations overview for GAME-MANIA. Live KPIs will wire in once analytics endpoints ship."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (today)" value="—" hint="Placeholder" />
        <StatCard label="Orders" value="—" hint="Placeholder" />
        <StatCard label="Open trade-ins" value="—" hint="Placeholder" />
        <StatCard label="Low stock" value="—" hint="Placeholder" />
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
