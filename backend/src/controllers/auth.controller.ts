import type { Request, Response, NextFunction } from 'express';
import { COOKIE_NAMES } from '../config/constants';
import { env } from '../config/env';
import { created, ok } from '../utils/apiResponse';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies';
import * as authService from '../services/auth.service';
import * as googleAuthService from '../services/google-auth.service';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validators';

function sessionMeta(req: Request) {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  };
}

function safeFrontendReturn(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return '/account';
  return path;
}

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as RegisterInput;
    const result = await authService.register(body, sessionMeta(req));
    setRefreshCookie(res, result.refreshToken);
    created(res, { user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as LoginInput;
    const result = await authService.login(body, sessionMeta(req));
    setRefreshCookie(res, result.refreshToken);
    ok(res, { user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[COOKIE_NAMES.refreshToken] as string | undefined;
    const result = await authService.refresh(token, sessionMeta(req));
    setRefreshCookie(res, result.refreshToken);
    ok(res, { user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[COOKIE_NAMES.refreshToken] as string | undefined;
    await authService.logout(req.user!.id, token);
    clearRefreshCookie(res);
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.me(req.user!.id);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ForgotPasswordInput;
    const result = await authService.requestPasswordReset(body);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ResetPasswordInput;
    const result = await authService.resetPassword(body);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function googleStartController(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const returnUrl = typeof req.query.returnUrl === 'string' ? req.query.returnUrl : '/account';
    const url = googleAuthService.getGoogleAuthorizeUrl(safeFrontendReturn(returnUrl));
    res.redirect(url);
  } catch (err) {
    if (env.NODE_ENV !== 'production') {
      console.error('[auth/google] authorize url failed:', err);
    }
    const returnUrl =
      typeof req.query.returnUrl === 'string'
        ? safeFrontendReturn(req.query.returnUrl)
        : '/account';
    const target = new URL('/login', env.FRONTEND_URL);
    target.searchParams.set('error', 'google_unavailable');
    target.searchParams.set('returnUrl', returnUrl);
    res.redirect(target.toString());
  }
}

export async function googleCallbackController(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const returnUrl = googleAuthService.decodeOAuthState(
      typeof req.query.state === 'string' ? req.query.state : undefined,
    );

    if (typeof req.query.error === 'string') {
      const target = new URL('/login', env.FRONTEND_URL);
      target.searchParams.set('error', 'google_denied');
      target.searchParams.set('returnUrl', returnUrl);
      res.redirect(target.toString());
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    if (!code) {
      const target = new URL('/login', env.FRONTEND_URL);
      target.searchParams.set('error', 'google_failed');
      target.searchParams.set('returnUrl', returnUrl);
      res.redirect(target.toString());
      return;
    }

    const result = await googleAuthService.loginWithGoogleCode(code, sessionMeta(req));
    setRefreshCookie(res, result.refreshToken);

    const target = new URL('/auth/callback', env.FRONTEND_URL);
    target.searchParams.set('accessToken', result.accessToken);
    target.searchParams.set('returnUrl', returnUrl);
    res.redirect(target.toString());
  } catch {
    const returnUrl = googleAuthService.decodeOAuthState(
      typeof req.query.state === 'string' ? req.query.state : undefined,
    );
    const target = new URL('/login', env.FRONTEND_URL);
    target.searchParams.set('error', 'google_failed');
    target.searchParams.set('returnUrl', returnUrl);
    res.redirect(target.toString());
  }
}
