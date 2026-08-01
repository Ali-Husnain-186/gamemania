'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Heart, ShoppingBag, Star, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { apiPost, getAccessToken } from '@/lib/api';
import { formatGBP } from '@/lib/format';
import { notify } from '@/lib/toast';
import { useCartStore } from '@/stores/cart-store';
import { TradeValueBlock, showsConditionVariant } from '@/features/catalog/trade-value-block';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';

type MarketplaceProductCardProps = {
  product: Product;
  index?: number;
};

function conditionLabel(condition?: string | null) {
  if (!condition || condition === 'NEW') return 'New';
  return 'Used';
}

export function MarketplaceProductCard({ product, index = 0 }: MarketplaceProductCardProps) {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [wishMsg, setWishMsg] = useState<string | null>(null);
  const setCart = useCartStore((s) => s.setCart);
  const queryClient = useQueryClient();
  const image = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  const rating = 4 + ((product.name.length + index) % 10) / 10;
  const showCondition = showsConditionVariant(product.name);
  const displayName = product.name.replace(/\s*\((New|Used)\)\s*$/i, '');

  const addMutation = useMutation({
    mutationFn: () => apiPost<Cart>('/cart/items', { productId: product.id, quantity: 1 }),
    onSuccess: (cart) => {
      setCart(cart);
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      setQuickOpen(false);
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
    <>
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/80 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:-translate-y-1 hover:border-[var(--gm-cyan)]/70 hover:shadow-[0_16px_40px_rgba(1,166,194,0.14)] sm:rounded-2xl"
      >
        <div className="relative aspect-square overflow-hidden bg-white">
          <Link href={`/products/${product.slug}`} className="absolute inset-0">
            {image?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.altText || product.name}
                className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[var(--gm-muted)]">
                No image
              </div>
            )}
          </Link>

          {showCondition ? (
            <span
              className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                conditionLabel(product.condition) === 'New'
                  ? 'bg-[var(--gm-cyan)] text-black'
                  : 'bg-[var(--gm-magenta)] text-white'
              }`}
            >
              {conditionLabel(product.condition)}
            </span>
          ) : null}

          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              aria-label="Add to wishlist"
              onClick={() => wishlistMutation.mutate()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:border-[var(--gm-magenta)] hover:text-[var(--gm-magenta)]"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Quick view"
              onClick={() => setQuickOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:border-[var(--gm-cyan)] hover:text-[var(--gm-cyan)]"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--gm-cyan)]">
            {product.platform ?? product.brand?.name ?? 'Game'}
          </p>
          <Link href={`/products/${product.slug}`} className="mt-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug transition hover:text-[var(--gm-yellow)]">
              {displayName}
            </h3>
          </Link>

          <div className="mt-2 flex items-center gap-1 text-[var(--gm-yellow)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-current' : 'opacity-30'}`}
              />
            ))}
            <span className="ml-1 text-xs text-[var(--gm-muted)]">{rating.toFixed(1)}</span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div>
              <p className="gm-display text-xl text-[var(--gm-magenta)]">
                {formatGBP(product.price)}
              </p>
              <TradeValueBlock
                cashPence={product.tradeInCashPence}
                creditPence={product.tradeInCreditPence}
                compact
              />
              {wishMsg ? <p className="text-[10px] text-[var(--gm-muted)]">{wishMsg}</p> : null}
            </div>
            <button
              type="button"
              disabled={addMutation.isPending}
              onClick={() => addMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gm-yellow)] px-3 py-2 text-xs font-extrabold text-black transition hover:brightness-105 disabled:opacity-60"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {addMutation.isSuccess ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
      </motion.article>

      {quickOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view ${product.name}`}
          onClick={() => setQuickOpen(false)}
        >
          <div
            className="relative grid w-full max-w-2xl gap-4 overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 shadow-2xl sm:grid-cols-2 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setQuickOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-black/40 p-1.5"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-square overflow-hidden rounded-xl bg-white">
              {image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.url} alt={displayName} className="h-full w-full object-contain" />
              ) : null}
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--gm-cyan)]">
                {product.platform ?? 'Game'}
              </p>
              <h3 className="mt-1 text-lg font-bold">{displayName}</h3>
              <p className="gm-display mt-3 text-2xl text-[var(--gm-magenta)]">
                {formatGBP(product.price)}
              </p>
              <TradeValueBlock
                cashPence={product.tradeInCashPence}
                creditPence={product.tradeInCreditPence}
                compact
              />
              <p className="mt-3 line-clamp-4 text-sm text-[var(--gm-muted)]">
                {product.shortDescription ||
                  'Ready to ship across the UK. Genuine stock from GAME MANIA.'}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <button
                  type="button"
                  disabled={addMutation.isPending}
                  onClick={() => addMutation.mutate()}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Add to cart
                </button>
                <Link
                  href={`/products/${product.slug}`}
                  className="btn-cyan-outline px-4 py-2 text-sm"
                >
                  Full details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
