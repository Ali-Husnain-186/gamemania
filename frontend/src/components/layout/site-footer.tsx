import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <p className="gm-display text-sm font-semibold tracking-[0.18em] text-[var(--gm-accent)]">
            GAME-MANIA
          </p>
          <p className="mt-3 max-w-xs text-sm text-[var(--gm-muted)]">
            Premium UK marketplace for games, consoles, and accessories — with trade-in that pays.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gm-muted)]">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/shop"
                className="text-foreground/90 transition hover:text-[var(--gm-accent)] gm-focus rounded-sm"
              >
                Shop
              </Link>
            </li>
            <li>
              <Link
                href="/trade-in"
                className="text-foreground/90 transition hover:text-[var(--gm-accent)] gm-focus rounded-sm"
              >
                Trade-In
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="text-foreground/90 transition hover:text-[var(--gm-accent)] gm-focus rounded-sm"
              >
                Account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gm-muted)]">
            Shipping
          </p>
          <p className="mt-3 text-sm text-[var(--gm-muted)]">
            Free UK delivery on orders £60 and over.
          </p>
          <p className="mt-6 text-xs text-[var(--gm-muted)]">
            © {new Date().getFullYear()} GAME-MANIA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
