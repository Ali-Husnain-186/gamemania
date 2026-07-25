'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { CreditCard, Lock } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ orderNumber: string; message?: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('cancelled') === '1') {
      setInfo('Payment was cancelled. You can try again when ready.');
    }
  }, [searchParams]);

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
          stripeEnabled?: boolean;
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
        <p className="gm-display text-3xl text-[var(--gm-yellow)]">Order placed</p>
        <p className="mt-3 text-[var(--gm-muted)]">
          Reference <span className="font-semibold text-[var(--gm-fg)]">{placed.orderNumber}</span>
        </p>
        {placed.message ? (
          <p className="mt-2 text-sm text-[var(--gm-muted)]">{placed.message}</p>
        ) : null}
        <Link
          href={`/account/orders/${placed.orderNumber}`}
          className="btn-primary mt-8 inline-flex"
        >
          View order
        </Link>
      </div>
    );
  }

  const payLabel =
    preview && preview.grandTotalPence <= 0
      ? 'Complete order'
      : pending
        ? 'Redirecting to Stripe…'
        : 'Pay securely with Stripe';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Checkout</h1>
      <p className="mt-2 text-[var(--gm-muted)]">
        Choose delivery, apply a code, then pay securely with Stripe.
      </p>

      {info ? (
        <p className="mt-6 rounded-xl border border-[var(--gm-cyan)]/40 bg-[var(--gm-cyan)]/10 px-4 py-3 text-sm text-[var(--gm-cyan)]">
          {info}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}{' '}
          {!addresses.length ? (
            <button
              type="button"
              className="underline"
              onClick={() => router.push('/account/addresses')}
            >
              Add address
            </button>
          ) : null}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <label className="block text-sm">
          <span className="font-medium">Delivery address</span>
          <select
            className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
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
          <span className="font-medium">Coupon</span>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 uppercase"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="GAMEMANIA10"
          />
        </label>

        {preview ? (
          <div className="rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/80 p-5 text-sm">
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
            <dl className="mt-4 space-y-1 border-t border-[var(--gm-border)] pt-4 text-[var(--gm-muted)]">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatGbpFromPence(preview.subtotalPence)}</dd>
              </div>
              {preview.discountPence > 0 ? (
                <div className="flex justify-between text-emerald-400">
                  <dt>Discount</dt>
                  <dd>−{formatGbpFromPence(preview.discountPence)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{preview.freeShipping ? 'Free' : formatGbpFromPence(preview.shippingPence)}</dd>
              </div>
              <div className="flex justify-between font-display text-lg text-[var(--gm-fg)]">
                <dt>Total</dt>
                <dd className="text-[var(--gm-magenta)]">
                  {formatGbpFromPence(preview.grandTotalPence)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--gm-border)] bg-black/25 p-4 text-xs text-[var(--gm-muted)]">
          <p className="inline-flex items-center gap-2 font-semibold text-[var(--gm-cyan)]">
            <Lock className="h-3.5 w-3.5" />
            Secure card payments by Stripe
          </p>
          <p className="mt-1">
            You’ll be redirected to Stripe’s secure checkout page (Visa, Mastercard, Apple Pay where
            available). We never store your full card details.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-50"
          disabled={pending || !addressId || !preview}
          onClick={placeOrder}
        >
          <CreditCard className="h-4 w-4" />
          {payLabel}
        </button>

        <p className="text-center text-xs text-[var(--gm-muted)]">
          By paying you agree to GAME MANIA terms. Need an address?{' '}
          <Link href="/account/addresses" className="text-[var(--gm-cyan)] underline">
            Manage addresses
          </Link>
        </p>
      </div>
    </div>
  );
}
