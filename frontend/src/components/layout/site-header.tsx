'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';

const nav = [
  { href: '/shop', label: 'Shop' },
  { href: '/trade-in', label: 'Trade-In' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/account', label: 'Account' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
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

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--gm-border)]/80 bg-[var(--gm-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="gm-display text-sm font-semibold tracking-[0.2em] text-[var(--gm-accent)] gm-focus rounded-sm"
        >
          GAME-MANIA
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm transition gm-focus rounded-sm',
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'text-foreground'
                  : 'text-[var(--gm-muted)] hover:text-foreground',
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gm-border)] text-[var(--gm-muted)] transition hover:text-foreground gm-focus"
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
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gm-border)] text-[var(--gm-muted)] transition hover:text-foreground gm-focus"
            aria-label={`Cart${itemCount ? `, ${itemCount} items` : ''}`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {itemCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gm-accent)] px-1 text-[10px] font-bold text-[#042016]">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </Link>

          <Link
            href="/login"
            className="hidden rounded-md bg-[var(--gm-accent)] px-3 py-2 text-xs font-semibold text-[#042016] transition hover:brightness-110 gm-focus sm:inline-flex"
          >
            Sign in
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gm-border)] text-[var(--gm-muted)] md:hidden gm-focus"
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
          className="border-t border-[var(--gm-border)] px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block text-sm gm-focus rounded-sm',
                    pathname === item.href ? 'text-foreground' : 'text-[var(--gm-muted)]',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block text-sm text-[var(--gm-accent)] gm-focus rounded-sm"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
