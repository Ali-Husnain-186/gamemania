import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { RedirectIfAuthenticated } from '@/features/auth/components/require-auth';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <RedirectIfAuthenticated>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 md:px-6">
        <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Forgot password</h1>
        <p className="mt-2 text-sm text-[var(--gm-muted)]">
          Enter your account email and we will send a reset link.
        </p>
        <div className="mt-8 rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-5">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--gm-muted)]">
          Remembered it?{' '}
          <Link href="/login" className="font-bold text-[var(--gm-cyan)] underline">
            Sign in
          </Link>
        </p>
      </main>
    </RedirectIfAuthenticated>
  );
}
