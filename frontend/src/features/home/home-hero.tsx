'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  { label: 'Games', href: '/shop?category=games', cta: 'Shop games' },
  { label: 'Consoles', href: '/shop?q=console', cta: 'Shop consoles' },
  { label: 'PlayStation', href: '/shop?q=playstation', cta: 'Shop PlayStation' },
  { label: 'Accessories', href: '/shop?q=accessories', cta: 'Shop accessories' },
  { label: 'Trade-ins', href: '/trade-in', cta: 'Get a trade-in quote' },
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    body: 'Encrypted checkout you can trust.',
  },
  {
    icon: Truck,
    title: 'Free UK Delivery',
    body: 'On orders over £60.',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    body: 'Hassle-free support when you need it.',
  },
  {
    icon: BadgeCheck,
    title: 'Genuine Products',
    body: 'Authentic games & hardware only.',
  },
];

export function HomeHero() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const active = slides[slideIndex]!;

  return (
    <section className="relative w-full bg-black">
      {/* Natural image height = full photo, nothing cropped */}
      <div className="relative w-full">
        <Image
          src="/brand/hero-main.jpg"
          alt="GAME MANIA gaming setup"
          width={2560}
          height={1440}
          priority
          quality={100}
          sizes="100vw"
          className="block h-auto w-full"
        />

        {/* Text overlay — copy higher, CTA lower with clear gap */}
        <div className="absolute inset-0 z-10 flex flex-col items-center px-4 pt-[10%] sm:px-6 sm:pt-[9%] lg:pt-[8%]">
          <div className="pointer-events-auto w-full max-w-3xl text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white sm:mb-3 sm:text-xs [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]">
              UK gaming marketplace
            </p>

            <h1 className="gm-display text-[clamp(2rem,7vw,5rem)] leading-[0.92] text-white [text-shadow:0_3px_14px_rgba(0,0,0,0.95)]">
              Play more.
              <br />
              <span className="text-[var(--gm-yellow)]">Save more.</span>
            </h1>

            <p className="gm-display mt-3 text-[clamp(0.85rem,2.4vw,1.25rem)] tracking-[0.14em] text-[var(--gm-cyan)] sm:mt-4 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
              Games • Consoles • Accessories
            </p>
          </div>

          <div className="pointer-events-auto mt-16 flex flex-col items-center gap-3 sm:mt-24 sm:gap-4 lg:mt-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.cta}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  href={active.href}
                  className="btn-primary inline-flex min-w-[10rem] justify-center px-7 py-3 text-sm sm:min-w-[10.5rem] sm:px-8 sm:py-3.5 sm:text-base"
                >
                  {active.cta}
                </Link>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  aria-label={`Show ${s.label}`}
                  aria-current={i === slideIndex}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slideIndex
                      ? 'w-7 bg-[var(--gm-yellow)] sm:w-8'
                      : 'w-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5 md:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-start gap-2.5">
              <item.icon
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gm-cyan)] sm:h-6 sm:w-6"
                aria-hidden
              />
              <div>
                <p className="text-xs font-extrabold sm:text-sm">{item.title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-[var(--gm-muted)] sm:text-xs">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
