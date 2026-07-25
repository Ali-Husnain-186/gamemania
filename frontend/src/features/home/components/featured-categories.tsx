'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';

const categories = [
  {
    title: 'PlayStation',
    href: '/shop?q=playstation',
    image: '/brand/hero-banner-hd.jpg',
  },
  {
    title: 'Xbox',
    href: '/shop?q=xbox',
    image: '/brand/hero-slide-2.jpg',
  },
  {
    title: 'Nintendo',
    href: '/shop?q=nintendo',
    image: '/brand/hero-slide-1.jpg',
  },
  {
    title: 'PC Gaming',
    href: '/shop?q=pc',
    image: '/brand/hero-accessories.jpg',
  },
  {
    title: 'Retro',
    href: '/shop?q=retro',
    image: '/brand/hero-trade-in.jpg',
  },
  {
    title: 'Accessories',
    href: '/shop?q=accessories',
    image: '/brand/hero-accessories.jpg',
  },
];

export function FeaturedCategories() {
  return (
    <section className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Browse"
        title="Featured categories"
        description="Jump straight into the platforms and gear you love."
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={cat.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-[var(--gm-cyan)]/20 transition hover:border-[var(--gm-cyan)]/70 sm:rounded-2xl gm-focus"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                quality={90}
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 400px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <h3 className="gm-display text-lg text-white sm:text-2xl">{cat.title}</h3>
                <span className="mt-2 inline-flex rounded-full bg-[var(--gm-cyan)] px-3 py-1 text-[11px] font-extrabold text-black transition group-hover:bg-[var(--gm-yellow)] sm:text-xs">
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
