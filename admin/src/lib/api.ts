import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

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

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
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

export { API_URL };
