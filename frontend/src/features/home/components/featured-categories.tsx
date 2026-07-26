'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';

const categories = [
  {
    title: 'PlayStation',
    href: '/shop?q=playstation',
    image: '/brand/playstation.png',
  },
  {
    title: 'Nintendo',
    href: '/shop?q=nintendo',
    image: '/brand/nintendo.png',
  },
  {
    title: 'PC Gaming',
    href: '/shop?q=pc',
    image: '/brand/pcgames.png',
  },
  {
    title: 'Retro',
    href: '/shop?q=retro',
    image: '/brand/retrogames.png',
  },
  {
    title: 'Accessories',
    href: '/shop?q=accessories',
    image: '/brand/accessories.png',
  },
  {
    title: 'Controllers',
    href: '/shop?q=controller',
    image: '/brand/wireless-controller.png',
  },
];

export function FeaturedCategories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Browse"
        title="Featured categories"
        description="Jump straight into the platforms and gear you love."
      />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="h-full"
          >
            <Link
              href={cat.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)] transition hover:-translate-y-1 hover:border-[var(--gm-cyan)]/70 hover:shadow-[0_14px_36px_rgba(1,166,194,0.16)] gm-focus"
            >
              {/* Fixed image box — same size on every card */}
              <div className="relative h-[180px] w-full shrink-0 overflow-hidden bg-[#0a1016] sm:h-[220px] md:h-[240px]">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  quality={90}
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 360px"
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              {/* Fixed footer height */}
              <div className="flex h-[4.25rem] items-center justify-between gap-2 border-t border-[var(--gm-cyan)]/15 px-4 sm:h-[4.75rem] sm:px-5">
                <h3 className="gm-display line-clamp-1 text-base text-[var(--gm-yellow)] sm:text-xl">
                  {cat.title}
                </h3>
                <span className="shrink-0 rounded-full bg-[var(--gm-cyan)] px-3 py-1 text-[10px] font-extrabold text-black transition group-hover:bg-[var(--gm-yellow)] sm:text-xs">
                  Explore
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
