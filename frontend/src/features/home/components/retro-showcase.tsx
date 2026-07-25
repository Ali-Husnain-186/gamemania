'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';
import type { Product } from '@/types/catalog';
import { MarketplaceProductCard } from './marketplace-product-card';
import { ProductSkeleton } from './product-skeleton';

export function RetroShowcase() {
  const query = useQuery({
    queryKey: ['products', 'retro-home'],
    queryFn: () => apiGet<Product[]>('/products?q=retro&limit=4'),
  });

  const products = query.data?.length ? query.data : (undefined as Product[] | undefined);

  const fallbackQuery = useQuery({
    queryKey: ['products', 'retro-fallback'],
    queryFn: () => apiGet<Product[]>('/products?sort=newest&limit=4'),
    enabled: !query.isLoading && (query.data?.length ?? 0) === 0,
  });

  const list = (products?.length ? products : fallbackQuery.data) ?? [];

  return (
    <section className="relative overflow-hidden border-y border-[var(--gm-border)]">
      <div className="absolute inset-0">
        <Image
          src="/brand/hero-slide-1.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.85),rgba(5,5,5,0.95))]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-magenta)]">
              Collection
            </p>
            <h2 className="gm-display mt-1 text-3xl text-[var(--gm-yellow)] sm:text-4xl">
              Retro gaming
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--gm-muted)]">
              Classics, rarities and nostalgia — curated for collectors and casual players.
            </p>
          </div>
          <Link href="/shop?q=retro" className="btn-cyan-outline px-5 py-2.5 text-sm">
            Explore Retro
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {query.isLoading || (fallbackQuery.isLoading && list.length === 0) ? (
            <ProductSkeleton count={4} />
          ) : (
            list
              .slice(0, 4)
              .map((p, i) => <MarketplaceProductCard key={p.id} product={p} index={i} />)
          )}
        </div>
      </div>
    </section>
  );
}
