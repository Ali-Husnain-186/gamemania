'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type AuthSwitchLinkProps = {
  href: '/login' | '/register';
  children: React.ReactNode;
};

/** Preserves returnUrl when switching between login and register. */
export function AuthSwitchLink({ href, children }: AuthSwitchLinkProps) {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const to = returnUrl ? `${href}?returnUrl=${encodeURIComponent(returnUrl)}` : href;

  return (
    <Link href={to} className="font-bold text-[var(--gm-cyan)] underline">
      {children}
    </Link>
  );
}
