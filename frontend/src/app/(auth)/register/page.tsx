import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { RegisterForm } from '@/features/auth/components/register-form';
import { RedirectIfAuthenticated } from '@/features/auth/components/require-auth';

export const metadata: Metadata = {
  title: 'Create account',
};

function AuthFormFallback() {
  return <div className="h-56 animate-pulse rounded-md bg-[var(--gm-border)]" aria-busy="true" />;
}

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 md:px-6">
        <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Create account</h1>
        <p className="mt-2 text-sm text-[var(--gm-muted)]">
          Join GAME MANIA to checkout faster, track orders, and receive trade-in store credit.
        </p>
        <div className="mt-8 rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-5">
          <Suspense fallback={<AuthFormFallback />}>
            <RegisterForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--gm-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[var(--gm-cyan)] underline">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-wider text-[var(--gm-cyan)]">
          Code GAMEMANIA10 · 10% off online
        </p>
      </main>
    </RedirectIfAuthenticated>
  );
}
