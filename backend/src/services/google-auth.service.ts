import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { UnauthorizedError, ValidationError } from '../exceptions/AppError';
import { toPublicUser, userRoleInclude } from '../dto/user.dto';
import { hashToken, parseDurationMs, signAccessToken, signRefreshToken } from '../utils/tokens';

type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

type GoogleProfile = {
  googleId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
};

async function findCustomerRoleId(): Promise<string> {
  const role = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!role) {
    throw new ValidationError('CUSTOMER role is not configured');
  }
  return role.id;
}

function buildAccessToken(user: {
  id: string;
  email: string;
  role: { name: string; permissions: Array<{ permission: { code: string } }> };
}): string {
  const permissions = user.role.permissions.map((rp) => rp.permission.code);
  return signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
    permissions,
  });
}

async function createSession(userId: string, meta?: SessionMeta) {
  const refreshToken = signRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    },
  });

  return { refreshToken, expiresAt };
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    env.GOOGLE_CLIENT_ID?.trim() &&
    env.GOOGLE_CLIENT_SECRET?.trim() &&
    env.GOOGLE_CALLBACK_URL?.trim(),
  );
}

export function encodeOAuthState(returnUrl: string): string {
  const payload = Buffer.from(JSON.stringify({ r: returnUrl, t: Date.now() }), 'utf8').toString(
    'base64url',
  );
  const sig = createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function decodeOAuthState(state: string | undefined): string {
  if (!state || !state.includes('.')) {
    return '/account';
  }
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return '/account';

  const expected = createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return '/account';
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      r?: string;
      t?: number;
    };
    // State older than 15 minutes is ignored
    if (parsed.t && Date.now() - parsed.t > 15 * 60 * 1000) {
      return '/account';
    }
    const returnUrl = parsed.r ?? '/account';
    if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
      return '/account';
    }
    if (returnUrl.startsWith('/login') || returnUrl.startsWith('/register')) {
      return '/account';
    }
    return returnUrl;
  } catch {
    return '/account';
  }
}

export function getGoogleAuthorizeUrl(returnUrl: string): string {
  if (!isGoogleOAuthConfigured()) {
    throw new ValidationError('Google sign-in is not configured');
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state: encodeOAuthState(returnUrl),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeGoogleCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID!,
    client_secret: env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: env.GOOGLE_CALLBACK_URL!,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    throw new UnauthorizedError('Google authorization failed');
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new UnauthorizedError('Google authorization failed');
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!profileRes.ok) {
    throw new UnauthorizedError('Could not load Google profile');
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!profile.sub || !profile.email) {
    throw new UnauthorizedError('Google profile is incomplete');
  }

  return {
    googleId: profile.sub,
    email: profile.email.toLowerCase(),
    firstName: profile.given_name ?? null,
    lastName: profile.family_name ?? null,
    avatarUrl: profile.picture ?? null,
    emailVerified: Boolean(profile.email_verified),
  } satisfies GoogleProfile;
}

export async function loginWithGoogleCode(code: string, meta?: SessionMeta) {
  if (!isGoogleOAuthConfigured()) {
    throw new ValidationError('Google sign-in is not configured');
  }

  const profile = await exchangeGoogleCode(code);

  let user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ googleId: profile.googleId }, { email: profile.email }],
    },
    include: userRoleInclude,
  });

  if (user && !user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }

  if (!user) {
    const roleId = await findCustomerRoleId();
    user = await prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        emailVerified: profile.emailVerified ? new Date() : null,
        roleId,
      },
      include: userRoleInclude,
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId ?? profile.googleId,
        firstName: user.firstName ?? profile.firstName,
        lastName: user.lastName ?? profile.lastName,
        avatarUrl: user.avatarUrl ?? profile.avatarUrl,
        emailVerified: user.emailVerified ?? (profile.emailVerified ? new Date() : null),
      },
      include: userRoleInclude,
    });
  }

  const { refreshToken } = await createSession(user.id, meta);
  const accessToken = buildAccessToken(user);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}
