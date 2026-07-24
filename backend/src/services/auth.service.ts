import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError, ValidationError } from '../exceptions/AppError';
import { toPublicUser, userRoleInclude } from '../dto/user.dto';
import { hashPassword, verifyPassword } from '../utils/password';
import { hashToken, parseDurationMs, signAccessToken, signRefreshToken } from '../utils/tokens';
import type { LoginInput, RegisterInput } from '../validators/auth.validators';

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
