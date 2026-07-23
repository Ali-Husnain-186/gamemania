'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ApiError, apiPost, setAccessToken } from '@/lib/api';
import { registerSchema, type RegisterFormValues } from '../schemas';

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const data = await apiPost<{ accessToken: string }>('/auth/register', {
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      });
      setAccessToken(data.accessToken);
      router.push('/account');
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Registration failed',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">
            First name
          </span>
          <input
            autoComplete="given-name"
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-sm gm-focus"
            {...register('firstName')}
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--gm-muted)]">Last name</span>
          <input
            autoComplete="family-name"
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2 text-sm gm-focus"
            {...register('lastName')}
          />
        </label>
      </div>

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
          autoComplete="new-password"
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
        {isSubmitting ? 'Creating…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-[var(--gm-muted)]">
        Already registered?{' '}
        <Link
          href="/login"
          className="text-[var(--gm-accent)] underline-offset-2 hover:underline gm-focus rounded-sm"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
