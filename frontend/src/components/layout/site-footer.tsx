'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

const quickLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/trade-in', label: 'Trade-In' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/account', label: 'My account' },
];

const supportLinks = [
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQs' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'Shipping info' },
];

const legalLinks = [
  { href: '/about', label: 'Privacy Policy' },
  { href: '/about', label: 'Terms & Conditions' },
];

export function SiteFooter() {
  const { isAuthenticated, status } = useAuth();
  const showCreateAccount = status !== 'loading' && !isAuthenticated;

  return (
    <footer className="mt-auto border-t-2 border-[var(--gm-magenta)]/45 bg-black">
      <div className="gm-banner mx-auto max-w-6xl px-4 py-3 text-center text-sm md:text-base">
        Play more. Save more. GAME MANIA!
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 gm-focus rounded-sm">
            <Image
              src="/brand/game-mania-logo.png"
              alt="GAME MANIA"
              width={56}
              height={56}
              className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            />
            <span className="gm-display text-lg leading-none sm:text-xl">
              <span className="text-[var(--gm-yellow)]">GAME</span>
              <br />
              <span className="text-[var(--gm-magenta)]">MANIA</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--gm-muted)]">
            UK games, consoles & accessories — plus trade-ins for store credit or cash.
          </p>
          <div className="mt-4 flex gap-3">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Social link"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gm-border)] text-[var(--gm-muted)] transition hover:border-[var(--gm-cyan)] hover:text-[var(--gm-cyan)]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="gm-display text-sm text-[var(--gm-yellow)]">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              {showCreateAccount ? (
                <Link href="/register" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                  Create account
                </Link>
              ) : (
                <Link
                  href="/account/orders"
                  className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm"
                >
                  Orders
                </Link>
              )}
            </li>
          </ul>
        </div>

        <div>
          <p className="gm-display text-sm text-[var(--gm-yellow)]">Customer support</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {supportLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/trade-in" className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                Trade-In help
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="gm-display text-sm text-[var(--gm-yellow)]">Legal</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[var(--gm-cyan)] gm-focus rounded-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
            We accept
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Visa', 'Mastercard', 'PayPal', 'Apple Pay'].map((p) => (
              <span
                key={p}
                className="rounded-md border border-[var(--gm-border)] bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--gm-muted)]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--gm-border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-[var(--gm-muted)] sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p>© {new Date().getFullYear()} GAME MANIA. All rights reserved.</p>
          <p className="font-bold text-[var(--gm-cyan)]">@gamemaniastore</p>
        </div>
      </div>
    </footer>
  );
}
