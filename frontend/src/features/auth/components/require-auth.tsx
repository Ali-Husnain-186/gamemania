'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading account">
          <div className="h-8 w-40 rounded bg-[var(--gm-border)]" />
          <div className="h-24 rounded-lg bg-[var(--gm-border)]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <p className="text-sm text-[var(--gm-muted)]">Redirecting to sign in…</p>
      </div>
    );
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
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-4">
        <div className="h-8 w-40 animate-pulse rounded bg-[var(--gm-border)]" aria-busy="true" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-4">
        <p className="text-sm text-[var(--gm-muted)]">Taking you to the shop…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export { safeReturnUrl };
