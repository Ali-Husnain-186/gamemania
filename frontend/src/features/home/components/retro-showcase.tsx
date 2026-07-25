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
    <section className="relative overflow-hidden border-y border-[var(--gm-cyan)]/25">
      <div className="absolute inset-0">
        <Image
          src="/brand/hero-slide-1.jpg"
          alt=""
          fill
          quality={85}
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,12,0.88),rgba(5,8,12,0.96))]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-cyan)] sm:text-xs">
              Collection
            </p>
            <h2 className="gm-display mt-1 text-[1.5rem] text-[var(--gm-yellow)] sm:text-4xl">
              Retro gaming
            </h2>
            <p className="mt-2 max-w-xl text-xs text-[var(--gm-muted)] sm:text-sm">
              Classics, rarities and nostalgia — curated for collectors and casual players.
            </p>
          </div>
          <Link
            href="/shop?q=retro"
            className="btn-cyan-outline w-full justify-center px-5 py-2.5 text-sm sm:w-auto"
          >
            Explore Retro
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
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
