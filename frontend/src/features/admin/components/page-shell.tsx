import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--admin-fg)] sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-[var(--admin-fg)]">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-[var(--admin-muted)]">{hint}</p> : null}
    </Panel>
  );
}
