'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Heart,
  Home,
  LogIn,
  Mail,
  Menu,
  Moon,
  RefreshCcw,
  Search,
  ShoppingBag,
  Store,
  Sun,
  User,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { BrandWordmark } from '@/components/brand/brand-wordmark';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCartStore } from '@/stores/cart-store';

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/trade-in', label: 'Trade-In', icon: RefreshCcw },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account', label: 'Account', icon: User },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAuthenticated, status, logout } = useAuth();
  const itemCount = useCartStore((s) => s.itemCount());
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
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
    window.location.assign('/');
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-[#01A6C2] shadow-[0_4px_18px_rgba(1,166,194,0.35)]">
      {/* Main nav row — no search here */}
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-2.5 sm:h-[5rem] sm:gap-3 sm:px-4 md:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-1.5 gm-focus sm:gap-2.5"
          aria-label="GameMania UK home"
        >
          <Image
            src="/brand/game-mania-logo.png"
            alt=""
            width={96}
            height={96}
            className="h-14 w-14 shrink-0 object-contain sm:h-[4.75rem] sm:w-[4.75rem] md:h-[5.25rem] md:w-[5.25rem]"
            priority
          />
          <BrandWordmark
            showUk
            className="hidden whitespace-nowrap text-[1.15rem] [text-shadow:0_1px_0_#000] md:inline md:text-[1.55rem] lg:text-[1.85rem]"
            gameClassName="[text-shadow:0_1px_0_#000]"
            maniaClassName="[text-shadow:0_1px_0_#000]"
            ukClassName="[text-shadow:0_1px_0_#000]"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-4 xl:flex xl:gap-5" aria-label="Primary">
          {nav
            .filter((item) => item.href !== '/')
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-sm text-xs font-bold uppercase tracking-wide transition gm-focus lg:text-sm',
                  pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(`${item.href}/`))
                    ? 'text-[var(--gm-yellow)]'
                    : 'text-white/90 hover:text-white',
                )}
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 xl:ml-0">
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/45 text-white transition hover:border-white hover:bg-white/10 sm:h-9 sm:w-9 gm-focus"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            ) : (
              <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            )}
          </button>

          <Link
            href="/cart"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/45 text-white transition hover:border-white hover:bg-white/10 sm:h-9 sm:w-9 gm-focus"
            aria-label={`Cart${itemCount ? `, ${itemCount} items` : ''}`}
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            {mounted && itemCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gm-magenta)] px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </Link>

          {signedIn ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-full border-2 border-white px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-white hover:text-[#01A6C2] md:inline-flex"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden rounded-sm px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-white/85 transition hover:text-[var(--gm-yellow)] md:inline-flex gm-focus"
              >
                Sign out
              </button>
            </>
          ) : showAuthControls ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-full border-2 border-white px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-white hover:text-[#01A6C2] md:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full border border-white/50 px-2 py-1 text-[10px] font-semibold text-white/90 transition hover:border-white hover:bg-white/10 md:inline-flex"
              >
                Create account
              </Link>
            </>
          ) : null}

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/45 text-white xl:hidden sm:h-9 sm:w-9 gm-focus"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            ) : (
              <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Search strip — always directly under the navbar */}
      <div className="border-t border-white/25 bg-[#0196b0] px-3 py-2.5 sm:px-4 sm:py-3">
        <form
          onSubmit={onSearch}
          className="mx-auto flex max-w-6xl items-center gap-2"
          role="search"
        >
          <label className="sr-only" htmlFor="header-search">
            Search
          </label>
          <input
            id="header-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, consoles, accessories…"
            className="min-h-10 min-w-0 flex-1 rounded-lg border-2 border-white/40 bg-black/20 px-3.5 py-2 text-sm text-white placeholder:text-white/65 focus:border-white focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--gm-yellow)] px-4 text-sm font-extrabold text-black"
          >
            <Search className="h-4 w-4" aria-hidden />
            Search
          </button>
        </form>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t-2 border-white/20 bg-[#01A6C2] px-4 py-4 xl:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold uppercase tracking-wide gm-focus',
                      active
                        ? 'bg-black/15 text-[var(--gm-yellow)]'
                        : 'text-white/90 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {signedIn ? (
              <li>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-[var(--gm-yellow)] gm-focus"
                >
                  <LogIn className="h-4 w-4 shrink-0 rotate-180" aria-hidden />
                  Sign out
                </button>
              </li>
            ) : showAuthControls ? (
              <li>
                <Link
                  href="/login"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white gm-focus"
                >
                  <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                  Sign in
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
