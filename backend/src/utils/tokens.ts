import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/auth';
import { UnauthorizedError } from '../exceptions/AppError';

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Opaque refresh token (random bytes), not a JWT */
export function signRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded !== 'object' || decoded === null) {
      throw new UnauthorizedError('Invalid access token');
    }

    const { sub, email, role, permissions } = decoded as Partial<JwtPayload>;
    if (
      typeof sub !== 'string' ||
      typeof email !== 'string' ||
      typeof role !== 'string' ||
      !Array.isArray(permissions)
    ) {
      throw new UnauthorizedError('Invalid access token payload');
    }

    return {
      sub,
      email,
      role,
      permissions: permissions.filter((p): p is string => typeof p === 'string'),
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

/** Parse duration strings like `15m`, `7d` into milliseconds */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)([smhd])$/i.exec(input.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * (multipliers[unit] ?? 86_400_000);
}
