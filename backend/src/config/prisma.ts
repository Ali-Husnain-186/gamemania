import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/**
 * Prefer a client that includes every schema model. After `prisma generate`,
 * discard a stale global instance (common with tsx watch) so new models work.
 */
function getClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (
    existing &&
    typeof (existing as { passwordResetToken?: unknown }).passwordResetToken !== 'undefined'
  ) {
    return existing;
  }
  if (existing) {
    void existing.$disconnect().catch(() => undefined);
  }
  const client = createPrisma();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getClient();
