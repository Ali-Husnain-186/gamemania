'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';

const FEATURED_CARDS = [
  {
    key: 'consoles',
    title: 'Game Consoles',
    href: '/shop?category=game-consoles',
    image: '/brand/playstation.png',
    alt: 'PlayStation and gaming consoles',
  },
  {
    key: 'preorders',
    title: 'Pre-orders and Latest releases',
    href: '/shop?preorder=true&sort=release',
    image: '/brand/preorder-latest-releases.jpg',
    alt: 'Wolverine, GTA VI and FC 27 game cases',
  },
  {
    key: 'accessories',
    title: 'PlayStation Accessories',
    href: '/shop?category=accessories',
    image: '/brand/accessories.png',
    alt: 'Controllers and gaming accessories',
  },
] as const;

export function FeaturedCategories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <SectionHeading
        eyebrow="Browse"
        title="Featured categories"
        description="Consoles, upcoming releases and accessories — then filter by platform in shop."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
        {FEATURED_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="h-full"
          >
            <Link
              href={card.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)] transition hover:-translate-y-1 hover:border-[var(--gm-cyan)]/70 hover:shadow-[0_14px_36px_rgba(1,166,194,0.16)] gm-focus"
            >
              <div className="relative h-[180px] w-full shrink-0 overflow-hidden bg-[#0a1016] sm:h-[200px] md:h-[220px]">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  quality={90}
                  sizes="(max-width:640px) 100vw, 33vw"
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              {/* Title + Explore below image so Explore never covers card text */}
              <div className="flex flex-col gap-2.5 border-t border-[var(--gm-cyan)]/15 px-4 py-4 sm:px-5">
                <h3 className="gm-display text-base leading-snug text-[var(--gm-yellow)] sm:text-xl">
                  {card.title}
                </h3>
                <span className="w-fit rounded-full bg-[var(--gm-cyan)] px-3 py-1.5 text-[10px] font-extrabold text-black transition group-hover:bg-[var(--gm-yellow)] sm:text-xs">
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
