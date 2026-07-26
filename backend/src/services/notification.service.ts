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

    const href = link
      ? `${env.FRONTEND_URL.replace(/\/$/, '')}${link.startsWith('/') ? link : `/${link}`}`
      : env.FRONTEND_URL;
    const text = `Hi${user.firstName ? ` ${user.firstName}` : ''},\n\n${body}\n\nOpen: ${href}\n\n— GAME MANIA`;
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f7f9;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f4f7f9;">
        <tr><td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;border:1px solid #d8e2e8;overflow:hidden;">
            <tr><td style="background:#0a1016;padding:18px 24px;font-family:Arial,sans-serif;font-weight:800;color:#fff;letter-spacing:0.04em;">GAME <span style="color:#01A6C2;">MANIA</span></td></tr>
            <tr><td style="height:4px;background:#01A6C2;font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:24px;font-family:Arial,sans-serif;color:#0a1016;">
              <h1 style="margin:0 0 12px;font-size:22px;">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h1>
              <p style="margin:0 0 18px;color:#5a6b75;line-height:1.5;">${body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>
              <a href="${href}" style="display:inline-block;background:#FFD100;color:#0a1016;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:10px;">Open</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    await sendMail({
      to: user.email,
      subject: `[GAME MANIA] ${title}`,
      text,
      html,
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
