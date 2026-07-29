'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLoader } from '@/components/ui/brand-loader';
import { isStaffRole } from '@/lib/roles';
import { useAuth } from '@/providers/auth-provider';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const staff = isStaffRole(user?.role);

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/admin');
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!staff) {
      router.replace('/account');
    }
  }, [status, isAuthenticated, staff, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)]">
        <BrandLoader variant="inline" size="md" label="Checking staff access…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)]">
        <BrandLoader variant="inline" size="sm" label="Redirecting to sign in…" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)]">
        <BrandLoader variant="inline" size="sm" label="Staff access required…" />
      </div>
    );
  }

  return <>{children}</>;
}
