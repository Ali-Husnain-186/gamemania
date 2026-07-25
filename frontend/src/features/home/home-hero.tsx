'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const slides = [
  {
    src: '/brand/hero-slide-1.jpg',
    alt: 'Latest video games',
    label: 'Games',
    color: 'text-[var(--gm-yellow)]',
    href: '/shop?category=games',
    cta: 'Shop games',
  },
  {
    src: '/brand/hero-slide-2.jpg',
    alt: 'Gaming consoles',
    label: 'Consoles',
    color: 'text-[var(--gm-cyan)]',
    href: '/shop?q=console',
    cta: 'Shop consoles',
  },
  {
    src: '/brand/hero-banner-hd.jpg',
    alt: 'PlayStation consoles',
    label: 'PlayStation',
    color: 'text-[var(--gm-cyan)]',
    href: '/shop?q=playstation',
    cta: 'Shop PlayStation',
  },
  {
    src: '/brand/hero-accessories.jpg',
    alt: 'Gaming accessories',
    label: 'Accessories',
    color: 'text-[var(--gm-magenta)]',
    href: '/shop?q=accessories',
    cta: 'Shop accessories',
  },
  {
    src: '/brand/hero-trade-in.jpg',
    alt: 'Trade in games and consoles',
    label: 'Trade-ins',
    color: 'text-[var(--gm-yellow)]',
    href: '/trade-in',
    cta: 'Get a trade-in quote',
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
    <section className="relative w-full overflow-hidden bg-[#05060c]">
      <div className="relative w-full">
        <div className="relative aspect-[16/9] w-full">
          {slides.map((slide, i) => (
            <motion.div
              key={slide.src}
              aria-hidden={i !== slideIndex}
              initial={false}
              animate={{
                opacity: i === slideIndex ? 1 : 0,
                scale: i === slideIndex ? 1 : 1.04,
              }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                quality={100}
                sizes="100vw"
                className="object-cover object-left"
              />
            </motion.div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4 py-6 sm:justify-end sm:px-6 md:px-10">
          <div className="pointer-events-auto w-full max-w-md text-center sm:text-left">
            <h1 className="gm-display text-[clamp(2rem,5.5vw,3.75rem)] leading-[0.95] text-white drop-shadow-[0_4px_22px_rgba(0,0,0,0.75)]">
              Play more.
              <br />
              <span className="text-[var(--gm-yellow)]">Save more.</span>
            </h1>

            <div className="relative mt-3 grid min-h-[2rem] place-items-center sm:min-h-[2.25rem] sm:place-items-start">
              <span
                aria-hidden
                className="gm-display invisible whitespace-nowrap text-[clamp(1.2rem,3.5vw,1.65rem)] tracking-[0.08em]"
              >
                Accessories
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={active.label}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`gm-display absolute inset-0 flex items-center justify-center whitespace-nowrap text-[clamp(1.2rem,3.5vw,1.65rem)] tracking-[0.08em] drop-shadow-[0_3px_14px_rgba(0,0,0,0.8)] sm:justify-start ${active.color}`}
                >
                  {active.label}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="mt-5 flex justify-center sm:justify-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.cta}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={active.href} className="btn-primary px-7 py-3 text-sm sm:text-base">
                    {active.cta}
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-5">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show ${s.label}`}
              aria-current={i === slideIndex}
              onClick={() => setSlideIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === slideIndex ? 'w-8 bg-[var(--gm-yellow)]' : 'w-3 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
