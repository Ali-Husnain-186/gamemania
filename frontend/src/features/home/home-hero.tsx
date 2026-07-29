'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, RefreshCcw, ShieldCheck, Truck, ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  { label: 'PlayStation', href: '/shop?category=playstation', cta: 'Shop PlayStation' },
  { label: 'Nintendo', href: '/shop?category=nintendo', cta: 'Shop Nintendo' },
  { label: 'PC Gaming', href: '/shop?category=pc-gaming', cta: 'Shop PC Gaming' },
  { label: 'Accessories', href: '/shop?category=accessories', cta: 'Shop accessories' },
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
  {
    icon: ArrowLeftRight,
    title: 'Trade In',
    body: 'Consoles & games for cash or credit.',
    href: '/trade-in',
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
      {/* Hero image + copy only — CTA sits in its own bar below so it never covers content */}
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

        <div className="absolute inset-0 z-10 flex flex-col items-center px-4 pt-[8%] sm:px-6 sm:pt-[9%] lg:pt-[8%]">
          <div className="pointer-events-none w-full max-w-3xl text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white sm:mb-3 sm:text-xs [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]">
              Built by Gamers, For Gamers
            </p>

            <h1 className="gm-display text-[clamp(1.75rem,6.2vw,4.5rem)] leading-[0.95] text-white [text-shadow:0_3px_14px_rgba(0,0,0,0.95)]">
              Trade. Play.
              <br />
              <span className="text-[var(--gm-yellow)]">Repeat.</span>
            </h1>

            <p className="gm-display mt-3 text-[clamp(0.75rem,2vw,1.2rem)] tracking-[0.1em] text-[var(--gm-cyan)] sm:mt-4 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
              Games • Consoles • Accessories • Trade In
            </p>
          </div>
        </div>
      </div>

      {/* CTA bar — always below the image, never overlays trust strip */}
      <div className="border-t border-[var(--gm-cyan)]/20 bg-black px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3">
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

      <div className="border-t border-[var(--gm-cyan)]/25 bg-[var(--gm-bg-elevated)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5 md:grid-cols-3 lg:grid-cols-5">
          {trustItems.map((item) => {
            const inner = (
              <>
                <item.icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gm-cyan)] sm:h-6 sm:w-6"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold sm:text-sm">{item.title}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-[var(--gm-muted)] sm:text-xs">
                    {item.body}
                  </p>
                </div>
              </>
            );
            return item.href ? (
              <Link key={item.title} href={item.href} className="flex items-start gap-2.5 gm-focus">
                {inner}
              </Link>
            ) : (
              <div key={item.title} className="flex items-start gap-2.5">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
