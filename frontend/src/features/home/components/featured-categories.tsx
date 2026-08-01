'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';
import type { Category } from '@/types/catalog';
import { BrandLoader } from '@/components/ui/brand-loader';
import { SectionHeading } from './section-heading';

const FALLBACK_IMAGE = '/brand/playstation.png';

export function FeaturedCategories() {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/categories'),
  });

  const categories = (categoriesQuery.data ?? []).slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Browse"
        title="Featured categories"
        description="Game Consoles, Video Games and Accessories — then filter by platform in shop."
      />
      {categoriesQuery.isLoading ? (
        <BrandLoader
          variant="page"
          size="sm"
          label="Loading categories…"
          className="!min-h-[28vh] !py-8"
        />
      ) : categoriesQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--gm-danger)]">Could not load categories.</p>
          <button
            type="button"
            className="btn-cyan-outline px-4 py-2 text-xs"
            onClick={() => void categoriesQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-[var(--gm-muted)]">Categories coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
          {categories.map((cat, i) => {
            const image = cat.imageUrl || FALLBACK_IMAGE;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="h-full"
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)] transition hover:-translate-y-1 hover:border-[var(--gm-cyan)]/70 hover:shadow-[0_14px_36px_rgba(1,166,194,0.16)] gm-focus"
                >
                  <div className="relative h-[180px] w-full shrink-0 overflow-hidden bg-[#0a1016] sm:h-[200px] md:h-[220px]">
                    <Image
                      src={image}
                      alt={cat.name}
                      fill
                      quality={90}
                      sizes="(max-width:640px) 100vw, 33vw"
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="flex min-h-[4.5rem] flex-col justify-center gap-2 border-t border-[var(--gm-cyan)]/15 px-4 py-3 sm:min-h-[5rem] sm:px-5">
                    <h3 className="gm-display text-base leading-tight text-[var(--gm-yellow)] sm:text-xl">
                      {cat.name}
                    </h3>
                    <span className="w-fit rounded-full bg-[var(--gm-cyan)] px-3 py-1 text-[10px] font-extrabold text-black transition group-hover:bg-[var(--gm-yellow)] sm:text-xs">
                      Explore
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
