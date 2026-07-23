import { PageHeader, Panel } from '@/components/ui/page-shell';
import { formatGbp } from '@/lib/utils';

const FREE_THRESHOLD_PENCE = 6000;
const FLAT_RATE_PENCE = 395;

const EXAMPLES = [
  { label: 'Basket £29.99', subtotalPence: 2999 },
  { label: 'Basket £59.99', subtotalPence: 5999 },
  { label: 'Basket £60.00', subtotalPence: 6000 },
  { label: 'Basket £120.00', subtotalPence: 12000 },
] as const;

function quote(subtotalPence: number) {
  const free = subtotalPence >= FREE_THRESHOLD_PENCE;
  return {
    ratePence: free ? 0 : FLAT_RATE_PENCE,
    freeShipping: free,
  };
}

export default function ShippingPage() {
  return (
    <>
      <PageHeader
        title="Shipping"
        description="Default UK shipping rules used at checkout. Editable shipping-rule CRUD lands with the admin API."
      />

      <Panel className="mb-6 p-5">
        <h2 className="text-sm font-semibold">£60 free shipping rule</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--admin-muted)]">
          Orders under{' '}
          <span className="text-[var(--admin-fg)]">{formatGbp(FREE_THRESHOLD_PENCE)}</span> are
          charged a flat{' '}
          <span className="text-[var(--admin-fg)]">{formatGbp(FLAT_RATE_PENCE)}</span>. Orders at or
          above the threshold ship free. Live quotes come from{' '}
          <code className="font-mono text-xs text-[var(--admin-accent)]">GET /shipping/quote</code>.
        </p>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-[var(--admin-border)] px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--admin-muted)]">
          Quote examples (GB)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                <th className="px-4 py-3 font-medium">Subtotal</th>
                <th className="px-4 py-3 font-medium">Shipping</th>
                <th className="px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((ex) => {
                const q = quote(ex.subtotalPence);
                return (
                  <tr
                    key={ex.label}
                    className="border-b border-[var(--admin-border)]/70 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{ex.label}</span>
                      <span className="ml-2 font-mono text-xs text-[var(--admin-muted)]">
                        ({ex.subtotalPence}p)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{formatGbp(q.ratePence)}</td>
                    <td className="px-4 py-3 text-[var(--admin-muted)]">
                      {q.freeShipping ? 'Free shipping' : 'Flat rate applies'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
