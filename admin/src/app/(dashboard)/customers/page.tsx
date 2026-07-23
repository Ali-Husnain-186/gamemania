import { PageHeader, Panel } from '@/components/ui/page-shell';

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer profiles, store credit, and loyalty adjustments."
      />
      <Panel className="p-6 text-sm text-[var(--admin-muted)]">
        Customers module placeholder — wire to admin customers API when available.
      </Panel>
    </>
  );
}
