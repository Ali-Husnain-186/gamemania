'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { defaultPostLoginPath } from '@/lib/roles';
import { useAuth } from '@/providers/auth-provider';

function safeReturnUrl(path: string | null | undefined, role?: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return defaultPostLoginPath(role);
  }
  if (path.startsWith('/login') || path.startsWith('/register')) {
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
      const returnUrl = encodeURIComponent(safeReturnUrl(pathname));
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [status, isAuthenticated, router, pathname]);

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading account">
          <div className="h-8 w-40 rounded bg-[var(--gm-border)]" />
          <div className="h-24 rounded-lg bg-[var(--gm-border)]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = safeReturnUrl(params.get('returnUrl'), user?.role);
      router.replace(returnUrl);
    }
  }, [status, isAuthenticated, user?.role, router]);

  if (status === 'loading' || isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-4">
        <div className="h-8 w-40 animate-pulse rounded bg-[var(--gm-border)]" aria-busy="true" />
      </div>
    );
  }

  return <>{children}</>;
}

export { safeReturnUrl };
