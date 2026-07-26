'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { apiGet, apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';
import { ErrorState } from '@/components/shared/error-state';

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => apiGet<Product>(`/products/${params.slug}`),
  });

  const addMutation = useMutation({
    mutationFn: (productId: string) => apiPost<Cart>('/cart/items', { productId, quantity: 1 }),
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: (productId: string) => apiPost('/wishlist', { productId }),
  });

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
  const image = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]">
          {image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText ?? product.name}
              className="h-full w-full object-cover"
            />
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
          {addMutation.isSuccess ? (
            <p className="mt-3 text-sm text-[var(--gm-accent)]">
              Added to cart.{' '}
              <Link href="/cart" className="font-bold underline">
                View cart
              </Link>{' '}
              or{' '}
              <Link href="/checkout" className="font-bold underline">
                checkout
              </Link>
              .
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
