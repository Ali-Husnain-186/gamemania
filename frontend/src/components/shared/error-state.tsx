import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/50 px-6 py-16 text-center',
        className,
      )}
      role="alert"
    >
      <p className="gm-display text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm text-[var(--gm-muted)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-md border border-[var(--gm-border)] px-4 py-2 text-sm font-semibold text-foreground transition hover:border-[var(--gm-accent)] gm-focus"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
