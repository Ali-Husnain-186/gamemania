/**
 * Browser always uses same-origin `/api/v1` (Nginx → Express :5000).
 * Never call localhost from a remote user's browser.
 */
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

/** Works on HTTP IP sites where crypto.randomUUID is unavailable (non-secure context). */
function createGuestId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `gm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getGuestId(): string {
  if (!isBrowser()) return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = createGuestId();
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

  const url = `${getApiUrl()}${path}`;
  const res = await fetch(url, {
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
