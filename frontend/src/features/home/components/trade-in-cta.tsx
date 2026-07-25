'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function TradeInCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/70 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative min-h-[280px] lg:min-h-[420px]"
        >
          <Image
            src="/brand/hero-trade-in.jpg"
            alt="Trade in consoles and games"
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover object-left"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 lg:bg-gradient-to-l" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center p-6 sm:p-10"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-cyan)]">
            Trade-in
          </p>
          <h2 className="gm-display mt-2 text-3xl text-[var(--gm-yellow)] sm:text-4xl">
            Trade your games and consoles
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--gm-muted)] sm:text-base">
            <li className="flex gap-2">
              <span className="text-[var(--gm-magenta)]">▸</span>
              Receive instant quotes online
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--gm-magenta)]">▸</span>
              Choose cash or store credit
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--gm-magenta)]">▸</span>
              Fast, trusted UK trade-in process
            </li>
          </ul>
          <div className="mt-8">
            <Link href="/trade-in" className="btn-primary px-6 py-3 text-sm sm:text-base">
              Start Trading
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
