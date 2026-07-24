'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError, apiPatch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import type { User } from '@/types/auth';

const profileSchema = z.object({
  firstName: z.string().max(60),
  lastName: z.string().max(60),
  phone: z.string().max(30),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, setUser, refreshUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setError,
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      const data = await apiPatch<{ user: User }>('/users/me', {
        firstName: values.firstName.trim() || null,
        lastName: values.lastName.trim() || null,
        phone: values.phone.trim() || null,
      });
      setUser(data.user);
      reset({
        firstName: data.user.firstName ?? '',
        lastName: data.user.lastName ?? '',
        phone: data.user.phone ?? '',
      });
      await refreshUser();
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Could not update profile',
      });
    }
  }

  return (
    <div>
      <h1 className="gm-display text-4xl text-[var(--gm-yellow)]">Profile</h1>
      <p className="mt-2 text-sm text-[var(--gm-muted)]">Update your name and phone number.</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 max-w-md space-y-4 rounded-2xl border-2 border-[var(--gm-magenta)] bg-black/40 p-5"
        noValidate
      >
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
            Email
          </span>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/50 px-3 py-2.5 text-sm text-[var(--gm-muted)]"
          />
        </label>

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
            {errors.firstName ? (
              <p className="mt-1 text-xs text-[var(--gm-danger)]">{errors.firstName.message}</p>
            ) : null}
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
            {errors.lastName ? (
              <p className="mt-1 text-xs text-[var(--gm-danger)]">{errors.lastName.message}</p>
            ) : null}
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--gm-muted)]">
            Phone
          </span>
          <input
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-md border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-3 py-2.5 text-sm gm-focus"
            {...register('phone')}
          />
          {errors.phone ? (
            <p className="mt-1 text-xs text-[var(--gm-danger)]">{errors.phone.message}</p>
          ) : null}
        </label>

        {errors.root ? (
          <p className="text-sm text-[var(--gm-danger)]" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
