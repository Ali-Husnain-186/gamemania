'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]);

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PATHS.has(pathname) || pathname.startsWith('/auth/');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAuthRoute || isAdminRoute) {
    return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
