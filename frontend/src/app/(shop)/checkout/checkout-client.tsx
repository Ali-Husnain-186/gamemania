'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { formatGbpFromPence } from '@/lib/money';

type Address = {
  id: string;
  line1: string;
  city: string;
  postcode: string;
  isDefault: boolean;
};

type Preview = {
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  storeCreditApplied: number;
  pointsValuePence: number;
  grandTotalPence: number;
  freeShipping: boolean;
  lineItems: Array<{ name: string; quantity: number; lineTotalPence: number }>;
};

export function CheckoutClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ orderNumber: string; message?: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const list = await apiGet<Address[]>('/users/me/addresses');
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setAddressId(def.id);
      } catch {
        setError('Sign in and add a delivery address to checkout.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!addressId) return;
    startTransition(async () => {
      try {
        setError(null);
        const data = await apiPost<Preview>('/checkout/preview', {
          shippingAddressId: addressId,
          couponCode: couponCode || undefined,
          country: 'GB',
        });
        setPreview(data);
      } catch (err) {
        setPreview(null);
        setError(err instanceof ApiError ? err.message : 'Preview failed');
      }
    });
  }, [addressId, couponCode]);

  function placeOrder() {
    if (!addressId) return;
    startTransition(async () => {
      try {
        setError(null);
        const data = await apiPost<{
          order: { orderNumber: string };
          checkoutUrl?: string | null;
          paymentMessage?: string;
        }>('/checkout', {
          shippingAddressId: addressId,
          couponCode: couponCode || undefined,
          country: 'GB',
        });
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        setPlaced({
          orderNumber: data.order.orderNumber,
          message: data.paymentMessage,
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not place order');
      }
    });
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="font-display text-3xl text-[var(--gm-ink)]">Order placed</p>
        <p className="mt-3 text-[var(--gm-muted)]">
          Reference <span className="font-semibold text-[var(--gm-ink)]">{placed.orderNumber}</span>
        </p>
        {placed.message ? (
          <p className="mt-2 text-sm text-[var(--gm-muted)]">{placed.message}</p>
        ) : null}
        <Link href="/account/orders" className="btn-primary mt-8 inline-flex">
          View orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-[var(--gm-ink)]">Checkout</h1>
      <p className="mt-2 text-[var(--gm-muted)]">Review shipping, coupon, and place your order.</p>

      {error ? (
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}{' '}
          {!addresses.length ? (
            <button type="button" className="underline" onClick={() => router.push('/account')}>
              Account
            </button>
          ) : null}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <label className="block text-sm">
          <span className="font-medium text-[var(--gm-ink)]">Delivery address</span>
          <select
            className="mt-1 w-full rounded-xl border border-[var(--gm-line)] bg-white px-3 py-2.5"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
          >
            <option value="">Select address</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city} {a.postcode}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[var(--gm-ink)]">Coupon</span>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--gm-line)] bg-white px-3 py-2.5 uppercase"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="GAMEMANIA10"
          />
        </label>

        {preview ? (
          <div className="rounded-2xl border border-[var(--gm-line)] bg-white/80 p-5 text-sm">
            <ul className="space-y-2">
              {preview.lineItems.map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatGbpFromPence(item.lineTotalPence)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-[var(--gm-line)] pt-4 text-[var(--gm-muted)]">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatGbpFromPence(preview.subtotalPence)}</dd>
              </div>
              {preview.discountPence > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount</dt>
                  <dd>−{formatGbpFromPence(preview.discountPence)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{preview.freeShipping ? 'Free' : formatGbpFromPence(preview.shippingPence)}</dd>
              </div>
              <div className="flex justify-between font-display text-lg text-[var(--gm-ink)]">
                <dt>Total</dt>
                <dd>{formatGbpFromPence(preview.grandTotalPence)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <button
          type="button"
          className="btn-primary w-full disabled:opacity-50"
          disabled={pending || !addressId || !preview}
          onClick={placeOrder}
        >
          {pending ? 'Working…' : 'Place order'}
        </button>
      </div>
    </div>
  );
}
