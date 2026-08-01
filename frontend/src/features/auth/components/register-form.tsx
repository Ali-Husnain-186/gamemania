'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api';
import { notify } from '@/lib/toast';
import { useAuth } from '@/providers/auth-provider';
import { AuthDivider, GoogleAuthButton } from '@/features/auth/components/google-auth-button';
import { safeReturnUrl } from '@/features/auth/components/require-auth';
import { registerSchema, type RegisterFormValues } from '../schemas';

export function RegisterForm() {
  const searchParams = useSearchParams();
  const { register: registerAccount } = useAuth();
  const returnUrl = searchParams.get('returnUrl');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const user = await registerAccount({
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      });
      notify.success('Account created');
      window.location.assign(safeReturnUrl(returnUrl, user.role));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      setError('root', { message });
      notify.error(message);
    }
  }

  return (
    <div>
      <GoogleAuthButton label="Sign up with Google" returnUrl={returnUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
              First name
            </span>
            <input
              autoComplete="given-name"
              className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
              {...register('firstName')}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
              Last name
            </span>
            <input
              autoComplete="family-name"
              className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
              {...register('lastName')}
            />
          </label>
        </div>

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
              autoComplete="new-password"
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
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
            Confirm password
          </span>
          <div className="relative mt-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 pr-10 text-sm gm-focus"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--gm-muted)] hover:text-[var(--gm-fg)]"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-[var(--gm-danger)]" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </label>

        {errors.root ? (
          <p className="text-sm text-[var(--gm-danger)]" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 text-sm">
          {isSubmitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
