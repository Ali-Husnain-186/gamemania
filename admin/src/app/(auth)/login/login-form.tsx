'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost, ApiError } from '@/lib/api';
import { isAuthenticated, saveTokens } from '@/lib/auth';

const STAFF_ROLES = new Set(['STAFF', 'ADMIN', 'SUPER_ADMIN']);

type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string;
    role?: string | { name?: string };
  };
};

function resolveRole(user: LoginResponse['user']): string {
  if (!user?.role) return '';
  return typeof user.role === 'string' ? user.role : (user.role.name ?? '');
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const next = searchParams.get('next') || '/';
      router.replace(next.startsWith('/') ? next : '/');
    }
  }, [router, searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiPost<LoginResponse>(
        '/auth/login',
        { email, password },
        { auth: false },
      );

      const role = resolveRole(data.user).toUpperCase();
      if (role === 'CUSTOMER' || (role && !STAFF_ROLES.has(role))) {
        setError('Customer accounts cannot access the admin panel.');
        return;
      }

      const accessToken = data.accessToken ?? data.token;
      if (!accessToken) {
        setError('Login succeeded but no access token was returned.');
        return;
      }

      saveTokens(accessToken, data.refreshToken);
      const next = searchParams.get('next') || '/';
      router.replace(next.startsWith('/') ? next : '/');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to sign in. Check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(800px 400px at 20% -10%, rgba(91,140,255,0.18), transparent 55%), radial-gradient(600px 320px at 90% 10%, rgba(91,140,255,0.08), transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-8 shadow-2xl shadow-black/40">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-accent)]">
          Staff access
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">GAME-MANIA Admin</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Sign in with a staff, admin, or super-admin account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--admin-muted)]">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--admin-accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--admin-muted)]">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--admin-accent)]"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-[#0b1020] transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
