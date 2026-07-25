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
    <header className="sticky top-0 z-50 bg-[#01A6C2] shadow-[0_4px_18px_rgba(1,166,194,0.35)]">
      <div className="mx-auto flex h-[3.75rem] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[4.5rem] sm:gap-4 sm:px-4 md:px-6">
        <Link
          href="/"
          className="relative flex shrink-0 items-center overflow-hidden rounded-full outline-none focus-visible:outline-none"
          aria-label="GAME MANIA home"
        >
          <Image
            src="/brand/game-mania-logo.png"
            alt="GAME MANIA"
            width={64}
            height={64}
            className="h-11 w-11 rounded-full border-0 object-cover outline-none ring-0 sm:h-14 sm:w-14"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 md:flex lg:gap-6" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-sm text-xs font-bold uppercase tracking-wide transition gm-focus lg:text-sm',
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'text-[var(--gm-yellow)]'
                  : 'text-white/90 hover:text-white',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/45 text-white transition hover:border-white hover:bg-white/10 gm-focus"
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
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/45 text-white transition hover:border-white hover:bg-white/10 gm-focus"
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
                className="hidden rounded-full border-2 border-white px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white hover:text-[#01A6C2] sm:inline-flex"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-wide text-white/85 transition hover:text-[var(--gm-yellow)] sm:inline-flex gm-focus"
              >
                Sign out
              </button>
            </>
          ) : showAuthControls ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-full border-2 border-white px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white hover:text-[#01A6C2] sm:inline-flex"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/45 text-white md:hidden gm-focus"
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
          className="border-t-2 border-white/20 bg-[#01A6C2] px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wide gm-focus',
                    pathname === item.href
                      ? 'bg-black/15 text-[var(--gm-yellow)]'
                      : 'text-white/90 hover:bg-white/10 hover:text-white',
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
                  className="block w-full rounded-lg px-3 py-3 text-left text-sm font-bold text-[var(--gm-yellow)] gm-focus"
                >
                  Sign out
                </button>
              </li>
            ) : showAuthControls ? (
              <>
                <li>
                  <Link
                    href="/login"
                    className="block rounded-lg px-3 py-3 text-sm font-bold text-white gm-focus"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="block rounded-lg px-3 py-3 text-sm font-bold text-[var(--gm-yellow)] gm-focus"
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
