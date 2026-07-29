import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError, ValidationError } from '../exceptions/AppError';
import { toPublicUser, userRoleInclude } from '../dto/user.dto';
import { hashPassword, verifyPassword } from '../utils/password';
import { hashToken, parseDurationMs, signAccessToken, signRefreshToken } from '../utils/tokens';
import { sendMail } from './email.service';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../validators/auth.validators';
import crypto from 'crypto';

type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
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

export async function register(input: RegisterInput, meta?: SessionMeta) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('Email is already registered');
  }

  const roleId = await findCustomerRoleId();
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId,
    },
    include: userRoleInclude,
  });

  const { refreshToken } = await createSession(user.id, meta);
  const accessToken = buildAccessToken(user);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput, meta?: SessionMeta) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: userRoleInclude,
  });

  if (!user || !user.passwordHash || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { refreshToken } = await createSession(user.id, meta);
  const accessToken = buildAccessToken(user);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshToken: string | undefined, meta?: SessionMeta) {
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const refreshTokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash },
    include: {
      user: { include: userRoleInclude },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (!session.user.isActive || session.user.deletedAt) {
    throw new UnauthorizedError('Account is inactive');
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const { refreshToken: nextRefresh } = await createSession(session.userId, meta);
  const accessToken = buildAccessToken(session.user);

  return {
    user: toPublicUser(session.user),
    accessToken,
    refreshToken: nextRefresh,
  };
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);
    await prisma.session.updateMany({
      where: {
        userId,
        refreshTokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return;
  }

  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function me(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
    include: userRoleInclude,
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return toPublicUser(user);
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Always returns the same message — do not reveal whether the email exists. */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const email = input.email.trim().toLowerCase();
  const generic = {
    message:
      'If an account exists for that email, we have sent a password reset link. Check your inbox and spam folder.',
  };

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null, isActive: true },
  });

  if (!user) {
    return generic;
  }

  // Invalidate previous unused tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = new URL('/reset-password', env.FRONTEND_URL);
  resetUrl.searchParams.set('token', rawToken);

  const settingFirstPassword = !user.passwordHash;
  const subject = settingFirstPassword
    ? 'Set a GAME MANIA password'
    : 'Reset your GAME MANIA password';
  const intro = settingFirstPassword
    ? 'You can set a password for your GAME MANIA account (e.g. if you usually sign in with Google).'
    : 'You requested a password reset for your GAME MANIA account.';
  const ctaLabel = settingFirstPassword ? 'Set your password' : 'Reset your password';

  const result = await sendMail({
    to: user.email,
    subject,
    text: [
      intro,
      '',
      `Open this link to choose a password (expires in 1 hour):`,
      resetUrl.toString(),
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>${intro}</p>
      <p><a href="${resetUrl.toString()}">${ctaLabel}</a> (link expires in 1 hour).</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  if (!result.sent) {
    console.error('[auth:password-reset] email failed', result.error);
    // Still return generic success to the client; log for ops.
  }

  return generic;
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashToken(input.token.trim());
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new ValidationError('This reset link is invalid or has expired. Request a new one.');
  }

  if (!row.user.isActive || row.user.deletedAt) {
    throw new ValidationError('This account cannot reset its password.');
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    // Force re-login on all devices
    await tx.session.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  return { message: 'Password updated. You can sign in with your new password.' };
}
