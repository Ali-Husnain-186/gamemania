const ACCESS_TOKEN_KEY = 'gm_access_token';
const GUEST_ID_KEY = 'gm_guest_id';

/**
 * Resolve API base URL at call time.
 *
 * Behind Nginx (`/api` → :5000), the browser must use same-origin `/api/v1`.
 * A baked-in `http://localhost:5000/...` breaks remote users (request never hits the VPS).
 */
export function getApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    if (!configured || /localhost|127\.0\.0\.1/i.test(configured)) {
      return '/api/v1';
    }
    return configured;
  }

  if (configured && !configured.startsWith('/')) {
    return configured;
  }

  return (process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:5000/api/v1').replace(/\/$/, '');
}

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  success: true;
  data: T;
  meta?: unknown;
};

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
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
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

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

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
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
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

export function apiGet<T>(
  path: string,
  init?: Omit<RequestOptions, 'body' | 'method'>,
): Promise<T> {
  return request<T>(path, { ...init, method: 'GET' });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  init?: Omit<RequestOptions, 'body' | 'method'>,
): Promise<T> {
  return request<T>(path, { ...init, method: 'POST', body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: Omit<RequestOptions, 'body' | 'method'>,
): Promise<T> {
  return request<T>(path, { ...init, method: 'PATCH', body });
}

export function apiDelete<T>(
  path: string,
  init?: Omit<RequestOptions, 'body' | 'method'>,
): Promise<T> {
  return request<T>(path, { ...init, method: 'DELETE' });
}
