import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';
import { RedirectIfAuthenticated } from '@/features/auth/components/require-auth';

export const metadata: Metadata = {
  title: 'Sign in',
};

function AuthFormFallback() {
  return <div className="h-48 animate-pulse rounded-md bg-[var(--gm-border)]" aria-busy="true" />;
}

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 md:px-6">
        <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--gm-muted)]">
          Welcome back — shop, track orders, and manage store credit.
        </p>
        <div className="mt-8 rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-5">
          <Suspense fallback={<AuthFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--gm-muted)]">
          New here?{' '}
          <Link href="/register" className="font-bold text-[var(--gm-cyan)] underline">
            Create account
          </Link>
        </p>
      </main>
    </RedirectIfAuthenticated>
  );
}
