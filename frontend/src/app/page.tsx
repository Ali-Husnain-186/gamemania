'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Cpath d=%22M40 0H0V40%22 fill=%22none%22 stroke=%22%231c2740%22 stroke-width=%221%22/%3E%3C/svg%3E')] opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-3xl bg-[radial-gradient(ellipse_at_70%_40%,rgba(0,229,168,0.16),transparent_60%)]"
      />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center px-4 pb-20 pt-16 md:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="gm-display text-sm font-semibold tracking-[0.28em] text-[var(--gm-accent)]"
        >
          GAME-MANIA
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="gm-display mt-4 max-w-3xl text-4xl font-bold leading-[1.1] text-foreground md:text-6xl"
        >
          Level up your loadout.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mt-5 max-w-xl text-lg text-[var(--gm-muted)] md:text-xl"
        >
          The premium UK marketplace for games, gear, and trade-ins — built for speed, trust, and
          rewards that stick.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <Link
            href="/shop"
            className="rounded-md bg-[var(--gm-accent)] px-6 py-3 text-sm font-semibold text-[#042016] transition hover:brightness-110 gm-focus"
          >
            Enter the shop
          </Link>
          <Link
            href="/trade-in"
            className="rounded-md border border-[var(--gm-border)] px-6 py-3 text-sm font-semibold text-foreground transition hover:border-[var(--gm-accent)] gm-focus"
          >
            Get a trade-in quote
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-xs uppercase tracking-[0.18em] text-[var(--gm-muted)]"
        >
          Free UK shipping on orders £60+
        </motion.p>
      </section>
    </main>
  );
}
