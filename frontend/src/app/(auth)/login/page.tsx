import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12 md:px-6">
      <h1 className="gm-display text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">Welcome back to GAME-MANIA.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
