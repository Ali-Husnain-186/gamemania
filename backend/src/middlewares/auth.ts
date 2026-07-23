import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../exceptions/AppError';
import { verifyAccessToken } from '../utils/tokens';

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearer(req);
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearer(req);
    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
    next();
  } catch {
    // Invalid/expired token is ignored for optional auth
    next();
  }
}

export function requirePermissions(...codes: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasAll = codes.every((code) => req.user!.permissions.includes(code));
      if (!hasAll) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
