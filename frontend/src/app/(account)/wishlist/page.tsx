'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';
import type { Cart } from '@/types/cart';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';

type WishlistRow = {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl?: string | null;
    status?: string;
  };
};

export default function WishlistPage() {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['wishlist'],
    enabled: Boolean(token),
    queryFn: () => apiGet<WishlistRow[]>('/wishlist'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => apiDelete<WishlistRow[]>(`/wishlist/${productId}`),
    onSuccess: (data) => queryClient.setQueryData(['wishlist'], data),
  });

  const addCartMutation = useMutation({
    mutationFn: (productId: string) => apiPost<Cart>('/cart/items', { productId, quantity: 1 }),
    onSuccess: (cart) => setCart(cart),
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="gm-display text-3xl font-bold">Wishlist</h1>
        <p className="mt-3 text-[var(--gm-muted)]">Sign in to save favourites across devices.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-[var(--gm-accent)] px-5 py-2.5 text-sm font-semibold text-[#042016]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="gm-display text-3xl font-bold">Wishlist</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">Titles you are watching.</p>

      {listQuery.isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--gm-bg-elevated)]" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <div className="mt-8">
          <ErrorState message="Could not load wishlist." />
        </div>
      ) : !listQuery.data?.length ? (
        <div className="mt-8">
          <EmptyState
            title="Wishlist is empty"
            description="Tap the heart on a product to save it."
          />
          <Link href="/shop" className="mt-6 inline-block text-sm text-[var(--gm-accent)]">
            Browse shop →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {listQuery.data.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/40 p-4"
            >
              <div>
                <Link
                  href={`/products/${row.product.slug}`}
                  className="font-semibold hover:text-[var(--gm-accent)]"
                >
                  {row.product.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--gm-accent)]">
                  {formatGBP(row.product.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addCartMutation.mutate(row.productId)}
                  className="rounded-md bg-[var(--gm-accent)] px-3 py-1.5 text-xs font-semibold text-[#042016]"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(row.productId)}
                  className="rounded-md border border-[var(--gm-border)] px-3 py-1.5 text-xs"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
