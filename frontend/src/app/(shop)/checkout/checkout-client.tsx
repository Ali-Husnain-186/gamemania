'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState, useTransition } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { formatGbpFromPence } from '@/lib/money';
import { useAuth } from '@/providers/auth-provider';

type SavedAddress = {
  id: string;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  postcode: string;
  phone?: string | null;
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

type ShippingForm = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  phone: string;
};

const emptyShipping: ShippingForm = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  postcode: '',
  phone: '',
};

export function CheckoutClient() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [pending, startTransition] = useTransition();
  const [couponCode, setCouponCode] = useState('');
  const [email, setEmail] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ orderNumber: string; message?: string } | null>(null);
  const [shipping, setShipping] = useState<ShippingForm>(emptyShipping);
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('cancelled') === '1') {
      setInfo('Payment was cancelled. You can try again when ready.');
    }
    const paidOrder = searchParams.get('order');
    if (searchParams.get('paid') === '1' && paidOrder) {
      setPlaced({
        orderNumber: paidOrder,
        message: 'Payment received — thank you for your order.',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    if (name) {
      setShipping((s) => (s.fullName ? s : { ...s, fullName: name }));
    }
  }, [user?.email, user?.firstName, user?.lastName]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const list = await apiGet<SavedAddress[]>('/users/me/addresses');
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (!def) return;
        setSavedAddressId(def.id);
        setShipping({
          fullName: def.fullName,
          line1: def.line1,
          line2: def.line2 ?? '',
          city: def.city,
          postcode: def.postcode,
          phone: def.phone ?? '',
        });
      } catch {
        // Guest can still type address
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
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
        setError(err instanceof ApiError ? err.message : 'Could not load cart totals');
      }
    });
  }, [couponCode]);

  function updateField<K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) {
    setSavedAddressId(null);
    setShipping((s) => ({ ...s, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (
      !shipping.fullName.trim() ||
      !shipping.line1.trim() ||
      !shipping.city.trim() ||
      !shipping.postcode.trim()
    ) {
      setError('Please fill in your delivery details.');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const payload: Record<string, unknown> = {
          email: email.trim().toLowerCase(),
          couponCode: couponCode || undefined,
          country: 'GB',
        };

        if (savedAddressId && isAuthenticated) {
          payload.shippingAddressId = savedAddressId;
        } else {
          payload.shipping = {
            fullName: shipping.fullName.trim(),
            line1: shipping.line1.trim(),
            line2: shipping.line2.trim() || undefined,
            city: shipping.city.trim(),
            postcode: shipping.postcode.trim().toUpperCase(),
            phone: shipping.phone.trim() || undefined,
            country: 'GB',
          };
        }

        const data = await apiPost<{
          order: { orderNumber: string };
          checkoutUrl?: string | null;
          paymentMessage?: string;
        }>('/checkout', payload);

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
        <p className="gm-display text-3xl text-[var(--gm-yellow)]">Order confirmed</p>
        <p className="mt-3 text-[var(--gm-muted)]">
          Reference <span className="font-semibold text-[var(--gm-fg)]">{placed.orderNumber}</span>
        </p>
        {placed.message ? (
          <p className="mt-2 text-sm text-[var(--gm-muted)]">{placed.message}</p>
        ) : null}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/shop" className="btn-primary inline-flex">
            Continue shopping
          </Link>
          {isAuthenticated ? (
            <Link
              href={`/account/orders/${placed.orderNumber}`}
              className="btn-cyan-outline inline-flex"
            >
              View order
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const payLabel =
    preview && preview.grandTotalPence <= 0
      ? pending
        ? 'Placing order…'
        : 'Complete order'
      : pending
        ? 'Opening payment…'
        : 'Pay securely';

  return (
    <div className="mx-auto max-w-3xl px-3 py-8 sm:px-6 sm:py-10">
      <h1 className="gm-display text-3xl text-[var(--gm-yellow)] sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)] sm:text-base">
        Enter your details and pay — no account required.
      </p>

      {info ? (
        <p className="mt-6 rounded-xl border border-[var(--gm-cyan)]/40 bg-[rgba(1,166,194,0.1)] px-4 py-3 text-sm text-[var(--gm-cyan)]">
          {info}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--gm-cyan)]">
            Contact
          </h2>
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@email.com"
            />
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--gm-cyan)]">
            Delivery
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Full name</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
                value={shipping.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Address line 1</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
                value={shipping.line1}
                onChange={(e) => updateField('line1', e.target.value)}
                autoComplete="address-line1"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Address line 2 (optional)</span>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
                value={shipping.line2}
                onChange={(e) => updateField('line2', e.target.value)}
                autoComplete="address-line2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">City</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
                value={shipping.city}
                onChange={(e) => updateField('city', e.target.value)}
                autoComplete="address-level2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Postcode</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 uppercase"
                value={shipping.postcode}
                onChange={(e) => updateField('postcode', e.target.value.toUpperCase())}
                autoComplete="postal-code"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Phone (optional)</span>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5"
                value={shipping.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                autoComplete="tel"
              />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--gm-cyan)]">
            Order
          </h2>
          <label className="block text-sm">
            <span className="font-medium">Coupon (optional)</span>
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
                  <dd>
                    {preview.freeShipping ? 'Free' : formatGbpFromPence(preview.shippingPence)}
                  </dd>
                </div>
                <div className="flex justify-between text-lg font-bold text-[var(--gm-fg)]">
                  <dt>Total</dt>
                  <dd className="text-[var(--gm-magenta)]">
                    {formatGbpFromPence(preview.grandTotalPence)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="h-28 animate-pulse rounded-2xl bg-[var(--gm-bg-elevated)]" />
          )}
        </section>

        <div className="rounded-2xl border border-[var(--gm-border)] bg-black/25 p-4 text-xs text-[var(--gm-muted)]">
          <p className="inline-flex items-center gap-2 font-semibold text-[var(--gm-cyan)]">
            <Lock className="h-3.5 w-3.5" />
            Secure card payment
          </p>
          <p className="mt-1">You’ll pay on the next screen. We never store full card details.</p>
        </div>

        <button
          type="submit"
          className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-50"
          disabled={pending || !preview}
        >
          <CreditCard className="h-4 w-4" />
          {payLabel}
        </button>

        <p className="text-center text-xs text-[var(--gm-muted)]">
          Need to change items?{' '}
          <Link href="/cart" className="text-[var(--gm-cyan)] underline">
            Back to cart
          </Link>
        </p>
      </form>
    </div>
  );
}
