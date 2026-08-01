'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { notify } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import { AuthDivider, GoogleAuthButton } from '@/features/auth/components/google-auth-button';
import { safeReturnUrl } from '@/features/auth/components/require-auth';
import { loginSchema, type LoginFormValues } from '../schemas';

export function LoginForm() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const returnUrl = searchParams.get('returnUrl');
  const oauthError = searchParams.get('error');
  const [showPassword, setShowPassword] = useState(false);
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
      notify.success('Welcome back');
      window.location.assign(target);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      setError('root', { message });
      notify.error(message);
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
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 pr-10 text-sm gm-focus"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--gm-muted)] hover:text-[var(--gm-fg)]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
