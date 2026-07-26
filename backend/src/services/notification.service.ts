import type { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { isEmailEnabled, sendMail } from './email.service';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  options?: { email?: boolean },
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  // Best-effort email when configured. Pass email: false if a dedicated order email is sent.
  if (options?.email !== false) {
    void maybeEmailUser(userId, title, body, link);
  }

  return notification;
}

async function maybeEmailUser(userId: string, title: string, body: string, link?: string) {
  if (!isEmailEnabled()) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
    if (!user?.email) return;

    const linkLine = link
      ? `\n\nOpen: ${env.FRONTEND_URL}${link.startsWith('/') ? link : `/${link}`}`
      : '';
    const text = `Hi${user.firstName ? ` ${user.firstName}` : ''},\n\n${body}${linkLine}\n\n— GAME MANIA`;

    await sendMail({
      to: user.email,
      subject: `[GAME MANIA] ${title}`,
      text,
    });
  } catch (err) {
    console.error('[notification:email]', err instanceof Error ? err.message : err);
  }
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
