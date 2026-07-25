'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden border-y-2 border-[var(--gm-yellow)]/35">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(110deg,rgba(229,26,99,0.28),rgba(0,181,226,0.18),rgba(255,209,0,0.2))]"
      />
      <div aria-hidden className="absolute inset-0 opacity-40 gm-halftone" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--gm-cyan)]">
            Limited offer
          </p>
          <h2 className="gm-display mt-2 text-3xl text-white sm:text-4xl md:text-5xl">
            10% OFF Your First Order
          </h2>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            Use code{' '}
            <span className="rounded-md bg-black/40 px-2.5 py-1 font-extrabold tracking-wide text-[var(--gm-yellow)]">
              GAMEMANIA10
            </span>{' '}
            at checkout.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Link href="/shop" className="btn-magenta px-6 py-3 text-sm sm:text-base">
            Shop the Sale
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
