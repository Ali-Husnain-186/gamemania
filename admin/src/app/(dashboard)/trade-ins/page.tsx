import { PageHeader, Panel } from '@/components/ui/page-shell';

export default function TradeInsPage() {
  return (
    <>
      <PageHeader
        title="Trade-ins"
        description="Grade incoming devices, approve quotes, and mark payouts."
      />
      <Panel className="p-6 text-sm text-[var(--admin-muted)]">
        Trade-in queue placeholder — connect to{' '}
        <code className="font-mono text-xs text-[var(--admin-accent)]">
          /admin/trade-in/requests
        </code>{' '}
        when ready.
      </Panel>
    </>
  );
}
