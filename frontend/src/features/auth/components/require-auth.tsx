'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLoader } from '@/components/ui/brand-loader';
import { defaultPostLoginPath, isStaffRole } from '@/lib/roles';
import { useAuth } from '@/providers/auth-provider';

const AUTH_ONLY_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
] as const;

/** Path-only sanitizer for OAuth (role unknown yet). Allows /admin deep links. */
export function sanitizeReturnPath(path: string | null | undefined, fallback = '/account'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }
  if (
    AUTH_ONLY_PREFIXES.some(
      (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
    )
  ) {
    return fallback;
  }
  return path;
}

function safeReturnUrl(
  path: string | null | undefined,
  role?: string | { name?: string } | null,
): string {
  // Staff always lands in the admin panel (one-site staff UX)
  if (isStaffRole(role)) {
    if (path && path.startsWith('/admin')) return path;
    return '/admin';
  }

  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return defaultPostLoginPath(role);
  }
  if (
    AUTH_ONLY_PREFIXES.some(
      (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
    ) ||
    path.startsWith('/admin')
  ) {
    return defaultPostLoginPath(role);
  }
  return path;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/account');
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [status, isAuthenticated, router, pathname]);

  if (status === 'loading') {
    return <BrandLoader variant="page" size="md" label="Loading account…" />;
  }

  if (!isAuthenticated) {
    return <BrandLoader variant="page" size="sm" label="Redirecting to sign in…" />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const target = safeReturnUrl(params.get('returnUrl'), user?.role);
    // Hard navigation avoids soft-nav races that leave the login page stuck on a spinner
    window.location.replace(target);
  }, [status, isAuthenticated, user?.role]);

  if (status === 'loading') {
    return <BrandLoader variant="page" size="md" label="Checking session…" />;
  }

  if (isAuthenticated) {
    return <BrandLoader variant="page" size="sm" label="Taking you there…" />;
  }

  return <>{children}</>;
}

export { safeReturnUrl };
