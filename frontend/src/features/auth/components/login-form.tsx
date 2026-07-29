'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { AuthDivider, GoogleAuthButton } from '@/features/auth/components/google-auth-button';
import { safeReturnUrl } from '@/features/auth/components/require-auth';
import { loginSchema, type LoginFormValues } from '../schemas';

export function LoginForm() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const returnUrl = searchParams.get('returnUrl');
  const oauthError = searchParams.get('error');
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
      const user = await login(values);
      const target = safeReturnUrl(returnUrl, user.role);
      window.location.assign(target);
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Login failed',
      });
    }
  }

  return (
    <div>
      <GoogleAuthButton label="Sign in with Google" returnUrl={returnUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
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
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-[var(--gm-danger)]" role="alert">
              {errors.password.message}
            </p>
          ) : null}
          <p className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[var(--gm-cyan)] underline"
            >
              Forgot password?
            </Link>
          </p>
        </label>

        {oauthError ? (
          <p className="text-sm text-[var(--gm-danger)]" role="alert">
            {oauthError === 'google_unavailable'
              ? 'Google sign-in is not configured on the server yet.'
              : 'Google sign-in was cancelled or failed. Try again or use email.'}
          </p>
        ) : null}

        {errors.root ? (
          <p className="text-sm text-[var(--gm-danger)]" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 text-sm">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
