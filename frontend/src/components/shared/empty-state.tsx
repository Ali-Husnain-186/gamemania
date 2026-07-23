import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/50 px-6 py-16 text-center',
        className,
      )}
      role="status"
    >
      <p className="gm-display text-lg font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[var(--gm-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
