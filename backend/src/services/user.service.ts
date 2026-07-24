import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';
import { toPublicUser, userRoleInclude } from '../dto/user.dto';
import type { UpdateProfileInput } from '../validators/user.validators';

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName?.trim() || null } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
    },
    include: userRoleInclude,
  });

  return toPublicUser(user);
}
