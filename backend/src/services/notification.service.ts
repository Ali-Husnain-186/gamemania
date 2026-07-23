import type { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
