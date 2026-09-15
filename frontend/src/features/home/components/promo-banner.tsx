'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';
import {
  DEFAULT_PROMO_BANNER,
  formatPromoBlurb,
  normalizePromoBanner,
  type PromoBannerContent,
} from '@/features/home/promo-banner-content';

export function PromoBanner() {
  const [promo, setPromo] = useState<PromoBannerContent>(DEFAULT_PROMO_BANNER);

  useEffect(() => {
    void (async () => {
      try {
        const row = await apiGet<{ key: string; value: unknown }>('/settings/promo.banner');
        setPromo(normalizePromoBanner(row.value));
      } catch {
        setPromo(DEFAULT_PROMO_BANNER);
      }
    })();
  }, []);

  if (!promo.enabled) return null;

  const blurbParts = formatPromoBlurb(promo.blurb, promo.code).split(promo.code);

  return (
    <section className="relative overflow-hidden border-y-2 border-[var(--gm-cyan)]/40">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(110deg,rgba(1,166,194,0.32),rgba(229,26,99,0.22),rgba(255,209,0,0.18))]"
      />
      <div aria-hidden className="absolute inset-0 opacity-40 gm-halftone" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-5 px-4 py-8 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--gm-cyan-soft)] sm:text-xs">
            {promo.eyebrow}
          </p>
          <h2 className="gm-display mt-2 text-[1.75rem] leading-tight text-white sm:text-4xl md:text-5xl">
            {promo.title}
          </h2>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            {blurbParts.length > 1 ? (
              <>
                {blurbParts[0]}
                <span className="rounded-md bg-black/40 px-2.5 py-1 font-extrabold tracking-wide text-[var(--gm-yellow)]">
                  {promo.code}
                </span>
                {blurbParts.slice(1).join(promo.code)}
              </>
            ) : (
              <>
                {formatPromoBlurb(promo.blurb, promo.code)}{' '}
                <span className="rounded-md bg-black/40 px-2.5 py-1 font-extrabold tracking-wide text-[var(--gm-yellow)]">
                  {promo.code}
                </span>
              </>
            )}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full sm:w-auto"
        >
          <Link
            href={promo.ctaHref}
            className="btn-cyan inline-flex w-full justify-center px-6 py-3 text-sm sm:w-auto sm:text-base"
          >
            {promo.ctaLabel}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
