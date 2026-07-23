'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';
import type { Cart } from '@/types/cart';
import { EmptyState } from '@/components/shared/empty-state';

export default function CartPage() {
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cart = await apiGet<Cart>('/cart');
      setCart(cart);
      return cart;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      apiPatch<Cart>(`/cart/items/${id}`, { quantity }),
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(['cart'], cart);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiDelete<Cart>(`/cart/items/${id}`),
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(['cart'], cart);
    },
  });

  const cart = cartQuery.data;
  const remainingForFree = Math.max(0, 6000 - (cart?.subtotalPence ?? 0));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="gm-display text-3xl font-bold">Cart</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">
        {remainingForFree > 0
          ? `Add ${formatGBP(remainingForFree)} more for free UK shipping.`
          : 'You qualify for free UK shipping.'}
      </p>

      {cartQuery.isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--gm-bg-elevated)]" />
          ))}
        </div>
      ) : !cart?.items?.length ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Browse the shop and add something epic."
          />
          <Link href="/shop" className="mt-6 inline-block text-sm text-[var(--gm-accent)]">
            Continue shopping →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {cart.items.map((item) => {
            const product = item.product;
            const lineTotal = item.lineTotal ?? product.price * item.quantity;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/40 p-4"
              >
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-semibold hover:text-[var(--gm-accent)]"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--gm-muted)]">
                    {formatGBP(product.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(e) =>
                      updateMutation.mutate({ id: item.id, quantity: Number(e.target.value) || 1 })
                    }
                    className="w-16 rounded border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-1 text-sm"
                    aria-label={`Quantity for ${product.name}`}
                  />
                  <p className="w-20 text-right text-sm font-semibold">{formatGBP(lineTotal)}</p>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.id)}
                    className="text-xs text-[var(--gm-danger)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-[var(--gm-border)] pt-4">
            <p className="text-[var(--gm-muted)]">Subtotal</p>
            <p className="text-xl font-semibold text-[var(--gm-accent)]">
              {formatGBP(cart.subtotalPence ?? 0)}
            </p>
          </div>
          <Link
            href="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[var(--gm-accent)] px-4 py-3 text-sm font-semibold text-[#042016]"
          >
            Proceed to checkout
          </Link>
        </div>
      )}
    </div>
  );
}
