import { PageHeader, Panel } from '@/components/ui/page-shell';

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Store name, contact email, loyalty rates, and public site flags."
      />
      <Panel className="p-6 text-sm text-[var(--admin-muted)]">
        Settings placeholder — admin settings API not connected yet.
      </Panel>
    </>
  );
}
