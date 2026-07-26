'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';
import { ErrorState } from '@/components/shared/error-state';

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => apiGet<Product>(`/products/${params.slug}`),
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => apiPost<Cart>('/cart/items', { productId, quantity: 1 }),
    onSuccess: (cart) => {
      setCart(cart);
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.push('/checkout');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: (productId: string) => apiPost('/wishlist', { productId }),
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
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="aspect-square animate-pulse rounded-lg bg-[var(--gm-bg-elevated)]" />
      </div>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState message="Product not found. Please try again." />
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]">
            {mainImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.url}
                alt={mainImage.altText ?? product.name}
                className="h-full w-full object-cover"
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
                  className="aspect-square overflow-hidden rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] transition hover:ring-2 hover:ring-[var(--gm-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gm-accent)]"
                  aria-label="View product image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText ?? product.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--gm-muted)]">
            {product.platform ?? product.brand?.name}
          </p>
          <h1 className="gm-display mt-2 text-3xl font-bold md:text-4xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold text-[var(--gm-accent)]">
            {formatGBP(product.price)}
          </p>
          <p className="mt-4 text-[var(--gm-muted)]">
            {product.shortDescription ?? product.description ?? 'Premium gaming product.'}
          </p>
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
          {addMutation.isPending ? (
            <p className="mt-3 text-sm text-[var(--gm-accent)]">Taking you to checkout…</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
