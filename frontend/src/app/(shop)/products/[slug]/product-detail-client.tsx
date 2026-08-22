'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost, getAccessToken } from '@/lib/api';
import { TradeValueBlock } from '@/features/catalog/trade-value-block';
import { formatGBP } from '@/lib/format';
import { getProductWarranty } from '@/lib/product-warranty';
import { notify } from '@/lib/toast';
import { useCartStore } from '@/stores/cart-store';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';
import { ErrorState } from '@/components/shared/error-state';
import { BrandLoader } from '@/components/ui/brand-loader';

export function ProductDetailClient() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [tradeMethod, setTradeMethod] = useState<'STORE_CREDIT' | 'CASH'>('STORE_CREDIT');

  const productQuery = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => apiGet<Product>(`/products/${params.slug}`),
  });

  const siblingSlug = useMemo(() => {
    const slug = params.slug ?? '';
    if (slug.endsWith('-new')) return `${slug.slice(0, -4)}-used`;
    if (slug.endsWith('-used')) return `${slug.slice(0, -5)}-new`;
    return null;
  }, [params.slug]);

  const siblingQuery = useQuery({
    queryKey: ['product', siblingSlug],
    queryFn: () => apiGet<Product>(`/products/${siblingSlug}`),
    enabled: Boolean(siblingSlug),
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => apiPost<Cart>('/cart/items', { productId, quantity: 1 }),
    onSuccess: (cart) => {
      setCart(cart);
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      notify.success('Added to cart');
      router.push('/cart');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Could not add to cart';
      notify.error(message);
    },
  });

  const tradeMutation = useMutation({
    mutationFn: (productId: string) =>
      apiPost<Cart>('/cart/items', {
        productId,
        quantity: 1,
        isTradeIn: true,
        tradePayoutMethod: tradeMethod,
      }),
    onSuccess: (cart) => {
      setCart(cart);
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      notify.success('Trade-in added to cart');
      router.push('/cart');
    },
    onError: () => notify.error('Could not add trade-in'),
  });

  const wishlistMutation = useMutation({
    mutationFn: (productId: string) => apiPost('/wishlist', { productId }),
    onSuccess: () => notify.success('Saved to wishlist'),
    onError: () => {
      if (!getAccessToken()) notify.info('Sign in to save wishlist items');
      else notify.error('Could not save to wishlist');
    },
  });

  const gallery = useMemo(() => {
    const images = productQuery.data?.images ?? [];
    if (!images.length) return [];
    return [...images]
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      })
      .slice(0, 4);
  }, [productQuery.data?.images]);

  const primary = gallery.find((i) => i.isPrimary) ?? gallery[0];
  const mainUrl = activeUrl ?? primary?.url ?? null;
  const mainImage = gallery.find((i) => i.url === mainUrl) ?? primary;
  const thumbs = gallery.filter((img) => img.url && img.url !== mainUrl).slice(0, 3);

  if (productQuery.isLoading) {
    return <BrandLoader variant="page" size="md" label="Loading product…" />;
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState message="Product not found. Please try again." />
      </div>
    );
  }

  const product = productQuery.data;
  const warranty = getProductWarranty(product);
  const hasTradeIn =
    (product.tradeInCashPence != null && product.tradeInCashPence > 0) ||
    (product.tradeInCreditPence != null && product.tradeInCreditPence > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-[var(--gm-border)] bg-white">
            {mainImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.url}
                alt={mainImage.altText ?? product.name}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
          {thumbs.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {thumbs.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setActiveUrl(img.url)}
                  className="aspect-square overflow-hidden rounded-md border border-[var(--gm-border)] bg-white transition hover:ring-2 hover:ring-[var(--gm-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gm-accent)]"
                  aria-label="View product image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText ?? product.name}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--gm-muted)]">
            {product.category?.name ?? product.platform ?? product.brand?.name}
          </p>
          <h1 className="gm-display mt-2 text-3xl font-bold md:text-4xl">
            {product.name.replace(/\s*\((New|Used)\)\s*$/i, '')}
          </h1>

          {siblingQuery.data ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
                Condition
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(product.condition === 'NEW' || siblingQuery.data.condition === 'NEW') && (
                  <button
                    type="button"
                    onClick={() => {
                      const target =
                        product.condition === 'NEW'
                          ? product.slug
                          : siblingQuery.data.condition === 'NEW'
                            ? siblingQuery.data.slug
                            : null;
                      if (target && target !== product.slug) router.push(`/products/${target}`);
                    }}
                    className={
                      product.condition === 'NEW'
                        ? 'rounded-full bg-[var(--gm-yellow)] px-4 py-2 text-xs font-extrabold text-black'
                        : 'rounded-full border border-[var(--gm-border)] px-4 py-2 text-xs font-bold text-[var(--gm-muted)]'
                    }
                  >
                    New
                    {product.condition === 'NEW'
                      ? ` · ${formatGBP(product.price)}`
                      : siblingQuery.data.condition === 'NEW'
                        ? ` · ${formatGBP(siblingQuery.data.price)}`
                        : ''}
                  </button>
                )}
                {(product.condition !== 'NEW' || siblingQuery.data.condition !== 'NEW') && (
                  <button
                    type="button"
                    onClick={() => {
                      const target =
                        product.condition !== 'NEW'
                          ? product.slug
                          : siblingQuery.data.condition !== 'NEW'
                            ? siblingQuery.data.slug
                            : null;
                      if (target && target !== product.slug) router.push(`/products/${target}`);
                    }}
                    className={
                      product.condition !== 'NEW'
                        ? 'rounded-full bg-[var(--gm-magenta)] px-4 py-2 text-xs font-extrabold text-white'
                        : 'rounded-full border border-[var(--gm-border)] px-4 py-2 text-xs font-bold text-[var(--gm-muted)]'
                    }
                  >
                    Pre-owned
                    {product.condition !== 'NEW'
                      ? ` · ${formatGBP(product.price)}`
                      : siblingQuery.data.condition !== 'NEW'
                        ? ` · ${formatGBP(siblingQuery.data.price)}`
                        : ''}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {product.isPreorder && product.condition === 'NEW' ? (
            <p className="mt-2 inline-flex rounded bg-[var(--gm-magenta)] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
              Pre-order
            </p>
          ) : null}
          <p className="mt-4 text-2xl font-semibold text-[var(--gm-accent)]">
            {formatGBP(product.price)}
          </p>

          <TradeValueBlock
            cashPence={product.tradeInCashPence}
            creditPence={product.tradeInCreditPence}
          />

          <p className="mt-4 text-[var(--gm-muted)]">
            {product.shortDescription ?? product.description ?? 'Premium gaming product.'}
          </p>

          {/* Trust details — Condition / Included / Warranty / Dispatch */}
          <dl className="mt-5 grid gap-3 rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--gm-muted)]">
                Condition
              </dt>
              <dd className="mt-1 font-semibold text-[var(--gm-fg)]">
                {product.condition === 'NEW' ? 'Brand new · Boxed' : 'Pre-owned · Unboxed / tested'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--gm-muted)]">
                What’s included
              </dt>
              <dd className="mt-1 font-semibold text-[var(--gm-fg)]">
                {product.condition === 'NEW'
                  ? 'Original packaging where supplied by manufacturer'
                  : 'Console/item as listed · necessary cables where stated in description'}
              </dd>
            </div>
            {warranty.detail ? (
              <div>
                <dt className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--gm-muted)]">
                  Warranty
                </dt>
                <dd className="mt-1 font-semibold text-[var(--gm-fg)]">{warranty.detail}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--gm-muted)]">
                Dispatch time
              </dt>
              <dd className="mt-1 font-semibold text-[var(--gm-fg)]">
                {product.isPreorder && product.condition === 'NEW'
                  ? 'Ships on/after release date'
                  : '1–2 working days'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--gm-muted)]">
                Real photos
              </dt>
              <dd className="mt-1 text-[var(--gm-muted)]">
                Gallery images show this product (or matching retail stock). Add more detail anytime
                in Admin → Products description (e.g. “boxed”, “unboxed”, accessories).
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={addMutation.isPending || (product.stock ?? 0) < 1}
              onClick={() => addMutation.mutate(product.id)}
              className="rounded-md bg-[var(--gm-accent)] px-6 py-3 text-sm font-semibold text-[#042016] disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding…' : 'Add to cart'}
            </button>
            <button
              type="button"
              disabled={wishlistMutation.isPending}
              onClick={() => {
                if (!getAccessToken()) {
                  window.location.href = '/login';
                  return;
                }
                wishlistMutation.mutate(product.id);
              }}
              className="rounded-md border border-[var(--gm-border)] px-6 py-3 text-sm font-semibold"
            >
              {wishlistMutation.isSuccess ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          {hasTradeIn ? (
            <div className="mt-6 rounded-xl border border-[var(--gm-cyan)]/30 bg-[var(--gm-bg-elevated)] p-4">
              <p className="text-sm font-bold">Trade this game to us</p>
              <p className="mt-1 text-xs text-[var(--gm-muted)]">
                Add as a trade-in, fill your details at checkout — we email a pre-printed postage
                label to our address.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={tradeMethod === 'STORE_CREDIT'}
                    onChange={() => setTradeMethod('STORE_CREDIT')}
                  />
                  Store credit
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={tradeMethod === 'CASH'}
                    onChange={() => setTradeMethod('CASH')}
                  />
                  Cash
                </label>
              </div>
              <button
                type="button"
                disabled={tradeMutation.isPending}
                onClick={() => tradeMutation.mutate(product.id)}
                className="btn-cyan mt-4 inline-flex px-5 py-2.5 text-sm font-bold"
              >
                {tradeMutation.isPending ? 'Adding…' : 'Trade to us'}
              </button>
              {tradeMutation.isError ? (
                <p className="mt-2 text-xs text-[var(--gm-danger)]">
                  {tradeMutation.error instanceof Error
                    ? tradeMutation.error.message
                    : 'Could not add trade-in'}
                </p>
              ) : null}
            </div>
          ) : null}

          {addMutation.isPending ? (
            <p className="mt-3 text-sm text-[var(--gm-accent)]">Taking you to checkout…</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
