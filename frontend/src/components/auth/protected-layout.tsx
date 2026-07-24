'use client';

import { RequireAuth } from '@/features/auth/components/require-auth';

/**
 * Client-side protected shell. Pair with middleware (`gm_logged_in` cookie)
 * for an early redirect before React hydrates.
 */
export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
