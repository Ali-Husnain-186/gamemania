import type { CookieOptions, Response } from 'express';
import { COOKIE_NAMES } from '../config/constants';
import { env } from '../config/env';
import { parseDurationMs } from './tokens';

export function refreshCookieOptions(): CookieOptions {
  const maxAge = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge,
  };

  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost') {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAMES.refreshToken, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.refreshToken, {
    ...refreshCookieOptions(),
    maxAge: 0,
  });
}
