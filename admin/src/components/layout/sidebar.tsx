'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  RefreshCw,
  Truck,
  Settings,
  LogOut,
} from 'lucide-react';
import { clearTokens } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/trade-ins', label: 'Trade-ins', icon: RefreshCw },
  { href: '/shipping', label: 'Shipping', icon: Truck },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.replace('/login');
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <div className="border-b border-[var(--admin-border)] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-accent)]">
          Admin
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight">GAME-MANIA</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[var(--admin-accent)]/15 text-[var(--admin-fg)]'
                  : 'text-[var(--admin-muted)] hover:bg-white/5 hover:text-[var(--admin-fg)]',
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--admin-border)] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--admin-muted)] transition-colors hover:bg-white/5 hover:text-[var(--admin-fg)]"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
