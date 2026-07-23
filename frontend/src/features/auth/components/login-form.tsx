'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ApiError, apiPost, setAccessToken } from '@/lib/api';
import { loginSchema, type LoginFormValues } from '../schemas';

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const data = await apiPost<{ accessToken: string }>('/auth/login', values);
      setAccessToken(data.accessToken);
      await apiPost('/cart/merge').catch(() => undefined);
      router.push('/account');
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Login failed',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">Email</span>
        <input
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-sm gm-focus"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-[var(--gm-danger)]" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-sm gm-focus"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <p className="mt-1 text-xs text-[var(--gm-danger)]" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </label>

      {errors.root ? (
        <p className="text-sm text-[var(--gm-danger)]" role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--gm-accent)] px-4 py-2.5 text-sm font-semibold text-[#042016] transition hover:brightness-110 disabled:opacity-60 gm-focus"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-[var(--gm-muted)]">
        New here?{' '}
        <Link
          href="/register"
          className="text-[var(--gm-accent)] underline-offset-2 hover:underline gm-focus rounded-sm"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
