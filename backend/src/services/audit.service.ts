import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
      },
    });
  } catch {
    // Audit must never break the primary write path.
  }
}
