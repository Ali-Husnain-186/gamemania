import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12 md:px-6">
      <h1 className="gm-display text-3xl font-bold">Create account</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">
        Join GAME-MANIA for faster checkout and trade-ins.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </main>
  );
}
