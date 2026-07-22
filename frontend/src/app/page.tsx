import Link from 'next/link';

/**
 * Foundation landing — full storefront pages land in Phase 3+.
 * Brand-first composition only; no dashboard clutter.
 */
export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Cpath d=%22M40 0H0V40%22 fill=%22none%22 stroke=%22%231c2740%22 stroke-width=%221%22/%3E%3C/svg%3E')] opacity-40"
      />
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <p className="gm-display text-sm font-semibold tracking-[0.2em] text-[var(--gm-accent)]">
          GAME-MANIA
        </p>
        <nav className="flex gap-6 text-sm text-[var(--gm-muted)]">
          <Link href="/shop" className="transition hover:text-white">
            Shop
          </Link>
          <Link href="/trade-in" className="transition hover:text-white">
            Trade-In
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-10 md:px-12">
        <h1 className="gm-display max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
          GAME-MANIA
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[var(--gm-muted)] md:text-xl">
          The premium UK marketplace for games, gear, and trade-ins — built for speed, trust, and
          level-up rewards.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="rounded-md bg-[var(--gm-accent)] px-6 py-3 text-sm font-semibold text-[#042016] transition hover:brightness-110"
          >
            Enter the shop
          </Link>
          <Link
            href="/trade-in"
            className="rounded-md border border-[var(--gm-border)] px-6 py-3 text-sm font-semibold text-white transition hover:border-[var(--gm-accent)]"
          >
            Get a trade-in quote
          </Link>
        </div>
        <p className="mt-16 text-xs uppercase tracking-[0.18em] text-[var(--gm-muted)]">
          Free UK shipping on orders £60+
        </p>
      </section>
    </main>
  );
}
