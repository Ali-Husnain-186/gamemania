'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCartStore } from '@/stores/cart-store';

const nav = [
  { href: '/shop', label: 'Shop' },
  { href: '/trade-in', label: 'Trade-In' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/account', label: 'Account' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAuthenticated, status, logout } = useAuth();
  const itemCount = useCartStore((s) => s.itemCount());
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isDark = !mounted || resolvedTheme !== 'light';
  const showAuthControls = mounted && status !== 'loading';
  const signedIn = showAuthControls && isAuthenticated;

  async function handleSignOut() {
    await logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--gm-cyan)]/40 bg-[var(--gm-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="relative flex items-center gap-2 gm-focus rounded-sm"
          aria-label="GAME MANIA home"
        >
          <Image
            src="/brand/game-mania-logo.png"
            alt="GAME MANIA"
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="gm-display hidden text-lg leading-none sm:inline">
            <span className="text-[var(--gm-yellow)]">GAME</span>{' '}
            <span className="text-[var(--gm-magenta)]">MANIA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-bold uppercase tracking-wide transition gm-focus rounded-sm',
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'text-[var(--gm-yellow)]'
                  : 'text-[var(--gm-muted)] hover:text-[var(--gm-cyan)]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--gm-border)] text-[var(--gm-muted)] transition hover:border-[var(--gm-cyan)] hover:text-[var(--gm-cyan)] gm-focus"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )}
          </button>

          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--gm-border)] text-[var(--gm-muted)] transition hover:border-[var(--gm-cyan)] hover:text-[var(--gm-cyan)] gm-focus"
            aria-label={`Cart${itemCount ? `, ${itemCount} items` : ''}`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {itemCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gm-magenta)] px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </Link>

          {signedIn ? (
            <>
              <Link
                href="/account"
                className="btn-cyan-outline hidden px-4 py-2 text-xs sm:inline-flex"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden px-3 py-2 text-xs font-bold uppercase tracking-wide text-[var(--gm-muted)] transition hover:text-[var(--gm-magenta)] sm:inline-flex gm-focus rounded-sm"
              >
                Sign out
              </button>
            </>
          ) : showAuthControls ? (
            <>
              <Link
                href="/login"
                className="btn-cyan-outline hidden px-4 py-2 text-xs sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-primary hidden px-4 py-2 text-xs sm:inline-flex"
              >
                Create account
              </Link>
            </>
          ) : null}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--gm-border)] text-[var(--gm-muted)] md:hidden gm-focus"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t-2 border-[var(--gm-border)] px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block text-sm font-bold uppercase gm-focus rounded-sm',
                    pathname === item.href ? 'text-[var(--gm-yellow)]' : 'text-[var(--gm-muted)]',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {signedIn ? (
              <li>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="block text-sm font-bold text-[var(--gm-magenta)] gm-focus rounded-sm"
                >
                  Sign out
                </button>
              </li>
            ) : showAuthControls ? (
              <>
                <li>
                  <Link
                    href="/login"
                    className="block text-sm font-bold text-[var(--gm-magenta)] gm-focus rounded-sm"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="block text-sm font-bold text-[var(--gm-cyan)] gm-focus rounded-sm"
                  >
                    Create account
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
