'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';
import type { Cart } from '@/types/cart';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { BrandLoader } from '@/components/ui/brand-loader';

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
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiGet<WishlistRow[]>('/wishlist'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => apiDelete<WishlistRow[]>(`/wishlist/${productId}`),
    onSuccess: (data) => queryClient.setQueryData(['wishlist'], data),
  });

  const addCartMutation = useMutation({
    mutationFn: (productId: string) => apiPost<Cart>('/cart/items', { productId, quantity: 1 }),
    onSuccess: (cart) => {
      setCart(cart);
      window.location.assign('/checkout');
    },
  });

  return (
    <div>
      <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Wishlist</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">Titles you are watching.</p>

      {listQuery.isLoading ? (
        <BrandLoader
          variant="page"
          size="sm"
          label="Loading wishlist…"
          className="!min-h-[30vh] !py-10"
        />
      ) : listQuery.isError ? (
        <div className="mt-8">
          <ErrorState message="Could not load wishlist." onRetry={() => void listQuery.refetch()} />
        </div>
      ) : !listQuery.data?.length ? (
        <div className="mt-8">
          <EmptyState
            title="Wishlist is empty"
            description="Tap the heart on a product to save it."
          />
          <Link href="/shop" className="mt-6 inline-block text-sm font-bold text-[var(--gm-cyan)]">
            Browse shop →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {listQuery.data.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[var(--gm-border)] bg-black/40 p-4"
            >
              <div>
                <Link
                  href={`/products/${row.product.slug}`}
                  className="font-semibold hover:text-[var(--gm-cyan)] gm-focus rounded-sm"
                >
                  {row.product.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--gm-yellow)]">
                  {formatGBP(row.product.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addCartMutation.mutate(row.productId)}
                  className="btn-primary px-3 py-1.5 text-xs"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(row.productId)}
                  className="rounded-md border border-[var(--gm-border)] px-3 py-1.5 text-xs font-bold uppercase"
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
