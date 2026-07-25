export function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]"
        >
          <div className="aspect-square animate-pulse bg-white/5" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-1/4 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </>
  );
}
