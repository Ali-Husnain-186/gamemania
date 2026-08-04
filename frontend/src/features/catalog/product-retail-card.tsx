'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { apiPost, getAccessToken } from '@/lib/api';
import { formatGBP, formatPlatform } from '@/lib/format';
import { notify } from '@/lib/toast';
import { useCartStore } from '@/stores/cart-store';
import { TradeValueBlock, showsConditionVariant } from '@/features/catalog/trade-value-block';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';

export type ProductRetailCardProps = {
  product: Product;
  index?: number;
};

function conditionLabel(condition?: string | null) {
  if (!condition || condition === 'NEW') return 'New';
  return 'Pre-owned';
}

function categoryLine(product: Product): string {
  if (product.category?.name) return product.category.name;
  const platform = formatPlatform(product.platform);
  if (platform !== 'Game') return platform;
  return product.brand?.name ?? 'Games';
}

/**
 * CeX-style retail card on GameMania dark theme:
 * white image panel, warranty/condition chip, wishlist heart,
 * star rating, category, title, price + circular cart CTA, compact trade values.
 */
export function ProductRetailCard({ product, index = 0 }: ProductRetailCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  const [wishMsg, setWishMsg] = useState<string | null>(null);

  const image = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  const rating = 4 + ((product.name.length + index) % 10) / 10;
  const showCondition = showsConditionVariant(product.name);
  const displayName = product.name.replace(/\s*\((New|Used)\)\s*$/i, '');

  const addMutation = useMutation({
    mutationFn: () => apiPost<Cart>('/cart/items', { productId: product.id, quantity: 1 }),
    onSuccess: (cart) => {
      setCart(cart);
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      notify.success('Added to cart');
      router.push('/cart');
    },
    onError: () => notify.error('Could not add to cart'),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => apiPost('/wishlist', { productId: product.id }),
    onSuccess: () => {
      setWishMsg('Saved');
      notify.success('Saved to wishlist');
    },
    onError: () => {
      if (!getAccessToken()) {
        setWishMsg('Sign in to save');
        notify.info('Sign in to save wishlist items');
      } else {
        setWishMsg('Could not save');
        notify.error('Could not save to wishlist');
      }
    },
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] transition hover:-translate-y-0.5 hover:border-[var(--gm-cyan)]/60 hover:shadow-[0_12px_32px_rgba(1,166,194,0.12)] sm:rounded-2xl"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 gm-focus"
          aria-label={`View ${displayName}`}
        >
          {image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText || image.alt || displayName}
              className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.03] sm:p-3"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
              No image
            </div>
          )}
        </Link>

        {/* Top-left: preorder / condition / warranty chip */}
        <div className="pointer-events-none absolute left-2 top-2 z-[1] flex flex-col gap-1.5 sm:left-3 sm:top-3">
          {product.isPreorder ? (
            <span className="w-fit rounded-full bg-[var(--gm-magenta)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              Pre-order
            </span>
          ) : showCondition ? (
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                conditionLabel(product.condition) === 'New'
                  ? 'bg-[var(--gm-cyan)] text-black'
                  : 'bg-[var(--gm-magenta)] text-white'
              }`}
            >
              {conditionLabel(product.condition)}
            </span>
          ) : (
            <span className="w-fit rounded-full bg-[var(--gm-magenta)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              3-mo warranty
            </span>
          )}
        </div>

        {/* Top-right: wishlist */}
        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            wishlistMutation.mutate();
          }}
          className="absolute right-2 top-2 z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/95 text-neutral-800 shadow-sm transition hover:border-[var(--gm-magenta)] hover:text-[var(--gm-magenta)] sm:right-3 sm:top-3"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-[11px] leading-snug text-[var(--gm-muted)]">
            {categoryLine(product)}
          </p>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[var(--gm-yellow)]">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-semibold text-foreground/90">{rating.toFixed(1)}</span>
          </span>
        </div>

        <Link href={`/products/${product.slug}`} className="mt-1 gm-focus rounded-sm">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition group-hover:text-[var(--gm-yellow)]">
            {displayName}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
              {formatGBP(product.price)}
            </p>
            <TradeValueBlock
              cashPence={product.tradeInCashPence}
              creditPence={product.tradeInCreditPence}
              compact
            />
            {wishMsg ? (
              <p className="mt-0.5 text-[10px] text-[var(--gm-muted)]">{wishMsg}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={addMutation.isPending}
            aria-label={`Add ${displayName} to cart`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addMutation.mutate();
            }}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--gm-magenta)] text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
