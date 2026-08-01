import { formatGBP } from '@/lib/format';

type TradeValueProps = {
  cashPence?: number | null;
  creditPence?: number | null;
  compact?: boolean;
};

export function TradeValueBlock({ cashPence, creditPence, compact = false }: TradeValueProps) {
  const cash = cashPence != null && cashPence > 0 ? cashPence : null;
  const credit = creditPence != null && creditPence > 0 ? creditPence : null;
  if (!cash && !credit) return null;

  if (compact) {
    return (
      <div className="mt-1.5 space-y-0.5 text-[11px] leading-snug">
        {credit != null ? (
          <p className="text-[var(--gm-yellow)]">
            <span className="font-extrabold">{formatGBP(credit)}</span>
            <span className="text-[var(--gm-muted)]"> trade voucher</span>
          </p>
        ) : null}
        {cash != null ? (
          <p className="text-[var(--gm-cyan)]">
            <span className="font-extrabold">{formatGBP(cash)}</span>
            <span className="text-[var(--gm-muted)]"> trade cash</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {credit != null ? (
        <div className="rounded-xl border-2 border-[var(--gm-yellow)] bg-[var(--gm-yellow)]/10 px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--gm-yellow)]">
            We buy · store credit
          </p>
          <p className="gm-display mt-1 text-2xl font-bold text-foreground">{formatGBP(credit)}</p>
        </div>
      ) : null}
      {cash != null ? (
        <div className="rounded-xl border-2 border-[var(--gm-cyan)] bg-[var(--gm-cyan)]/10 px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--gm-cyan)]">
            We buy · cash
          </p>
          <p className="gm-display mt-1 text-2xl font-bold text-foreground">{formatGBP(cash)}</p>
        </div>
      ) : null}
    </div>
  );
}

export function showsConditionVariant(name: string) {
  return /\((New|Used)\)\s*$/i.test(name);
}
