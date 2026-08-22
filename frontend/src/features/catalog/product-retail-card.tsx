'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { apiPost, getAccessToken } from '@/lib/api';
import { formatGBP, formatPlatform } from '@/lib/format';
import { getProductWarranty } from '@/lib/product-warranty';
import { notify } from '@/lib/toast';
import { useCartStore } from '@/stores/cart-store';
import { TradeValueBlock, showsConditionVariant } from '@/features/catalog/trade-value-block';
import type { Cart } from '@/types/cart';
import type { Product } from '@/types/catalog';

/** Explicit presentation props — parent can override anything derived from product */
export type ProductRetailCardProps = {
  product: Product;
  index?: number;
  /** Override primary image */
  imageUrl?: string | null;
  imageAlt?: string | null;
  /** Card title (defaults to product name without New/Used) */
  title?: string;
  /** e.g. "PlayStation 4 Games" — defaults from category / platform */
  category?: string;
  /** Short platform code for UI chips when needed (PS5, PS4, Xbox Series, …) */
  platformLabel?: string;
  rating?: number;
  /** Show warranty badge (true by default when not preorder) */
  showWarranty?: boolean;
  warrantyLabel?: string;
  /** Explicit condition chip: "New" | "Pre-owned" | "B · Good" | null to hide */
  conditionLabel?: string | null;
  /** Trade-in lines under price */
  showTradeValues?: boolean;
  /** Circular cart CTA */
  showCartButton?: boolean;
  href?: string;
};

function defaultTitle(product: Product) {
  return product.name.replace(/\s*\((New|Used)\)\s*$/i, '');
}

/** CeX-style category line: "PlayStation4 Games", "Xbox360 Games", etc. */
function defaultCategory(product: Product): string {
  const cat = product.category?.name?.trim();
  const slug = product.category?.slug ?? '';
  const platform = product.platform?.trim().toUpperCase().replace(/\s+/g, '_') ?? '';

  const platformNoun: Record<string, string> = {
    PS5: 'PlayStation5',
    PS4: 'PlayStation4',
    PS3: 'PlayStation3',
    PS2: 'PlayStation2',
    XBOX_SERIES: 'XboxSeries',
    XBOX: 'Xbox',
    SWITCH: 'NintendoSwitch',
    SWITCH2: 'NintendoSwitch2',
  };
  const noun = platformNoun[platform] ?? formatPlatform(product.platform);

  if (
    slug.includes('controller') ||
    /controller/i.test(cat ?? '') ||
    slug.includes('accessories')
  ) {
    return `${noun} Controllers`;
  }
  if (slug.includes('console') || /console/i.test(cat ?? '')) {
    if (platform === 'PS5') return 'PlayStation 5 Consoles';
    if (platform === 'PS4') return 'PlayStation 4 Consoles';
    if (platform === 'PS3') return 'PlayStation 3 Consoles';
    if (platform === 'PS2') return 'PlayStation 2 Consoles';
    return `${noun} Consoles`;
  }
  if (cat && /game/i.test(cat)) return cat;
  if (noun && noun !== 'Game') return `${noun} Games`;
  return cat || product.brand?.name || 'Games';
}

function defaultConditionLabel(product: Product): string | null {
  if (product.isPreorder && product.condition === 'NEW') return null;
  if (!showsConditionVariant(product.name)) return null;
  if (!product.condition || product.condition === 'NEW') return 'New';
  if (product.condition === 'PRE_OWNED_EXCELLENT') return 'A · Excellent';
  if (product.condition === 'PRE_OWNED_FAIR') return 'C · Fair';
  return 'B · Good';
}

function defaultRating(product: Product, index: number) {
  return 4 + ((product.name.length + index) % 10) / 10;
}

/**
 * Common CeX-style retail product card.
 * Layout: light image well → warranty + wishlist → rating → category → title
 * → optional condition → price + circular cart (+ optional trade values).
 * Platform branding (PS4/PS5 bar) lives on the product image itself.
 */
export function ProductRetailCard({
  product,
  index = 0,
  imageUrl,
  imageAlt,
  title,
  category,
  platformLabel,
  rating: ratingProp,
  showWarranty: showWarrantyProp,
  warrantyLabel: warrantyLabelProp,
  conditionLabel: conditionProp,
  showTradeValues = true,
  showCartButton = true,
  href,
}: ProductRetailCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  const [wishMsg, setWishMsg] = useState<string | null>(null);

  const productImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
  // Prefer explicit prop, then gallery, then platform brand art so cards never look empty
  const { url: fallbackUrl, alt: fallbackAlt } = (() => {
    if (imageUrl) return { url: imageUrl, alt: imageAlt ?? defaultTitle(product) };
    if (productImage?.url) {
      return {
        url: productImage.url,
        alt: imageAlt ?? productImage.altText ?? productImage.alt ?? defaultTitle(product),
      };
    }
    const platform = (product.platform ?? '').toUpperCase();
    const brand = product.brand?.slug ?? '';
    let brandUrl = '/brand/pcgames.png';
    if (platform.includes('PS') || brand === 'sony') brandUrl = '/brand/playstation.png';
    else if (platform.includes('SWITCH') || brand === 'nintendo') brandUrl = '/brand/nintendo.png';
    return { url: brandUrl, alt: imageAlt ?? defaultTitle(product) };
  })();
  const src = fallbackUrl;
  const alt = fallbackAlt;
  const displayName = title ?? defaultTitle(product);
  const categoryText = category ?? defaultCategory(product);
  const warranty = getProductWarranty(product);
  const showWarranty = showWarrantyProp ?? warranty.show;
  const warrantyLabel = warrantyLabelProp ?? warranty.label;
  const platformText = platformLabel ?? formatPlatform(product.platform);
  const rating = ratingProp ?? defaultRating(product, index);
  const conditionText =
    conditionProp !== undefined ? conditionProp : defaultConditionLabel(product);
  const productHref = href ?? `/products/${product.slug}`;

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
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.28) }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] transition hover:-translate-y-0.5 hover:border-[var(--gm-cyan)]/55 hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)] sm:rounded-2xl"
    >
      {/* Image well — white plate (console cards) like storefront screenshot */}
      <div className="relative mx-2 mt-2 overflow-hidden rounded-lg bg-white sm:mx-2.5 sm:mt-2.5 sm:rounded-xl">
        <div className="relative aspect-square">
          <Link
            href={productHref}
            className="absolute inset-0 gm-focus"
            aria-label={`View ${displayName}`}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-1.5 transition duration-400 group-hover:scale-[1.02] sm:p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                No image
              </div>
            )}
          </Link>

          {/* Top-left badges */}
          <div className="pointer-events-none absolute left-2 top-2 z-[1] flex max-w-[70%] flex-col gap-1">
            {product.isPreorder && product.condition === 'NEW' ? (
              <span className="w-fit rounded-full bg-[var(--gm-magenta)] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white sm:text-[10px]">
                Pre-order
              </span>
            ) : showWarranty ? (
              <span className="w-fit rounded-full bg-[#e11d48] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:text-[10px]">
                {warrantyLabel}
              </span>
            ) : null}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              wishlistMutation.mutate();
            }}
            className="absolute right-2 top-2 z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-black/5 transition hover:text-[var(--gm-magenta)] sm:h-9 sm:w-9"
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Console / accessory platform strip (matches retail screenshots) */}
          {platformText && platformText !== 'Game' && !product.category?.slug?.includes('game') ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-center gap-2 bg-black/85 px-2 py-1.5">
              <span className="shrink-0 rounded bg-black px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white ring-1 ring-white/25">
                {platformText}
              </span>
              <span className="truncate text-[10px] font-medium text-white/90 sm:text-[11px]">
                {displayName.replace(/^PlayStation\s*/i, 'PS').slice(0, 42)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-3.5 sm:pb-3.5">
        {/* Category left · rating right */}
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-[11px] leading-snug text-[var(--gm-muted)]">
            {categoryText}
          </p>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[var(--gm-yellow)]">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-bold text-foreground/90">{rating.toFixed(1)}</span>
          </span>
        </div>

        <Link href={productHref} className="mt-1 gm-focus rounded-sm">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition group-hover:text-[var(--gm-yellow)]">
            {displayName}
          </h3>
        </Link>

        {conditionText ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[var(--gm-muted)]">
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white ${
                conditionText === 'New' ? 'bg-[var(--gm-cyan)] text-black' : 'bg-neutral-500'
              }`}
            >
              {conditionText === 'New'
                ? 'N'
                : conditionText.startsWith('A')
                  ? 'A'
                  : conditionText.startsWith('C')
                    ? 'C'
                    : 'B'}
            </span>
            <span>{conditionText}</span>
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
              {formatGBP(product.price)}
            </p>
            {showTradeValues ? (
              <TradeValueBlock
                cashPence={product.tradeInCashPence}
                creditPence={product.tradeInCreditPence}
                compact
              />
            ) : null}
            {wishMsg ? (
              <p className="mt-0.5 text-[10px] text-[var(--gm-muted)]">{wishMsg}</p>
            ) : null}
          </div>
          {showCartButton ? (
            <button
              type="button"
              disabled={addMutation.isPending}
              aria-label={`Add ${displayName} to cart`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addMutation.mutate();
              }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
            >
              <ShoppingBag className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
