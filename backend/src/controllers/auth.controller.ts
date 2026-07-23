import type { Request, Response, NextFunction } from 'express';
import { COOKIE_NAMES } from '../config/constants';
import { created, ok } from '../utils/apiResponse';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies';
import * as authService from '../services/auth.service';
import type { LoginInput, RegisterInput } from '../validators/auth.validators';

function sessionMeta(req: Request) {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  };
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
