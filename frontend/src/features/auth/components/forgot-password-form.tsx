'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiPost, ApiError } from '@/lib/api';
import { notify } from '@/lib/toast';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas';

export function ForgotPasswordForm() {
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      setDoneMessage(null);
      const res = await apiPost<{ message: string }>('/auth/forgot-password', {
        email: values.email.trim().toLowerCase(),
      });
      setDoneMessage(
        res.message || 'If an account exists for that email, we have sent a password reset link.',
      );
      notify.success('Check your email for the reset link');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send reset email';
      setError('root', { message });
      notify.error(message);
    }
  }

  if (doneMessage) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-[var(--gm-cyan)]/40 bg-[rgba(1,166,194,0.1)] px-4 py-3 text-sm text-[var(--gm-cyan)]">
          {doneMessage}
        </p>
        <Link
          href="/login"
          className="btn-primary inline-flex w-full justify-center py-2.5 text-sm"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
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

      {errors.root ? (
        <p className="text-sm text-[var(--gm-danger)]" role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 text-sm">
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
