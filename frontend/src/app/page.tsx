'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { ProductCard } from '@/features/catalog/product-card';
import type { Product } from '@/types/catalog';

export default function HomePage() {
  const featuredQuery = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => apiGet<Product[]>('/products?sort=featured&limit=4'),
  });

  return (
    <main className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 gm-halftone opacity-40" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-10 text-center md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          className="relative"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 scale-125 rounded-full bg-[var(--gm-cyan)]/25 blur-3xl"
          />
          <Image
            src="/brand/game-mania-logo.png"
            alt="GAME MANIA"
            width={280}
            height={280}
            priority
            className="mx-auto h-44 w-44 object-contain drop-shadow-[0_0_40px_rgba(0,181,226,0.45)] sm:h-56 sm:w-56 md:h-64 md:w-64"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="gm-display mt-6 text-5xl leading-none sm:text-6xl md:text-7xl"
        >
          <span className="text-[var(--gm-yellow)]">Play more.</span>{' '}
          <span className="text-[var(--gm-magenta)]">Save more.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="mt-5 max-w-xl text-base text-[var(--gm-muted)] sm:text-lg"
        >
          UK games, consoles & accessories — plus trade-ins for store credit or cash bank transfer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/shop" className="btn-primary">
            Shop now
          </Link>
          <Link href="/trade-in" className="btn-cyan-outline">
            Get a trade-in quote
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-cyan)]"
        >
          Free UK shipping £60+ · Code GAMEMANIA10 for 10% off
        </motion.p>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Trade-ins',
              body: 'Swap old games & consoles for credit.',
              href: '/trade-in',
              color: 'border-[var(--gm-cyan)] text-[var(--gm-cyan)]',
            },
            {
              title: 'New releases',
              body: 'Be first on the latest drops.',
              href: '/shop',
              color: 'border-[var(--gm-yellow)] text-[var(--gm-yellow)]',
            },
            {
              title: 'Huge range',
              body: 'Games, consoles & accessories.',
              href: '/shop',
              color: 'border-[var(--gm-magenta)] text-[var(--gm-magenta)]',
            },
            {
              title: '10% offline flyer',
              body: 'Use GAMEMANIA10 online.',
              href: '/register',
              color: 'border-[var(--gm-cyan)] text-[var(--gm-cyan)]',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={item.href}
                className={`gm-pill w-full border-2 ${item.color} bg-black/40 transition hover:bg-white/5`}
              >
                <span>
                  <span className="gm-display block text-base">{item.title}</span>
                  <span className="mt-1 block text-xs font-semibold normal-case tracking-normal text-[var(--gm-muted)]">
                    {item.body}
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="gm-display text-3xl text-[var(--gm-yellow)]">Featured drops</h2>
            <p className="mt-2 text-sm text-[var(--gm-muted)]">Ready to ship across the UK.</p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-bold text-[var(--gm-cyan)] gm-focus rounded-sm"
          >
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredQuery.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl border-2 border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]"
                />
              ))
            : (featuredQuery.data ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </main>
  );
}
