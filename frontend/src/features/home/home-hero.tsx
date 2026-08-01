'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, RefreshCcw, ShieldCheck, Truck, ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  { label: 'Video Games', href: '/shop?category=video-games', cta: 'Shop Video Games' },
  { label: 'Consoles', href: '/shop?category=game-consoles', cta: 'Shop Consoles' },
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
      {/* Cropped hero on small screens so copy stays readable; wider aspect on desktop */}
      <div className="relative isolate aspect-[3/4] w-full overflow-hidden sm:aspect-[16/11] md:aspect-[21/10] lg:aspect-[2.4/1]">
        <Image
          src="/brand/hero-main.jpg"
          alt="GameMania UK gaming setup"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[center_28%] sm:object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/85"
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 py-8 text-center sm:px-6 sm:py-10">
          <div className="w-full max-w-3xl">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/95 sm:mb-3 sm:text-[11px] sm:tracking-[0.28em] md:text-xs">
              Built by Gamers, For Gamers
            </p>

            <h1 className="gm-display text-[clamp(2rem,9vw,4.75rem)] leading-[0.92] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
              Trade. Play.
              <br />
              <span className="text-[var(--gm-yellow)]">Repeat.</span>
            </h1>

            <p className="gm-display mx-auto mt-2 max-w-[18rem] text-[0.7rem] leading-snug tracking-[0.08em] text-[var(--gm-cyan)] sm:mt-3 sm:max-w-none sm:text-[0.95rem] sm:tracking-[0.12em] md:text-[1.15rem]">
              <span className="sm:hidden">Games • Consoles • Trade In</span>
              <span className="hidden sm:inline">Games • Consoles • Accessories • Trade In</span>
            </p>
          </div>
        </div>
      </div>

      {/* CTA bar — closer under heading */}
      <div className="border-t border-[var(--gm-cyan)]/20 bg-black px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2.5">
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
                className="btn-primary inline-flex min-h-11 min-w-[11rem] justify-center px-6 py-2.5 text-sm sm:min-w-[11.5rem] sm:px-8 sm:py-3.5 sm:text-base"
              >
                {active.cta}
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-center gap-2">
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
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:grid-cols-3 lg:grid-cols-5">
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
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start gap-2.5 rounded-lg px-1 py-1 gm-focus"
              >
                {inner}
              </Link>
            ) : (
              <div key={item.title} className="flex items-start gap-2.5 px-1 py-1">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
