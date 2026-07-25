'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { ErrorState } from '@/components/shared/error-state';

type OrderDetail = {
  orderNumber: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
  } | null;
  coupon?: { code: string } | null;
};

export function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const searchParams = useSearchParams();
  const justPaid = searchParams.get('paid') === '1';

  const orderQuery = useQuery({
    queryKey: ['orders', orderNumber],
    queryFn: () => apiGet<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`),
    refetchInterval: justPaid ? 2500 : false,
  });

  if (orderQuery.isLoading) {
    return (
      <div className="animate-pulse space-y-3" aria-busy="true">
        <div className="h-8 w-48 rounded bg-[var(--gm-border)]" />
        <div className="h-40 rounded-xl bg-[var(--gm-border)]" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div>
        <ErrorState
          title="Order not found"
          message={
            orderQuery.error instanceof Error ? orderQuery.error.message : 'Could not load order.'
          }
          onRetry={() => void orderQuery.refetch()}
        />
        <Link href="/account/orders" className="mt-6 inline-block text-sm text-[var(--gm-cyan)]">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const order = orderQuery.data;

  return (
    <div>
      <Link href="/account/orders" className="text-xs font-bold uppercase text-[var(--gm-cyan)]">
        ← Orders
      </Link>
      {justPaid ? (
        <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Payment submitted successfully. Status updates to <strong>PAID</strong> when Stripe
          confirms the webhook (may take a few seconds).
        </p>
      ) : null}
      <h1 className="gm-display mt-3 text-4xl text-[var(--gm-yellow)]">{order.orderNumber}</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">
        {order.status} · {new Date(order.createdAt).toLocaleDateString('en-GB')}
      </p>

      <ul className="mt-8 space-y-3">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gm-border)] px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-[var(--gm-muted)]">
                Qty {item.quantity} · {formatGBP(item.unitPrice)} each
              </p>
            </div>
            <p className="font-bold text-[var(--gm-yellow)]">{formatGBP(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-8 space-y-2 rounded-2xl border-2 border-[var(--gm-border)] bg-black/40 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--gm-muted)]">Subtotal</dt>
          <dd>{formatGBP(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--gm-muted)]">Discount</dt>
          <dd>-{formatGBP(order.discountTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--gm-muted)]">Shipping</dt>
          <dd>{formatGBP(order.shippingTotal)}</dd>
        </div>
        {order.coupon?.code ? (
          <div className="flex justify-between">
            <dt className="text-[var(--gm-muted)]">Coupon</dt>
            <dd className="font-mono">{order.coupon.code}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-[var(--gm-border)] pt-2 text-lg font-bold">
          <dt>Total</dt>
          <dd className="text-[var(--gm-yellow)]">{formatGBP(order.grandTotal)}</dd>
        </div>
      </dl>

      {order.shippingAddress ? (
        <section className="mt-8">
          <h2 className="gm-display text-lg text-[var(--gm-cyan)]">Shipping</h2>
          <p className="mt-2 text-sm text-[var(--gm-muted)]">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.postcode}
          </p>
        </section>
      ) : null}
    </div>
  );
}
