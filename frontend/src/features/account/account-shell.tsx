'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ProtectedLayout } from '@/components/auth/protected-layout';
import { useAuth } from '@/providers/auth-provider';

const accountNav = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/wishlist', label: 'Wishlist' },
];

function titleForPath(pathname: string): string {
  if (pathname.startsWith('/account/orders/')) return 'Order detail';
  const match = accountNav.find((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label === 'Overview' ? 'My account' : (match?.label ?? 'My account');
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  useEffect(() => {
    document.title = `${titleForPath(pathname)} | GAME MANIA`;
  }, [pathname]);

  async function handleSignOut() {
    await logout();
    window.location.assign('/');
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <aside className="w-full shrink-0 md:w-52">
            <p className="gm-display text-sm text-[var(--gm-yellow)]">My account</p>
            <nav
              className="mt-4 flex flex-row flex-wrap gap-2 md:flex-col md:gap-1"
              aria-label="Account"
            >
              {accountNav.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide transition gm-focus',
                      active
                        ? 'bg-[var(--gm-magenta)]/20 text-[var(--gm-yellow)]'
                        : 'text-[var(--gm-muted)] hover:text-[var(--gm-cyan)]',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-md px-3 py-2 text-left text-sm font-bold uppercase tracking-wide text-[var(--gm-muted)] transition hover:text-[var(--gm-magenta)] gm-focus"
              >
                Sign out
              </button>
            </nav>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
