'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import {
  DEFAULT_HOME_HERO,
  normalizeHomeHero,
  renderSubtitle,
  type HomeHeroContent,
} from './home-hero-content';

export function HomeHero() {
  const [hero, setHero] = useState<HomeHeroContent>(DEFAULT_HOME_HERO);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const row = await apiGet<{ key: string; value: unknown }>('/settings/home.hero');
        setHero(normalizeHomeHero(row.value));
      } catch {
        // keep defaults
      }
    })();
  }, []);

  const slides = hero.slides.length ? hero.slides : DEFAULT_HOME_HERO.slides;

  useEffect(() => {
    setSlideIndex(0);
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [slides]);

  const active = slides[slideIndex] ?? slides[0]!;
  const sub = renderSubtitle(hero.subtitle, hero.subtitleHighlight);
  const bgSrc = hero.backgroundImageUrl || DEFAULT_HOME_HERO.backgroundImageUrl;
  const remoteBg = /^https?:\/\//i.test(bgSrc);

  return (
    <section className="relative w-full bg-black">
      <div className="relative isolate aspect-[3/4] w-full overflow-hidden sm:aspect-[16/11] md:aspect-[21/10] lg:aspect-[2.4/1]">
        <Image
          src={bgSrc}
          alt={hero.backgroundAlt || DEFAULT_HOME_HERO.backgroundAlt}
          fill
          priority
          quality={90}
          sizes="100vw"
          unoptimized={remoteBg}
          className="object-cover object-[center_28%] sm:object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/85"
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 py-8 text-center sm:px-6 sm:py-10">
          <div className="w-full max-w-3xl">
            {hero.eyebrow ? (
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/95 sm:mb-3 sm:text-[11px] sm:tracking-[0.28em] md:text-xs">
                {hero.eyebrow}
              </p>
            ) : null}

            <h1 className="gm-display text-[clamp(2rem,9vw,4.75rem)] leading-[0.92] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
              {hero.titleLine1}
              {hero.titleLine2 ? (
                <>
                  <br />
                  <span className="text-[var(--gm-yellow)]">{hero.titleLine2}</span>
                </>
              ) : null}
            </h1>

            {hero.subtitle ? (
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-snug text-white/95 sm:mt-4 sm:text-base md:text-lg">
                {sub.highlight ? (
                  <>
                    {sub.before}
                    <span className="text-[var(--gm-yellow)]">{sub.highlight}</span>
                    {sub.after}
                  </>
                ) : (
                  hero.subtitle
                )}
              </p>
            ) : null}

            {hero.taglineMobile || hero.taglineDesktop ? (
              <p className="gm-display mx-auto mt-2 max-w-[18rem] text-[0.7rem] leading-snug tracking-[0.08em] text-[var(--gm-cyan)] sm:mt-3 sm:max-w-none sm:text-[0.95rem] sm:tracking-[0.12em] md:text-[1.15rem]">
                {hero.taglineMobile ? (
                  <span className="sm:hidden">{hero.taglineMobile}</span>
                ) : null}
                {hero.taglineDesktop ? (
                  <span className={hero.taglineMobile ? 'hidden sm:inline' : undefined}>
                    {hero.taglineDesktop}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>

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
                key={`${s.label}-${s.href}`}
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
    </section>
  );
}
