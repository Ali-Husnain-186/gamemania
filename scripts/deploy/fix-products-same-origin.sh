#!/usr/bin/env bash
# ONE-SHOT: fix shop products on VPS (no git required). Run as root.
set -euo pipefail
cd /var/www/gamemania

echo "==> Writing frontend/.env.local"
sudo -u deploy tee frontend/.env.local >/dev/null <<'EOF'
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_SITE_URL=http://168.231.113.138:8080
EOF

echo "==> Patching CORS"
if grep -q '^CORS_ORIGINS=' backend/.env; then
  sudo -u deploy sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=http://168.231.113.138:8080|' backend/.env
else
  echo 'CORS_ORIGINS=http://168.231.113.138:8080' | sudo -u deploy tee -a backend/.env >/dev/null
fi

echo "==> Overwriting frontend/src/lib/api.ts (browser ALWAYS /api/v1)"
sudo -u deploy tee frontend/src/lib/api.ts >/dev/null <<'EOF'
/** Browser always uses same-origin /api/v1 (Nginx → Express :5000). */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
  if (configured && !configured.startsWith('/')) {
    return configured;
  }
  return (process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:5000/api/v1').replace(/\/$/, '');
}

const ACCESS_TOKEN_KEY = 'gm_access_token';
const GUEST_ID_KEY = 'gm_guest_id';

export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

export type ApiSuccessBody<T> = { success: true; data: T; meta?: unknown };

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (!isBrowser()) return;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getGuestId(): string {
  if (!isBrowser()) return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const guestId = getGuestId();
  if (guestId && !headers.has('X-Guest-Id')) {
    headers.set('X-Guest-Id', guestId);
  }
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
    cache: 'no-store',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try { json = JSON.parse(text) as unknown; } catch { json = null; }
  }
  if (!res.ok) {
    const err = json as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      err?.error?.message ?? `API ${res.status}: ${path}`,
      err?.error?.code,
      err?.error?.details,
    );
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as ApiSuccessBody<T>).data;
  }
  return json as T;
}

export function apiGet<T>(path: string, init?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
  return request<T>(path, { ...init, method: 'GET' });
}
export function apiPost<T>(path: string, body?: unknown, init?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
  return request<T>(path, { ...init, method: 'POST', body });
}
export function apiPatch<T>(path: string, body?: unknown, init?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
  return request<T>(path, { ...init, method: 'PATCH', body });
}
export function apiDelete<T>(path: string, init?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
  return request<T>(path, { ...init, method: 'DELETE' });
}
EOF

echo "==> next.config without standalone + API rewrite"
sudo -u deploy tee frontend/next.config.ts >/dev/null <<'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const internal =
      process.env.INTERNAL_API_ORIGIN?.replace(/\/$/, '') || 'http://127.0.0.1:5000';
    return [{ source: '/api/:path*', destination: `${internal}/api/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
EOF

echo "==> Rebuild frontend (REQUIRED)"
sudo -u deploy bash -lc 'cd /var/www/gamemania && npm run build --workspace=frontend'

echo "==> Restart PM2"
su - deploy -c 'pm2 restart all --update-env'
sleep 5
su - deploy -c 'pm2 status'

echo "==> Verify API via Nginx"
curl -sS 'http://127.0.0.1:8080/api/v1/products?limit=1' | head -c 300
echo
echo
echo "DONE. Hard refresh http://168.231.113.138:8080/shop"
echo "Network tab MUST show: /api/v1/products  (same host :8080)"
echo "If UI still says 'API running on :5000' the rebuild did not apply."
