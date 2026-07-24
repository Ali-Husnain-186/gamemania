'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isStaffRole } from '@/lib/roles';
import { useAuth } from '@/providers/auth-provider';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/admin');
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!isStaffRole(user?.role)) {
      router.replace('/account');
    }
  }, [status, isAuthenticated, user?.role, router, pathname]);

  if (status === 'loading' || !isAuthenticated || !isStaffRole(user?.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)] text-[var(--admin-muted)]">
        Checking staff access…
      </div>
    );
  }

  return <>{children}</>;
}
