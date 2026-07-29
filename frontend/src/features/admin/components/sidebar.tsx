'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  RefreshCw,
  Truck,
  Settings,
  FileText,
  MessageSquare,
  LogOut,
  Tags,
  Award,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/brands', label: 'Brands', icon: Award },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/trade-ins', label: 'Trade-ins', icon: RefreshCw },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/cms', label: 'CMS', icon: FileText },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
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
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    window.location.assign('/');
  }

  const brand = (
    <div className="border-b border-[var(--admin-border)] px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-accent)]">
        Admin
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight">GAME-MANIA</p>
      {user?.email ? (
        <p className="mt-2 truncate text-xs text-[var(--admin-muted)]">{user.email}</p>
      ) : null}
    </div>
  );

  const logoutBtn = (
    <div className="border-t border-[var(--admin-border)] p-3">
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--admin-muted)] transition-colors hover:bg-white/5 hover:text-[var(--admin-fg)]"
      >
        <LogOut className="size-4 shrink-0" />
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-3 lg:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--admin-border)] text-[var(--admin-fg)]"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <p className="text-sm font-semibold tracking-tight">GAME-MANIA Admin</p>
        <div className="w-10" />
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-[var(--admin-panel)] text-[var(--admin-fg)] shadow-xl">
            {brand}
            <NavLinks onNavigate={() => setOpen(false)} />
            {logoutBtn}
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-fg)] lg:flex">
        {brand}
        <NavLinks />
        {logoutBtn}
      </aside>
    </>
  );
}
