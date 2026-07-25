'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';

const platforms = [
  {
    name: 'PlayStation',
    href: '/shop?q=playstation',
    image: '/brand/hero-banner-hd.jpg',
    count: '120+ games',
  },
  {
    name: 'Xbox',
    href: '/shop?q=xbox',
    image: '/brand/hero-slide-2.jpg',
    count: '90+ games',
  },
  {
    name: 'Nintendo',
    href: '/shop?q=nintendo',
    image: '/brand/hero-slide-1.jpg',
    count: '80+ games',
  },
  {
    name: 'PC',
    href: '/shop?q=pc',
    image: '/brand/hero-accessories.jpg',
    count: '60+ titles',
  },
  {
    name: 'Retro',
    href: '/shop?q=retro',
    image: '/brand/hero-trade-in.jpg',
    count: '45+ classics',
  },
];

export function ShopByPlatform() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Platforms"
        title="Shop by platform"
        description="Find the perfect titles for every console generation."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {platforms.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6 }}
          >
            <Link
              href={p.href}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-[var(--gm-border)] gm-focus"
            >
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="20vw"
                className="object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="gm-display text-lg text-white">{p.name}</h3>
                <p className="mt-1 text-xs font-semibold text-[var(--gm-cyan)]">{p.count}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
