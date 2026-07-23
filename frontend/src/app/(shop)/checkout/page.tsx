'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { ErrorState } from '@/components/shared/error-state';

type CheckoutPreview = {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  storeCreditApplied: number;
  pointsValue: number;
  grandTotalPence: number;
  freeShipping: boolean;
};

type CheckoutResult = {
  order: { orderNumber: string; grandTotal: number; status: string };
  paymentMessage?: string;
  checkoutUrl?: string | null;
};

export default function CheckoutPage() {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const [couponCode, setCouponCode] = useState('');
  const [useStoreCredit, setUseStoreCredit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    enabled: Boolean(token),
    queryFn: () =>
      apiGet<
        Array<{
          id: string;
          fullName: string;
          line1: string;
          city: string;
          postcode: string;
          isDefault: boolean;
        }>
      >('/users/me/addresses'),
    retry: false,
  });

  const previewQuery = useQuery({
    queryKey: ['checkout-preview', couponCode, useStoreCredit],
    enabled: Boolean(token),
    queryFn: () =>
      apiPost<CheckoutPreview>('/checkout/preview', {
        couponCode: couponCode || undefined,
        useStoreCredit,
        country: 'GB',
      }),
    retry: false,
  });

  const placeMutation = useMutation({
    mutationFn: async () => {
      const addresses = addressesQuery.data ?? [];
      const shippingAddressId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;
      if (!shippingAddressId) {
        throw new Error('Add a shipping address in Account first (or create one via API).');
      }
      return apiPost<CheckoutResult>('/checkout', {
        shippingAddressId,
        couponCode: couponCode || undefined,
        useStoreCredit,
      });
    },
    onSuccess: (data) => {
      setMessage(
        data.paymentMessage ??
          `Order ${data.order.orderNumber} created (${data.order.status}). Total ${formatGBP(data.order.grandTotal)}.`,
      );
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Checkout failed'),
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gm-display text-3xl font-bold">Checkout</h1>
        <p className="mt-3 text-[var(--gm-muted)]">Sign in to checkout.</p>
        <Link href="/login" className="mt-6 inline-flex text-[var(--gm-accent)]">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <h1 className="gm-display text-3xl font-bold">Checkout</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">Review totals and place your order.</p>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">Coupon</span>
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useStoreCredit}
            onChange={(e) => setUseStoreCredit(e.target.checked)}
          />
          Apply store credit
        </label>
      </div>

      {previewQuery.isError ? (
        <div className="mt-6">
          <ErrorState message="Checkout preview unavailable — API may still be deploying. Cart still works." />
        </div>
      ) : previewQuery.data ? (
        <dl className="mt-8 space-y-2 rounded-lg border border-[var(--gm-border)] p-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatGBP(previewQuery.data.subtotalPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>-{formatGBP(previewQuery.data.discountPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>
              {previewQuery.data.freeShipping ? 'Free' : formatGBP(previewQuery.data.shippingPence)}
            </dd>
          </div>
          <div className="flex justify-between text-lg font-semibold text-[var(--gm-accent)]">
            <dt>Total</dt>
            <dd>{formatGBP(previewQuery.data.grandTotalPence)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-6 text-sm text-[var(--gm-muted)]">Loading preview…</p>
      )}

      <p className="mt-4 text-xs text-[var(--gm-muted)]">
        Addresses: {addressesQuery.data?.length ?? 0} on file.
        {!addressesQuery.data?.length
          ? ' Demo tip: place order after adding an address (seed creates none — checkout API will guide).'
          : null}
      </p>

      <button
        type="button"
        disabled={placeMutation.isPending || !previewQuery.data}
        onClick={() => placeMutation.mutate()}
        className="mt-8 w-full rounded-md bg-[var(--gm-accent)] px-4 py-3 text-sm font-semibold text-[#042016] disabled:opacity-50"
      >
        {placeMutation.isPending ? 'Placing order…' : 'Place order'}
      </button>

      {message ? <p className="mt-4 text-sm text-[var(--gm-muted)]">{message}</p> : null}
      <Link href="/cart" className="mt-6 inline-block text-sm text-[var(--gm-accent)]">
        ← Back to cart
      </Link>
    </div>
  );
}
