'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/auth/');

  if (isAdminRoute) {
    return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      {isAuthRoute ? null : <SiteFooter />}
    </>
  );
}
