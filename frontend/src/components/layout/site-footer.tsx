'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export function SiteFooter() {
  const { isAuthenticated, status } = useAuth();
  const showCreateAccount = status !== 'loading' && !isAuthenticated;

  return (
    <footer className="mt-auto border-t-2 border-[var(--gm-magenta)]/50 bg-black">
      <div className="gm-banner mx-auto max-w-6xl px-4 py-3 text-center text-sm md:text-base">
        Play more. Save more. GAME MANIA!
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 gm-focus rounded-sm">
            <Image
              src="/brand/game-mania-logo.png"
              alt="GAME MANIA"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
            <span className="gm-display text-xl leading-none">
              <span className="text-[var(--gm-yellow)]">GAME</span>
              <br />
              <span className="text-[var(--gm-magenta)]">MANIA</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-[var(--gm-muted)]">
            UK games, consoles & accessories — trade in for store credit or cash bank transfer.
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--gm-cyan)]">
            @gamemaniastore
          </p>
        </div>

        <div>
          <p className="gm-display text-sm text-[var(--gm-yellow)]">Explore</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li>
              <Link href="/shop" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/trade-in" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                Trade-In
              </Link>
            </li>
            <li>
              {showCreateAccount ? (
                <Link href="/register" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                  Create account
                </Link>
              ) : (
                <Link href="/account" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                  My account
                </Link>
              )}
            </li>
            <li>
              <Link href="/about" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="gm-display text-sm text-[var(--gm-yellow)]">Exclusive</p>
          <p className="mt-3 text-sm text-[var(--gm-muted)]">
            Use code{' '}
            <span className="rounded bg-[var(--gm-magenta)] px-2 py-0.5 font-bold text-white">
              GAMEMANIA10
            </span>{' '}
            for 10% off your next web order.
          </p>
          <p className="mt-4 text-sm text-[var(--gm-muted)]">Free UK delivery on orders £60+.</p>
          <p className="mt-6 text-xs text-[var(--gm-muted)]">
            © {new Date().getFullYear()} GAME MANIA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
