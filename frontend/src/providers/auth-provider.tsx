'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, apiGet, apiPost, getAccessToken, setAccessToken } from '@/lib/api';
import { clearLoggedInCookie, setLoggedInCookie } from '@/lib/auth-cookie';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function unwrapUser(data: User | { user: User }): User {
  if (data && typeof data === 'object' && 'user' in data) {
    return data.user;
  }
  return data as User;
}

async function mergeCart(): Promise<void> {
  await apiPost('/cart/merge').catch(() => undefined);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const clearSession = useCallback(() => {
    setAccessToken(null);
    clearLoggedInCookie();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const establishSession = useCallback((accessToken: string, nextUser: User) => {
    setAccessToken(accessToken);
    setLoggedInCookie(nextUser.role);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const loadUser = useCallback(async (): Promise<User | null> => {
    const token = getAccessToken();
    if (!token) {
      clearLoggedInCookie();
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }

    try {
      const data = await apiGet<User | { user: User }>('/auth/me');
      const next = unwrapUser(data);
      setLoggedInCookie(next.role);
      setUser(next);
      setStatus('authenticated');
      return next;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        try {
          const refreshed = await apiPost<AuthResponse>('/auth/refresh');
          establishSession(refreshed.accessToken, refreshed.user);
          return refreshed.user;
        } catch {
          clearSession();
          return null;
        }
      }
      clearSession();
      return null;
    }
  }, [clearSession, establishSession]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (input: LoginInput) => {
      const data = await apiPost<AuthResponse>('/auth/login', input);
      establishSession(data.accessToken, data.user);
      // Do not block login UX on cart merge (can feel like a stuck spinner)
      void mergeCart();
      return data.user;
    },
    [establishSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await apiPost<AuthResponse>('/auth/register', input);
      establishSession(data.accessToken, data.user);
      void mergeCart();
      return data.user;
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // still clear local session
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      login,
      register,
      logout,
      refreshUser: loadUser,
      setUser,
    }),
    [user, status, login, register, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
