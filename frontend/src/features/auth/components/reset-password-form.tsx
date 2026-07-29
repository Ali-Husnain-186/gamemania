'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiPost, ApiError } from '@/lib/api';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--gm-danger)]" role="alert">
          This reset link is missing or invalid. Request a new one from the forgot password page.
        </p>
        <Link
          href="/forgot-password"
          className="btn-primary inline-flex w-full justify-center py-2.5 text-sm"
        >
          Request new link
        </Link>
      </div>
    );
  }

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await apiPost<{ message: string }>('/auth/reset-password', {
        token,
        password: values.password,
      });
      setDone(true);
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Could not reset password',
      });
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-[var(--gm-cyan)]/40 bg-[rgba(1,166,194,0.1)] px-4 py-3 text-sm text-[var(--gm-cyan)]">
          Password updated. You can sign in with your new password.
        </p>
        <Link
          href="/login"
          className="btn-primary inline-flex w-full justify-center py-2.5 text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
          New password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
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
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
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
        {isSubmitting ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
