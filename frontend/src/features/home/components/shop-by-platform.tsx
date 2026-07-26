'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';

const platforms = [
  {
    name: 'PlayStation',
    href: '/shop?q=playstation',
    image: '/brand/playstation.png',
    count: '120+ games',
  },
  {
    name: 'Nintendo',
    href: '/shop?q=nintendo',
    image: '/brand/nintendo.png',
    count: '80+ games',
  },
  {
    name: 'PC',
    href: '/shop?q=pc',
    image: '/brand/pcgames.png',
    count: '60+ titles',
  },
  {
    name: 'Retro',
    href: '/shop?q=retro',
    image: '/brand/retrogames.png',
    count: '45+ classics',
  },
  {
    name: 'Accessories',
    href: '/shop?q=accessories',
    image: '/brand/accessories.png',
    count: 'Gear & more',
  },
];

export function ShopByPlatform() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Platforms"
        title="Shop by platform"
        description="Find the perfect titles for every console generation."
      />
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
        {platforms.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="w-[46vw] shrink-0 sm:w-auto"
          >
            <Link
              href={p.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)] transition hover:border-[var(--gm-cyan)]/70 hover:shadow-[0_12px_32px_rgba(1,166,194,0.14)] gm-focus"
            >
              <div className="relative aspect-square bg-[#0a1016] p-3 sm:p-4">
                <div className="relative h-full w-full">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    quality={90}
                    sizes="(max-width:640px) 46vw, 20vw"
                    className="object-contain object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              </div>
              <div className="px-3.5 py-3 sm:px-4 sm:py-3.5">
                <h3 className="gm-display text-base text-[var(--gm-yellow)] sm:text-lg">
                  {p.name}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-[var(--gm-cyan)] sm:text-xs">
                  {p.count}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
