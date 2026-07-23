export default function TradeInPage() {
  const steps = ['Console', 'Model', 'Storage', 'Condition', 'Accessories', 'Quote'];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="gm-display text-3xl font-bold md:text-4xl">Trade-In</h1>
      <p className="mt-3 max-w-xl text-[var(--gm-muted)]">
        Get an instant quote for cash or boosted store credit. Full wizard connects to pricing rules
        next.
      </p>
      <ol className="mt-10 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-4 rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/40 px-4 py-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gm-accent)] text-xs font-bold text-[var(--gm-accent)]">
              {index + 1}
            </span>
            <span className="font-medium">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
