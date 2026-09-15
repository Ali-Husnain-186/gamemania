import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandLoader } from '@/components/ui/brand-loader';
import { AuthSwitchLink } from '@/features/auth/components/auth-switch-link';
import { RegisterForm } from '@/features/auth/components/register-form';
import { RedirectIfAuthenticated } from '@/features/auth/components/require-auth';
import { PromoCodeHint } from '@/features/home/components/promo-code-hint';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 md:px-6">
        <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Create account</h1>
        <p className="mt-2 text-sm text-[var(--gm-muted)]">
          Join GAME MANIA to checkout faster, track orders, and receive trade-in store credit.
        </p>
        <div className="mt-8 rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-5">
          <Suspense fallback={<BrandLoader variant="inline" size="sm" label="Loading…" />}>
            <RegisterForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--gm-muted)]">
          Already have an account?{' '}
          <Suspense fallback={<span className="font-bold text-[var(--gm-cyan)]">Sign in</span>}>
            <AuthSwitchLink href="/login">Sign in</AuthSwitchLink>
          </Suspense>
        </p>
        <PromoCodeHint className="mt-4 text-center text-xs font-bold uppercase tracking-wider text-[var(--gm-cyan)]" />
      </main>
    </RedirectIfAuthenticated>
  );
}
