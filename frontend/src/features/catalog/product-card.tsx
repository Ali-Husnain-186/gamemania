'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatGBP } from '@/lib/format';
import type { Product } from '@/types/catalog';

type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const image = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="group block gm-focus rounded-lg"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] transition group-hover:border-[var(--gm-cyan)]">
          {image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.altText || image.alt || product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--gm-muted)]">
              No image
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--gm-cyan)]">
            {product.platform ?? product.brand?.name ?? 'Game'}
          </p>
          <h3 className="line-clamp-2 text-sm font-bold text-foreground transition group-hover:text-[var(--gm-yellow)]">
            {product.name}
          </h3>
          <p className="gm-display text-lg text-[var(--gm-magenta)]">{formatGBP(product.price)}</p>
        </div>
      </Link>
    </motion.article>
  );
}
