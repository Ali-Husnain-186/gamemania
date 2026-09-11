'use client';

import { Fragment, useEffect, useState, useTransition } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { apiDelete, apiGet, apiPatch, ApiError } from '@/lib/api';
import { notify } from '@/lib/toast';
import { formatGbp } from '@/lib/utils';
import { PageHeader, Panel } from '@/features/admin/components/page-shell';

type Address = {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  country: string;
  phone?: string | null;
};

type OrderItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Payment = {
  id: string;
  provider: string;
  status: string;
  amount: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  storeCreditApplied?: number;
  grandTotal: number;
  currency: string;
  notes?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  shippedAt?: string | null;
  createdAt: string;
  placedAt?: string | null;
  user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  items?: OrderItem[];
  payments?: Payment[];
  shippingAddress?: Address | null;
  billingAddress?: Address | null;
};

const STATUSES = [
  'PENDING',
  'AWAITING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

function formatAddress(addr?: Address | null): string {
  if (!addr) return '—';
  return [
    addr.fullName,
    addr.line1,
    addr.line2,
    [addr.city, addr.county].filter(Boolean).join(', '),
    addr.postcode,
    addr.country,
    addr.phone ? `Tel: ${addr.phone}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingDrafts, setTrackingDrafts] = useState<
    Record<string, { trackingNumber: string; trackingCarrier: string }>
  >({});

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<{ items: Order[] }>('/admin/orders?limit=50');
      const items = data.items ?? [];
      setOrders(items);
      setTrackingDrafts(
        Object.fromEntries(
          items.map((o) => [
            o.id,
            {
              trackingNumber: o.trackingNumber ?? '',
              trackingCarrier: o.trackingCarrier ?? 'Royal Mail',
            },
          ]),
        ),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateStatus(
    id: string,
    status: string,
    extras?: { trackingNumber?: string; trackingCarrier?: string },
  ) {
    startTransition(async () => {
      try {
        await apiPatch(`/admin/orders/${id}`, {
          status,
          ...(extras?.trackingNumber !== undefined
            ? { trackingNumber: extras.trackingNumber || null }
            : {}),
          ...(extras?.trackingCarrier !== undefined
            ? { trackingCarrier: extras.trackingCarrier || 'Royal Mail' }
            : {}),
        });
        notify.success(
          status === 'SHIPPED' && extras?.trackingNumber
            ? 'Shipped — customer emailed with tracking'
            : 'Order status updated',
        );
        await load();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Update failed';
        setError(message);
        notify.error(message);
      }
    });
  }

  function onStatusChange(order: Order, nextStatus: string) {
    const draft = trackingDrafts[order.id] ?? {
      trackingNumber: order.trackingNumber ?? '',
      trackingCarrier: order.trackingCarrier ?? 'Royal Mail',
    };

    if (nextStatus === 'SHIPPED') {
      const tracking = window.prompt(
        'Royal Mail tracking number (from Click & Drop).\nCustomer will get an email with this tracking link.',
        draft.trackingNumber || '',
      );
      if (tracking === null) return; // cancelled
      const trimmed = tracking.trim();
      if (!trimmed) {
        const okNoTrack = window.confirm(
          'No tracking number entered. Mark as SHIPPED anyway? (You can add tracking later.)',
        );
        if (!okNoTrack) return;
      }
      updateStatus(order.id, 'SHIPPED', {
        trackingNumber: trimmed,
        trackingCarrier: draft.trackingCarrier || 'Royal Mail',
      });
      return;
    }

    updateStatus(order.id, nextStatus);
  }

  function saveTracking(order: Order) {
    const draft = trackingDrafts[order.id];
    if (!draft?.trackingNumber.trim()) {
      notify.error('Enter a tracking number first');
      return;
    }
    updateStatus(order.id, order.status === 'SHIPPED' ? 'SHIPPED' : 'SHIPPED', {
      trackingNumber: draft.trackingNumber.trim(),
      trackingCarrier: draft.trackingCarrier.trim() || 'Royal Mail',
    });
  }

  function resendEmails(order: Order) {
    if (
      !window.confirm(
        `Resend ${order.status} emails for ${order.orderNumber}?\n\nSends to:\n• Customer (${order.email})\n• info@gamemaniaauk.co.uk\n• husnain.code@gmail.com`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await apiPatch(`/admin/orders/${order.id}`, {
          status: order.status,
          resendEmails: true,
          trackingNumber: order.trackingNumber ?? undefined,
          trackingCarrier: order.trackingCarrier ?? undefined,
        });
        notify.success('Emails resent to customer + owners');
        await load();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Resend failed';
        setError(message);
        notify.error(message);
      }
    });
  }

  function remove(id: string, orderNumber: string) {
    if (!window.confirm(`Delete order ${orderNumber}? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await apiDelete(`/admin/orders/${id}`);
        notify.success('Order deleted');
        await load();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Delete failed';
        setError(message);
        notify.error(message);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Full order details, shipping address, and Royal Mail tracking emails when you mark orders shipped."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <Panel className="overflow-hidden">
        {loading ? (
          <p className="flex justify-center p-8">
            <BrandLoader variant="inline" size="sm" label="Loading…" showWordmark={false} />
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-muted)]">
                  <th className="px-3 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Shipping address</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Items</th>
                  <th className="px-3 py-3 font-medium">Totals</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <th className="px-3 py-3 font-medium">Tracking</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Placed</th>
                  <th className="px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-[var(--admin-muted)]">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const name = [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' ');
                    const shipName = o.shippingAddress?.fullName;
                    const itemsSummary =
                      o.items && o.items.length
                        ? o.items.map((i) => `${i.name} ×${i.quantity}`).join('; ')
                        : '—';
                    const paymentSummary =
                      o.payments && o.payments.length
                        ? o.payments
                            .map((p) => `${p.provider} ${p.status} (${formatGbp(p.amount)})`)
                            .join('; ')
                        : '—';

                    return (
                      <Fragment key={o.id}>
                        <tr className="border-b border-[var(--admin-border)]/70 align-top last:border-0">
                          <td className="px-3 py-3 font-mono text-xs">
                            <button
                              type="button"
                              className="text-left text-[var(--admin-accent)] hover:underline"
                              onClick={() => setExpandedId((id) => (id === o.id ? null : o.id))}
                            >
                              {o.orderNumber}
                            </button>
                          </td>
                          <td className="break-all px-3 py-3 text-xs">{o.email}</td>
                          <td className="px-3 py-3 text-xs">
                            {shipName || name || o.user?.email || '—'}
                          </td>
                          <td className="max-w-[220px] whitespace-pre-line px-3 py-3 text-xs text-[var(--admin-muted)]">
                            {formatAddress(o.shippingAddress)}
                          </td>
                          <td className="px-3 py-3 text-xs">{o.shippingAddress?.phone || '—'}</td>
                          <td
                            className="max-w-[200px] px-3 py-3 text-xs text-[var(--admin-muted)]"
                            title={itemsSummary}
                          >
                            {itemsSummary}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs">
                            <div>{formatGbp(o.grandTotal)}</div>
                            <div className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                              Sub {formatGbp(o.subtotal)}
                              {o.shippingTotal ? ` · Ship ${formatGbp(o.shippingTotal)}` : ''}
                              {o.discountTotal ? ` · Disc −${formatGbp(o.discountTotal)}` : ''}
                            </div>
                          </td>
                          <td className="max-w-[140px] px-3 py-3 text-[10px] text-[var(--admin-muted)]">
                            {paymentSummary}
                          </td>
                          <td className="max-w-[150px] px-3 py-3 font-mono text-[10px]">
                            {o.trackingNumber ? (
                              <div>
                                <div>{o.trackingNumber}</div>
                                <div className="text-[var(--admin-muted)]">
                                  {o.trackingCarrier || 'Royal Mail'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[var(--admin-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <select
                              className="rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1 text-xs"
                              value={o.status}
                              disabled={pending}
                              onChange={(e) => onStatusChange(o, e.target.value)}
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-[var(--admin-muted)]">
                            {new Date(o.placedAt || o.createdAt).toLocaleString('en-GB')}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                className="text-xs text-[var(--admin-accent)] hover:underline disabled:opacity-50"
                                disabled={pending}
                                onClick={() => resendEmails(o)}
                              >
                                Resend emails
                              </button>
                              <button
                                type="button"
                                className="text-sm text-[var(--admin-danger)] hover:underline disabled:opacity-50"
                                disabled={pending}
                                onClick={() => remove(o.id, o.orderNumber)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === o.id ? (
                          <tr className="border-b border-[var(--admin-border)]/70 bg-black/20">
                            <td colSpan={12} className="px-4 py-4">
                              <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                                    Items
                                  </p>
                                  <ul className="space-y-1 text-xs">
                                    {(o.items ?? []).map((i) => (
                                      <li key={i.id}>
                                        <span className="font-medium">{i.name}</span>
                                        <span className="text-[var(--admin-muted)]">
                                          {' '}
                                          · {i.sku} · ×{i.quantity} · {formatGbp(i.lineTotal)}
                                        </span>
                                      </li>
                                    ))}
                                    {!o.items?.length ? (
                                      <li className="text-[var(--admin-muted)]">No items</li>
                                    ) : null}
                                  </ul>
                                </div>
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                                    Shipping
                                  </p>
                                  <pre className="whitespace-pre-wrap font-sans text-xs text-[var(--admin-muted)]">
                                    {formatAddress(o.shippingAddress)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                                    Notes / payment
                                  </p>
                                  <p className="text-xs text-[var(--admin-muted)]">
                                    {o.notes?.trim() || 'No notes'}
                                  </p>
                                  <p className="mt-2 text-xs text-[var(--admin-muted)]">
                                    {paymentSummary}
                                  </p>
                                </div>
                                <div>
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-muted)]">
                                    Royal Mail tracking
                                  </p>
                                  <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
                                    Paste tracking from{' '}
                                    <a
                                      href="https://business.parcel.royalmail.com/"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[var(--admin-accent)] underline"
                                    >
                                      Click &amp; Drop
                                    </a>
                                    . Customer is emailed with track link.
                                  </p>
                                  <label className="mb-2 block text-[10px] text-[var(--admin-muted)]">
                                    Carrier
                                    <input
                                      className="mt-1 w-full rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 text-xs text-white"
                                      value={
                                        trackingDrafts[o.id]?.trackingCarrier ??
                                        o.trackingCarrier ??
                                        'Royal Mail'
                                      }
                                      onChange={(e) =>
                                        setTrackingDrafts((prev) => ({
                                          ...prev,
                                          [o.id]: {
                                            trackingNumber:
                                              prev[o.id]?.trackingNumber ?? o.trackingNumber ?? '',
                                            trackingCarrier: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </label>
                                  <label className="mb-2 block text-[10px] text-[var(--admin-muted)]">
                                    Tracking number
                                    <input
                                      className="mt-1 w-full rounded border border-[var(--admin-border)] bg-black/20 px-2 py-1.5 font-mono text-xs text-white"
                                      placeholder="e.g. AB123456789GB"
                                      value={
                                        trackingDrafts[o.id]?.trackingNumber ??
                                        o.trackingNumber ??
                                        ''
                                      }
                                      onChange={(e) =>
                                        setTrackingDrafts((prev) => ({
                                          ...prev,
                                          [o.id]: {
                                            trackingCarrier:
                                              prev[o.id]?.trackingCarrier ??
                                              o.trackingCarrier ??
                                              'Royal Mail',
                                            trackingNumber: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() => saveTracking(o)}
                                    className="rounded-md bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                                  >
                                    Save &amp; email customer
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
