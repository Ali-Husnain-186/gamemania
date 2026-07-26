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

type OrderStatus = {
  orderNumber: string;
  status: string;
  paid: boolean;
  awaitingPayment: boolean;
  cancelled: boolean;
  grandTotalPence: number;
  email: string;
  canRetryPayment: boolean;
  paymentStatus: string | null;
};

type ConfirmationState = {
  orderNumber: string;
  title: string;
  message: string;
  paid: boolean;
  canRetry: boolean;
  email?: string;
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
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [shipping, setShipping] = useState<ShippingForm>(emptyShipping);
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);

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

  useEffect(() => {
    const paidFlag = searchParams.get('paid') === '1';
    const cancelledFlag = searchParams.get('cancelled') === '1';
    const orderNumber = searchParams.get('order');
    const emailParam = searchParams.get('email') ?? undefined;

    if (cancelledFlag) {
      setInfo('Payment was cancelled. Your order is waiting — you can complete payment below.');
      if (orderNumber) {
        setConfirmation({
          orderNumber,
          title: 'Payment pending',
          message: 'No charge was made. Complete payment to confirm your order.',
          paid: false,
          canRetry: true,
          email: emailParam,
        });
      }
      return;
    }

    if (!paidFlag || !orderNumber) return;

    setVerifying(true);
    void (async () => {
      try {
        const qs = emailParam ? `?email=${encodeURIComponent(emailParam)}` : '';
        const status = await apiGet<OrderStatus>(
          `/checkout/orders/${encodeURIComponent(orderNumber)}${qs}`,
        );

        if (status.paid) {
          setConfirmation({
            orderNumber: status.orderNumber,
            title: 'Payment successful',
            message: 'Thank you — your order is confirmed.',
            paid: true,
            canRetry: false,
            email: status.email,
          });
        } else if (status.cancelled) {
          setConfirmation({
            orderNumber: status.orderNumber,
            title: 'Order cancelled',
            message: 'This payment session expired. Please start checkout again from your cart.',
            paid: false,
            canRetry: false,
            email: status.email,
          });
        } else {
          setConfirmation({
            orderNumber: status.orderNumber,
            title: 'Payment pending',
            message:
              'We’re confirming your payment. If you completed the card payment, this usually updates within a few seconds — you can refresh or retry below.',
            paid: false,
            canRetry: status.canRetryPayment,
            email: status.email,
          });
        }
      } catch {
        setConfirmation({
          orderNumber,
          title: 'Payment pending',
          message:
            'We could not verify payment yet. If you paid, please wait a moment and refresh, or contact support with your order reference.',
          paid: false,
          canRetry: Boolean(orderNumber),
          email: emailParam,
        });
      } finally {
        setVerifying(false);
      }
    })();
  }, [searchParams]);

  function updateField<K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) {
    setSavedAddressId(null);
    setShipping((s) => ({ ...s, [key]: value }));
  }

  function retryPayment(orderNumber: string, orderEmail?: string) {
    startTransition(async () => {
      try {
        setError(null);
        const data = await apiPost<{ checkoutUrl?: string | null; paymentMessage?: string }>(
          `/checkout/orders/${encodeURIComponent(orderNumber)}/pay`,
          { email: orderEmail || email.trim().toLowerCase() || undefined },
        );
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        setError(data.paymentMessage ?? 'Could not start secure payment.');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not start secure payment');
      }
    });
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
          paid?: boolean;
        }>('/checkout', payload);

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        if (data.paid || (preview && preview.grandTotalPence <= 0)) {
          setConfirmation({
            orderNumber: data.order.orderNumber,
            title: 'Order confirmed',
            message: data.paymentMessage ?? 'Order confirmed — no card payment needed.',
            paid: true,
            canRetry: false,
            email: email.trim().toLowerCase(),
          });
          return;
        }

        setError(
          data.paymentMessage ??
            'Could not open secure payment. Please try again or contact support.',
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not place order');
      }
    });
  }

  if (verifying) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="gm-display text-3xl text-[var(--gm-yellow)]">Confirming payment…</p>
        <p className="mt-3 text-sm text-[var(--gm-muted)]">
          Just a moment while we verify your order.
        </p>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="gm-display text-3xl text-[var(--gm-yellow)]">{confirmation.title}</p>
        <p className="mt-3 text-[var(--gm-muted)]">
          Reference{' '}
          <span className="font-semibold text-[var(--gm-fg)]">{confirmation.orderNumber}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--gm-muted)]">{confirmation.message}</p>
        {error ? (
          <p
            className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {confirmation.canRetry ? (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              disabled={pending}
              onClick={() => retryPayment(confirmation.orderNumber, confirmation.email)}
            >
              <CreditCard className="h-4 w-4" />
              {pending ? 'Opening payment…' : 'Complete payment'}
            </button>
          ) : null}
          <Link href="/shop" className="btn-cyan-outline inline-flex">
            Continue shopping
          </Link>
          {confirmation.paid && isAuthenticated ? (
            <Link
              href={`/account/orders/${confirmation.orderNumber}`}
              className="btn-cyan-outline inline-flex"
            >
              View order
            </Link>
          ) : null}
        </div>
        {!isAuthenticated && confirmation.paid ? (
          <p className="mt-6 text-xs text-[var(--gm-muted)]">
            Want to track orders faster next time?{' '}
            <Link href="/login" className="text-[var(--gm-cyan)] underline">
              Sign in
            </Link>{' '}
            or use the email on your order for support.
          </p>
        ) : null}
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
        {isAuthenticated
          ? 'Review your details and pay securely.'
          : 'Checking out as a guest — no account required.'}
      </p>
      {!isAuthenticated ? (
        <p className="mt-2 text-xs text-[var(--gm-muted)]">
          Have an account?{' '}
          <Link href="/login?returnUrl=/checkout" className="text-[var(--gm-cyan)] underline">
            Sign in for faster checkout
          </Link>
        </p>
      ) : null}

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
          <p className="mt-1">
            You’ll pay on Stripe’s secure next screen. We never store full card details.
          </p>
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
